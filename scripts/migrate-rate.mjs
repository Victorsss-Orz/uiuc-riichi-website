import 'dotenv/config';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {applyRatingGame} from '../dist/lib/rating.js';
import {connectToDatabase} from '../dist/lib/sqlDatabase.js';

const connection = await connectToDatabase();
const [[{database}]] = await connection.query('SELECT DATABASE() AS `database`');
const lock = `riichi-games-${createHash('sha256').update(database).digest('hex').slice(0,32)}`;
let locked = false;

async function hasColumn(table, column) {
  const [rows] = await connection.execute(`SELECT 1 FROM information_schema.columns
    WHERE table_schema=? AND table_name=? AND column_name=?`, [database, table, column]);
  return rows.length > 0;
}

async function verifyLedger() {
  const [invalid] = await connection.query(`SELECT p.id FROM players p
    LEFT JOIN (SELECT player_id, COUNT(*) AS games, COUNT(rate_change) AS settled,
      SUM(rate_change) AS total FROM game_players GROUP BY player_id) g ON g.player_id=p.id
    WHERE p.rate_games<>COALESCE(g.games,0) OR COALESCE(g.games,0)<>COALESCE(g.settled,0)
      OR ABS(p.rate-1500-COALESCE(g.total,0))>0.000001
      OR (p.rate_games=0 AND p.rate_rookie_handicap IS NOT NULL)
      OR (p.rate_games>0 AND p.rate_rookie_handicap IS NULL) LIMIT 1`);
  if (invalid.length) throw new Error(`Rate ledger is inconsistent for player ${invalid[0].id}.`);
}

try {
  const [[row]] = await connection.execute('SELECT GET_LOCK(?, 10) AS acquired', [lock]);
  if (Number(row.acquired) !== 1) throw new Error('Game writes are busy; retry the migration.');
  locked = true;
  // Validate before any DDL. Never silently omit malformed historical games.
  const [invalid] = await connection.query(`SELECT g.id FROM games g
    LEFT JOIN game_players gp ON gp.game_id=g.id LEFT JOIN players p ON p.id=gp.player_id
    GROUP BY g.id HAVING COUNT(gp.player_id)<>4 OR COUNT(DISTINCT gp.player_id)<>4
      OR COUNT(p.id)<>4 OR SUM(gp.placement BETWEEN 1 AND 4)<>4 LIMIT 1`);
  const [orphans] = await connection.query(`SELECT gp.game_id FROM game_players gp
    LEFT JOIN games g ON g.id=gp.game_id WHERE g.id IS NULL LIMIT 1`);
  if (invalid.length || orphans.length) throw new Error('Incomplete or invalid game records; resolve them before migration.');

  const schema = fs.readFileSync(new URL('../migrations/001_rate.sql', import.meta.url), 'utf8');
  for (const statement of schema.split(';').map(s=>s.trim()).filter(Boolean)) {
    const column = statement.match(/^ALTER TABLE (\w+) ADD COLUMN (\w+)/);
    if (column && await hasColumn(column[1], column[2])) continue;
    const index = statement.match(/^CREATE INDEX \w+ ON (\w+) \((\w+)\)/);
    if (index) {
      const [existing] = await connection.execute(`SELECT 1 FROM information_schema.statistics
        WHERE table_schema=? AND table_name=? AND column_name=? AND seq_in_index=1`,
        [database, index[1], index[2]]);
      if (existing.length) continue;
    }
    await connection.query(statement);
  }

  await connection.beginTransaction();
  try {
    const [[counts]] = await connection.query('SELECT COUNT(*) AS total, COUNT(rate_change) AS settled FROM game_players');
    if (Number(counts.settled) === 0) {
      const [nonempty] = await connection.query(`SELECT id FROM players
        WHERE rate<>1500 OR rate_games<>0 OR rate_rookie_handicap IS NOT NULL LIMIT 1`);
      if (nonempty.length) throw new Error('Existing Rate state without settlements; refusing to overwrite it.');
      const [rows] = await connection.query(`SELECT g.id AS game_id, gp.player_id, gp.placement
        FROM games g JOIN game_players gp ON gp.game_id=g.id
        ORDER BY g.game_time, g.id, gp.player_id`);
      const games = [];
      for (const row of rows) {
        const id = String(row.game_id);
        if (games.at(-1)?.id !== id) games.push({id, players:[]});
        games.at(-1).players.push({id:String(row.player_id), placement:Number(row.placement)});
      }
      const state = new Map();
      for (const game of games) {
        const changes = applyRatingGame(state, game);
        for (const [id, delta] of changes) await connection.execute(
          'UPDATE game_players SET rate_change=? WHERE game_id=? AND player_id=?', [delta, game.id, id]);
      }
      for (const [id, rating] of state) await connection.execute(`UPDATE players
        SET rate=?, rate_games=?, rate_rookie_handicap=? WHERE id=?`,
        [rating.rate, rating.games, rating.rookieHandicap, id]);
      console.log(`Backfilled ${games.length} games and ${state.size} player Rates.`);
    } else if (Number(counts.settled) !== Number(counts.total)) {
      throw new Error('Partially settled history; refusing to replay or overwrite existing changes.');
    }
    await verifyLedger();
    await connection.commit();
  } catch (error) { await connection.rollback(); throw error; }

  console.log('Rate migration complete. Existing settlements are preserved on subsequent runs.');
} finally {
  if (locked) await connection.execute('DO RELEASE_LOCK(?)', [lock]);
  await connection.end();
}
