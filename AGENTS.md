# Repository instructions

## Scope and project map

- Read `README.md` for setup, commands, and deployment details. Verify claims
  against the current checkout before updating documentation.
- This is a TypeScript/Express application with a MySQL database and a discord.js
  Gateway bot in the same process. There is no frontend bundler or root test suite.
- `src/pages/` contains Express routers, adjacent `.html.ts` templates, and SQL.
  `src/components/` contains reusable HTML and layout. `assets/` contains browser
  scripts and CSS.
- Shared domain logic belongs in `src/lib/`: game results, semester ranks, Rate,
  and player account merges are used by more than one entry point.
- `packages/html/` is a vendored template helper. Its tracked `dist/` is used at
  runtime; it is separate from the generated root `dist/`.

## Build and verification

- Use the root npm scripts. Run `npm run build` after changing TypeScript or SQL;
  it compiles to `dist/` and copies `src/**/*.sql` to the compiled module locations.
- `npm run dev` runs nodemon on compiled output only. It does not compile source.
- Keep `.js` extensions in relative TypeScript imports, matching emitted ES modules.
- Do not hand-edit generated root `dist/`. Make changes in `src/` and rebuild.
- The root package has no `test` or `lint` script. Do not report a build as evidence
  that database writes or Discord interactions work. Use focused checks for the
  affected behavior and state what was actually verified.
- Use a disposable database and a test Discord application for integration checks.
  Normal server startup attempts to launch the bot; it has no environment toggle
  to disable that attempt.

## Database and domain invariants

- Read SQL from adjacent `.sql` files with `loadSqlEquiv(import.meta.url)` and keep
  named `-- BLOCK name` markers intact. Use query parameters for data values.
- Use `queryRows`, `queryRow`, and `queryWrite` from `sqlDatabase.ts` so operations
  participate in the current transaction. `queryRow` requires exactly one result.
- Preserve `withGameTransaction` around related game, points, rank, Rate, and merge
  writes. Its database-scoped named lock serializes updates across Passenger
  workers; nested calls reuse the active transaction.
- Player and Discord IDs are represented as strings. MySQL BIGINT/DECIMAL results
  and aggregates can be strings; do not convert IDs to JavaScript numbers.
- A game has four distinct players, integer scores in multiples of 100, and a total
  score of 100000. Reuse shared validation instead of implementing separate rules
  in web routes and bot commands.
- Preserve score units: web game forms pass scores in hundreds (`250` means
  `25000`), while Discord `/result` accepts raw points (`25000`). Database scores
  use raw points. Check conversions before changing either input path.
- Semester points and rank are separate from Rate, which persists across semesters
  and includes team games. Keep Rate settlements consistent with player totals;
  use the existing rating and removal functions rather than adjusting one side.
- Account merges affect history, redirects, ranks, points, and Rate. Preserve
  preview/conflict checks, fingerprints, and transaction boundaries in
  `playerMerge.ts`. Resolve merged Discord IDs in command paths that record data.
- `databases/init.sql` is destructive and explicitly selects `uiucriichi_data`.
  Use it only for a disposable database. Existing databases use the migration
  runners in `scripts/`; do not substitute a raw schema import for a migration.
- Keep migration SQL compatible with its runner. In particular, the Rate runner
  splits statements and recognizes specific ALTER/INDEX layouts to skip existing
  schema objects; changes to SQL layout can alter migration behavior.

## Web, templates, and Discord

- Reuse the vendored `html` tagged template helper to escape dynamic content.
  Ordinary template strings do not escape values; inspect the surrounding
  rendering code before interpolating user-controlled data. Reserve `unsafeHtml`
  for content whose trust and escaping are understood.
- Keep admin routes protected by the existing authentication middleware. Route
  mount order in `server.ts` matters because the `/admin` prefix guard protects
  subsequently mounted admin routers.
- Add commands to `src/lib/bot-commands/index.ts` so help and registration include
  them. A command description claiming officer-only access is not authorization;
  preserve or explicitly implement the relevant access checks.
- Acknowledge/defer Discord commands before potentially slow database work and
  report successful writes only after commit. A failed Discord reply after commit
  must not imply that the database rolled back.
- The bot singleton lock prevents multiple Gateway clients across web workers.
  It is separate from the game-write lock; preserve their distinct purposes.
- `DEPLOY_COMMANDS=1` clears and replaces commands after bot login, targeting the
  guild hardcoded in `bot.ts`. Do not enable it against the live application for
  routine validation.

## Configuration and change scope

- Keep credentials and local data out of commits and tool output. `.env` is ignored;
  document placeholder values rather than copying local or legacy credentials.
- Database settings support `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`,
  `DB_NAME`, and `DB_SOCKET`. Omitted values retain hosting defaults, so local
  checks should explicitly configure their database connection.
- Review session and startup assumptions when changing hosting. Passenger can
  spawn several workers and stop idle processes; memory-only state is neither
  shared nor durable.
- Keep changes focused, preserve pre-existing user edits, and update the README
  when setup, commands, configuration, or deployment behavior changes.

## Formatting

- After editing code or documentation, run `npm run format:prettier` from the repository root before finishing.
- Use the project's installed Prettier and SQL plugin with `.prettierrc.json`; do not introduce separate formatting rules.
- Respect `.prettierignore`. Do not automatically format `dist/`, `databases/init.sql`, or `migrations/`. The Rate migration runner relies on the existing SQL statement layout.
- Review the resulting diff for unintended changes and preserve any pre-existing user edits.
- If formatting cannot run because dependencies or tools are unavailable, report that limitation.
