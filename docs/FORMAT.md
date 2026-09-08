# Theme API 1

This API requires a theme-enabled Izumi build. The theme catalog is independent of client
release scheduling; older builds without Settings → Themes cannot install these packages.

## Package

A package is one UTF-8 JSON document, at most 256,000 bytes. Required envelope fields:

| Field | Value |
| --- | --- |
| `app` | `izumi` |
| `kind` | `theme-package` |
| `schemaVersion` | `1` |
| `themeApi` | `1` |
| `id` | Stable lowercase author/theme identity, 2–64 letters, digits, dots or hyphens |
| `name` | Display name, 1–48 characters |
| `author` | Attribution, 1–80 characters |
| `description` | Description, 1–600 characters |
| `version` | Three numeric version parts, e.g. `1.0.0` |
| `design` | Appearance and presentation settings |

`design` accepts `tokens`, `radius` (0–2 rem), `font` (`nunito`, `system`, `serif`, `mono`),
`fontScale` (0.85–1.2), `backdrop` (`solid`, `aurora`, `spotlight`, `mesh`),
`backdropStrength` (0–0.65), `glassBlur` (0–40 pixels), and `presentation`.
Set backdrop/strength/blur explicitly for a solid theme. Unspecified design values use the
Theme Studio starter, while absent presentation properties use the client's default layout.

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

See the Cinema package for a conditional rank badge, Meridian for a composed hero/card,
and Ink for row-specific grid/carousel choices.

## Listings and direct links

An entry contains package metadata plus `tags` (at most 12), `download` (HTTPS package URL),
`sha256` (64 hex characters), and `bytes`. Optional `preview` and `project` are HTTPS URLs.
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
