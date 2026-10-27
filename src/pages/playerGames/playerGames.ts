import * as express from "express";
import { PageLocals } from "../../components/pageLayout.html.js";
import asyncHandler from "express-async-handler";
import { playerGames, playerHistoryContent } from "./playerGames.html.js";
import { getPlayerHistory, getPlayerProfile } from "../../lib/playerProfile.js";
import { error } from "../error/error.html.js";

const router = express.Router();
router.get(
  "/history",
  asyncHandler(async (req, res: express.Response<string, PageLocals>) => {
    const { semester, player_id } = res.locals;
    if (!semester || !player_id || !res.locals.semesters?.includes(semester)) {
      res.status(404).send(error({ resLocals: res.locals }));
      return;
    }
    const history = await getPlayerHistory(
      player_id,
      semester,
      typeof req.query.page === "string" ? Number(req.query.page) : 1,
    );
    if (!history) {
      res.status(404).send(error({ resLocals: res.locals }));
      return;
    }
    res
      .type("html")
      .send(
        playerHistoryContent({
          ...history,
          id: player_id,
          semester,
        }).toString(),
      );
  }),
);
router.get(
  "/",
  asyncHandler(async (req, res: express.Response<string, PageLocals>) => {
    const { semester, player_id } = res.locals;
    if (!semester || !player_id || !res.locals.semesters?.includes(semester)) {
      res.status(404).send(error({ resLocals: res.locals }));
      return;
    }
    const profile = await getPlayerProfile(
      player_id,
      semester,
      typeof req.query.page === "string" ? Number(req.query.page) : 1,
    );
    if (!profile) {
      res.status(404).send(error({ resLocals: res.locals }));
      return;
    }
    res.send(playerGames({ profile, resLocals: { ...res.locals, semester } }));
  }),
);
export default router;
