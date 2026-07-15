import pg from "pg";
import { env } from "./env.js";

export const pool = new pg.Pool({
  user: env.dbUser,
  host: env.dbHost,
  database: env.dbName,
  password: env.dbPassword,
  port: env.dbPort,
});
