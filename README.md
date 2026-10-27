# UIUC Riichi

The UIUC Riichi club website and Discord bot, serving player and team standings,
game histories, and player profiles at <https://uiucriichi.web.illinois.edu>.
Officers can manage semesters, players, teams, and game results through the website
and Discord commands.

The application uses TypeScript, Express, MySQL, and discord.js. Pages are rendered
on the server with HTML template functions; browser scripts and styles live in
`assets/`. The website is hosted on cPanel with Passenger.

## Local setup

You need Node.js and npm compatible with the locked dependencies, Make, and a MySQL
server. The repository does not currently pin a Node.js version in `engines` or a
version file. Match the deployment runtime when possible.

Install dependencies through the Makefile:

```sh
make deps
```

This runs `npm install --include=dev`. For an install strictly from the lockfile,
use `npm ci` instead.

Create a `.env` file in the repository root with your local settings. This file is
ignored by Git. Use a dedicated local database and database user; explicitly set
all connection values because the application retains legacy hosting defaults for
values that are omitted.

```dotenv
PORT=3001
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=riichi_local
DB_PASSWORD=replace-with-local-password
DB_NAME=uiucriichi_data
ADMIN_USERNAME=local_admin
ADMIN_PASSWORD=replace-with-local-admin-password
DISCORD_TOKEN=replace-with-test-bot-token
DISCORD_CLIENT_ID=replace-with-test-application-id
DEPLOY_COMMANDS=0
```

`DB_SOCKET` can optionally specify a MySQL Unix socket. The database settings are
read in `src/lib/sqlDatabase.ts`; the admin credentials are used by `/login`.
Use the token and application ID from a separate test Discord application for the
Discord values above.
There is currently no environment setting for the session secret: session settings
are configured directly in `src/server.ts`.

### Prepare the database

For a **new, disposable local database**, inspect and import `databases/init.sql`:

```sh
mysql -u root -p < databases/init.sql
```

**This script drops and recreates the application tables.** It explicitly selects
`uiucriichi_data`, even if another database is supplied to the MySQL client. Edit a
local copy if you need a different database name, and make sure the configured
local database user has access to it. Never use this script to upgrade an existing
deployment.

The init script includes the current Rate and account-merge schema, plus a sample
`fa25` semester that is initially inactive. Before reporting games through Discord,
activate exactly one semester through `/semesters use` or update the semester
state in your local database. For an existing database, use the migration runners
below instead of the init script.

### Build and run

Use the Makefile to build and start the local development server:

```sh
make dev
```

This runs the build and SQL-copy steps, then starts nodemon. Other useful targets
are `make build` to compile and copy SQL without starting the server, and
`make clean` to remove the generated root `dist/` directory.

Open <http://localhost:3001> unless you changed `PORT`. The build compiles `src/`
into `dist/` and copies adjacent SQL files into the output directory. Runtime code
loads those SQL files from disk, so compiling TypeScript alone is insufficient.

Nodemon runs against `dist/server.js`; it does **not** compile or watch TypeScript
source files. While the development server is running, use `make build` in another
terminal after changing TypeScript or SQL.

The equivalent npm workflow is `npm run build` followed by `npm run dev`. To run
the compiled application without nodemon, use `npm start`.

Startup also attempts to acquire the bot lock and connect to Discord. Without a
valid bot token, it logs a bot-start failure while the web server remains available.
There is currently no environment flag that disables bot startup. For bot testing,
use a separate Discord application and test server so local commands cannot alter
the club's live data.

## Discord bot

The current implementation receives slash commands through a persistent Gateway
connection in `src/lib/bot.ts`. It runs inside the website process. A MySQL named
lock (`discord-bot-singleton`) allows only one Passenger worker to start the bot,
preventing multiple workers from handling the same command.

| Variable            | Purpose                                                                        |
| ------------------- | ------------------------------------------------------------------------------ |
| `DISCORD_TOKEN`     | Bot token used to connect to Discord and register commands.                    |
| `DISCORD_CLIENT_ID` | Discord application ID used when registering commands.                         |
| `DEPLOY_COMMANDS`   | Set to `1` to register command definitions after login; leave unset otherwise. |

Command definitions and handlers are in `src/lib/bot-commands/` and are collected
in `index.ts`. The commands are `/help`, `/website`, `/result`, `/updatename`, and
`/semesters` with `show`, `add`, and `use` subcommands.

