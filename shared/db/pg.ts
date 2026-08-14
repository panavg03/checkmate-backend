import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

/* Commented for demo
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});*/
const pool = new Pool({
    host: "0.tcp.in.ngrok.io",
    port: 13152,
    user: "somnium_demo",
    password: "somnium_demo_password",
    database: "somnium_demo",
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