import { pool } from "../config/db.js";
import type { UserAuthRecord } from "../types/auth.types.js";

export async function findUserByGoogleIdAndEmail(
  googleId: string,
  email: string
): Promise<UserAuthRecord | null> {
  const result = await pool.query<UserAuthRecord>(
    `SELECT * FROM user_auth WHERE "googleId" = $1 AND email = $2 LIMIT 1`,
    [googleId, email]
  );

  return result.rows[0] ?? null;
}

export async function updateLastLogin(userId: number): Promise<void> {
  await pool.query(
    `UPDATE user_auth SET "lastLogin" = CURRENT_TIMESTAMP WHERE "userId" = $1`,
    [userId]
  );
}
