# Store screenshots

Every listing image is a screenshot of the real izumi client with the theme applied, rendered by
`scripts/preview/` over live catalog data: one per screen (Home, Series, Search and Schedule; phones
skip Schedule) for each platform the listing declares, saved in `previews/<id>/`.

## Rendering

It needs the [izumi](https://github.com/nickEatsBread/izumi) repository checked out next to this
one and served by its dev server, Playwright, and Chromium:

```sh
npm install                      # playwright-core
(cd ../izumi && npm install && npm run dev)
npm run previews -- --live --only <id>
npm run build
```

`--live` writes `previews/<id>/<platform>-<screen>.jpg` and the entry's `screenshots` and `preview`.
Without `--live` it renders over a fixture catalogue, for offline smoke tests only: never publish
those images.

| Option | Use |
| --- | --- |
| `--only a,b` | Render only these listings (all of them by default). |
| `--series <id>` | The series page to shoot. |
| `--hero-slide <n>` | Start Home on a later featured slide. |
| `--screens schedule,…` | Re-shoot only these screens and keep the rest. |

Set `IZUMI_PREVIEW_CHROMIUM` to use a specific Chromium binary. A change to a package, or to the
client's renderer, needs a re-render.
