import * as express from "express";
import asyncHandler from "express-async-handler";
import { gamesGeneral } from "./gamesGeneral.html.js";
import { connectToDatabase } from "../../lib/database.js";
import { loadSqlEquiv } from "../../lib/loader.js";
import { PlayerType } from "../../lib/db-types.js";

const router = express.Router();
const sql = loadSqlEquiv(import.meta.url);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    // const connection = await connectToDatabase();
    // const [players] = await connection.query<PlayerType[]>(sql.select_players);
    // console.log(res.locals);
    res.send(gamesGeneral({ resLocals: res.locals }));
  })
);

export default router;
