import * as express from "express";
import asyncHandler from "express-async-handler";
import { individualStats } from "./individualStats.html.js";
import { connectToDatabase } from "../../lib/sqlDatabase.js";
import { loadSqlEquiv } from "../../lib/sqlLoader.js";
import { PlayerRow } from "../../lib/db-types.js";
import {
  playerIndividualStats,
  PlayerSemesterStats,
} from "../../lib/stats.js";

const router = express.Router();
const sql = loadSqlEquiv(import.meta.url);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const connection = await connectToDatabase();
    const [players] = await connection.query<PlayerRow[]>(sql.select_players);
    const semester = res.locals.semester;
    const allStats: PlayerSemesterStats[] = [];
    for (const player of players) {
      const stats = await playerIndividualStats(player, semester);
      if (stats) {
        allStats.push(stats);
      }
    }
    allStats.sort((a, b) => {
      if (a.points - b.points > 1e-6) {
        return -1;
      } else if (a.points - b.points < 1e-6) {
        return 1;
      } else {
        return 0;
      }
    });
    res.send(individualStats({ allStats, resLocals: res.locals }));
  })
);

export default router;
