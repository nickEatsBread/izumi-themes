#!/usr/bin/env node
// Render catalog previews from the real izumi client.
//
//   node scripts/preview/render.mjs [--izumi ../izumi] [--url http://127.0.0.1:1420]
//                                   [--only izumi.kindling,...] [--out previews] [--live]
//                                   [--series <anilist id>] [--hero-slide <n>] [--screens schedule,...]
//
// Shoots every screen a store listing shows (Home, Series, Search, Schedule; phones skip Schedule)
// for each platform the listing declares, into previews/<id>/<platform>-<screen>.jpg, and writes
// `screenshots` + `preview` into its entry. The client must be served by `npm run dev` (Vite) from
// the sibling izumi checkout. `--live` renders against the real network instead of the fixtures.
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { tauriShim, storageSeed } from './shim.mjs'
import { ART_HOST, MEDIA, aniZipMappings, artwork, loadFont } from './fixtures.mjs'
import { executeGraphql, loadParser } from './graphql.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const args = parseArgs(process.argv.slice(2))
const izumiDir = resolve(root, args.izumi ?? '../izumi')
const baseUrl = (args.url ?? 'http://127.0.0.1:1420').replace(/\/$/, '')
const outDir = resolve(root, args.out ?? 'previews')
const only = args.only ? new Set(String(args.only).split(',')) : null
const live = Boolean(args.live)
// The series page to shoot: a fixture title offline; live, `--series <id>` or the most-trending series with banner art.
const trending = live ? await trendingMedia() : []
const seriesId = args.series ? Number(args.series) : trending[0]?.id ?? MEDIA[0].id
// Live Home shots can start on a later featured slide (0-based) when the first one makes a poor listing image.
const heroSlide = args['hero-slide'] ? Number(args['hero-slide']) : 0
// `--screens` re-shoots only those screens and keeps the entry's other screenshots.
const screensOnly = args.screens ? new Set(String(args.screens).split(',')) : null
const localBase = 'https://raw.githubusercontent.com/nickEatsBread/izumi-themes/main/'
// Per-screen store shots. Phones skip Schedule: its week view is a desktop layout squeezed.
const SCREENS = { desktop: ['home', 'series', 'search', 'schedule'], phone: ['home', 'series', 'search'] }
const DEVICES = {
  desktop: { platform: 'linux', viewport: { width: 1280, height: 800 }, scale: 1 },
  phone: { platform: 'android', viewport: { width: 390, height: 844 }, scale: 2 },
}
// Search shows the trending sort rather than a typed title, so no title is baked into the catalog.
const PATHS = { home: '/app/home', series: `/app/anime/${seriesId}`, search: '/app/search?sort=TRENDING_DESC', schedule: '/app/schedule' }
const WAITS = { home: waitForHome, series: waitForSeries, search: waitForPage, schedule: waitForPage }

const { chromium } = await loadPlaywright()
loadParser(izumiDir)
loadFont(izumiDir)
mkdirSync(outDir, { recursive: true })

const entries = readdirSync(join(root, 'entries')).filter((name) => name.endsWith('.json')).sort()
  .map((name) => JSON.parse(readFileSync(join(root, 'entries', name), 'utf8')))
  .filter((entry) => !only || only.has(entry.id))

const failures = []
const browser = await chromium.launch({
  executablePath: process.env.IZUMI_PREVIEW_CHROMIUM || undefined,
  args: ['--force-color-profile=srgb', '--font-render-hinting=none', '--disable-lcd-text'],
})
try {
  for (const entry of entries) {
    const pkg = loadPackage(entry)
    console.log(`→ ${entry.id} ${pkg.version}`)
    const design = { id: 'preview-theme', name: pkg.name, createdAt: 1, updatedAt: 1, ...pkg.design }
    // A dev-server reload (an edit landing mid-capture) or a slow first compile fails one theme,
    // not the whole batch: retry once, then report and carry on.
    let attempt = 0
    while (true) {
      try { await renderEntry(entry, design); break }
      catch (error) {
        if (++attempt > 1) { failures.push(`${entry.id}: ${error.message.split('\n')[0]}`); console.log(`  failed: ${error.message.split('\n')[0]}`); break }
        console.log(`  retrying after: ${error.message.split('\n')[0]}`)
      }
    }
  }
  if (failures.length) { console.error(`\n${failures.length} preview(s) failed:\n${failures.map((line) => `  ${line}`).join('\n')}`); process.exitCode = 1 }
} finally {
  await browser.close()
}

