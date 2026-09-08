# Contributing a theme

Submit one listing in `entries/` per theme. Use a stable ID such as `author.theme-name`.
Include an accurate preview, useful description, author attribution, project link, theme API
version, versioned package URL, byte size, and SHA-256 digest. Preview images should show the
theme or clearly identify themselves as layout previews.

Keep descriptions about presentation. Do not include account information, content-source
configuration, executable scripts, or tracking parameters. Theme packages must load without
credentials and work offline once installed.

Before requesting review, run `npm run build` and `npm test`. Reviewers check compatibility,
preview accuracy, package provenance, and the actual layout on desktop and mobile. Listing
a package does not transfer ownership to this repository. New package bytes require a new
version; never replace an existing published version.

To update your listing, retain its ID and increment the version. Izumi preserves personal
edits during updates and offers restoration of the previously installed version.
