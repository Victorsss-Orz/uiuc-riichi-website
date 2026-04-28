## UIUC Riichi Website + Discord Bot

An Express + TypeScript app that serves the UIUC Riichi club website (stats, games, admin pages) and can also run a Discord slash-command bot that writes/reads the same MySQL database.

### Tech stack

- **Server**: Node.js, Express, TypeScript (compiled to `dist/`)
- **Database**: MySQL (`mysql2/promise`)
- **UI assets**: Bootstrap, Bootstrap Table, Chart.js, jQuery, SortableJS (served from `node_modules/`)
- **Bot**: `discord.js` (starts alongside the server if configured)

### Prerequisites

- **Node.js + npm**
- **MySQL** running locally (or reachable from this machine)

### Setup

Install dependencies:

```bash
npm install --include=dev
```

Create a `.env` file in `uiuc-riichi-website/` (it’s gitignored) for Discord settings:

```bash
# Required to run the Discord bot
DISCORD_TOKEN=your-bot-token
DISCORD_CLIENT_ID=your-application-client-id

# Optional: set to 1 to auto-register commands on startup
DEPLOY_COMMANDS=0

# Optional: web server port (default: 3001)
PORT=3001
```

### Database initialization

1) Create the schema/tables:

```bash
mysql -u root -p < databases/init.sql
```

2) Create the MySQL user/password expected by the code (or change them in `src/lib/sqlDatabase.ts`):

```sql
CREATE USER IF NOT EXISTS 'uiucriichi_admin'@'localhost' IDENTIFIED BY 'uiucriichi1326';
GRANT ALL PRIVILEGES ON uiucriichi_data.* TO 'uiucriichi_admin'@'localhost';
FLUSH PRIVILEGES;
```

### Build

Compile TypeScript to `dist/` and copy SQL files into `dist/`:

```bash
npx tsc
npm run postbundle
```

### Run (local)

Start the server (expects `dist/` to already exist):

```bash
npm start
```

Open `http://localhost:3001`.

### Development workflow

This repo’s `npm run dev` runs `nodemon dist/server.js`, so you typically want a TypeScript compiler running in watch mode too:

Terminal 1:

```bash
npx tsc -w
```

Terminal 2:

```bash
npm run dev
```

### Admin login (current default)

- **URL**: `/login`
- **Default credentials**: `admin` / `1326` (see `src/pages/admin/login/login.ts`)

### Notes / gotchas

- **Bot startup**: the Discord bot starts from `src/server.ts` when the web server starts. It uses a MySQL named lock (`GET_LOCK('discord-bot-singleton', 0)`) so only one instance starts the bot.
- **Secrets**: update the session secret in `src/server.ts` and the hard-coded DB credentials in `src/lib/sqlDatabase.ts` before deploying publicly.
- **Makefile**: `Makefile` includes Unix commands (like `rm -rf`) and may not work on Windows; the `npm`/`npx` commands above are the recommended cross-platform path.
