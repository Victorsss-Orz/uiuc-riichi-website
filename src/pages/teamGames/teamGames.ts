import * as express from "express";
import asyncHandler from "express-async-handler";
import { teamGames } from "./teamGames.html.js";
import { queryRows } from "../../lib/sqlDatabase.js";
import { loadSqlEquiv } from "../../lib/sqlLoader.js";
import { GameInfo, getGamesForPlayer } from "../../lib/gamesTable.js";
import { Team } from "../../lib/db-types.js";
import { findTeamById } from "../../lib/gameResults.js";

const router = express.Router();
const sql = loadSqlEquiv(import.meta.url);

type Id = { player_id: number };

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const semester = res.locals.semester;
    const team_id = parseInt(res.locals.team_id);

    const teams = await queryRows<Team>(sql.select_teams, { semester });
    const team_name = findTeamById(teams, team_id);

    const team_players = await queryRows<Id>(sql.select_team_players, {
      team_id,
    });

    let info: GameInfo[] = [];
    for (const player of team_players) {
      const new_game_info = await getGamesForPlayer(player.player_id, semester);
      info = info.concat(new_game_info);
    }

    res.send(
      teamGames({
        info: info.filter((item) => item.is_team_game),
        team_name,
        team_players: team_players.map((item) => item.player_id),
        resLocals: res.locals,
      })
    );
  })
);

export default router;
