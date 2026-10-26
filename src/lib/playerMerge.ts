import { createHash } from "node:crypto";
import { GamePlayer, Player, PlayerMerge, SqlNumber, StartingWind } from "./db-types.js";
import { RATING_INITIAL } from "./rating.js";
import { loadSqlEquiv } from "./sqlLoader.js";
import { queryRows, queryWrite, withGameTransaction } from "./sqlDatabase.js";

const sql = loadSqlEquiv(import.meta.url);
const validId = (id: string): boolean => id.length <= 20 && /^[1-9]\d*$/.test(id) && BigInt(id) <= 18446744073709551615n;

export class PlayerMergeError extends Error {
  constructor(message: string, public readonly status = 409) { super(message); }
}

type MergeHistory = Omit<GamePlayer, "game_id" | "starting_wind" | "score"> & {
  game_id: string; semester: string | null; is_team_game: 0 | 1 | null; game_time: SqlNumber | null;
  starting_wind: keyof typeof StartingWind | null; score: SqlNumber;
};
type MergeSemesterRow = {
  player_id: string; semester: string; ranking: number; points: number;
  team_id: string | null; team_semester: string | null;
};
type GameCheck = {
  game_id: string; entries: SqlNumber; players: SqlNumber; registered: SqlNumber;
  valid_placements: SqlNumber; score: SqlNumber; settled: SqlNumber;
};
type Snapshot = { players: Player[]; history: MergeHistory[]; semesters: MergeSemesterRow[]; checks: GameCheck[]; mappings: PlayerMerge[] };
type SemesterStats = { games: number; points: number; ranking: number };
export type MergeSemester = {
  semester: string; source: SemesterStats; target: SemesterStats;
  merged: SemesterStats; team_id: string | null;
};
export type PlayerMergePreview = {
  source: Player; target: Player; moveGames: number; games: number; rate: number;
  createTarget: boolean; previousTarget: string | null;
  handicap: number | null; semesters: MergeSemester[]; conflicts: string[]; fingerprint: string;
};
export type MergeCandidate = Pick<Player, "id" | "player_name" | "rate" | "rate_games">;

function parameters(source_id: string, target_id: string): { source_id: string; target_id: string } {
  if (!validId(source_id) || !validId(target_id) || source_id === target_id)
    throw new PlayerMergeError("Select two different, valid Discord IDs.", 400);
  return { source_id, target_id };
}

async function readSnapshot(source_id: string, target_id: string): Promise<Snapshot> {
  const params = parameters(source_id, target_id);
  const [players, history, semesters, checks, mappings] = await Promise.all([
    queryRows<Player>(sql.players, params), queryRows<MergeHistory>(sql.history, params),
    queryRows<MergeSemesterRow>(sql.semesters, params), queryRows<GameCheck>(sql.game_checks, params),
    queryRows<PlayerMerge>(sql.mappings, params),
  ]);
  return { players, history, semesters, checks, mappings };
}

function gameConflicts(snapshot: Snapshot): string[] {
  return snapshot.checks.filter(g => Number(g.entries) !== 4 || Number(g.players) !== 4 ||
    Number(g.registered) !== 4 || Number(g.valid_placements) !== 4 ||
    Number(g.score) !== 100000 || Number(g.settled) !== 4)
    .map(g => `Game ${g.game_id} does not have four complete, settled player results.`);
}

