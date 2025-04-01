import mysql, { Connection, RowDataPacket } from "mysql2/promise";

export async function connectToDatabase(): Promise<Connection> {
  const connection = await mysql.createConnection({
    host: "localhost", // Use service name defined in docker-compose.yml
    user: "victorsss_orz", // MySQL username
    // password: "password", // MySQL password
    database: "riichi", // Database name
  });

  return connection;
}
