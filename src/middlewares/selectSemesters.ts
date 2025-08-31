import asyncHandler from "express-async-handler";

import { Semester } from "../lib/db-types.js";
import { queryRows } from "../lib/sqlDatabase.js";
import { loadSqlEquiv } from "../lib/sqlLoader.js";

const sql = loadSqlEquiv(import.meta.url);
export default asyncHandler(async (req, res, next) => {
  const semesters = (await queryRows<Semester>(sql.select_semesters)).map(
    (row) => row.semester
  );
  semesters.reverse();
  res.locals.semesters = semesters;
  next();
});
