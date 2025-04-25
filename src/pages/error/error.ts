import * as express from "express";

import { error } from "./error.html.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.send(error({ resLocals: res.locals }));
});

export default router;
