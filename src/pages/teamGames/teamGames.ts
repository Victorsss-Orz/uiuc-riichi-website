import * as express from "express";
import asyncHandler from "express-async-handler";
import { teamGames } from "./teamGames.html.js";
import { queryRows } from "../../lib/sqlDatabase.js";
import { loadSqlEquiv } from "../../lib/sqlLoader.js";
import { getGamesForPlayer } from "../../lib/gamesTable.js";
import { Team } from "../../lib/db-types.js";
import { findTeamById } from "../../lib/gameResults.js";

const router = express.Router();
const sql = loadSqlEquiv(import.meta.url);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const semester = res.locals.semester;
    const team_id = parseInt(res.locals.team_id);

    const teams = await queryRows<Team>(sql.select_teams, { semester });
    const team_name = findTeamById(teams, team_id);
    console.log(team_name);

    const team_players = await queryRows<number>(sql.select_team_players, {
      team_id,
    });
    console.log(team_players);

    // const info = await getGamesForPlayer(player_id, semester);

    res.send("");
  })
);

export default router;
