import "dotenv/config";
import { AsyncLocalStorage } from "node:async_hooks";
import { createHash } from "node:crypto";
import mysql, {
  Connection,
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

// export async function connectToDatabase(): Promise<Connection> {
//   const connection = await mysql.createConnection({
//     host: "localhost", // Use service name defined in docker-compose.yml
//     user: "victorsss_orz", // MySQL username
//     // password: "password", // MySQL password
//     database: "riichi", // Database name
//   });

//   return connection;
// }

export async function acquireSingleton(): Promise<boolean> {
  const lockConn = await connectToDatabase();

  const [rows] = await lockConn.query(
    "SELECT GET_LOCK('discord-bot-singleton', 0) AS ok"
  );
  // @ts-ignore
  if (!rows[0].ok) {
    await lockConn.end();
    return false;
  }
  process.on("exit", async () => {
    try {
      await lockConn!.query("DO RELEASE_LOCK('discord-bot-singleton')");
    } catch {}
  });
  return true;
}

export async function connectToDatabase(): Promise<Connection> {
  const connection = await mysql.createConnection({
    ...databaseOptions,
    supportBigNumbers: true,
    bigNumberStrings: true,
  });

  return connection;
}

// Preserve the existing hosting defaults; local development overrides every
// connection setting in .env. Removing legacy credentials requires a separate
// deployment/configuration change by the hosting owner.
const databaseOptions = {
    host: "localhost", // Use service name defined in docker-compose.yml
    user: "uiucriichi_admin", // MySQL username
    password: "uiucriichi1326", // MySQL password
    database: "uiucriichi_data", // Database name
    ...Object.fromEntries(
      [
        ["host", process.env.DB_HOST],
        ["user", process.env.DB_USER],
        ["password", process.env.DB_PASSWORD],
        ["database", process.env.DB_NAME],
        ["socketPath", process.env.DB_SOCKET],
      ].filter((entry) => entry[1] !== undefined),
    ),
    port: Number(process.env.DB_PORT || 3306),
};

const pool = mysql.createPool({
  ...databaseOptions,
  namedPlaceholders: true, // allows using :key in query
  supportBigNumbers: true,
  bigNumberStrings: true,
});

const transactionConnection = new AsyncLocalStorage<PoolConnection>();
const gameWriteLock = `riichi-games-${createHash("sha256")
  .update(databaseOptions.database)
  .digest("hex").slice(0, 32)}`;

/** Commit an entire game or nothing. Serialize score mutations across workers
 * so read/modify/write totals cannot overwrite another game's changes.
 * Uses the existing MySQL named-lock mechanism; no schema changes required.
 */
export async function withGameTransaction<T>(work: () => Promise<T>): Promise<T> {
  if (transactionConnection.getStore()) return work();
  const connection = await pool.getConnection();
  let locked = false;
  let reusable = true;
  try {
    const [rows] = await connection.execute<RowDataPacket[]>(
      "SELECT GET_LOCK(?, 10) AS acquired", [gameWriteLock],
    );
    locked = rows[0].acquired === 1 || rows[0].acquired === "1";
    if (!locked) throw new Error("Another game is being saved. Please try again.");
    await connection.beginTransaction();
    try {
      const result = await transactionConnection.run(connection, work);
      await connection.commit();
      return result;
    } catch (error) {
      try { await connection.rollback(); } catch { reusable = false; }
      throw error;
    }
  } finally {
    if (locked) {
      try {
        await connection.execute("DO RELEASE_LOCK(?)", [gameWriteLock]);
      } catch { reusable = false; }
    }
    if (reusable) connection.release();
    else connection.destroy();
  }
}

type queryParams = Record<string, any>;

export async function queryRows<T>(
  query: string,
  params?: queryParams
): Promise<T[]> {
  const [rows] = await (transactionConnection.getStore() ?? pool).execute<RowDataPacket[]>(query, params);
  return rows as T[];
}

export async function queryRow<T>(
  query: string,
  params?: queryParams
): Promise<T> {
  const [rows] = await (transactionConnection.getStore() ?? pool).execute<RowDataPacket[]>(query, params);
  if (rows.length != 1) {
    throw new Error(
      `queryRow() result should be length 1. Got: ${rows.length}`
    );
  }
  return rows[0] as T;
}

export async function queryWrite(
  query: string,
  params?: queryParams
): Promise<ResultSetHeader> {
  const [result] = await (transactionConnection.getStore() ?? pool).execute<ResultSetHeader>(query, params);
  return result;
}
