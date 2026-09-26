// Resolve hook registered by ts-resolve.mjs: `./block-schema` → `./block-schema.ts`.
export async function resolve(specifier, context, nextResolve) {
  if (/^\.{1,2}\//.test(specifier) && !/\.[cm]?[jt]s$/.test(specifier)) {
    try {
      return await nextResolve(`${specifier}.ts`, context)
    } catch {
      // Fall through to the default resolution (and its error) below.
    }
  }
  return nextResolve(specifier, context)
}
