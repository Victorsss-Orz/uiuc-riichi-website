import * as express from "express";
import asyncHandler from "express-async-handler";
import { addPlayer } from "./players.html.js";
import { queryRows, queryWrite } from "../../../lib/sqlDatabase.js";
import { loadSqlEquiv } from "../../../lib/sqlLoader.js";
import { Player } from "../../../lib/db-types.js";

const router = express.Router();
const sql = loadSqlEquiv(import.meta.url);
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const players = await queryRows<Player>(sql.select_players);
    res.send(addPlayer({ players, resLocals: res.locals }));
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    if (req.body.__action === "add") {
      const { playerName } = req.body;
      const players = await queryRows<Player>(sql.select_players);
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
        await queryWrite(sql.insert_player, { player_name: playerName });
        console.log(`Inserted player ${playerName}`);
        res.redirect(req.originalUrl);
      }
    } else if (req.body.__action == "remove") {
      const { playerToRemove } = req.body;
      await queryWrite(sql.remove_player, { player_id: playerToRemove });
      res.redirect(req.originalUrl);
    } else {
      res.redirect(req.originalUrl);
    }
  })
);

export default router;
