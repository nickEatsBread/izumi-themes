# Izumi themes

The public theme catalog for Izumi. In the client, open **Settings → Themes** to browse,
preview, and install a theme. **Add from link** also accepts unlisted themes.

This repository contains listings and example themes. Desktop-led: Kindling, Ledger, Tidal,
Ember, Halo, Orchid, Nebula, Prism, Cobalt, Tangerine and Daylight (the light theme).
Streaming-site looks with a docked watch layout (the player in a stage with episodes beside or
below it): Reel, Booth, Spotlight, Mint, Amethyst, Lime and Frost. Phone-first: Lavender,
Coral, Onyx and Blossom, each carrying a `presentation.mobile` block and its own bottom bar,
slide marker and tab style (theme API 2, see `docs/FORMAT.md`) while keeping a desktop layout.
Listings say which layouts a theme was designed for (`platforms`). The renderer ships with the
client; installing a theme changes presentation without installing executable code.

Every preview in `previews/` is a screenshot of the real client with that theme applied,
rendered by `scripts/preview/` over a fixture catalogue with generated key art.

## Publishing

1. Copy an example from `packages/` and give it a unique ID and a `major.minor.patch` version.
2. Follow the format in `docs/FORMAT.md`. A package is a UTF-8 JSON file under 512 KB.
3. Host the file at a public HTTPS URL. A versioned GitHub file or release asset works.
4. Add an entry under `entries/` with a preview image, package URL, exact byte size, and SHA-256.
   For a package in this repository, `npm run listing -- packages/<id>/<version>.json --tags "Dark,Top nav"`
   writes the entry and release descriptor with the checksum computed from the file.
5. Run `npm run build`, then `npm test`, and submit a pull request.

The catalog's `index.json` is generated from the entries. An update must receive a new
version and matching checksum. Authors can host packages in their own repositories.

Users can also paste a direct package link or a release-descriptor link. A release descriptor
allows checking for updates from the same location. Packages and personal edits stay on the
user's device, including while offline.

## Development

Node.js 22.16 or newer is required. Validation has no package dependencies.

```sh
npm run build
npm test
```

`scripts/presentation.ts` mirrors Izumi's theme API 1 validator. Changes to the presentation
contract must be coordinated with the client and verified against these examples. The schemas
are editor aids; the validator is the compatibility gate.

### Rendering previews

Previews are captured from the real client, so a change to a package or to the client's
renderer is reflected by re-rendering. It needs the sibling `../izumi` checkout served by its
dev server, Playwright, and Chromium:

```sh
npm install                      # playwright-core
(cd ../izumi && npm install && npm run dev)
npm run previews                 # all listings; --only izumi.kindling,izumi.coral for a subset
```

`--keep-shots <dir>` also saves the series page and phone Home for each desktop theme.
Rendering uses a fixture catalogue of original sample titles and generated artwork, so it works
offline and ships no licensed images; `--live` renders against the real network instead.
Set `IZUMI_PREVIEW_CHROMIUM` to use a specific Chromium binary.

## Scope

Theme API 1 covers color/typography/backdrop settings, Home hero templates and rank badges,
row spacing and grid/carousel arrangements, ordinary media-card templates, series-page
composition and episode cards, shell chrome, the player seekbar, and a phone override block.
Specialized content cards retain their host behavior. Shell replacement, native player skins,
packaged fonts/images, and TV support require future client capabilities. The current package
format is JSON; ZIP archives and arbitrary JavaScript/CSS are not accepted.

Original example designs and tooling are licensed under MIT. Contributors retain ownership
of their themes and specify their own license in their project repository.
