import { queryRows, queryWrite } from "./sqlDatabase.js";
import { loadSqlEquiv } from "./sqlLoader.js";
import {
  applyRatingGame,
  StoredRatingState,
  RATING_REFERENCE_GAMES,
} from "./rating.js";

const sql = loadSqlEquiv(import.meta.url);
type RatingRow = {
  id: string;
  rate: number;
  rate_games: number;
  rate_rookie_handicap: number | null;
};

/** Called after all four results are inserted, inside withGameTransaction. */
export async function recordGameRating(
  gameId: number,
  game: readonly { player_id: string; placement: number }[],
): Promise<void> {
  if (
    game.length !== 4 ||
    new Set(game.map((p) => String(p.player_id))).size !== 4
  )
    throw new Error("Expected four distinct game results.");
  const params = Object.fromEntries(
    game.map((p, i) => [`player_${i + 1}`, String(p.player_id)]),
  );
  const participants = await queryRows<RatingRow>(sql.game_ratings, params);
  if (participants.length !== 4) throw new Error("A rated player is missing.");
  const reference = participants.some((p) => p.rate_rookie_handicap === null)
    ? (
        await queryRows<{ rate: number }>(sql.reference_rates, {
          minimum_games: RATING_REFERENCE_GAMES,
        })
      ).map((p) => Number(p.rate))
    : undefined;
  const state = new Map<string, StoredRatingState>(
    participants.map((p) => [
      String(p.id),
      {
        rate: Number(p.rate),
        games: Number(p.rate_games),
        rookieHandicap:
          p.rate_rookie_handicap === null
            ? null
            : Number(p.rate_rookie_handicap),
      },
    ]),
  );
  const changes = applyRatingGame(
    state,
    {
      id: String(gameId),
      players: game.map((p) => ({
        id: String(p.player_id),
        placement: Number(p.placement),
      })),
    },
    reference,
  );
  for (const p of game) {
    const id = String(p.player_id),
      rating = state.get(id)!;
    await queryWrite(sql.save_rating, {
      player_id: id,
      rate: rating.rate,
      games: rating.games,
      handicap: rating.rookieHandicap,
    });
    const saved = await queryWrite(sql.save_change, {
      game_id: gameId,
      player_id: id,
      change: changes.get(id)!,
    });
    if (saved.affectedRows !== 1)
      throw new Error("Expected an unsettled game result.");
  }
}

/** Undo only the stored settlement; later games keep their original changes. */
export async function removeGameRating(
  game: readonly { player_id: string; rate_change: number | null }[],
): Promise<void> {
  for (const p of game) {
    if (p.rate_change === null)
      throw new Error("Missing Rate settlement; run the Rate migration first.");
    const result = await queryWrite(sql.undo_rating, {
      player_id: String(p.player_id),
      change: p.rate_change,
    });
    if (result.affectedRows !== 1)
      throw new Error("Rate game count is inconsistent.");
  }
}
