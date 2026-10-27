import { Player } from "./db-types.js";
import { queryRows, queryWrite, withGameTransaction } from "./sqlDatabase.js";
import { loadSqlEquiv } from "./sqlLoader.js";

const sql = loadSqlEquiv(import.meta.url);

export async function playerExists(player_id: string): Promise<boolean> {
  const player = await queryRows<Player>(sql.select_player, { player_id });
  return player.length > 0;
}

export async function addPlayer(player_id: string, player_name: string) {
  return withGameTransaction(async () => {
    const result = await queryWrite(sql.add_player, { player_id, player_name });
    if (result.affectedRows !== 1) throw new Error("This Discord ID has been merged. Use the main account.");
    return result;
  });
}

export async function updatePlayerName(player_id: string, player_name: string) {
  return withGameTransaction(() => queryWrite(sql.update_player_name, { player_id, player_name }));
}
