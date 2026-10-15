import { Response } from "express";
import { PageLocals } from "../components/pageLayout.html.js";
import asyncHandler from "express-async-handler";

import { Semester } from "../lib/db-types.js";
import { queryRows } from "../lib/sqlDatabase.js";
import { loadSqlEquiv } from "../lib/sqlLoader.js";

const sql = loadSqlEquiv(import.meta.url);
export default asyncHandler(async (req, res: Response<string, PageLocals>, next) => {
  const rows = await queryRows<Semester>(sql.select_semesters);
  res.locals.activeSemester = rows.find(row => row.active)?.semester;
  const semesters = rows.map(
    (row) => row.semester
  );
  semesters.reverse();
  res.locals.semesters = semesters;
  next();
});
