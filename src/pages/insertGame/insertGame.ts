import * as express from "express";
import asyncHandler from "express-async-handler";
import { insertGame } from "./insertGame.html.js";
import { loadSqlEquiv } from "../../lib/sqlLoader.js";
import { connectToDatabase } from "../../lib/sqlDatabase.js";
import { PlayerType } from "../../lib/db-types.js";

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
  (req, res) => {
    const { player1ID, player2ID, player3ID, player4ID } = req.body;

    let { player1Score, player2Score, player3Score, player4Score } = req.body;
    player1Score = parseInt(player1Score, 10) * 100;
    player2Score = parseInt(player2Score, 10) * 100;
    player3Score = parseInt(player3Score, 10) * 100;
    player4Score = parseInt(player4Score, 10) * 100;

    const totalScore =
      player1Score + player2Score + player3Score + player4Score;

    if (Math.abs(totalScore - 100000) > 0.1) {
      res.json({
        ok: false,
        html: `
          <p style="color:red;">Total score does not add up to <b>100000</b></p>
          <p>Current total score: <b>${totalScore}</b></p>
        `,
      });
      return;
    }

    if (new Set([player1ID, player2ID, player3ID, player4ID]).size < 4) {
      res.json({
        ok: false,
        html: `
          <p style="color:red;">Cannot have duplicate players in a game</p>
        `,
      });
      return;
    }

    const placementPoints = { 1: 50, 2: 10, 3: -10, 4: -30 };

    res.json({
      ok: true,
      html: `<b>Player ${player1ID} with ${player1Score} points added!</b>`,
    });
  }
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    console.log(req.body);
    res.redirect(req.originalUrl);
  })
);

export default router;
