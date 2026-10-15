/** Four-player pairwise Elo. Rates persist across semesters, including team games. */
export type RatingPlayer = { id: string; placement: number };
export type RatingGame = { id: string; players: RatingPlayer[] };
export type RatingState = { rate: number; games: number };

export const RATING_INITIAL = 1500;
export const RATING_K = 16;
export const RATING_SCALE = 350;
export const RATING_ROOKIE_QUANTILE = 0.05;
export const RATING_ROOKIE_GAMES = 5;
export const RATING_REFERENCE_GAMES = 10;
export const RATING_REFERENCE_MIN_PLAYERS = 8;

export type StoredRatingState = RatingState & { rookieHandicap: number | null };
function quantile(values: number[], position: number): number {
  const sorted = values.slice().sort((a, b) => a - b);
  const index = (sorted.length - 1) * position;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

export function expectedWin(rateA: number, rateB: number): number {
  return 1 / (1 + 10 ** ((rateB - rateA) / RATING_SCALE));
}

export function applyRatingGame(state: Map<string, StoredRatingState>, game: RatingGame, referenceRates?: number[]): Map<string, number> {
  if (game.players.length !== 4 || new Set(game.players.map(p => p.id)).size !== 4) {
    throw new Error(`Game ${game.id} must have four distinct players.`);
  }
  if (game.players.some(p => !Number.isInteger(p.placement) || p.placement < 1 || p.placement > 4)) {
    throw new Error(`Game ${game.id} has an invalid placement.`);
  }
  const newcomers = game.players.filter(p => state.get(p.id)?.rookieHandicap == null);
  if (newcomers.length) {
    const reference = referenceRates ?? [...state.values()].filter(p => p.games >= RATING_REFERENCE_GAMES).map(p => p.rate);
    const referenceRate = reference.length >= RATING_REFERENCE_MIN_PLAYERS
      ? quantile(reference, RATING_ROOKIE_QUANTILE) : RATING_INITIAL;
    // Determine every newcomer's discount from the same pre-game reference pool.
    for (const p of newcomers) {
      const current = state.get(p.id) ?? { rate: RATING_INITIAL, games: 0, rookieHandicap: null };
      current.rookieHandicap = Math.max(0, RATING_INITIAL - referenceRate);
      state.set(p.id, current);
    }
  }
  const before = game.players.map(p => state.get(p.id)!.rate);
  const effective = game.players.map((p, i) => {
    const current = state.get(p.id)!;
    // The rookie discount changes only predictions; ledger Rate starts at 1500.
    return before[i] - current.rookieHandicap! * Math.max(0, 1 - current.games / RATING_ROOKIE_GAMES);
  });
  const changes = [0, 0, 0, 0];
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
    const expected = expectedWin(effective[i], effective[j]);
    const actual = game.players[i].placement < game.players[j].placement ? 1
      : game.players[i].placement > game.players[j].placement ? 0 : 0.5;
    changes[i] += actual - expected;
    changes[j] -= actual - expected;
  }
  const deltas = new Map<string, number>();
  for (let i = 0; i < 4; i++) {
    const id = game.players[i].id, current = state.get(id)!;
    const delta = RATING_K * changes[i] / 3;
    current.rate = before[i] + delta;
    current.games++;
    deltas.set(id, delta);
  }
  return deltas;
}
