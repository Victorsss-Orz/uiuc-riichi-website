import * as express from "express";
import asyncHandler from "express-async-handler";
import { gamesGeneral } from "./gamesGeneral.html.js";
import { connectToDatabase } from "../../lib/sqlDatabase.js";
import { loadSqlEquiv } from "../../lib/sqlLoader.js";
import { PlayerType } from "../../lib/db-types.js";
import {
  playerIndividualStats,
  PlayerSemesterStats,
} from "../../lib/playerStats.js";

const router = express.Router();
const sql = loadSqlEquiv(import.meta.url);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const connection = await connectToDatabase();
    const [players] = await connection.query<PlayerType[]>(sql.select_players);
    const semester = res.locals.semester;
    const allStats: PlayerSemesterStats[] = [];
    for (const player of players) {
      const stats = await playerIndividualStats(player, semester);
      if (stats) {
        allStats.push(stats);
      }
    }
    res.send(gamesGeneral({ allStats, resLocals: res.locals }));
  })
);

export default router;
