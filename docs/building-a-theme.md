# Building an izumi theme

A theme is one JSON file, at most 512,000 bytes, that izumi validates and renders. It can change
colours, type and corner radius; the Home banner and rows; card templates; the series page and its
episode cards; the navigation and top bar; the player bar; and the phone and TV layouts. From theme
API 3 it can also carry a stylesheet and fonts. It never contains code.

[FORMAT.md](FORMAT.md) is the full reference. This page is the path through it.

## 1. Start from an example

Copy the package in `packages/` closest to what you want and change its envelope:

```json
{
  "app": "izumi",
  "kind": "theme-package",
  "schemaVersion": 1,
  "themeApi": 3,
  "id": "yourname.theme-name",
  "name": "Theme Name",
  "author": "Your name",
  "description": "What changes: palette, Home, cards, series page, phone layout.",
  "version": "1.0.0",
  "design": {}
}
```

- `id` is permanent: lowercase letters, digits, dots and hyphens, 2-64 characters. `shared.*` is
  reserved for izumi's own imports.
- `version` is `major.minor.patch`, and every published change gets a new one.
- `themeApi` is the lowest API whose keys you use. A client that only knows an older API lists the
  theme as "Needs a newer izumi" instead of rendering half of it. Each API's additions are listed in
  FORMAT.md, from [Theme API 2 additions](FORMAT.md#theme-api-2-additions) to
  [Theme API 6](FORMAT.md#theme-api-6).

## 2. Design

- **Appearance:** `design.tokens` (HSL colour triplets such as `230 15% 6%`), `font`, `fontScale`,
  `radius`, `backdrop` and glass. See [Package](FORMAT.md#package).
- **Layout:** `design.presentation`: the Home hero, rows and card templates, the series page, shell
  chrome, the player seekbar, and `mobile` and `tv` blocks. See [Presentation](FORMAT.md#presentation)
  and [Templates](FORMAT.md#templates).
- **Stylesheet and fonts (API 3+):** `design.css` styles izumi's stable hooks (`data-slot`,
  `data-part` and `data-state` attributes), never its internal class names, which change. The hooks
  are listed under "Styling hooks" in izumi's
  [docs/THEMES.md](https://github.com/nickEatsBread/izumi/blob/main/docs/THEMES.md); the CSS rules are
  in [Theme API 3](FORMAT.md#theme-api-3).
- **Leave the izumi logo alone.** Themes don't recolour, restyle, hide or replace it.

izumi's Theme Studio (in Settings → Themes) is useful for trying colours and layout values live
before you write them into the package.

## 3. Try it

In izumi, **Settings → Themes → Add theme** accepts a file, a folder of packages, or a link. It
validates the package as the catalog does, and you can preview it on your own library before
installing it. Check:

- a desktop window, and a narrow window or phone (about 390 px wide);
- Home, a series page, Search, Schedule and the player;
- the TV layout, if your theme has a `tv` block.

Run the catalog's checks on the file too:

```sh
npm install
npm run listing -- packages/<id>/<version>.json --tags "Dark,Top nav" --platforms desktop,phone
npm run build
npm test
```

## 4. Screenshots and listing

Store images come from the real client with your theme applied: [previews.md](previews.md). Then
submit as the [README](../README.md#submitting-a-theme) describes.

## Before you submit

- [ ] `npm test` passes, and `themeApi` is the lowest API the package needs.
- [ ] No account details, source settings, tracking links or remote assets that need credentials.
- [ ] Logos, artwork and fonts are yours or licensed for this use; the izumi logo is untouched.
- [ ] Screenshots are real renders for every platform in `platforms`.
- [ ] The description says what the theme changes.
