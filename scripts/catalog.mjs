import { readFile, readdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { parsePresentation } from './presentation.ts'

const root = new URL('../', import.meta.url)
const localBase = 'https://raw.githubusercontent.com/nickEatsBread/izumi-themes/main/'
const parse = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'))
const https = value => { const url = new URL(value); assert.equal(url.protocol, 'https:'); assert(!url.username && !url.password); return url }
const contentKeys = ['tokens', 'radius', 'font', 'fontScale', 'backdrop', 'backdropStrength', 'glassBlur', 'presentation']
const scalarRanges = { radius: [0, 2], fontScale: [.85, 1.2], backdropStrength: [0, .65], glassBlur: [0, 40] }
function validatePackage(pkg, entry) {
  assert.equal(pkg.app, 'izumi'); assert.equal(pkg.kind, 'theme-package'); assert.equal(pkg.schemaVersion, 1)
  for (const key of ['id', 'version', 'themeApi']) assert.equal(pkg[key], entry[key], `Package ${key} does not match its listing`)
  assert([1, 2].includes(pkg.themeApi), 'Unsupported theme API')
  for (const key of ['name', 'author', 'description']) assert.equal(typeof pkg[key], 'string')
  assert(pkg.design && !Array.isArray(pkg.design))
  for (const key of Object.keys(pkg.design)) assert(contentKeys.includes(key), `Unsupported design key: ${key}`)
  if (pkg.design.presentation) parsePresentation(pkg.design.presentation, pkg.themeApi)
  if (pkg.design.tokens) for (const [key, value] of Object.entries(pkg.design.tokens)) {
    if (key === 'scheme') { assert(['dark', 'light'].includes(value)); continue }
    assert(['background', 'foreground', 'muted', 'mutedForeground', 'primary', 'primaryForeground', 'secondary', 'secondaryForeground', 'accent', 'accentForeground', 'border', 'input', 'ring', 'card', 'cardForeground', 'theme'].includes(key))
    const match = /^\s*(-?\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%\s*$/.exec(value)
    assert(match && Number(match[2]) <= 100 && Number(match[3]) <= 100, `Invalid color: ${key}`)
  }
  for (const [key, [min, max]] of Object.entries(scalarRanges)) if (pkg.design[key] !== undefined) assert(typeof pkg.design[key] === 'number' && pkg.design[key] >= min && pkg.design[key] <= max)
  if (pkg.design.font !== undefined) assert(['nunito', 'system', 'serif', 'mono'].includes(pkg.design.font))
  if (pkg.design.backdrop !== undefined) assert(['solid', 'aurora', 'spotlight', 'mesh'].includes(pkg.design.backdrop))
}
async function download(url, limit) {
  https(url)
  if (url.startsWith(localBase)) {
    const path = url.slice(localBase.length)
    assert(!path.split('/').includes('..') && !path.includes('%'), 'Invalid local path')
    const bytes = await readFile(new URL(path, root)); assert(bytes.length <= limit); return bytes
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) })
  assert(response.ok, `HTTP ${response.status} for package`)
  const chunks = []; let size = 0
  for await (const chunk of response.body) { size += chunk.length; assert(size <= limit, 'Package too large'); chunks.push(chunk) }
  return Buffer.concat(chunks)
}
const entries = []
for (const filename of (await readdir(new URL('entries/', root))).filter(name => name.endsWith('.json')).sort()) {
  const entry = await parse(`entries/${filename}`)
  assert(/^[a-z0-9][a-z0-9.-]{1,63}$/.test(entry.id)); assert(/^[0-9]{1,6}\.[0-9]{1,6}\.[0-9]{1,6}$/.test(entry.version))
  assert([1, 2].includes(entry.themeApi), 'Unsupported theme API'); assert(Array.isArray(entry.tags) && entry.tags.length <= 12)
  if (entry.platforms !== undefined) {
    assert(Array.isArray(entry.platforms) && entry.platforms.length >= 1 && entry.platforms.length <= 2 && new Set(entry.platforms).size === entry.platforms.length, 'Invalid platforms')
    for (const platform of entry.platforms) assert(['desktop', 'phone'].includes(platform), `Unknown platform: ${platform}`)
  }
  assert(!entries.some(other => other.id === entry.id), 'Duplicate theme ID')
  for (const [key, max] of [['name', 48], ['author', 80], ['description', 600]]) assert(typeof entry[key] === 'string' && entry[key].trim().length > 0 && entry[key].length <= max)
  for (const tag of entry.tags) assert(typeof tag === 'string' && tag.length <= 32)
  assert(Number.isSafeInteger(entry.bytes) && entry.bytes > 0 && entry.bytes <= 256000)
  assert(/^[a-f0-9]{64}$/.test(entry.sha256)); https(entry.download)
  if (entry.preview) https(entry.preview)
  if (entry.project) https(entry.project)
  const bytes = await download(entry.download, 256000)
  assert.equal(bytes.length, entry.bytes); assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.sha256)
  validatePackage(JSON.parse(bytes.toString('utf8')), entry)
  entries.push(entry)
}
assert(entries.length <= 500)
const index = { app: 'izumi', kind: 'theme-catalog', schemaVersion: 1, themes: entries }
const output = JSON.stringify(index, null, 2) + '\n'
if (process.argv.includes('--write')) await writeFile(new URL('index.json', root), output)
else assert.equal(await readFile(new URL('index.json', root), 'utf8'), output, 'Run npm run build to update index.json')
console.log(`Validated ${entries.length} theme listings, packages, checksums, and presentation templates.`)
