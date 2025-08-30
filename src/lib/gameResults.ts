import {
  StartingWind,
  Game,
  GamePlayer,
  Team,
  Player,
  PlayerSemesterData,
} from "./db-types.js";
import { queryRow, queryRows, queryWrite } from "./sqlDatabase.js";
import { loadSqlEquiv } from "./sqlLoader.js";

const sql = loadSqlEquiv(import.meta.url);

export type GameResult = {
  player_id: string;
  player_name: string;
  team_id: number | null;
  starting_wind: StartingWind | null;
  score: number;
  placement: number;
  point_change: number;
};

type GameAndPlayer = Game & GamePlayer;

export function findPlayerById(players: Player[], id: string): string {
  let player_name = "";
  players.forEach((player) => {
    if (player.id === id) {
      player_name = player.player_name;
    }
  });
  return player_name;
}

export function findTeamById(teams: Team[], id: number): string {
  let team_name = "";
  teams.forEach((team) => {
    if (team.id === id) {
      team_name = team.team_name;
    }
  });
  return team_name;
}

export async function processGameResults(
  data: {
    player1ID: string;
    player2ID: string;
    player3ID: string;
    player4ID: string;
    player1Score: string;
    player2Score: string;
    player3Score: string;
    player4Score: string;
    player1Wind: StartingWind | null;
    player2Wind: StartingWind | null;
    player3Wind: StartingWind | null;
    player4Wind: StartingWind | null;
    teamGame: boolean;
    semester: string;
  },
  context: "website" | "discord" = "discord"
): Promise<GameResult[]> {
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
    semester,
  } = data;

  const player1ScoreVal = parseInt(player1Score, 10) * 100;
  const player2ScoreVal = parseInt(player2Score, 10) * 100;
  const player3ScoreVal = parseInt(player3Score, 10) * 100;
  const player4ScoreVal = parseInt(player4Score, 10) * 100;

  const totalScore =
    player1ScoreVal + player2ScoreVal + player3ScoreVal + player4ScoreVal;

  if (teamGame) {
    if (
      new Set([player1Wind, player2Wind, player3Wind, player4Wind]).size < 4
    ) {
      throw new Error(`
        <p style="color:red;">There should not be duplicate starting winds for team games</p>
      `);
    }

    const teams = [
      await queryRow<{ team_id: number }>(sql.select_team_of_player, {
        player_id: parseInt(player1ID, 10),
        semester,
      }),
      await queryRow<{ team_id: number }>(sql.select_team_of_player, {
        player_id: parseInt(player2ID, 10),
        semester,
      }),
      await queryRow<{ team_id: number }>(sql.select_team_of_player, {
        player_id: parseInt(player3ID, 10),
        semester,
      }),
      await queryRow<{ team_id: number }>(sql.select_team_of_player, {
        player_id: parseInt(player4ID, 10),
        semester,
      }),
    ].filter((item) => item.team_id);
    if (new Set(teams.map((item) => item.team_id)).size < 4) {
      throw new Error(`
        <p style="color:red;">All players should come from different teams for team games</p>
      `);
    }
  }

  if (Math.abs(totalScore - 100000) > 0.1) {
    if (context === "website") {
      throw new Error(`
      <p style="color:red;">Total score does not add up to <b>100000</b></p>
      <p>Current total score: <b>${totalScore}</b></p>
    `);
    } else {
      throw new Error(`Total score does not add up to *100000*
Current total score: *${totalScore}*`);
    }
  }

  if (new Set([player1ID, player2ID, player3ID, player4ID]).size < 4) {
    if (context === "website") {
      throw new Error(`
      <p style="color:red;">You must select 4 distinct players</p>
    `);
    } else {
      throw new Error("You must select 4 distinct players");
    }
  }

  const results: GameResult[] = [
    {
      player_id: player1ID,
      player_name: "",
      team_id: null,
      score: player1ScoreVal,
      starting_wind: teamGame ? player1Wind : null,
      placement: 0,
      point_change: 0,
    },
    {
      player_id: player2ID,
      player_name: "",
      team_id: null,
      score: player2ScoreVal,
      starting_wind: teamGame ? player2Wind : null,
      placement: 0,
      point_change: 0,
    },
    {
      player_id: player3ID,
      player_name: "",
      team_id: null,
      score: player3ScoreVal,
      starting_wind: teamGame ? player3Wind : null,
      placement: 0,
      point_change: 0,
    },
    {
      player_id: player4ID,
      player_name: "",
      team_id: null,
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
  const players = await queryRows<Player>(sql.select_players);

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
      if (teamGame) {
        results[k].team_id = (
          await queryRow<{ team_id: number }>(sql.select_team_of_player, {
            player_id: results[k].player_id,
            semester,
          })
        ).team_id;
      }
    }
    i = j;
  }
  return results;
}

