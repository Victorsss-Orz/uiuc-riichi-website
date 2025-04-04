import { Request } from "express";

import { StartingWind, PlayerType } from "./db-types.js";
import { connectToDatabase } from "./sqlDatabase.js";
import { loadSqlEquiv } from "./sqlLoader.js";

const sql = loadSqlEquiv(import.meta.url);

export type GameResultType = {
  player_id: number;
  player_name: string;
  starting_wind: StartingWind | null;
  score: number;
  placement: number;
  point_change: number;
};

function findPlayerById(players: PlayerType[], id: number): string {
  let player_name = "";
  players.forEach((player) => {
    if (player.id === id) {
      player_name = player.player_name;
    }
  });
  return player_name;
}

export async function processGameResults(
  req: Request
): Promise<GameResultType[]> {
  const {
    player1ID,
    player2ID,
    player3ID,
    player4ID,
    player1Score,
    player2Score,
    player3Score,
    player4Score,
  } = req.body;

  const player1ScoreVal = parseInt(player1Score, 10) * 100;
  const player2ScoreVal = parseInt(player2Score, 10) * 100;
  const player3ScoreVal = parseInt(player3Score, 10) * 100;
  const player4ScoreVal = parseInt(player4Score, 10) * 100;

  const totalScore =
    player1ScoreVal + player2ScoreVal + player3ScoreVal + player4ScoreVal;

  if (Math.abs(totalScore - 100000) > 0.1) {
    throw new Error(`
      <p style="color:red;">Total score does not add up to <b>100000</b></p>
      <p>Current total score: <b>${totalScore}</b></p>
    `);
  }

  // if (new Set([player1ID, player2ID, player3ID, player4ID]).size < 4) {
  //   throw new Error(`
  //     <p style="color:red;">Cannot have duplicate players in a game</p>
  //   `);
  // }

  const results: GameResultType[] = [
    {
      player_id: parseInt(player1ID, 10),
      player_name: "",
      score: player1ScoreVal,
      starting_wind: null,
      placement: 0,
      point_change: 0,
    },
    {
      player_id: parseInt(player2ID, 10),
      player_name: "",
      score: player2ScoreVal,
      starting_wind: null,
      placement: 0,
      point_change: 0,
    },
    {
      player_id: parseInt(player3ID, 10),
      player_name: "",
      score: player3ScoreVal,
      starting_wind: null,
      placement: 0,
      point_change: 0,
    },
    {
      player_id: parseInt(player4ID, 10),
      player_name: "",
      score: player4ScoreVal,
      starting_wind: null,
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
