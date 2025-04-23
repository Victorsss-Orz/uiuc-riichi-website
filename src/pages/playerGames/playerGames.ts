import * as express from "express";
import asyncHandler from "express-async-handler";
import { playerGames } from "./playerGames.html.js";
import { connectToDatabase } from "../../lib/sqlDatabase.js";
import { loadSqlEquiv } from "../../lib/sqlLoader.js";
import { getGamesForPlayer } from "../../lib/playerGames.js";
import { PlayerType } from "../../lib/db-types.js";
import { findPlayerById } from "../../lib/gameStats.js";

const router = express.Router();
const sql = loadSqlEquiv(import.meta.url);

router.get(
  "/",
  asyncHandler(async (req, res) => {

    const semester = res.locals.semester;
    const player_id = parseInt(res.locals.player_id);

    const connection = await connectToDatabase();
    const [players] = await connection.query<PlayerType[]>(sql.select_players);
    const player_name = findPlayerById(players, player_id);

    const info = await getGamesForPlayer(player_id, semester);

    res.send(
      playerGames({
        info,
        player_name,
        resLocals: res.locals,
      })
    );
  })
);

export default router;
