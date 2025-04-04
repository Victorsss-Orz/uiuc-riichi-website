import express, { Request, Response, NextFunction } from "express";
import { isAuthenticated } from "./lib/auth.js";
import session from "express-session";

const app = express();
app.use(express.urlencoded({ extended: false }));
const PORT = 3001;

async function setupRoutes() {
  app.use(
    session({
      secret: "your-secret-key", // Change this to a secure, random string
      resave: false, // Prevents saving unchanged sessions
      saveUninitialized: false, // Prevents saving empty sessions
      cookie: { secure: false }, // Set to true if using HTTPS
    })
  );

  app.use(
    "/admin",
    // isAuthenticated, // TODO: remember to enable it back
    (await import("./pages/addPlayer/addPlayer.js")).default // TODO: add default admin panel page
  );
  app.use("/login", (await import("./pages/adminLogin/adminLogin.js")).default);

  app.use(
    "/admin/players",
    (await import("./pages/addPlayer/addPlayer.js")).default
  );
  app.use(
    "/admin/games",
    (await import("./pages/insertGame/insertGame.js")).default
  );
  app.use(
    "/:semester([a-zA-Z0-9_-]+)/overview",
    function (req: Request, res: Response, next: NextFunction) {
      res.locals.semester = req.params.semester;
      next();
    },
    (await import("./pages/gamesGeneral/gamesGeneral.js")).default
  );
}

setupRoutes().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
});
