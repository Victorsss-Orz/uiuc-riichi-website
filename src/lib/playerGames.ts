import { GamePlayer, GamePlayerRow } from "./db-types.js";
import { connectToDatabase } from "./sqlDatabase.js";
import { loadSqlEquiv } from "./sqlLoader.js";

const sql = loadSqlEquiv(import.meta.url);

export interface GameInformationRow extends GamePlayerRow {
  game_time: string;
  is_team_game: boolean;
  player_name: string;
}

type ExtendedGamePlayer = GamePlayer & { player_name: string };

export type GameInfo = {
  game_id: number;
  game_date: string;
  is_team_game: boolean;
  player_1: ExtendedGamePlayer | null;
  player_2: ExtendedGamePlayer | null;
  player_3: ExtendedGamePlayer | null;
  player_4: ExtendedGamePlayer | null;
};

export async function getGamesForPlayer(
  player_id: string,
  semester: string
): Promise<GameInfo[]> {
  const connection = await connectToDatabase();
  const [games] = await connection.query<GameInformationRow[]>(
    sql.select_player_games,
    [player_id, semester]
  );

  const info: GameInfo[] = [];
  let curr_game_info = { game_id: -1, game_date: "", is_team_game: false };
  let curr_game_players: (ExtendedGamePlayer | null)[] = [];
  for (const game of games) {
    if (curr_game_info.game_id != game.game_id) {
      if (curr_game_players.length) {
        while (curr_game_players.length < 4) {
          curr_game_players.push(null);
        }
        info.push({
          game_id: curr_game_info.game_id,
          game_date: curr_game_info.game_date,
          is_team_game: curr_game_info.is_team_game,
          player_1: curr_game_players[0],
          player_2: curr_game_players[1],
          player_3: curr_game_players[2],
          player_4: curr_game_players[3],
        });
      }
      curr_game_info = {
        game_id: game.game_id,
        game_date: game.game_time,
        is_team_game: game.is_team_game,
      };
      curr_game_players = [];
    }
    curr_game_players.push({
      game_id: game.game_id,
      player_id: game.player_id,
      starting_wind: game.starting_wind,
      score: game.score,
      placement: game.placement,
      point_change: game.point_change,
      player_name: game.player_name,
    });
  }
  while (curr_game_players.length < 4) {
    curr_game_players.push(null);
  }
  info.push({
    game_id: curr_game_info.game_id,
    game_date: curr_game_info.game_date,
    is_team_game: curr_game_info.is_team_game,
    player_1: curr_game_players[0],
    player_2: curr_game_players[1],
    player_3: curr_game_players[2],
    player_4: curr_game_players[3],
  });

  return info;
}