async function renderEntry(entry, design) {
  const platforms = entry.platforms ?? ['desktop', 'phone']
  const dir = join(outDir, entry.id)
  mkdirSync(dir, { recursive: true })
  const path = join(root, 'entries', `${entry.id}.json`)
  const saved = JSON.parse(readFileSync(path, 'utf8'))
  const screenshots = []
  for (const platform of platforms) {
    for (const screen of SCREENS[platform]) {
      const kept = screensOnly && !screensOnly.has(screen) && saved.screenshots?.find((shot) => shot.platform === platform && shot.screen === screen)
      if (kept) { screenshots.push(kept); continue }
      const shot = await capture({ design, ...DEVICES[platform], path: PATHS[screen], wait: WAITS[screen] })
      const file = join(dir, `${platform}-${screen}.jpg`)
      writeFileSync(file, shot)
      screenshots.push({ screen, platform, url: localBase + relative(root, file).replaceAll('\\', '/') })
      console.log(`  wrote ${relative(root, file)}`)
    }
  }
  // Clients that predate `screenshots` read `preview`: the primary layout's Home.
  const preview = screenshots.find((shot) => shot.platform === platforms[0] && shot.screen === 'home').url
  // The store tints its spotlight with the theme's accent colour.
  const accent = design.tokens?.theme
  writeFileSync(path, JSON.stringify({ ...saved, ...(accent ? { accent } : {}), preview, screenshots }, null, 2) + '\n')
}

async function waitForPage(page) {
  await page.waitForSelector('main', { timeout: 60000 })
  await page.waitForTimeout(3000)
}

async function capture({ design, platform, viewport, scale, path, wait, attempt = 0 }) {
  const context = await browser.newContext({
    viewport, deviceScaleFactor: scale, colorScheme: 'dark', locale: 'en-US', timezoneId: 'UTC',
    isMobile: platform === 'android', hasTouch: platform === 'android',
    userAgent: platform === 'android' ? 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Mobile Safari/537.36' : undefined,
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`) })
  // Catalog data and artwork in flight (the dev server's own modules don't count). A reload (the history
  // seed) drops the old document's requests without settling them, so a navigation starts afresh.
  const pending = new Set()
  page.on('request', (request) => { if (!request.url().startsWith(baseUrl)) pending.add(request) })
  page.on('requestfinished', (request) => pending.delete(request))
  page.on('requestfailed', (request) => pending.delete(request))
  page.on('framenavigated', (frame) => { if (frame === page.mainFrame()) pending.clear() })
  if (!live) await page.route('**/*', fixtureRoute)
  await page.addInitScript(tauriShim({ platform }))
  await page.addInitScript(storageSeed({
    'onboarding-complete-v1': true,
    'theme-preset': 'custom',
    'theme-studio-active-v1': design.id,
    'theme-studio-themes-v1': [design],
    'ui-scale': 1,
    'motion-preference': 'reduce',
    'save-local-history': true,
  }))
  await page.goto(`${baseUrl}${path}`, { waitUntil: 'domcontentloaded' })
  if (!live) await seedHistory(page, [MEDIA[3], MEDIA[8], MEDIA[12], MEDIA[1]].map(publicMedia))
  else if (trending.length > 1) await seedHistory(page, trending.slice(1, 5))
  await wait(page, design)
  if (heroSlide && path === '/app/home') {
    const dots = page.locator('[data-part="hero.dot"]')
    if (await dots.count() > heroSlide) { await dots.nth(heroSlide).click(); await page.waitForTimeout(1500) }
  }
  await waitForQuiet(page, () => pending.size)
  await settleImages(page)
  // A rate-limited AniList swaps in the fallback catalogue under a warning strip: never ship that shot.
  if (live && await page.getByText('AniList is unavailable').first().isVisible()) {
    await context.close()
    if (attempt >= 4) throw new Error('AniList stayed unavailable')
    console.log('  AniList unavailable; retrying in a minute')
    await new Promise((done) => setTimeout(done, 60000))
    return capture({ design, platform, viewport, scale, path, wait, attempt: attempt + 1 })
  }
  await page.waitForTimeout(600)
  const shot = await page.screenshot({ type: 'jpeg', quality: 85, fullPage: false })
  if (errors.length && args.verbose) console.log(errors.slice(0, 12).map((line) => `    ${line}`).join('\n'))
  await context.close()
  return shot
}

async function seedHistory(page, titles) {
  // Continue Watching is local-first: record a few plays through the client's own history
  // module (Vite serves it as an importable module), then let the row reconcile as usual.
  // Each play also gets a mid-episode resume point, so resume cards show a real progress meter
  // and percentage rather than an empty bar.
  const plays = titles.map((media, index) => ({ media, episode: Math.min(2 + index * 3, media.episodes || 99), seconds: 380 + index * 210 }))
  await page.evaluate(async (plays) => {
    const history = await import('/src/lib/player/history.ts')
    const progress = await import('/src/lib/player/progress.ts').catch(() => null)
    for (const play of plays) {
      history.recordPlay(play.media, play.episode)
      try { progress?.savePosition?.(play.media.id, play.episode, play.seconds, 1440) } catch { /* optional */ }
    }
    await new Promise((done) => setTimeout(done, 50))
  }, plays)
  await page.reload({ waitUntil: 'domcontentloaded' })
}

function publicMedia(media) {
  const copy = {}
  for (const [key, value] of Object.entries(media)) if (!key.startsWith('_') && !['relations', 'recommendations', 'characters', 'staff'].includes(key)) copy[key] = value
  return copy
}

async function waitForHome(page, design) {
  // A theme layout (API 3) decides whether Home has a featured banner; otherwise `hero.hidden` does.
  const layoutHome = design?.presentation?.layout?.home
  const hero = layoutHome ? layoutHome.some((entry) => entry.role === 'hero') : !design?.presentation?.hero?.hidden
  if (hero) await page.waitForSelector('[data-theme-hero], [aria-label="Featured"], [data-slot="home.hero"]', { timeout: 60000 })
  // `:visible` on each branch: waitForSelector only tests the first match, and a theme may hide a block's
  // own image (a profile header kept for its buttons hides its banner), which would never become visible.
  await page.waitForSelector('[data-theme-row] img:visible, [data-carousel-scroller] img:visible, [data-slot^="block."] img:visible', { timeout: 60000 })
  await page.waitForTimeout(1200)
}

async function waitForSeries(page) {
  await page.waitForSelector('h1', { timeout: 60000 })
  await page.waitForTimeout(2500)
}

// A page's first artwork can show while other rows' catalog queries are still in flight (a slow or
// rate-limited API): wait until the network has been quiet for a second, capped, so no row is shot loading.
async function waitForQuiet(page, inflight, cap = 20000) {
  for (let quiet = 0, waited = 0; quiet < 1000 && waited < cap; waited += 250) {
    await page.waitForTimeout(250)
    quiet = inflight() > 0 ? 0 : quiet + 250
  }
}

async function settleImages(page) {
  await page.evaluate(() => Promise.all([...document.images].filter((image) => !image.complete).map((image) => new Promise((done) => { image.onload = done; image.onerror = done; setTimeout(done, 4000) }))))
  await page.evaluate(() => document.fonts?.ready)
}

async function fixtureRoute(route) {
  const request = route.request()
  const url = new URL(request.url())
  if (`${url.protocol}//${url.host}` === baseUrl) return route.continue()
  if (url.host === 'graphql.anilist.co') {
    try {
      const result = executeGraphql(request.postData())
      return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'x-ratelimit-limit': '90', 'x-ratelimit-remaining': '89' }, body: JSON.stringify(result) })
    } catch (error) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: null, errors: [{ message: String(error) }] }) })
    }
  }
  if (url.host === 'api.ani.zip') {
    const id = Number(url.searchParams.get('anilist_id'))
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(aniZipMappings(id)) })
  }
  if (`${url.protocol}//${url.host}` === ART_HOST) {
    const svg = artwork(url.pathname)
    if (svg) return route.fulfill({ status: 200, contentType: 'image/svg+xml', headers: { 'cache-control': 'max-age=3600' }, body: svg })
  }
  return route.fulfill({ status: 404, contentType: 'text/plain', body: 'preview: no network' })
}

