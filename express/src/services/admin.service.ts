import pool from "../../../shared/db/pg.js";
import type { UserAuthRecord } from "../types/auth.types.js";
import { Role } from "../types/auth.types.js";

export async function getAllUsers(): Promise<UserAuthRecord[]> {
  const result = await pool.query<UserAuthRecord>(
    `SELECT * FROM user_auth ORDER BY "userId" ASC`
  );
  return result.rows;
}

export async function getUserById(userId: number): Promise<UserAuthRecord | null> {
  const result = await pool.query<UserAuthRecord>(
    `SELECT * FROM user_auth WHERE "userId" = $1 LIMIT 1`,
    [userId]
  );
  return result.rows[0] ?? null;
}

export async function updateUserRole(
  userId: number,
  role: Role
): Promise<UserAuthRecord | null> {
  const result = await pool.query<UserAuthRecord>(
    `UPDATE user_auth SET role = $1 WHERE "userId" = $2 RETURNING *`,
    [role, userId]
  );
  return result.rows[0] ?? null;
}

export async function forceDeleteParty(partyId: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM parties WHERE id = $1`,
    [partyId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function forceRemovePartyMember(
  partyId: string,
  userId: number
): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM party_members WHERE "partyId" = $1 AND "userId" = $2`,
    [partyId, userId]
  );
  return (result.rowCount ?? 0) > 0;
}
