import * as express from "express";
import asyncHandler from "express-async-handler";
import { insertGame } from "./insertGame.html.js";
import { loadSqlEquiv } from "../../lib/loader.js";
import { connectToDatabase } from "../../lib/database.js";
import { PlayerType } from "../../lib/db-types.js";

const router = express.Router();
const sql = loadSqlEquiv(import.meta.url);
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const connection = await connectToDatabase();
    const [players] = await connection.query<PlayerType[]>(sql.select_players);
    console.log(players);
    res.send(insertGame({ players, resLocals: res.locals }));
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    console.log(req.body);
  })
);

export default router;
