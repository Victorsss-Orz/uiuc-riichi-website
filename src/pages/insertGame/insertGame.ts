import * as express from "express";
import asyncHandler from "express-async-handler";
import { insertGame } from "./insertGame.html.js";

const router = express.Router();
router.get(
  "/",
  asyncHandler(async (req, res) => {
    console.log(res.locals);
    res.send(insertGame(req, res));
  })
);

export default router;
