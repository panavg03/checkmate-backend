import pool from "./pg.js";

export interface DBParty {
  id: string;
  name: string;
  passwordHash: string | null;
  leaderId: string;
  maxPlayers: number;
  createdAt: Date;
}

export async function dbGetParty(partyId: string): Promise<DBParty | null> {
  const result = await pool.query(
    `SELECT id, name, passwordHash AS "passwordHash", leaderId AS "leaderId",
            maxPlayers AS "maxPlayers", createdAt AS "createdAt"
     FROM parties WHERE id = $1;`,
    [partyId],
  );

  return result.rows[0] ?? null;
}
