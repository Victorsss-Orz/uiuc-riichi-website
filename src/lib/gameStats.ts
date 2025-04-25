import { Request } from "express";

import {
  StartingWind,
  PlayerType,
  PlayerSemesterDataType,
  GamePlayerRow,
} from "./db-types.js";
import { connectToDatabase } from "./sqlDatabase.js";
import { loadSqlEquiv } from "./sqlLoader.js";
import { ResultSetHeader } from "mysql2";

const sql = loadSqlEquiv(import.meta.url);

export type GameResult = {
  player_id: number;
  player_name: string;
  starting_wind: StartingWind | null;
  score: number;
  placement: number;
  point_change: number;
};

export function findPlayerById(players: PlayerType[], id: number): string {
  let player_name = "";
  players.forEach((player) => {
    if (player.id === id) {
      player_name = player.player_name;
    }
  });
  return player_name;
}

export async function processGameResults(req: Request): Promise<GameResult[]> {
  const {
    player1ID,
    player2ID,
    player3ID,
    player4ID,
    player1Score,
    player2Score,
    player3Score,
    player4Score,
    player1Wind,
    player2Wind,
    player3Wind,
    player4Wind,
    teamGame,
  } = req.body;

  const player1ScoreVal = parseInt(player1Score, 10) * 100;
  const player2ScoreVal = parseInt(player2Score, 10) * 100;
  const player3ScoreVal = parseInt(player3Score, 10) * 100;
  const player4ScoreVal = parseInt(player4Score, 10) * 100;

  const totalScore =
    player1ScoreVal + player2ScoreVal + player3ScoreVal + player4ScoreVal;

  if (
    teamGame &&
    new Set([player1Wind, player2Wind, player3Wind, player4Wind]).size < 4
  ) {
    throw new Error(`
      <p style="color:red;">There should not be duplicate starting winds for team games</p>
    `);
  }

  if (Math.abs(totalScore - 100000) > 0.1) {
    throw new Error(`
      <p style="color:red;">Total score does not add up to <b>100000</b></p>
      <p>Current total score: <b>${totalScore}</b></p>
    `);
  }

  if (new Set([player1ID, player2ID, player3ID, player4ID]).size < 4) {
    throw new Error(`
      <p style="color:red;">You must select 4 distinct players</p>
    `);
  }

  const results: GameResult[] = [
    {
      player_id: parseInt(player1ID, 10),
      player_name: "",
      score: player1ScoreVal,
      starting_wind: teamGame ? player1Wind : null,
      placement: 0,
      point_change: 0,
    },
    {
      player_id: parseInt(player2ID, 10),
      player_name: "",
      score: player2ScoreVal,
      starting_wind: teamGame ? player2Wind : null,
      placement: 0,
      point_change: 0,
    },
    {
      player_id: parseInt(player3ID, 10),
      player_name: "",
      score: player3ScoreVal,
      starting_wind: teamGame ? player3Wind : null,
      placement: 0,
      point_change: 0,
    },
    {
      player_id: parseInt(player4ID, 10),
      player_name: "",
      score: player4ScoreVal,
      starting_wind: teamGame ? player4Wind : null,
      placement: 0,
      point_change: 0,
    },
  ];
  results.sort((a, b) => {
    if (a.score - b.score > 1e-6) {
      return -1;
    } else if (a.score - b.score < 1e-6) {
      return 1;
    } else {
      return 0;
    }
  });

  const placementPointsMatching = [50, 10, -10, -30];
  const connection = await connectToDatabase();
  const [players] = await connection.query<PlayerType[]>(sql.select_players);

  // Updates information for game results
  // Considers tie games for placement points
  for (let i = 0; i < 4; i) {
    const placement_points = [placementPointsMatching[i]];
    let j = i + 1;
    for (j; j < 4; j++) {
      if (Math.abs(results[i].score - results[j].score) > 1e-6) {
        break;
      }
      placement_points.push(placementPointsMatching[j]);
    }
    for (let k = i; k < j; k++) {
      results[k].point_change =
        (results[k].score - 30000) / 1000 +
        placement_points.reduce((acc, val) => acc + val, 0) /
          placement_points.length;
      results[k].placement = i + 1;
      results[k].player_name = findPlayerById(players, results[k].player_id);
    }
    i = j;
  }
  return results;
}

export async function insertGameResults(
  results: GameResult[],
  semester: string,
  is_team_game: boolean
): Promise<void> {
  // Create game
  const connection = await connectToDatabase();
  const [inserted_game] = await connection.query<ResultSetHeader>(
    sql.insert_game,
    [is_team_game, semester]
  );

  for (const result of results) {
    // Insert player semester data if DNE
    let [data] = await connection.query<PlayerSemesterDataType[]>(
      sql.select_player_semester_data,
      [result.player_id, semester]
    );
    if (data.length == 0) {
      console.log(`Creating ${semester} data for ${result.player_name}`);
      await connection.query(sql.insert_player_semester_data, [
        result.player_id,
        semester,
      ]);
    }

    // Insert player results
    await connection.query(sql.insert_player_game_result, [
      inserted_game.insertId,
      result.player_id,
      result.starting_wind,
      result.score,
      result.placement,
      result.point_change,
    ]);
    console.log(
      `Inserted player ${result.player_id} results for game ${inserted_game.insertId}`
    );

    if (!is_team_game) {
      // Update player semester data
      const [players_data] = await connection.query<PlayerSemesterDataType[]>(
        sql.select_player_semester_data,
        [result.player_id, semester]
      );
      const player_data = players_data[0];
      const new_points = player_data.points + result.point_change;

      // Ranking
      const [player_games] = await connection.query<GamePlayerRow[]>(
        sql.select_player_game_history,
        [semester, result.player_id]
      );
      let new_ranking = player_data.ranking;
      while (playerRankUp(player_games, new_ranking)) {
        new_ranking++;
      }
      // Update
      await connection.query(sql.update_player_semester_data, [
        new_ranking,
        new_points,
        result.player_id,
        semester,
      ]);
    } else {
      // TODO: Update team scores and stuff
    }
  }
}

function playerRankUp(player_games: GamePlayerRow[], ranking: number): boolean {
  const rankLookup = [
    { num_games: 5, avg_placement: 3.0 }, // 4级
    { num_games: 5, avg_placement: 2.9 },
    { num_games: 5, avg_placement: 2.8 },
    { num_games: 10, avg_placement: 2.7 }, // 1级
    { num_games: 10, avg_placement: 2.6 }, // 初段
    { num_games: 10, avg_placement: 2.5 },
    { num_games: 15, avg_placement: 2.5 },
    { num_games: 15, avg_placement: 2.4 },
    { num_games: 20, avg_placement: 2.4 },
    { num_games: 20, avg_placement: 2.3 },
    { num_games: 25, avg_placement: 2.3 },
    { num_games: 25, avg_placement: 2.2 },
    { num_games: 25, avg_placement: 2.1 },
    { num_games: 30, avg_placement: 2.0 }, // 十段
  ];
  const requirement = rankLookup[ranking];
  if (player_games.length < requirement.num_games) {
    return false;
  }
  const game_placements = [];
  for (
    let i = player_games.length - requirement.num_games;
    i < player_games.length;
    i++
  ) {
    game_placements.push(player_games[i].placement);
  }
  const player_avg_placement =
    game_placements.reduce((acc, val) => acc + val, 0) / game_placements.length;
  return player_avg_placement <= requirement.avg_placement;
}
