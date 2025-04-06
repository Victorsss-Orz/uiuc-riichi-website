import asyncHandler from "express-async-handler";

export default asyncHandler(async (req, res, next) => {
  res.locals.semester = req.params.semester;
  next();
});
