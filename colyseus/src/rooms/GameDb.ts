import pool from "../../../shared/db/pg.js";

export async function validateTeamCreation(teamId: string) {
    try {
        const res = await pool.query(
            "SELECT 1 FROM parties WHERE id = $1 LIMIT 1",
            [teamId]
        );
        return res.rows.length > 0;
    } catch (err) {
        console.error(err);
        return false;
    }
}

export async function validateTeamJoin(email: string, teamId: string) {
    try {
        const res = await pool.query(
            `SELECT 1
             FROM party_members pm
             JOIN user_auth ua
               ON ua.userId = pm.userId
             WHERE pm.partyId = $1
               AND ua.email = $2
             LIMIT 1`,
            [teamId, email]
        );

        return res.rows.length > 0;

    } catch (err) {
        console.error(err);
        return false;
    }
}