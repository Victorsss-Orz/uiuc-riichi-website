import asyncHandler from "express-async-handler";

export default asyncHandler(async (req, res, next) => {
  if (req.session && req.session.isAdmin) {
    // User is logged in, proceed
    res.locals.isAdmin = true;
  } else {
    res.locals.isAdmin = false;
  }
  next();
});
