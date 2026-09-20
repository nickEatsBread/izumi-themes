# Izumi themes

The public theme catalog for Izumi. In the client, open **Settings → Themes** to browse,
preview, and install a theme. **Add from link** also accepts unlisted themes.

This repository contains listings and example themes: Kindling, Ledger, Tidal, Ember,
Halo and Orchid. The renderer ships with the client; installing a theme changes
presentation without installing executable code.

## Publishing

1. Copy an example from `packages/` and give it a unique ID and a `major.minor.patch` version.
2. Follow the format in `docs/FORMAT.md`. A package is a UTF-8 JSON file under 256 KB.
3. Host the file at a public HTTPS URL. A versioned GitHub file or release asset works.
4. Add an entry under `entries/` with a preview image, package URL, exact byte size, and SHA-256.
5. Run `npm run build`, then `npm test`, and submit a pull request.

The catalog's `index.json` is generated from the entries. An update must receive a new
version and matching checksum. Authors can host packages in their own repositories.

Users can also paste a direct package link or a release-descriptor link. A release descriptor
allows checking for updates from the same location. Packages and personal edits stay on the
user's device, including while offline.

## Development

Node.js 22.16 or newer is required. There are no package dependencies.

```sh
npm run build
npm test
```

`scripts/presentation.ts` mirrors Izumi's theme API 1 validator. Changes to the presentation
contract must be coordinated with the client and verified against these examples. The schemas
are editor aids; the validator is the compatibility gate.

## Scope

Theme API 1 covers color/typography/backdrop settings, Home hero templates and rank badges,
row spacing and grid/carousel arrangements, and ordinary media-card templates. Specialized
content cards retain their host behavior. Shell replacement, native player skins, packaged
fonts/images, and TV support require future client capabilities. The current package format
is JSON; ZIP archives and arbitrary JavaScript/CSS are not accepted.

Original example designs and tooling are licensed under MIT. Contributors retain ownership
of their themes and specify their own license in their project repository.
