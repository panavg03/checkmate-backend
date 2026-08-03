import pool from "../../../shared/db/pg.js";
import type { UserAuthRecord } from "../types/auth.types.js";

export async function findUserByGoogleIdAndEmail(
  googleId: string,
  email: string
): Promise<UserAuthRecord | null> {
  const result = await pool.query<UserAuthRecord>(
    `SELECT * FROM user_auth WHERE googleid = $1 AND email = $2 LIMIT 1`,
    [googleId, email]
  );

  return result.rows[0] ?? null;
}

export async function createUser(
  googleId: string,
  email: string,
  _displayName: string
): Promise<UserAuthRecord> {
  const baseUsername = (email.split("@")[0] || "user").slice(0, 40);

  try {
    const result = await pool.query<UserAuthRecord>(
      `INSERT INTO user_auth (googleid, email, username, lastlogin)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       RETURNING *`,
      [googleId, email, baseUsername]
    );
    return result.rows[0];
  } catch (error: any) {
    if (error.code === "23505") {
      const uniqueUsername = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
      const result = await pool.query<UserAuthRecord>(
        `INSERT INTO user_auth (googleid, email, username, lastlogin)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (googleid) DO UPDATE SET lastlogin = CURRENT_TIMESTAMP
         RETURNING *`,
        [googleId, email, uniqueUsername]
      );
      return result.rows[0];
    }
    throw error;
  }
}

export async function updateLastLogin(userId: string): Promise<void> {
  await pool.query(
    `UPDATE user_auth SET lastlogin = CURRENT_TIMESTAMP WHERE userid = $1`,
    [userId]
  );
}
