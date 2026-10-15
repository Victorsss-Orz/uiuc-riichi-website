import { queryRows } from "./sqlDatabase.js";
import { loadSqlEquiv } from "./sqlLoader.js";
import { Team, GamePlayer } from "./db-types.js";

const sql = loadSqlEquiv(import.meta.url);

export type teamSemesterStats = {
  id: number;
  name: string;
  placements: number[];
  average_placement: number;
  points: number;
};

export async function getSemesterTeamStats(
  team: Team
): Promise<teamSemesterStats | null> {
  const player_games = await queryRows<GamePlayer>(
    sql.select_team_game_history,
    { team_id: team.id }
  );
  if (!player_games.length) {
    return null;
  }

  const placements = [0, 0, 0, 0];
  let sum_placement = 0;
  let length_placement = 0;
  for (const game of player_games) {
    placements[game.placement - 1]++;
    sum_placement += game.placement;
    length_placement++;
  }

  return {
    id: team.id,
    name: team.team_name,
    placements,
    average_placement: sum_placement / length_placement,
    points: team.points,
  };
}
