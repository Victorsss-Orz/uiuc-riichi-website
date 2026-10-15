import { SeasonStats } from "./playerProfile.js";

export type RankingSort = "pt" | "rate";

/** Search results retain their rank among all participants in the semester. */
export function orderSeasonStats(stats: SeasonStats[]) {
  const players = [...stats].sort((a, b) => a.position - b.position
    || b.points - a.points || a.id.localeCompare(b.id));
  return { players, positions: new Map(players.map(p => [p.id, p.position])) };
}
