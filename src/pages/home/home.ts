import * as express from "express";

import { home } from "./home.html.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.send(home({ resLocals: res.locals }));
});

export default router;
