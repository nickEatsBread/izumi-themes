#!/usr/bin/env node
// Render catalog previews from the real izumi client.
//
//   node scripts/preview/render.mjs [--izumi ../izumi] [--url http://127.0.0.1:1420]
//                                   [--only izumi.kindling,...] [--out previews] [--live]
//                                   [--shots home,series,phone] [--keep-shots dir] [--viewport 1280x1400]
//
// The client must be served by `npm run dev` (Vite) from the sibling izumi checkout, so its
// modules are importable for seeding. Every preview is the actual Home screen with the theme
// applied — the same renderer, tokens and templates users get — over a fixture catalogue with
// generated key art. `--live` skips the fixtures and renders against the real network instead.
// Phone themes (tagged "Phone") are composed from two phone screens: Home and a series page.
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
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
const shots = new Set(String(args.shots ?? 'home,series,phone').split(','))
// `--viewport 1280x1400` sizes the kept desktop shots (Home stays at the catalog's 1280x800).
const keptViewport = (() => { const m = /^(\d+)x(\d+)$/.exec(String(args.viewport ?? '')); return m ? { width: Number(m[1]), height: Number(m[2]) } : { width: 1280, height: 800 } })()
const keepShots = args['keep-shots'] ? resolve(root, String(args['keep-shots'])) : null
const localBase = 'https://raw.githubusercontent.com/nickEatsBread/izumi-themes/main/'

const { chromium } = await loadPlaywright()
loadParser(izumiDir)
loadFont(izumiDir)
mkdirSync(outDir, { recursive: true })
if (keepShots) mkdirSync(keepShots, { recursive: true })

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
    const phone = entry.tags.some((tag) => /^phone$/i.test(tag))
    console.log(`→ ${entry.id} ${pkg.version}${phone ? ' (phone)' : ''}`)
    const design = { id: 'preview-theme', name: pkg.name, createdAt: 1, updatedAt: 1, ...pkg.design }
    // A dev-server reload (an edit landing mid-capture) or a slow first compile fails one theme,
    // not the whole batch: retry once, then report and carry on.
    let attempt = 0
    while (true) {
      try { await renderEntry(entry, pkg, design, phone); break }
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

async function renderEntry(entry, pkg, design, phone) {
    if (phone) {
      const home = await capture({ design, platform: 'android', viewport: { width: 390, height: 844 }, scale: 2, path: '/app/home', wait: waitForHome })
      const series = await capture({ design, platform: 'android', viewport: { width: 390, height: 844 }, scale: 2, path: `/app/anime/${MEDIA[0].id}`, wait: waitForSeries })
      const composed = await composePhones(design, [home, series])
      writeFileSync(join(outDir, `${entry.id}.png`), composed)
      if (keepShots) { writeFileSync(join(keepShots, `${entry.id}-phone-home.png`), home); writeFileSync(join(keepShots, `${entry.id}-phone-series.png`), series) }
    } else {
      if (shots.has('home')) {
        const home = await capture({ design, platform: 'linux', viewport: { width: 1280, height: 800 }, scale: 1, path: '/app/home', wait: waitForHome })
        writeFileSync(join(outDir, `${entry.id}.png`), home)
      }
      if (keepShots && shots.has('series')) {
        const series = await capture({ design, platform: 'linux', viewport: keptViewport, scale: 1, path: `/app/anime/${MEDIA[0].id}`, wait: waitForSeries })
        writeFileSync(join(keepShots, `${entry.id}-series.png`), series)
      }
      if (keepShots && shots.has('phone')) {
        const home = await capture({ design, platform: 'android', viewport: { width: 390, height: 844 }, scale: 2, path: '/app/home', wait: waitForHome })
        writeFileSync(join(keepShots, `${entry.id}-phone-home.png`), home)
      }
    }
    console.log(`  wrote ${join(outDir, `${entry.id}.png`)}`)
}

async function capture({ design, platform, viewport, scale, path, wait }) {
  const context = await browser.newContext({
    viewport, deviceScaleFactor: scale, colorScheme: 'dark', locale: 'en-US', timezoneId: 'UTC',
    isMobile: platform === 'android', hasTouch: platform === 'android',
    userAgent: platform === 'android' ? 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Mobile Safari/537.36' : undefined,
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`) })
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
  if (!live) await seedHistory(page)
  await wait(page, design)
  await settleImages(page)
  await page.waitForTimeout(600)
  const shot = await page.screenshot({ type: 'png', fullPage: false })
  if (errors.length && args.verbose) console.log(errors.slice(0, 12).map((line) => `    ${line}`).join('\n'))
  await context.close()
  return shot
}

async function seedHistory(page) {
  // Continue Watching is local-first: record a few plays through the client's own history
  // module (Vite serves it as an importable module), then let the row reconcile as usual.
  // Each play also gets a mid-episode resume point, so resume cards show a real progress meter
  // and percentage rather than an empty bar.
  const plays = [MEDIA[3], MEDIA[8], MEDIA[12], MEDIA[1]].map((media, index) => ({ media: publicMedia(media), episode: 2 + index * 3, seconds: 380 + index * 210 }))
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
  // A theme can hide the featured banner (`hero.hidden`); Home then opens straight on the rows.
  if (!design?.presentation?.hero?.hidden) await page.waitForSelector('[data-theme-hero], [aria-label="Featured"]', { timeout: 60000 })
  await page.waitForSelector('[data-theme-row] img, [data-carousel-scroller] img', { timeout: 60000 })
  await page.waitForTimeout(1200)
}

async function waitForSeries(page) {
  await page.waitForSelector('h1', { timeout: 60000 })
  await page.waitForTimeout(2500)
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

/** Two phone screens on the theme's own canvas, framed like a store listing. */
async function composePhones(design, screens) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 })
  const tokens = design.tokens ?? {}
  const html = `<!doctype html><html><body style="margin:0;width:1280px;height:800px;background:hsl(${tokens.background ?? '240 10% 4%'});overflow:hidden;position:relative">
    <div style="position:absolute;inset:0;background:radial-gradient(70% 90% at 20% 0%,hsl(${tokens.theme ?? '346 79% 51%'} / .35),transparent 60%),radial-gradient(60% 70% at 100% 100%,hsl(${tokens.ring ?? tokens.theme ?? '346 79% 51%'} / .25),transparent 65%)"></div>
    ${screens.map((buffer, index) => `<img src="data:image/png;base64,${buffer.toString('base64')}" style="position:absolute;top:${index ? 120 : 56}px;left:${index ? 700 : 260}px;width:${index ? 300 : 340}px;border-radius:38px;box-shadow:0 40px 90px rgba(0,0,0,.6),0 0 0 8px #0b0b0d,0 0 0 9px rgba(255,255,255,.08);transform:rotate(${index ? 4 : -5}deg)">`).join('')}
  </body></html>`
  await page.setContent(html)
  await page.waitForTimeout(300)
  const shot = await page.screenshot({ type: 'png' })
  await page.close()
  return shot
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
