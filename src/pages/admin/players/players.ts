import * as express from "express";
import asyncHandler from "express-async-handler";
import { addPlayer } from "./players.html.js";
import { connectToDatabase } from "../../../lib/sqlDatabase.js";
import { loadSqlEquiv } from "../../../lib/sqlLoader.js";
import { PlayerType } from "../../../lib/db-types.js";

const router = express.Router();
const sql = loadSqlEquiv(import.meta.url);
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const connection = await connectToDatabase();
    const [players] = await connection.query<PlayerType[]>(sql.select_players);
    res.send(addPlayer({ players, resLocals: res.locals }));
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    if (req.body.__action === "add") {
      const { playerName } = req.body;
      const connection = await connectToDatabase();
      const [players] = await connection.query<PlayerType[]>(
        sql.select_players
      );
      let canInsert = true;
      for (const player of players) {
        if (player.player_name === playerName) {
          // TODO: Use modal similar to game insertion
          canInsert = false;
          res.send(`
            <script>
              alert("You can't have duplicate player names.");
              window.location.href = "${req.originalUrl}";
            </script>
            `);
        }
      }
      if (canInsert) {
        await connection.query(sql.insert_player, [playerName]);
        console.log(`Inserted player ${playerName}`);
        res.redirect(req.originalUrl);
      }
    } else {
      const { playerToRemove } = req.body;
      const connection = await connectToDatabase();
      await connection.query(sql.remove_player, [playerToRemove]);
      res.redirect(req.originalUrl);
    }
  })
);

export default router;
