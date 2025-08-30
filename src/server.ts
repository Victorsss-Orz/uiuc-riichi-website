import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";

import { isAuthenticated } from "./lib/auth.js";
import { error } from "./pages/error/error.html.js";
import { startBot } from "./lib/bot.js";
import { acquireSingleton } from "./lib/sqlDatabase.js";

const app = express();
app.use(express.urlencoded({ extended: false }));
const PORT = process.env.PORT || 3001;
// const PORT = 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupRoutes() {
  app.use(
    session({
      secret: "your-secret-key", // Change this to a secure, random string
      resave: false, // Prevents saving unchanged sessions
      saveUninitialized: false, // Prevents saving empty sessions
      cookie: { secure: false }, // Set to true if using HTTPS
    })
  );
  app.use(express.json());
  app.use(
    "/bootstrap",
    express.static(path.join(__dirname, "../node_modules/bootstrap/dist"))
  );
  app.use(
    "/jquery",
    express.static(path.join(__dirname, "../node_modules/jquery/dist"))
  );
  app.use(
    "/chart.js",
    express.static(path.join(__dirname, "../node_modules/chart.js/dist"))
  );
  app.use(
    "/bootstrap-table",
    express.static(path.join(__dirname, "../node_modules/bootstrap-table/dist"))
  );
  app.use(
    "/sortablejs",
    express.static(path.join(__dirname, "../node_modules/sortablejs"))
  );
  app.use("/assets", express.static(path.join(__dirname, "../assets")));

  // TODO: create page
  app.use(
    "/",
    (await import("./middlewares/selectSemesters.js")).default,
    (await import("./middlewares/checkAuthentication.js")).default,
    (await import("./pages/home/home.js")).default
  );

  app.use(
    "/admin",
    isAuthenticated, // TODO: remember to enable it back
    (await import("./pages/admin/players/players.js")).default // TODO: add default admin panel page
  );
  app.use("/login", (await import("./pages/admin/login/login.js")).default);

  app.use(
    "/admin/players",
    (await import("./pages/admin/players/players.js")).default
  );
  app.use(
    "/admin/games",
    (await import("./pages/admin/games/games.js")).default
  );
  app.use(
    "/admin/teams",
    (await import("./pages/admin/teams/teams.js")).default
  );

  app.use(
    "/semester/:semester([a-zA-Z0-9_-]+)",
    (await import("./middlewares/getSemester.js")).default
  );
  app.use(
    "/semester/:semester([a-zA-Z0-9_-]+)/players",
    (await import("./pages/playerStats/playerStats.js")).default
  );
  app.use(
    "/semester/:semester([a-zA-Z0-9_-]+)/player/:player_id(\\d+)",
    function (req: Request, res: Response, next: NextFunction) {
      res.locals.player_id = req.params.player_id;
      next();
    },
    (await import("./pages/playerGames/playerGames.js")).default
  );
  app.use(
    "/semester/:semester([a-zA-Z0-9_-]+)/teams",
    (await import("./pages/teamStats/teamStats.js")).default
  );
  app.use(
    "/semester/:semester([a-zA-Z0-9_-]+)/team/:team_id(\\d+)",
    function (req: Request, res: Response, next: NextFunction) {
      res.locals.team_id = req.params.team_id;
      next();
    },
    (await import("./pages/teamGames/teamGames.js")).default
  );

  app.use((req, res) => {
    // TODO: handle this through another page
    res.status(404).send(error({ resLocals: res.locals }));
  });
}

setupRoutes().then(() => {
  app.listen(PORT, async () => {
    console.log(`Server running at http://localhost:${PORT}`);
    try {
      const canStartBot = await acquireSingleton();
      if (canStartBot) {
        await startBot();
      } else {
        console.log("Bot already running.");
      }
    } catch (e) {
      console.log(`Bot failed to start: ${e}`);
    }
  });
});
