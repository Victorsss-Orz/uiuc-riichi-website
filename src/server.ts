import express from "express";

const app = express();
app.use(express.urlencoded({ extended: false }));
const PORT = 3001;

async function setupRoutes() {
  app.use((req, res, next) => {
    res.locals.homeUrl = "/";
    res.locals.count = 0;
    next();
  });
  app.use(
    "/insert_game",
    (await import("./pages/insertGame/insertGame.js")).default
  );
  app.use(
    "/add_player",
    (await import("./pages/addPlayer/addPlayer.js")).default
  );
}

setupRoutes().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
});