function loadPackage(entry) {
  if (!entry.download.startsWith(localBase)) throw new Error(`${entry.id}: previews render local packages only`)
  return JSON.parse(readFileSync(join(root, entry.download.slice(localBase.length)), 'utf8'))
}

async function loadPlaywright() {
  const candidates = [
    process.env.IZUMI_PREVIEW_PLAYWRIGHT,
    join(root, 'node_modules/playwright-core/index.mjs'),
    join(izumiDir, 'node_modules/playwright-core/index.mjs'),
    join(izumiDir, 'node_modules/playwright/index.mjs'),
  ].filter(Boolean)
  for (const candidate of candidates) {
    if (existsSync(candidate)) return import(pathToFileURL(candidate).href)
  }
  try { return await import('playwright-core') } catch { /* fall through */ }
  const require = createRequire(import.meta.url)
  try { return require('playwright') } catch { throw new Error('Install playwright-core (npm i -D playwright-core) or set IZUMI_PREVIEW_PLAYWRIGHT.') }
}

/** Live renders: the most-trending non-adult series that have banner art — the series page opens on the
 *  first, and the next few seed the watch history, so Continue Watching and the profile banner show real
 *  titles as they would for a viewer. Empty (fixtures take over) when AniList can't be reached. */
async function trendingMedia() {
  const query = 'query { Page(perPage: 16) { media(type: ANIME, sort: TRENDING_DESC, isAdult: false) { id idMal title { romaji english userPreferred } coverImage { medium large extraLarge } bannerImage status format episodes duration nextAiringEpisode { episode airingAt timeUntilAiring } } } }'
  try {
    const response = await fetch('https://graphql.anilist.co', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ query }) })
    const media = (await response.json())?.data?.Page?.media ?? []
    return media.filter((item) => item.bannerImage)
  } catch {
    return []
  }
}

function parseArgs(list) {
  const parsed = {}
  for (let i = 0; i < list.length; i++) {
    const item = list[i]
    if (!item.startsWith('--')) continue
    const key = item.slice(2)
    const next = list[i + 1]
    if (next !== undefined && !next.startsWith('--')) { parsed[key] = next; i++ } else parsed[key] = true
  }
  return parsed
}
