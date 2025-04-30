import * as express from "express";
import asyncHandler from "express-async-handler";
import { teamStats } from "./teamStats.html.js";
import { connectToDatabase } from "../../lib/sqlDatabase.js";
import { loadSqlEquiv } from "../../lib/sqlLoader.js";
import { PlayerRow, TeamRow } from "../../lib/db-types.js";
import {
  getSemesterIndividualStats,
  getSemesterTeamStats,
  PlayerSemesterStats,
  teamSemesterStats,
} from "../../lib/stats.js";

const router = express.Router();
const sql = loadSqlEquiv(import.meta.url);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const connection = await connectToDatabase();
    const semester = res.locals.semester;
    const [teams] = await connection.query<TeamRow[]>(sql.select_teams, [
      semester,
    ]);

    const allStats: teamSemesterStats[] = [];
    for (const team of teams) {
      const stats = await getSemesterTeamStats(team);
      if (stats) {
        allStats.push(stats);
      }
    }
    console.log(allStats);
    allStats.sort((a, b) => {
      if (a.points - b.points > 1e-6) {
        return -1;
      } else if (a.points - b.points < 1e-6) {
        return 1;
      } else {
        return 0;
      }
    });
    res.send(teamStats({ allStats, resLocals: res.locals }));
  })
);

export default router;
