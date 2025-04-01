import * as express from "express";
import asyncHandler from "express-async-handler";
import { insertGame } from "./insertGame.html.js";

const router = express.Router();
router.get(
  "/",
  asyncHandler(async (req, res) => {
    res.send(insertGame(req, res));
  })
);

export default router;
