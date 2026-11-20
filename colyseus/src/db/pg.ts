import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DATABASE_HOST ?? "127.0.0.1",
  port: Number(process.env.DATABASE_PORT ?? 5432),
  user: process.env.DATABASE_USER ?? "postgres",
  password: process.env.DATABASE_PASSWORD ?? "postgres",
  database: process.env.DATABASE_NAME ?? "checkmate",
  ssl: false,
});

pool.on("error", (error) => {
  console.error("Postgres pool error:", error);
});

export default pool;
