import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
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