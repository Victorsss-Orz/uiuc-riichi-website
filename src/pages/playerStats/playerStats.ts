import * as express from "express";
import { PageLocals } from "../../components/pageLayout.html.js";
import asyncHandler from "express-async-handler";
import { playerStats } from "./playerStats.html.js";
import { getSeasonStats, searchTerm } from "../../lib/playerProfile.js";
import { orderSeasonStats, RankingSort } from "../../lib/playerRankings.js";

const router = express.Router();
router.get(
  "/",
  asyncHandler(async (req, res: express.Response<string, PageLocals>) => {
    const semester = res.locals.semester;
    if (!semester) {
      res.sendStatus(404);
      return;
    }
    const term = searchTerm(req.query.q);
    const sort: RankingSort = req.query.sort === "rate" ? "rate" : "pt";
    const stats = await getSeasonStats(semester, term, sort);
    const ranked = orderSeasonStats(term ? stats.slice(0, 50) : stats);
    res.send(
      playerStats({
        allStats: ranked.players,
        term,
        sort,
        positions: ranked.positions,
        hasMore: Boolean(term) && stats.length > 50,
        resLocals: { ...res.locals, semester },
      }),
    );
  }),
);
export default router;
