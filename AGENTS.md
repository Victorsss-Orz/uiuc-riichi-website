# Repository instructions

## Formatting

- After editing code or documentation, run `npm run format:prettier` from the repository root before finishing.
- Use the project's installed Prettier and SQL plugin with `.prettierrc.json`; do not introduce separate formatting rules.
- Respect `.prettierignore`. Do not automatically format `dist/`, `databases/init.sql`, or `migrations/`. The Rate migration runner relies on the existing SQL statement layout.
- Review the resulting diff for unintended changes and preserve any pre-existing user edits.
- If formatting cannot run because dependencies or tools are unavailable, report that limitation.
