import * as express from "express";
import asyncHandler from "express-async-handler";

import { insertGame, gameResultConfirmation } from "./insertGame.html.js";

import { loadSqlEquiv } from "../../lib/sqlLoader.js";
import { connectToDatabase } from "../../lib/sqlDatabase.js";
import { PlayerType } from "../../lib/db-types.js";
import { insertGameResults, processGameResults } from "../../lib/gameStats.js";

const router = express.Router();
const sql = loadSqlEquiv(import.meta.url);
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const connection = await connectToDatabase();
    const [players] = await connection.query<PlayerType[]>(sql.select_players);
    res.send(insertGame({ players, resLocals: res.locals }));
  })
);
router.post(
  "/calculate-game-results",
  express.urlencoded({ extended: true }),
  asyncHandler(async (req, res) => {
    try {
      const results = await processGameResults(req);
      res.json({
        ok: true,
        html: gameResultConfirmation(results, req.body.semester).toString(),
      });
    } catch (err) {
      if (typeof err === "string") {
        res.json({
          ok: false,
          html: err.toUpperCase,
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
    const results = await processGameResults(req);
    await insertGameResults(
      results,
      req.body.semester,
      req.body.teamGame ? true : false
    );
    res.redirect(req.originalUrl);
  })
);

export default router;
