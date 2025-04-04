import * as express from "express";
import asyncHandler from "express-async-handler";
import { gamesGeneral } from "./gamesGeneral.html.js";
import { connectToDatabase } from "../../lib/sqlDatabase.js";
import { loadSqlEquiv } from "../../lib/sqlLoader.js";
import { PlayerType } from "../../lib/db-types.js";

const router = express.Router();
// const sql = loadSqlEquiv(import.meta.url);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    // const connection = await connectToDatabase();
    // const [players] = await connection.query<PlayerType[]>(sql.select_players);
    console.log(res.locals);
    res.send(gamesGeneral({ players: [], resLocals: res.locals }));
  })
);

export default router;
