# Contributing a theme

Follow [Submitting a theme](README.md#submitting-a-theme): one listing in `entries/` per theme, with
a stable id such as `author.theme-name`, an accurate description, real screenshots, the theme API it
needs, and a versioned package with its exact size and SHA-256. Check it against
[What gets accepted](README.md#what-gets-accepted) first.

Keep descriptions about presentation. Packages carry no account information, source settings,
scripts or tracking parameters, load without credentials, and work offline once installed.

Before requesting review, run `npm run build` and `npm test`. New package bytes need a new version;
never replace a published one. To update a listing, keep its id and bump the version
([Updates](README.md#updates)).

Changes to the theme API itself start in the [izumi](https://github.com/nickEatsBread/izumi) client;
the validator files in `scripts/` are copies of it.

Listing a theme doesn't transfer ownership. Original example designs and tooling are MIT; your
theme's licence is set in its own project repository.
