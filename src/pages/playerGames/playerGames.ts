import * as express from "express";
import asyncHandler from "express-async-handler";
import { playerGames } from "./playerGames.html.js";
import { connectToDatabase } from "../../lib/sqlDatabase.js";
import { loadSqlEquiv } from "../../lib/sqlLoader.js";

const router = express.Router();
// const sql = loadSqlEquiv(import.meta.url);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    console.log(res.locals);
    res.send(playerGames({ games: [], resLocals: res.locals }));
  })
);

export default router;
