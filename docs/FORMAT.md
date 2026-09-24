# Theme API 2

This API requires a theme-enabled Izumi build. The theme catalog is independent of client
release scheduling; older builds without Settings → Themes cannot install these packages.

`themeApi` is `1` or `2`. API 1 is the original key set and every API 1 package stays valid on
every client. API 2 adds the keys under [Theme API 2 additions](#theme-api-2-additions): the
bottom bar, the featured slide marker, section headings, series-page tabs, the docked watch
layout and the `mobile` block. A client that only knows API 1 refuses an API 2 package with
"requires a different theme API"; the gallery lists it as "Needs a newer izumi" instead of a
half-rendered layout. Declare the lowest API a package actually uses.

## Package

A package is one UTF-8 JSON document, at most 256,000 bytes. Required envelope fields:

| Field | Value |
| --- | --- |
| `app` | `izumi` |
| `kind` | `theme-package` |
| `schemaVersion` | `1` |
| `themeApi` | `1` or `2` (see above) |
| `id` | Stable lowercase author/theme identity, 2–64 letters, digits, dots or hyphens |
| `name` | Display name, 1–48 characters |
| `author` | Attribution, 1–80 characters |
| `description` | Description, 1–600 characters |
| `version` | Three numeric version parts, e.g. `1.0.0` |
| `design` | Appearance and presentation settings |

`design` accepts `tokens`, `radius` (0–2 rem), `font` (`nunito`, `system`, `serif`, `mono`),
`fontScale` (0.85–1.2), `backdrop` (`solid`, `aurora`, `spotlight`, `mesh`),
`backdropStrength` (0–0.65), `glassBlur` (0–40 pixels), and `presentation`.
Unspecified design values use the shipped appearance baseline: a 0.5 rem radius, solid
backdrop, zero backdrop strength and zero glass blur, with the default palette and font.
Absent presentation properties use the client's default layout.

Color tokens use HSL triplets, e.g. `230 15% 6%`. Token names are `background`, `foreground`,
`muted`, `mutedForeground`, `primary`, `primaryForeground`, `secondary`, `secondaryForeground`,
`accent`, `accentForeground`, `border`, `input`, `ring`, `card`, `cardForeground`, and `theme`.
The extra `scheme` token is `dark` or `light`.

## Presentation

`presentation.hero` accepts `hidden`, `height` and `mobileHeight` (24–75 percent of viewport
height), `rotate`, `interval` (5–60 seconds), `rankHidden`, a `rank` template, and an entire
hero `template`. Heights on custom templates are minimum heights, so longer content can fit.
The host retains its details/slide controls. Reduced motion overrides automatic rotation.
Rank slots apply to the built-in hero; a custom hero decides which metadata it renders.

`presentation.rows` accepts `defaults` and `byId`. A row ID in `byId` can be a semantic role,
such as `continue`, or the full stable ID displayed in Theme Studio. Exact IDs override role
IDs, which override defaults. Titles and display positions are not identities.

Rows accept `layout` (`carousel` or `grid`), `width` (96–400 pixels), `gap` (0–48 pixels),
`spacing` (0–100 pixels below the row), `radius` (0–48 pixels), `aspect` (`poster`, `landscape`,
`square`), `titleSize` (12–32 pixels), and a `card` template. Grid width is a preferred minimum
column width; columns expand to use available space. Specialized content cards can retain
their own aspect and interaction controls. Card templates control their own artwork shape.

## Templates

Templates are trees of `stack`, `row`, `grid`, `overlay`, `text`, `artwork`, and `action`
nodes. Layout nodes accept `children`; leaves do not. Maximum 96 nodes and depth 8 per template.
Stack and row use flex layout; grid accepts a column count; overlay places its children in
the same grid area. Node order also determines reading order.

Text uses `text` for a literal string (at most 300 characters), or `field` for host data:
`title`, `description`, `rank`, `rankPosition`, `score`, `format`, or `year`.
Artwork uses `artwork: poster | backdrop | logo`. These bind to host artwork; package URLs
and arbitrary HTML are not template fields. `when: { field: "rankPosition", atMost: 10 }`
shows a node only for a positive numeric rank up to ten. Omitting `atMost` checks presence.

Hero actions use `action: play | details | favorite | previous | next`. Buttons appear only
when the host supplies that action. Their optional `text` changes the label. Actions cannot
appear inside badge/card templates, which already have app-owned activation behavior.

The optional `style` object supports:

| Properties | Allowed values |
| --- | --- |
| `gap`, `padding` | 0–96 pixels |
| `fontSize`, `fontWeight` | 10–96 pixels; 400–900 |
| `radius`, `opacity` | 0–80 pixels; 0–1 |
| `width`, `minHeight`, `maxWidth` | 5–100 percent; 0–600 pixels; 80–1200 pixels |
| `columns`, `grow` | 1–6; 0–1 |
| `align`, `justify` | start/center/end/stretch; start/center/end/space-between |
| `textAlign`, `position` | start/center/end; relative/absolute |
| `anchor` | fill, bottom-start, bottom-end, top-start, top-end |
| `fit`, `aspect` | cover/contain; `2 / 3`, `16 / 9`, `1 / 1` |
| `color`, `background` | Six/eight-digit hex, transparent, or supported semantic color name |

Semantic style colors are `foreground`, `background`, `muted`, `muted-foreground`, `theme`,
`card`, `card-foreground`, `primary`, and `primary-foreground`. The renderer translates
these to CSS variables. Raw CSS, selectors, functions, scripts and event-handler strings
are not part of this contract.

See Kindling for a split series rail, Tidal for overlay chrome and a top bar,
and Ledger for a continue-watching home layout.

## Theme API 2 additions

These keys need `themeApi: 2`. Colours below accept a six/eight-digit hex value or a semantic
colour name (`theme`, `foreground`, `background`, `card`, `muted`, `muted-foreground`, `primary`).

`shell.bottomNav` styles the phone bottom bar (destinations stay the user's, from Settings →
Navigation): `style` (`bar` flush with the screen edge, `floating` card above it, or a centred
`pill`), `labels` (`always`, `active`, `none`), `indicator` (`none`, a tonal `pill` behind the
icon, a `line` at the top, or a `dot` under the label), `height` (44–88), `iconSize` (16–30),
`radius` (0–40, floating and pill only), `background`, `activeColor`, `inactiveColor`, `blur`,
`border`, and `hide` (`scroll`, the default, glides the bar away while scrolling down; `never`
keeps it). The client reserves the bar's height under the page, so the bar never covers content.

`hero.indicator` replaces the featured banner's slide marker in every layout, built-in or
templated: `style` (`bars` filled over the interval, `dots`, `pills`, an "n / N" `counter`, or
`none`), `position` (`start`, `center`, `end`) and `color`. Without it each layout keeps its
default: timed bars on desktop and custom templates, dots on a phone.

`rows.defaults.heading` and per-row `heading` set `weight` (400–900), `transform` (`none`,
`uppercase`), `accent` (`none`, a `bar` or `dot` before the title, or an `underline`) and
`viewMore` (`text`, an `arrow`, or `hidden`).

`detail.tabs` chooses the series page's tab row: `underline` (default), `pills`, an iOS-style
`segmented` control, or a `bar` of equal tabs with a tinted pill behind the active one.

`player.layout: "docked"` keeps the browse chrome while watching and mounts the video in a
stage instead of the whole container. `player.dock` sets `episodes` (`right`: a scrolling
episode list beside the stage; `below`: a server switcher and an episode number grid under it),
`width` (50–100 percent of the container), `align` (`start`, `center`) and `comments` (`below`,
the default: the episode discussion under the stage, or after the episode grid; `hidden`
leaves that space plain). The client measures
the stage and hands its edges to the native video surface on every platform, so the picture is
rendered at the stage's real pixel size — a smaller player, never a rescaled one. Fullscreen,
picture-in-picture, Game mode and phones keep the full container. Card templates on home rows
also receive `rankPosition` (1-based) and `rank` (zero-padded) for numbered trending rows.

## Phone overrides

`presentation.mobile` holds a phone variant of the same layout (API 2). It accepts `density`,
`hideCardLabels`, `trueBlack`, `hero`, `rows`, `detail`, `player` and `cards`, each with the
same shape as its top-level counterpart, and applies on phones only: the Android app and any
window up to 640 pixels wide. Everywhere else the block is ignored.

Sections merge one level deep over the shared values. A phone `hero` keeps the shared
`interval` unless it sets its own; phone `rows.defaults` fill in over the shared defaults;
a row in `rows.byId` and a card family in `cards` replace the shared entry as a whole.
`shell` is not accepted inside `mobile`: phones always use the bottom bar.

Use it to give a phone a shorter or poster-led featured card, narrower poster rows, a stacked
series page with a tab-hosted episode list, or caption-free tiles, without a second package.
`shell.bottomNav` lives at the top level because only phones render the bottom bar. Packages
that include `mobile` declare `themeApi: 2`. See Lavender, Coral, Onyx and Blossom for
phone-first packages whose shared layout still renders on desktop.

## Listings and direct links

An entry contains package metadata plus `tags` (at most 12), `download` (HTTPS package URL),
`sha256` (64 hex characters), and `bytes`. Optional `preview` and `project` are HTTPS URLs.
Optional `platforms` lists the layouts the author designed, primary first: `["phone"]`,
`["desktop"]`, `["phone", "desktop"]` (designed for phones, desktop layout included) or
`["desktop", "phone"]`. The gallery labels and filters listings by it; an entry without it
serves both. `scripts/listing.mjs --platforms phone,desktop` writes it.
The catalog wraps entries as:

```json
{ "app": "izumi", "kind": "theme-catalog", "schemaVersion": 1, "themes": [] }
```

For an unlisted theme with update checks, wrap one entry in a stable release descriptor:

```json
{ "app": "izumi", "kind": "theme-release", "schemaVersion": 1, "release": {} }
```

The empty objects above illustrate envelopes; a release requires a complete validated
listing. Concrete descriptors are in `releases/`. Users paste that descriptor's URL into
Add from link. A direct package URL works too, without automatic update discovery.
The client verifies downloaded size/digest and package identity/version for listed releases.

## Personal edits and updates

The installed package's base design is retained separately from its editable Theme Studio
record. Updates use a three-way comparison: properties unchanged by the user take the new
author value; changed properties retain the user's value. Arrays, including template child
order, retain an edited array as a whole. The previous version and design remain available
for rollback. An ID installed from one origin cannot silently be replaced from another.

Theme export shares design settings only. App backup includes installed package records
and saved designs through their local storage records. Theme synchronization is not enabled
by this release.
