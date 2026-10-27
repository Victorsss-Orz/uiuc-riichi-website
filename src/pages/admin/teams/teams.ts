import * as express from "express";
import asyncHandler from "express-async-handler";
import { teams } from "./teams.html.js";
import { queryRows, queryWrite, withGameTransaction } from "../../../lib/sqlDatabase.js";
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

function isPlayerList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((id: unknown) => typeof id === "string");
}

router.post("/", asyncHandler<Record<string, string>, unknown, Record<string, unknown>>(async (req, res) => {
  const semester = req.query.semester?.toString();
  if (!semester) { res.status(400).send("Select a semester before editing teams."); return; }
  await withGameTransaction(async () => {
    if (req.body.__action === "add") {
      if (typeof req.body.teamName !== "string") throw new Error("A team name is required.");
      await queryWrite(sql.insert_team, { team_name: req.body.teamName, semester });
    } else if (req.body.__action === "remove") {
      const id = req.body.teamToRemove;
      if (typeof id !== "string" && typeof id !== "number") throw new Error("A team ID is required.");
      await queryWrite(sql.remove_team, { team_id: String(id) });
    } else if (req.body.__action === "save_team") {
      for (const [team_id, players] of Object.entries(req.body)) {
        if (team_id === "__action") continue;
        if (!isPlayerList(players)) throw new Error("Expected a list of player IDs.");
        for (const player_id of players) {
          const result = await queryWrite(team_id === "-1" ? sql.remove_player_from_team : sql.update_player_team,
            { player_id, semester, team_id });
          if (result.affectedRows !== 1) throw new Error("A player changed or no longer exists. Reload the team list.");
        }
      }
    }
  });
  res.redirect(req.originalUrl);
}));

export default router;
