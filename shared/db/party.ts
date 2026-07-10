import pool from './pg.js';

export interface DBParty {
    id: string;
    name: string;
    passwordHash: string | null;
    leaderId: number;
    maxPlayers: number;
    createdAt: Date;
}

export interface DBPartyMember {
    partyId: string;
    userId: number;
    username: string;
    email: string;
    joinedAt: Date;
}

/** Insert a new party and automatically add the leader as the first member in a transaction */
export async function dbCreateParty(party: Omit<DBParty, 'createdAt'>): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const insertPartyQuery = `
            INSERT INTO parties (id, name, passwordHash, leaderId, maxPlayers)
            VALUES ($1, $2, $3, $4, $5);
        `;
        await client.query(insertPartyQuery, [
            party.id,
            party.name,
            party.passwordHash,
            party.leaderId,
            party.maxPlayers
        ]);

        const insertMemberQuery = `
            INSERT INTO party_members (partyId, userId)
            VALUES ($1, $2);
        `;
        await client.query(insertMemberQuery, [party.id, party.leaderId]);

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error creating party in DB:", error);
        throw error;
    } finally {
        client.release();
    }
}

/** Fetch party details */
export async function dbGetParty(partyId: string): Promise<DBParty | null> {
    const query = `
        SELECT id, name, passwordHash AS "passwordHash", leaderId AS "leaderId", maxPlayers AS "maxPlayers", createdAt AS "createdAt"
        FROM parties
        WHERE id = $1;
    `;
    try {
        const result = await pool.query(query, [partyId]);
        if (result.rows.length === 0) return null;
        return result.rows[0] as DBParty;
    } catch (error) {
        console.error("Error fetching party from DB:", error);
        throw error;
    }
}

/** Fetch all members of a party */
export async function dbGetPartyMembers(partyId: string): Promise<DBPartyMember[]> {
    const query = `
        SELECT pm.partyId AS "partyId", pm.userId AS "userId", u.username, u.email, pm.joinedAt AS "joinedAt"
        FROM party_members pm
        JOIN user_auth u ON pm.userId = u.userId
        WHERE pm.partyId = $1
        ORDER BY pm.joinedAt ASC;
    `;
    try {
        const result = await pool.query(query, [partyId]);
        return result.rows as DBPartyMember[];
    } catch (error) {
        console.error("Error fetching party members from DB:", error);
        throw error;
    }
}

/** Add a user to a party */
export async function dbAddMember(partyId: string, userId: number): Promise<void> {
    const query = `
        INSERT INTO party_members (partyId, userId)
        VALUES ($1, $2)
        ON CONFLICT (partyId, userId) DO NOTHING;
    `;
    try {
        await pool.query(query, [partyId, userId]);
    } catch (error) {
        console.error("Error adding member in DB:", error);
        throw error;
    }
}

/** Remove a user from a party */
export async function dbRemoveMember(partyId: string, userId: number): Promise<void> {
    const query = `
        DELETE FROM party_members
        WHERE partyId = $1 AND userId = $2;
    `;
    try {
        await pool.query(query, [partyId, userId]);
    } catch (error) {
        console.error("Error removing member from DB:", error);
        throw error;
    }
}

/** Delete a party */
export async function dbDeleteParty(partyId: string): Promise<void> {
    const query = `
        DELETE FROM parties
        WHERE id = $1;
    `;
    try {
        await pool.query(query, [partyId]);
    } catch (error) {
        console.error("Error deleting party from DB:", error);
        throw error;
    }
}

/** Update the leader of a party */
export async function dbUpdateLeader(partyId: string, newLeaderId: number): Promise<void> {
    const query = `
        UPDATE parties
        SET leaderId = $1
        WHERE id = $2;
    `;
    try {
        await pool.query(query, [newLeaderId, partyId]);
    } catch (error) {
        console.error("Error updating leader in DB:", error);
        throw error;
    }
}
