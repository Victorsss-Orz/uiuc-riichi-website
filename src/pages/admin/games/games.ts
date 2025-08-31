import * as express from "express";
import asyncHandler from "express-async-handler";

import { games, gameResultConfirmation } from "./games.html.js";

import { loadSqlEquiv } from "../../../lib/sqlLoader.js";
import { queryRows } from "../../../lib/sqlDatabase.js";
import { Player } from "../../../lib/db-types.js";
import {
  insertGameResults,
  processGameResults,
  removeGameResults,
} from "../../../lib/gameResults.js";
import { getAllGames } from "../../../lib/gamesTable.js";

const router = express.Router();
const sql = loadSqlEquiv(import.meta.url);
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const players = await queryRows<Player>(sql.select_players);

    const info = await getAllGames();
    res.send(games({ players, resLocals: res.locals, info }));
  })
);
router.post(
  "/calculate-game-results",
  express.urlencoded({ extended: true }),
  asyncHandler(async (req, res) => {
    try {
      const results = await processGameResults(req.body);
      res.json({
        ok: true,
        html: gameResultConfirmation(results, req.body.semester).toString(),
      });
    } catch (err) {
      if (typeof err === "string") {
        res.json({
          ok: false,
          html: err.toUpperCase(),
        });
      } else if (err instanceof Error) {
        res.json({
          ok: false,
          html: err.message,
        });
      } else {
        res.json({
          ok: false,
          html: err,
        });
      }
    }
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    if (req.body.__action == "add") {
      const results = await processGameResults(req.body);
      await insertGameResults(
        results,
        req.body.semester,
        req.body.teamGame ? true : false
      );
      res.redirect(req.originalUrl);
    } else if (req.body.__action == "remove") {
      const { gameToRemove } = req.body;
      // TODO: Handle game removal
      await removeGameResults(parseInt(gameToRemove, 10));
      res.redirect(req.originalUrl);
    } else {
      res.redirect(req.originalUrl);
    }
  })
);

export default router;
