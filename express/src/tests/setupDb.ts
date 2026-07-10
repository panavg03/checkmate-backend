import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function setup() {
    console.log("🛠️ Starting Database and Schema Setup...");
    
    // Connect to default postgres database to create ctf_db
    const clientPostgres = new Client({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5433,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'root',
        database: 'postgres'
    });

    try {
        await clientPostgres.connect();
        
        // Create database if not exists
        console.log("Checking if database 'ctf_db' exists...");
        const res = await clientPostgres.query("SELECT 1 FROM pg_database WHERE datname='ctf_db'");
        if (res.rows.length === 0) {
            console.log("Creating database 'ctf_db'...");
            await clientPostgres.query("CREATE DATABASE ctf_db");
            console.log("Database 'ctf_db' created successfully.");
        } else {
            console.log("Database 'ctf_db' already exists.");
        }
        await clientPostgres.end();

        // Connect to ctf_db to run schema
        console.log("Connecting to 'ctf_db' to apply schema...");
        const clientCtf = new Client({
            host: process.env.DB_HOST || '127.0.0.1',
            port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5433,
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'root',
            database: 'ctf_db'
        });

        await clientCtf.connect();

        // Read schema file
        const schemaPath = path.join(__dirname, '../../../shared/db/schema.sql');
        console.log(`Reading schema from: ${schemaPath}`);
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log("Applying schema...");
        await clientCtf.query(schemaSql);
        console.log("Schema applied successfully! Database is ready.");
        await clientCtf.end();

    } catch (error: any) {
        console.error("Error setting up database:", error.message);
    }
    process.exit(0);
}

setup();