Startup registration currently targets the club guild ID hardcoded in
`src/lib/bot.ts`. For a test application, change that target in your local checkout
before enabling registration. `deployCommands()` clears and replaces the commands
in its selected scope; leave `DEPLOY_COMMANDS` unset or `0` during normal operation.
Officer command access should be configured in the Discord server's integration
settings; the `/semesters` description itself does not enforce a role check.

Passenger may stop idle website processes, which also disconnects the bot. A
Gateway command cannot wake a stopped process. This checkout does not expose an
HTTP interactions endpoint; bot availability currently depends on the hosting
process remaining active.

## Database migrations

Back up an existing database and confirm the target connection settings before
running a migration. These commands modify the database selected by the
application's environment:

```sh
npm run db:migrate:rate
npm run db:migrate:merge
```

Run them in that order when upgrading a database that predates both features.
Each command builds the application before running its migration script.

- `db:migrate:rate` adds Rate columns and indexes, validates historical records,
  and backfills unsettled history in chronological order. Subsequent runs preserve
  settled history and verify the ledger; inconsistent or partially settled data
  causes the runner to stop.
- `db:migrate:merge` creates the account-redirect mapping table without rewriting
  existing game history.

Use the runners rather than applying `migrations/001_rate.sql` directly: the Rate
migration includes data validation and backfill logic beyond the DDL.

## Project layout

| Path                        | Responsibility                                                     |
| --------------------------- | ------------------------------------------------------------------ |
| `src/server.ts`             | Express middleware, route mounting, sessions, and bot startup.     |
| `src/pages/`                | Route handlers, HTML templates, and page-specific SQL.             |
| `src/components/`           | Shared layout and reusable HTML components.                        |
| `src/lib/gameResults.ts`    | Game validation, placements, points, insertion, and removal.       |
| `src/lib/rankRules.ts`      | Semester rank promotion rules and progress calculations.           |
| `src/lib/rating.ts`         | Pure Rate calculations; Rate persists across semesters.            |
| `src/lib/ratingStore.ts`    | Database settlement and removal of Rate changes.                   |
| `src/lib/playerMerge.ts`    | Account-merge previews, validation, and transactional updates.     |
| `src/lib/sqlDatabase.ts`    | Connection configuration, queries, transactions, and named locks.  |
| `src/lib/sqlLoader.ts`      | Loads adjacent SQL files and named `-- BLOCK` sections.            |
| `assets/`                   | Browser JavaScript, CSS, and branding.                             |
| `packages/html/`            | Vendored HTML escaping/template helper, including tracked `dist/`. |
| `databases/`, `migrations/` | Fresh database schema and upgrade SQL.                             |
| `scripts/`                  | Database migration runners.                                        |

TypeScript files use `.js` extensions in relative imports to match the compiled
ES modules. SQL generally lives beside the TypeScript module that loads it.

## Validation and formatting

```sh
npm run build
npm run format:prettier
```

The root package currently has no automated test or lint command. A successful
build checks TypeScript and SQL copying; it does not verify database behavior or
Discord integration. For behavioral changes, exercise the affected flows against
a disposable local database and, where needed, a test Discord application. The
vendored `packages/html/` package has its own upstream scripts and is not wired
into the root build or a root test suite.

Prettier uses the repository configuration and SQL plugin. Respect
`.prettierignore`: generated root `dist/`, `databases/init.sql`, and `migrations/`
are excluded. Review the diff after formatting.

## cPanel deployment

Install dependencies, run `npm run build`, and restart the application through
cPanel/Passenger. The npm start command uses `app.js`, which imports
`dist/server.js`; `app.cjs` is also available as a CommonJS bootstrap for hosting
setups that require it. Keep the startup file consistent with the cPanel app's
configuration.

Deploy the compiled output and its copied SQL files together. The application also
needs `assets/`, `packages/html/dist/`, and installed dependencies at runtime; it
serves frontend libraries directly from `node_modules/`. Dependencies needed for
compilation are present in `dependencies` as well as `devDependencies` in the
current package manifest.

Set database, admin, and Discord environment values in the hosting configuration.
The current server uses an in-memory session store, a hardcoded session secret,
and non-secure session cookies in source; review those settings when changing
hosting or authentication. Sessions are not shared between Passenger workers and
are lost on restart.

See [AGENTS.md](AGENTS.md) for repository editing conventions and data invariants.
