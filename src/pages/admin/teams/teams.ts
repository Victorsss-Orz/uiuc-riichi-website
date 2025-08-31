import * as express from "express";
import asyncHandler from "express-async-handler";
import { teams } from "./teams.html.js";
import { queryRows, queryWrite } from "../../../lib/sqlDatabase.js";
import { loadSqlEquiv } from "../../../lib/sqlLoader.js";
import { Player, Team } from "../../../lib/db-types.js";

const router = express.Router();
const sql = loadSqlEquiv(import.meta.url);

export type TeamPlayerInformation = {
  id: number;
  team_name: string;
  players: Player[];
};

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const semester = req.query.semester?.toString();
    if (!semester) {
      res.send(
        teams({
          resLocals: res.locals,
          semester,
          teamInfo: [],
          unassigned_players: [],
        })
      );
    } else {
      const all_teams = await queryRows<Team>(sql.select_teams, { semester });

      const teamInfo: TeamPlayerInformation[] = [];
      for (const team of all_teams) {
        const players = await queryRows<Player>(sql.select_players_of_team, {
          team_id: team.id,
        });
        teamInfo.push({ id: team.id, team_name: team.team_name, players });
      }
      const unassigned_players = await queryRows<Player>(
        sql.select_unassigned_players,
        { semester }
      );

      res.send(
        teams({
          resLocals: res.locals,
          semester,
          teamInfo,
          unassigned_players,
        })
      );
    }
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const semester = req.query.semester?.toString();
    if (req.body.__action === "add") {
      await queryWrite(sql.insert_team, {
        team_name: req.body.teamName,
        semester,
      });
      res.redirect(req.originalUrl);
    } else if (req.body.__action == "remove") {
      await queryWrite(sql.remove_team, { team_id: req.body.teamToRemove });
      res.redirect(req.originalUrl);
    } else if (req.body.__action == "save_team") {
      for (const team_id in req.body) {
        if (team_id == "__action") {
          continue;
        } else if (team_id == "-1") {
          const players = req.body[team_id];
          for (const player_id of players) {
            await queryWrite(sql.remove_player_from_team, {
              player_id,
              semester,
            });
          }
        } else {
          const players = req.body[team_id];
          for (const player_id of players) {
            await queryWrite(sql.update_player_team, {
              team_id,
              player_id,
              semester,
            });
          }
        }
      }
      res.redirect(req.originalUrl);
    }
  })
);

export default router;