function preview(snapshot: Snapshot, source_id: string, target_id: string): PlayerMergePreview {
  const source = snapshot.players.find(p => p.id === source_id);
  if (!source) throw new PlayerMergeError("Source account no longer exists. Refresh the player list.", 404);
  const existingTarget = snapshot.players.find(p => p.id === target_id);
  const target: Player = existingTarget ?? { id: target_id, player_name: source.player_name,
    rate: RATING_INITIAL, rate_games: 0, rate_rookie_handicap: null };
  const conflicts = gameConflicts(snapshot);
  if (snapshot.mappings.some(m => m.source_id === source_id))
    conflicts.push("The source account is a merged ID. Use its current main account instead.");
  const sourceGames = new Set(snapshot.history.filter(g => g.player_id === source_id).map(g => g.game_id));
  for (const g of snapshot.history) {
    if (g.player_id === target_id && sourceGames.has(g.game_id))
      conflicts.push(`Both accounts appear in game ${g.game_id}. Resolve its player identities first.`);
    if (g.semester === null || g.game_time === null)
      conflicts.push(`Game ${g.game_id} is missing its game record.`);
  }
  for (const p of [source, target]) {
    const history = snapshot.history.filter(g => g.player_id === p.id);
    const delta = history.reduce((sum, g) => sum + (g.rate_change ?? 0), 0);
    if (history.some(g => g.rate_change === null) || p.rate_games !== history.length ||
      Math.abs(p.rate - RATING_INITIAL - delta) > 1e-6 ||
      (history.length > 0 ? p.rate_rookie_handicap === null : p.rate_rookie_handicap !== null))
      conflicts.push(`Rate ledger for ${p.player_name} (${p.id}) is inconsistent. Repair it before merging.`);
  }
  const semesterNames = new Set(snapshot.semesters.map(s => s.semester));
  for (const g of snapshot.history) if (g.semester !== null) semesterNames.add(g.semester);
  const semesters: MergeSemester[] = [];
  // Semesters have no date column. Use the project's sp/su/fa + year convention;
  // custom semester names fall back to their latest recorded game time.
  const semesterTime = (semester: string): number => {
    const match = /^(sp|su|fa)(\d{2}|\d{4})$/i.exec(semester);
    if (match) return Date.UTC(Number(match[2]) + (match[2].length === 2 ? 2000 : 0),
      { sp: 0, su: 4, fa: 7 }[match[1].toLowerCase() as "sp" | "su" | "fa"]);
    return snapshot.history.reduce((time, g) => g.semester === semester ? Math.max(time, Number(g.game_time) * 1000) : time, 0);
  };
  for (const semester of [...semesterNames].sort((a, b) => semesterTime(b) - semesterTime(a) || b.localeCompare(a))) {
    const rows = snapshot.semesters.filter(s => s.semester === semester);
    const a = rows.filter(s => s.player_id === source_id), b = rows.filter(s => s.player_id === target_id);
    if (a.length > 1 || b.length > 1) conflicts.push(`Duplicate player summaries in ${semester}.`);
    for (const row of rows) if (row.team_id !== null && row.team_semester !== semester)
      conflicts.push(`Invalid team assignment in ${semester} for ${row.player_id}.`);
    const history = snapshot.history.filter(g => g.semester === semester);
    const individual = history.filter(g => !g.is_team_game);
    const teamGames = history.filter(g => g.is_team_game);
    for (const p of [source, target]) if (teamGames.some(g => g.player_id === p.id) &&
      !rows.find(s => s.player_id === p.id)?.team_id)
      conflicts.push(`Team games in ${semester} have no team assignment for ${p.player_name}.`);
    if (teamGames.length && a[0]?.team_id && b[0]?.team_id && a[0].team_id !== b[0].team_id)
      conflicts.push(`Different teams in ${semester}; historical team results cannot be reassigned safely.`);
    // Keep the lower semester rank; merging does not award new promotions.
    const ranking = Math.min(a[0]?.ranking ?? 0, b[0]?.ranking ?? 0);
    const current = (id: string, row: MergeSemesterRow | undefined): SemesterStats => ({
      games: individual.filter(g => g.player_id === id).length,
      points: row?.points ?? 0, ranking: row?.ranking ?? 0,
    });
    semesters.push({ semester, source: current(source_id, a[0]), target: current(target_id, b[0]),
      merged: { games: individual.length, points: individual.reduce((sum, g) => sum + g.point_change, 0), ranking },
      team_id: b[0]?.team_id ?? a[0]?.team_id ?? null });
  }
  const earliest = snapshot.history.reduce<MergeHistory | null>((first, g) =>
    !first || Number(g.game_time) < Number(first.game_time) ||
    (Number(g.game_time) === Number(first.game_time) && BigInt(g.game_id) < BigInt(first.game_id)) ? g : first, null);
  return { source, target, createTarget: !existingTarget,
    previousTarget: snapshot.mappings.find(m => m.source_id === target_id)?.target_id ?? null,
    moveGames: sourceGames.size, games: snapshot.history.length,
    rate: RATING_INITIAL + snapshot.history.reduce((sum, g) => sum + (g.rate_change ?? 0), 0),
    handicap: earliest ? (earliest.player_id === source_id ? source : target).rate_rookie_handicap : null,
    semesters, conflicts: [...new Set(conflicts)],
    fingerprint: createHash("sha256").update(JSON.stringify({ source_id, target_id, snapshot })).digest("hex") };
}

export function getPlayerMergePreview(source_id: string, target_id: string): Promise<PlayerMergePreview> {
  return withGameTransaction(async () => preview(await readSnapshot(source_id, target_id), source_id, target_id));
}

