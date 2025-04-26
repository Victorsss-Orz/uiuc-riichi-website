import * as express from "express";
import asyncHandler from "express-async-handler";
import { teams } from "./teams.html.js";
import { connectToDatabase } from "../../../lib/sqlDatabase.js";
import { loadSqlEquiv } from "../../../lib/sqlLoader.js";
import { PlayerRow, TeamRow } from "../../../lib/db-types.js";

const router = express.Router();
const sql = loadSqlEquiv(import.meta.url);

export type TeamPlayerInformation = {
  id: number;
};

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const semester = req.query.semester?.toString();
    if (!semester) {
      res.send(
        teams({
          resLocals: res.locals,
          semester,
        })
      );
    } else {
      const connection = await connectToDatabase();
      const [all_teams] = await connection.query<TeamRow[]>(sql.select_teams, [
        semester,
      ]);
      res.send(
        teams({
          resLocals: res.locals,
          semester,
        })
      );
    }
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const semester = req.query.semester?.toString();
    if (req.body.__action === "add") {
      const connection = await connectToDatabase();
      await connection.query(sql.insert_team, [req.body.teamName, semester]);
      res.redirect(req.originalUrl);
    } else if (req.body.__action == "remove") {
      res.redirect(req.originalUrl);
    } else {
      res.redirect(req.originalUrl);
    }
  })
);

export default router;
