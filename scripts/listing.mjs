#!/usr/bin/env node
// Write (or refresh) the catalog listing and release descriptor for a package:
//
//   node scripts/listing.mjs packages/<id>/<version>.json --tags "Dark,Phone" [--platforms phone,desktop] [--preview <https url>]
//
// Metadata is read from the package itself; bytes and SHA-256 are computed from the file on disk,
// so a listing can never drift from the package it points at. Run `npm run build` afterwards.
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const base = 'https://raw.githubusercontent.com/nickEatsBread/izumi-themes/main/'
const [file, ...rest] = process.argv.slice(2)
if (!file) { console.error('usage: node scripts/listing.mjs packages/<id>/<version>.json [--tags a,b] [--platforms desktop,phone] [--preview url] [--project url]'); process.exit(1) }
const options = {}
for (let i = 0; i < rest.length; i += 2) options[rest[i].replace(/^--/, '')] = rest[i + 1]

const path = resolve(root, file)
const bytes = readFileSync(path)
const pkg = JSON.parse(bytes.toString('utf8'))
const entryPath = join(root, 'entries', `${pkg.id}.json`)
const existing = existsSync(entryPath) ? JSON.parse(readFileSync(entryPath, 'utf8')) : {}
const tags = options.tags ? options.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : existing.tags ?? []
// `--platforms phone` (phone only), `--platforms phone,desktop` (designed for phones, desktop included),
// `--platforms both` or omitted keeps the listing unlabelled: the shared layout serves both.
const platformList = options.platforms ? options.platforms.split(',').map((item) => item.trim()).filter(Boolean) : existing.platforms
const platforms = platformList && !platformList.includes('both') ? platformList : undefined
for (const platform of platforms ?? []) if (!['desktop', 'phone'].includes(platform)) { console.error(`Unknown platform: ${platform}`); process.exit(1) }
const entry = {
  id: pkg.id,
  name: pkg.name,
  version: pkg.version,
  author: pkg.author,
  description: pkg.description,
  themeApi: pkg.themeApi,
  tags,
  ...(platforms ? { platforms } : {}),
  project: options.project ?? existing.project ?? 'https://github.com/nickEatsBread/izumi-themes',
  download: base + relative(root, path).split('\\').join('/'),
  sha256: createHash('sha256').update(bytes).digest('hex'),
  bytes: bytes.length,
  preview: options.preview ?? existing.preview ?? `${base}previews/${pkg.id}.png`,
}
writeFileSync(entryPath, JSON.stringify(entry, null, 2) + '\n')
writeFileSync(join(root, 'releases', `${pkg.id}.json`), JSON.stringify({ app: 'izumi', kind: 'theme-release', schemaVersion: 1, release: entry }, null, 2) + '\n')
console.log(`${pkg.id} ${pkg.version}: ${entry.bytes} bytes, sha256 ${entry.sha256.slice(0, 12)}…`)
