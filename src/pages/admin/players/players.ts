import * as express from "express";
import asyncHandler from "express-async-handler";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { addPlayer } from "./players.html.js";
import { mergePreviewPage, mergeSearchResults } from "./merge.html.js";
import { queryRows, queryWrite, withGameTransaction } from "../../../lib/sqlDatabase.js";
import { loadSqlEquiv } from "../../../lib/sqlLoader.js";
import { Player } from "../../../lib/db-types.js";
import { PageLocals } from "../../../components/pageLayout.html.js";
import { searchTerm } from "../../../lib/playerProfile.js";
import { getPlayerMergePreview, mergePlayers, PlayerMergeError, PlayerMergeRankMode, searchMergeCandidates } from "../../../lib/playerMerge.js";

const router = express.Router();
const sql = loadSqlEquiv(import.meta.url);

function formValue(body: unknown, name: string): string {
  if (body === null || typeof body !== "object") return "";
  const value = (body as Record<string, unknown>)[name];
  return typeof value === "string" ? value : "";
}
function rankMode(body: unknown): PlayerMergeRankMode {
  const value = formValue(body, "rank_mode");
  if (value === "reset" || value === "highest") return value;
  throw new PlayerMergeError("Select how ranks should be handled before previewing the merge.", 400);
}
function mergeToken(req: express.Request): string {
  return req.session.playerMergeToken ??= randomBytes(32).toString("hex");
}
function validToken(req: express.Request): boolean {
  const supplied = formValue(req.body, "csrf"), expected = req.session.playerMergeToken;
  return !!expected && /^[a-f0-9]{64}$/.test(supplied) &&
    timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
}

// These routes inherit the server's existing /admin authentication middleware.
router.get("/merge", (req, res: express.Response<string, PageLocals>) => {
  res.send(mergePreviewPage({ resLocals: res.locals, token: mergeToken(req) }));
});

router.get("/merge-search", asyncHandler(async (req, res) => {
  const term = searchTerm(req.query.q);
  res.type("html").send(mergeSearchResults(term ? await searchMergeCandidates(term) : []).toString());
}));

router.post("/merge-preview", asyncHandler(async (req, res: express.Response<string, PageLocals>) => {
  if (!validToken(req)) { res.status(403).send("Invalid request token. Reload Merge accounts."); return; }
  try {
    const preview = await getPlayerMergePreview(formValue(req.body, "source_id"), formValue(req.body, "target_id"), rankMode(req.body));
    res.send(mergePreviewPage({ resLocals: res.locals, token: mergeToken(req), preview }));
  } catch (error) {
    if (!(error instanceof PlayerMergeError)) throw error;
    res.status(error.status).send(mergePreviewPage({ resLocals: res.locals, token: mergeToken(req), error: error.message }));
  }
}));

router.post("/merge", asyncHandler(async (req, res: express.Response<string, PageLocals>) => {
  if (!validToken(req)) { res.status(403).send("Invalid request token. Reload Merge accounts."); return; }
  try {
    if (formValue(req.body, "confirm") !== "yes") throw new PlayerMergeError("Confirm the merge direction before proceeding.", 400);
    const merged = await mergePlayers(formValue(req.body, "source_id"), formValue(req.body, "target_id"), formValue(req.body, "expected_preview"), rankMode(req.body));
    delete req.session.playerMergeToken;
    req.session.playerMergeNotice = { targetId: merged.target.id, games: merged.moveGames };
    res.redirect(303, "/admin/players");
  } catch (error) {
    if (!(error instanceof PlayerMergeError)) throw error;
    res.status(error.status).send(mergePreviewPage({ resLocals: res.locals, token: mergeToken(req), error: error.message }));
  }
}));

router.get("/", asyncHandler(async (req, res: express.Response<string, PageLocals>) => {
  const players = await queryRows<Player>(sql.select_players);
  const notice = req.session.playerMergeNotice;
  delete req.session.playerMergeNotice;
  res.send(addPlayer({ players, resLocals: res.locals,
    mergedPlayer: notice ? { id: notice.targetId, semester: res.locals.activeSemester ?? res.locals.semesters?.[0] ?? "" } : undefined,
    notice: notice ? `Moved ${notice.games} results into account ${notice.targetId}. The source account has been removed.` : undefined }));
}));

router.post("/", asyncHandler(async (req, res) => {
  const action = formValue(req.body, "__action");
  const name = formValue(req.body, "playerName");
  if (action === "add" && !name.trim()) { res.status(400).send("Player name is required."); return; }
  let duplicate = false;
  try {
    duplicate = await withGameTransaction(async () => {
      if (action === "add") {
        const players = await queryRows<Player>(sql.select_players);
        if (players.some(p => p.player_name === name)) return true;
        await queryWrite(sql.insert_player, { player_name: name });
      } else if (action === "remove") {
        await queryWrite(sql.remove_player, { player_id: formValue(req.body, "playerToRemove") });
      }
      return false;
    });
  } catch (error) {
    if (action === "remove" && error instanceof Error && "code" in error && error.code === "ER_ROW_IS_REFERENCED_2") {
      res.status(409).send("This account receives results from merged Discord IDs. Merge it into another account instead of deleting it.");
      return;
    }
    throw error;
  }
  if (duplicate) { res.status(409).send("You can't have duplicate player names."); return; }
  res.redirect(req.originalUrl);
}));

export default router;
