import { mkdir, writeFile } from 'node:fs/promises'
const root = new URL('../schemas/', import.meta.url)
await mkdir(root, { recursive: true })
const string = maxLength => ({ type: 'string', minLength: 1, maxLength })
const url = { type: 'string', pattern: '^https://' }
const listing = { type: 'object', required: ['id', 'name', 'author', 'description', 'version', 'themeApi', 'tags', 'download', 'sha256', 'bytes'], properties: {
  // `platforms`: which layouts the author designed, primary first. Absent means the shared layout serves both.
  id: { ...string(64), pattern: '^[a-z0-9][a-z0-9.-]{1,63}$' }, name: string(48), author: string(80), description: string(600),
  version: { type: 'string', pattern: '^\\d{1,6}\\.\\d{1,6}\\.\\d{1,6}$' }, themeApi: { enum: [1, 2, 3] },
  platforms: { type: 'array', minItems: 1, maxItems: 2, uniqueItems: true, items: { enum: ['desktop', 'phone'] } },
  tags: { type: 'array', maxItems: 12, items: string(32) }, download: url, preview: url, project: url,
  sha256: { type: 'string', pattern: '^[a-fA-F0-9]{64}$' }, bytes: { type: 'integer', minimum: 1, maximum: 512000 },
} }
const envelope = (kind, field, schema) => ({ $schema: 'https://json-schema.org/draft/2020-12/schema', type: 'object', required: ['app', 'kind', 'schemaVersion', field], properties: { app: { const: 'izumi' }, kind: { const: kind }, schemaVersion: { const: 1 }, [field]: schema } })
for (const [file, schema] of [
  ['listing.schema.json', { $schema: 'https://json-schema.org/draft/2020-12/schema', ...listing }],
  ['catalog.schema.json', envelope('theme-catalog', 'themes', { type: 'array', maxItems: 500, items: listing })],
  ['release.schema.json', envelope('theme-release', 'release', listing)],
]) await writeFile(new URL(file, root), JSON.stringify(schema, null, 2) + '\n')
