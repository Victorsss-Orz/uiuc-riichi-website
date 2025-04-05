import { connectToDatabase } from "./sqlDatabase.js";
import { loadSqlEquiv } from "./sqlLoader.js";
import {
  GamePlayerType,
  PlayerSemesterDataType,
  PlayerType,
} from "./db-types.js";

const sql = loadSqlEquiv(import.meta.url);

export type PlayerSemesterStats = {
  id: number;
  name: string;
  placements: number[];
  average_placement: number;
  ranking: string;
  points: number;
};

export async function playerIndividualStats(
  player: PlayerType,
  semester: string
): Promise<PlayerSemesterStats | null> {
  const connection = await connectToDatabase();

  const [player_games] = await connection.query<GamePlayerType[]>(
    sql.select_player_game_history,
    [semester, player.id]
  );
  if (!player_games.length) {
    return null;
  }
  const [players_data] = await connection.query<PlayerSemesterDataType[]>(
    sql.select_player_semester_data,
    [player.id, semester]
  );
  const player_data = players_data[0];

  const placements = [0, 0, 0, 0];
  let sum_placement = 0;
  let length_placement = 0;
  for (const game of player_games) {
    placements[game.placement - 1]++;
    sum_placement += game.placement;
    length_placement++;
  }

  const rankingText = [
    "5级",
    "4级",
    "3级",
    "2级",
    "1级",
    "初段",
    "二段",
    "三段",
    "四段",
    "五段",
    "六段",
    "七段",
    "八段",
    "九段",
    "十段",
  ];
  return {
    id: player.id,
    name: player.player_name,
    placements,
    average_placement: sum_placement / length_placement,
    ranking: rankingText[player_data.ranking],
    points: player_data.points,
  };
}
