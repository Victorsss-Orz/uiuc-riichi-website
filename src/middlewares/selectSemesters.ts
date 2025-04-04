import asyncHandler from "express-async-handler";

import { SemesterType } from "../lib/db-types.js";
import { connectToDatabase } from "../lib/sqlDatabase.js";
import { loadSqlEquiv } from "../lib/sqlLoader.js";

const sql = loadSqlEquiv(import.meta.url);
export default asyncHandler(async (req, res, next) => {
  const connection = await connectToDatabase();
  const [semester_rows] = await connection.query<SemesterType[]>(
    sql.select_semesters
  );
  const semesters = semester_rows.map((row) => row.semester);
  res.locals.semesters = semesters;
  next();
});