export async function removeGameResults(game_id: number): Promise<void> {
  console.log(`Removing game ${game_id}`);
  const games = await queryRows<GameAndPlayer>(sql.select_game_information, {
    game_id,
  });
  if (!games.length) {
    return;
  }
  const { semester, is_team_game } = games[0];

  for (const game of games) {
    if (!is_team_game) {
      // Update player semester data
      // Total points
      const player_data = await queryRow<PlayerSemesterData>(
        sql.select_player_semester_data,
        { player_id: game.player_id, semester }
      );
      const new_points = player_data.points - game.point_change;

      // Update
      await queryWrite(sql.update_player_semester_data, {
        new_ranking: player_data.ranking,
        new_points,
        player_id: game.player_id,
        semester,
      });
    } else {
      // Update team data
      const team_id = (
        await queryRow<{ team_id: number }>(sql.select_team_of_player, {
          player_id: game.player_id,
          semester,
        })
      ).team_id;
      const team_data = await queryRow<Team>(sql.select_team_data, {
        team_id,
      });
      const new_points = team_data.points - game.point_change;
      // Update
      await queryWrite(sql.update_team_data, {
        new_points,
        team_id,
      });
    }
    await queryWrite(sql.remove_player_game_result, {
      game_id,
      player_id: game.player_id,
    });
  }
  await queryWrite(sql.remove_game, { game_id });
}

export async function insertGameResults(
  results: GameResult[],
  semester: string,
  is_team_game: boolean
): Promise<void> {
  // Create game
  const inserted_game = await queryWrite(sql.insert_game, {
    is_team_game,
    semester,
  });

  for (const result of results) {
    // Insert player results
    await queryWrite(sql.insert_player_game_result, {
      game_id: inserted_game.insertId,
      player_id: result.player_id,
      starting_wind: result.starting_wind,
      score: result.score,
      placement: result.placement,
      point_change: result.point_change,
    });
    console.log(
      `Inserted player ${result.player_id} results for game ${inserted_game.insertId}`
    );

    if (!is_team_game) {
      // Update player semester data
      // Total points
      const player_data = await queryRow<PlayerSemesterData>(
        sql.select_player_semester_data,
        { player_id: result.player_id, semester }
      );
      const new_points = player_data.points + result.point_change;
      // Ranking
      const player_games = await queryRows<GamePlayer>(
        sql.select_player_game_history,
        { semester, player_id: result.player_id }
      );
      let new_ranking = player_data.ranking;
      while (playerRankUp(player_games, new_ranking)) {
        new_ranking++;
      }
      // Update
      await queryWrite(sql.update_player_semester_data, {
        new_ranking,
        new_points,
        player_id: result.player_id,
        semester,
      });
    } else {
      // Update team data
      const team_data = await queryRow<Team>(sql.select_team_data, {
        team_id: result.team_id,
      });
      const new_points = team_data.points + result.point_change;
      // Update
      await queryWrite(sql.update_team_data, {
        new_points,
        team_id: result.team_id,
      });
    }
  }
}

function playerRankUp(player_games: GamePlayer[], ranking: number): boolean {
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
