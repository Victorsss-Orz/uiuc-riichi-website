import 'dotenv/config';
import fs from 'node:fs';
import {connectToDatabase} from '../dist/lib/sqlDatabase.js';

const connection = await connectToDatabase();
try {
  await connection.query(fs.readFileSync(new URL('../migrations/002_player_merges.sql', import.meta.url), 'utf8'));
  console.log('Account merge mapping table ready. Existing game records are unchanged.');
} finally {
  await connection.end();
}
