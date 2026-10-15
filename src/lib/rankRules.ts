/** Existing UIUC rules, shared by game recording and profile display. */
export const rankNames = ["5级", "4级", "3级", "2级", "1级",
  "初段", "二段", "三段", "四段", "五段", "六段", "七段", "八段", "九段", "十段"];

export const rankRequirements = [
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
] as const;

export function playerRankUp(games: { placement: number }[], ranking: number): boolean {
  const requirement = rankRequirements[ranking];
  if (!requirement || games.length < requirement.num_games) return false;
  return games.slice(-requirement.num_games).reduce((sum, game) => sum + game.placement, 0)
    / requirement.num_games <= requirement.avg_placement;
}

/** Placements must be in insertion order, matching the existing promotion writer. */
export function promotionProgress(placements: number[], ranking: number) {
  const requirement = rankRequirements[ranking] ?? null;
  const windowSize = requirement?.num_games ?? 30;
  const recent = placements.slice(-windowSize);
  const sum = recent.reduce((a, b) => a + b, 0);
  const targetSum = requirement ? Math.round(windowSize * requirement.avg_placement * 10) / 10 : null;
  const integerLimit = targetSum === null ? null : Math.floor(targetSum + 1e-9);
  const missing = Math.max(0, windowSize - recent.length);
  const scenarios = [];
  if (integerLimit !== null) {
    for (let games = Math.max(1, missing); games <= windowSize; games++) {
      const retained = recent.slice(Math.max(0, recent.length - (windowSize - games)));
      const retainedSum = retained.reduce((a, b) => a + b, 0);
      const budget = integerLimit - retainedSum;
      scenarios.push({ games, budget,
        possible: budget >= games,
        guaranteed: budget >= 4 * games });
    }
  }
  return { requirement, windowSize, recent, sum, integerLimit, missing,
    average: recent.length ? sum / recent.length : null,
    sumGap: integerLimit !== null && !missing ? Math.max(0, sum - integerLimit) : null,
    qualified: integerLimit !== null && !missing && sum <= integerLimit,
    earliest: scenarios.find(s => s.possible) ?? null,
    scenarios };
}
