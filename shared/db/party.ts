import pool from './pg.js';

export interface DBParty {
    id: string;
    name: string;
    passwordHash: string | null;
    leaderId: string;
    maxPlayers: number;
    createdAt: Date;
}

export interface DBPartyMember {
    partyId: string;
    userId: string;
    username: string;
    email: string;
    joinedAt: Date;
}

export async function dbCreateParty(party: Omit<DBParty, 'createdAt'>): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query(
            `INSERT INTO parties (id, name, passwordHash, leaderId, maxPlayers)
             VALUES ($1, $2, $3, $4, $5);`,
            [party.id, party.name, party.passwordHash, party.leaderId, party.maxPlayers]
        );

        await client.query(
            `INSERT INTO party_members (partyId, userId) VALUES ($1, $2);`,
            [party.id, party.leaderId]
        );

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export async function dbGetParty(partyId: string): Promise<DBParty | null> {
    const result = await pool.query(
        `SELECT id, name, passwordHash AS "passwordHash", leaderId AS "leaderId",
                maxPlayers AS "maxPlayers", createdAt AS "createdAt"
         FROM parties WHERE id = $1;`,
        [partyId]
    );
    return result.rows[0] ?? null;
}

export async function dbGetPartyMembers(partyId: string): Promise<DBPartyMember[]> {
    const result = await pool.query(
        `SELECT pm.partyId AS "partyId", pm.userId AS "userId",
                u.username, u.email, pm.joinedAt AS "joinedAt"
         FROM party_members pm
         JOIN user_auth u ON pm.userId = u.userId
         WHERE pm.partyId = $1
         ORDER BY pm.joinedAt ASC;`,
        [partyId]
    );
    return result.rows;
}

export async function dbAddMember(partyId: string, userId: string): Promise<void> {
    await pool.query(
        `INSERT INTO party_members (partyId, userId)
         VALUES ($1, $2)
         ON CONFLICT (partyId, userId) DO NOTHING;`,
        [partyId, userId]
    );
}

export async function dbRemoveMember(partyId: string, userId: string): Promise<void> {
    await pool.query(
        `DELETE FROM party_members WHERE partyId = $1 AND userId = $2;`,
        [partyId, userId]
    );
}

export async function dbDeleteParty(partyId: string): Promise<void> {
    await pool.query(`DELETE FROM parties WHERE id = $1;`, [partyId]);
}

export async function dbUpdateLeader(partyId: string, newLeaderId: string): Promise<void> {
    await pool.query(
        `UPDATE parties SET leaderId = $1 WHERE id = $2;`,
        [newLeaderId, partyId]
    );
}
