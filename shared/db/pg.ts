import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

/** Asynchronously to verify -> PostgreSQL connection 
 *  Issue log kardega application ke starting mein
*/

async function connectToDatabase() {
    try {
        const client = await pool.connect();
        console.log("Connected to Database : Lesgoooooooo");
        client.release(); // Release the client back to the pool to prevent leakage
    } catch (error) {
        console.error("Database connection failed: oh hell nah", error);
    }
}

connectToDatabase();
export default pool;