export function mergePlayers(source_id: string, target_id: string, expectedPreview: string): Promise<PlayerMergePreview> {
  return withGameTransaction(async () => {
    const before = await readSnapshot(source_id, target_id);
    const p = preview(before, source_id, target_id);
    if (p.fingerprint !== expectedPreview) throw new PlayerMergeError("The accounts changed after preview. Generate a new preview.");
    if (p.conflicts.length) throw new PlayerMergeError(p.conflicts.join(" "));
    const params = parameters(source_id, target_id);
    // The receiving ID must be a live account, never an alias of another ID.
    if (p.previousTarget !== null) await queryWrite(sql.remove_target_redirect, params);
    if (p.createTarget) await queryWrite(sql.create_target, { target_id, player_name: p.target.player_name });
    // Creating a player may populate its semester rows through the existing trigger.
    const semesterRows = p.createTarget ? await queryRows<MergeSemesterRow>(sql.semesters, params) : before.semesters;
    const moved = await queryWrite(sql.move_results, params);
    if (moved.affectedRows !== p.moveGames) throw new PlayerMergeError("Unexpected number of results moved.");
    for (const s of p.semesters) {
      await queryWrite(semesterRows.some(row => row.player_id === target_id && row.semester === s.semester)
        ? sql.update_semester : sql.insert_semester,
        { target_id, semester: s.semester, points: s.merged.points, ranking: s.merged.ranking, team_id: s.team_id });
    }
    await queryWrite(sql.remove_source_semesters, params);
    await queryWrite(sql.update_rating, { target_id, rate: p.rate, games: p.games, handicap: p.handicap });
    // Flatten A → B, B → C into A → C, B → C before deleting B.
    await queryWrite(sql.redirect_incoming, params);
    await queryWrite(sql.remember_merge, params);
    const after = await readSnapshot(source_id, target_id);
    const expectedMappings = new Map(before.mappings.filter(m => m.source_id !== target_id).map(m => [m.source_id, target_id]));
    expectedMappings.set(source_id, target_id);
    if (after.mappings.length !== expectedMappings.size ||
      after.mappings.some(m => expectedMappings.get(m.source_id) !== m.target_id))
      throw new PlayerMergeError("Account mappings failed verification; no changes were saved.");
    const target = after.players.find(row => row.id === target_id);
    if (!target || target.player_name !== p.target.player_name ||
      JSON.stringify(after.history) !== JSON.stringify(before.history.map(g => ({ ...g, player_id: target_id }))) ||
      after.history.some(g => g.player_id === source_id) || after.history.length !== p.games ||
      after.semesters.some(s => s.player_id === source_id) || gameConflicts(after).length ||
      Math.abs(target.rate - p.rate) > 1e-6 || target.rate_games !== p.games ||
      target.rate_rookie_handicap !== p.handicap)
      throw new PlayerMergeError("Merged records failed verification; no changes were saved.");
    for (const s of p.semesters) {
      const rows = after.semesters.filter(row => row.player_id === target_id && row.semester === s.semester);
      // Semester PT uses the existing FLOAT column, unlike DOUBLE Rate.
      if (rows.length !== 1 || rows[0].ranking !== s.merged.ranking || rows[0].team_id !== s.team_id ||
        Math.abs(rows[0].points - s.merged.points) > Math.max(1e-4, Math.abs(s.merged.points) * 1e-6))
        throw new PlayerMergeError(`Merged semester ${s.semester} failed verification; no changes were saved.`);
    }
    const removed = await queryWrite(sql.remove_source, params);
    if (removed.affectedRows !== 1) throw new PlayerMergeError("Source account could not be removed.");
    return p;
  });
}

export async function searchMergeCandidates(term: string): Promise<MergeCandidate[]> {
  const escaped = term.replace(/[!%_]/g, "!$&");
  return queryRows<MergeCandidate>(sql.search, { term, pattern: `%${escaped}%`, exact_id: validId(term) ? term : "0" });
}

/** IDs are bound parameters; only placeholder names are expanded into SQL. */
export async function getPlayerRedirects(playerIds: string[]): Promise<PlayerMerge[]> {
  if (!playerIds.length) return [];
  const params = Object.fromEntries(playerIds.map((id, i) => [`player_${i}`, id]));
  const placeholders = Object.keys(params).map(name => `:${name}`).join(", ");
  return queryRows<PlayerMerge>(sql.redirects.replace(":player_ids", placeholders), params);
}
