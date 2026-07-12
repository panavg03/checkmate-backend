import pool from './pg.js';

export interface UserAuthRecord {
  userid: string;
  googleid: string;
  email: string;
  username: string;
  createdat: Date;
  lastlogin: Date | null;
}

/**
 * Upserts a Google user:
 * - Inserts user if they do not exist
 * - Updates lastLogin timestamp if they do exist
 * - Generates username and handles unique username collisions
 */
export async function upsertGoogleUser(
  googleId: string,
  email: string,
  displayName: string
): Promise<UserAuthRecord> {
  const baseUsername = email.split('@')[0] || 'user';
  
  const query = `
    INSERT INTO user_auth (googleId, email, username, lastLogin)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (googleId) 
    DO UPDATE SET 
      lastLogin = NOW(),
      email = EXCLUDED.email
    RETURNING userId AS "userid", googleId AS "googleid", email, username, createdAt AS "createdat", lastLogin AS "lastlogin";
  `;
  
  try {
    const result = await pool.query(query, [googleId, email, baseUsername]);
    return result.rows[0];
  } catch (error: any) {
    // Unique violation code: username might already be taken by another user
    if (error.code === '23505') {
      const uniqueUsername = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
      const fallbackQuery = `
        INSERT INTO user_auth (googleId, email, username, lastLogin)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (googleId) 
        DO UPDATE SET lastLogin = NOW()
        RETURNING userId AS "userid", googleId AS "googleid", email, username, createdAt AS "createdat", lastLogin AS "lastlogin";
      `;
      const result = await pool.query(fallbackQuery, [googleId, email, uniqueUsername]);
      return result.rows[0];
    }
    throw error;
  }
}
