import mysql, {
  Connection,
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
    host: "localhost", // Use service name defined in docker-compose.yml
    user: "uiucriichi_admin", // MySQL username
    password: "uiucriichi1326", // MySQL password
    database: "uiucriichi_data", // Database name
  });

  return connection;
}

const pool = mysql.createPool({
  host: "localhost", // Use service name defined in docker-compose.yml
  user: "uiucriichi_admin", // MySQL username
  password: "uiucriichi1326", // MySQL password
  database: "uiucriichi_data", // Database name
  namedPlaceholders: true, // allows using :key in query
  supportBigNumbers: true,
  bigNumberStrings: true,
});

type queryParams = Record<string, any>;

export async function queryRows<T>(
  query: string,
  params?: queryParams
): Promise<T[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(query, params);
  return rows as T[];
}

export async function queryRow<T>(
  query: string,
  params?: queryParams
): Promise<T> {
  const [rows] = await pool.execute<RowDataPacket[]>(query, params);
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
  const [result] = await pool.execute<ResultSetHeader>(query, params);
  return result;
}
