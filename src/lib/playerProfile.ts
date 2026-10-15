import { queryRows } from "./sqlDatabase.js";
import { loadSqlEquiv } from "./sqlLoader.js";
import { rankNames, rankRequirements, promotionProgress } from "./rankRules.js";
import { RankingSort } from "./playerRankings.js";
import { Player, SqlNumber } from "./db-types.js";
import { combineGameInfo, GameInfo, GameInformation } from "./gamesTable.js";

const sql = loadSqlEquiv(import.meta.url);
export type SeasonStats = {
  id: string; name: string; ranking: string; points: number; rate: number;
  games: number; placements: number[]; average_placement: number;
  position: number;
};
type SeasonStatsRow = Pick<Player, "id" | "rate"> & {
  name: string;
  rank_index: number;
  points: number;
  games: SqlNumber;
  firsts: SqlNumber; seconds: SqlNumber; thirds: SqlNumber; fourths: SqlNumber;
  average_placement: SqlNumber;
  position: SqlNumber;
};

export async function getSeasonStats(semester: string, term = "", sort: RankingSort = "pt"): Promise<SeasonStats[]> {
  const escaped = term.replace(/[!%_]/g, "!$&");
  const rows = await queryRows<SeasonStatsRow>(term ? sql.search_stats : sql.season_stats, { semester, term, sort,
    pattern: `%${escaped}%`, prefix: `${escaped}%` });
  return rows.map(r => ({ id: String(r.id), name: r.name,
    ranking: rankNames[Number(r.rank_index)] ?? "Unknown", points: Number(r.points), rate: Number(r.rate),
    games: Number(r.games), placements: [r.firsts, r.seconds, r.thirds, r.fourths].map(Number),
    average_placement: Number(r.average_placement), position: Number(r.position) }));
}

export type OpponentStats = {
  id: string; name: string; meetings: number; wins: number; ties: number;
  my_average: number; opponent_average: number;
  rivalry_pt: number; rivalry_index: number;
};
type OpponentStatsRow = Pick<Player, "id"> & {
  name: string;
  meetings: SqlNumber; wins: SqlNumber; ties: SqlNumber;
  my_average: SqlNumber; opponent_average: SqlNumber;
  rivalry_pt: SqlNumber; rivalry_index: SqlNumber;
};

type PlayerProfileRow = Pick<Player, "id" | "player_name" | "rate" | "rate_games"> & {
  rank_index: number;
  games: SqlNumber;
  points: number;
  average_placement: SqlNumber | null;
  highest_score: SqlNumber | null;
  average_score: SqlNumber | null;
  campus_rank: SqlNumber | null;
};

type ProfileSeasonStats = {
  games: number; points: number; campus_rank: number;
  average_placement: number; highest_score: number; average_score: number;
};

export type PlayerHistory = { games: GameInfo[]; page: number; pages: number; count: number };
export type PlayerProfile = {
  player: PlayerProfileRow;
  stats: ProfileSeasonStats | null;
  rating: { rate: number; games: number };
  opponents: OpponentStats[];
  page: number;
  pages: number;
  games: GameInfo[];
  promotion: ReturnType<typeof promotionProgress>;
};

const validPlayerId = (id: string): boolean => /^\d+$/.test(id) && BigInt(id) <= 18446744073709551615n;
const historyPageSize = 10;

export async function getPlayerHistory(player_id: string, semester: string, requestedPage = 1): Promise<PlayerHistory | null> {
  if (!validPlayerId(player_id)) return null;
  const counts = await queryRows<{ games: SqlNumber }>(sql.history_count, { player_id, semester });
  if (!counts.length) return null;
  const pages = Math.max(1, Math.ceil(Number(counts[0]?.games ?? 0) / historyPageSize));
  const page = Math.min(pages, Math.max(1, Number.isSafeInteger(requestedPage) ? requestedPage : 1));
  const rows = Number(counts[0].games) ? await queryRows<GameInformation>(sql.history, { player_id, semester, limit: String(historyPageSize), offset: String((page - 1) * historyPageSize) }) : [];
  return { games: combineGameInfo(rows), page, pages, count: Number(counts[0]?.games ?? 0) };
}

export async function getOpponentStats(player_id: string): Promise<OpponentStats[]> {
  const rows = await queryRows<OpponentStatsRow>(sql.opponents, { player_id });
  return rows.map(r => ({ id: String(r.id), name: r.name, meetings: Number(r.meetings),
    wins: Number(r.wins), ties: Number(r.ties),
    my_average: Number(r.my_average), opponent_average: Number(r.opponent_average),
    rivalry_pt: Number(r.rivalry_pt), rivalry_index: Number(r.rivalry_index) }))
    .sort((a, b) => b.rivalry_index - a.rivalry_index || b.meetings - a.meetings || a.id.localeCompare(b.id));
}

export async function getPlayerProfile(player_id: string, semester: string, requestedPage = 1): Promise<PlayerProfile | null> {
  // Keep Discord IDs as strings; they exceed JavaScript's safe integer range.
  if (!validPlayerId(player_id)) return null;
  const players = await queryRows<PlayerProfileRow>(sql.player, { player_id, semester });
  if (!players.length) return null;
  const player = players[0];
  const stats = Number(player.games) ? {
    games: Number(player.games), points: Number(player.points), campus_rank: Number(player.campus_rank),
    average_placement: Number(player.average_placement), highest_score: Number(player.highest_score),
    average_score: Number(player.average_score),
  } : null;
  const pages = Math.max(1, Math.ceil((stats?.games ?? 0) / historyPageSize));
  const page = Math.min(pages, Math.max(1, Number.isSafeInteger(requestedPage) ? requestedPage : 1));
  const windowSize = rankRequirements[Number(player.rank_index)]?.num_games ?? 30;
  const [opponents, recent, games] = await Promise.all([
    Number(player.rate_games) ? getOpponentStats(player_id) : [],
    stats ? queryRows<{ placement: number }>(sql.recent, { player_id, semester, limit: String(windowSize) }) : [],
    // mysql2 encodes JS numbers as DOUBLE; MySQL LIMIT parameters require integers.
    stats ? queryRows<GameInformation>(sql.history, { player_id, semester, limit: String(historyPageSize), offset: String((page - 1) * historyPageSize) }) : [],
  ]);
  return { player, stats, rating: { rate: Number(player.rate), games: Number(player.rate_games) },
    opponents, page, pages,
    games: combineGameInfo(games),
    promotion: promotionProgress(recent.reverse().map(g => g.placement), Number(player.rank_index)) };
}

export function searchTerm(input: unknown): string {
  return typeof input === "string" ? input.trim().slice(0, 100) : "";
}
