import * as express from "express";
import asyncHandler from "express-async-handler";
import { playerStats } from "./playerStats.html.js";
import { queryRows } from "../../lib/sqlDatabase.js";
import { loadSqlEquiv } from "../../lib/sqlLoader.js";
import { Player } from "../../lib/db-types.js";
import {
  getSemesterIndividualStats,
  PlayerSemesterStats,
} from "../../lib/stats.js";

const router = express.Router();
const sql = loadSqlEquiv(import.meta.url);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const players = await queryRows<Player>(sql.select_players);
    const semester = res.locals.semester;
    const allStats: PlayerSemesterStats[] = [];
    for (const player of players) {
      const stats = await getSemesterIndividualStats(player, semester);
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
    res.send(playerStats({ allStats, resLocals: res.locals }));
  })
);

export default router;
