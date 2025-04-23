import * as express from "express";
import asyncHandler from "express-async-handler";
import { playerGames } from "./playerGames.html.js";
import { connectToDatabase } from "../../lib/sqlDatabase.js";
import { loadSqlEquiv } from "../../lib/sqlLoader.js";
import { getGamesForPlayer } from "../../lib/playerGames.js";

const router = express.Router();
// const sql = loadSqlEquiv(import.meta.url);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    console.log(res.locals);

    const semester = res.locals.semester;
    const player_id = res.locals.player_id;

    const info = await getGamesForPlayer(player_id, semester);
    console.log(info);

    res.send(playerGames({ games: [], resLocals: res.locals }));
  })
);

export default router;
