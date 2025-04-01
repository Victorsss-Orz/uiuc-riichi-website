import { Request, Response, NextFunction } from "express";

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.isAdmin) {
    // User is logged in, proceed
    return next();
  }
  // Redirect to login page with original URL saved
  res.redirect(`/login?redirect=${encodeURIComponent(req.originalUrl)}`);
}
