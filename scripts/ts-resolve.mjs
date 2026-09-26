// The mirrored client modules (presentation.ts, block-schema.ts, …) import each other without file
// extensions, as the client's bundler allows. Node's ESM loader needs the extension, so this hook tries
// `<specifier>.ts` for extensionless relative imports. It keeps the mirrors byte-identical to the client.
import { register } from 'node:module'

register('./ts-resolve-hooks.mjs', import.meta.url)
