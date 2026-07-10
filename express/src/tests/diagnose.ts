import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const combinations = [
    { port: 5432, user: 'postgres', password: 'root' },
    { port: 5433, user: 'postgres', password: 'root' },
    { port: 5432, user: 'root', password: 'root' },
    { port: 5433, user: 'root', password: 'root' },
    { port: 5432, user: 'postgres', password: 'postgres' },
    { port: 5433, user: 'postgres', password: 'postgres' }
];

async function scan() {
    console.log("🔍 Scanning PostgreSQL Ports and Credentials...");
    
    let workingConfig = null;

    for (const config of combinations) {
        console.log(`Trying port ${config.port} with user "${config.user}" and password "${config.password}"...`);
        const client = new Client({
            host: '127.0.0.1',
            port: config.port,
            user: config.user,
            password: config.password,
            database: 'postgres'
        });

        try {
            await client.connect();
            console.log(`✅ SUCCESS! Connected on Port: ${config.port}, User: "${config.user}", Password: "${config.password}"`);
            workingConfig = config;
            await client.end();
            break; // Stop at first successful config
        } catch (err: any) {
            console.log(`❌ Failed: ${err.message}`);
        }
        console.log("-----------------------------------------");
    }

    if (workingConfig) {
        console.log("\n💡 FOUND WORKING CONFIGURATION:");
        console.log(`   DB_PORT=${workingConfig.port}`);
        console.log(`   DB_USER=${workingConfig.user}`);
        console.log(`   DB_PASSWORD=${workingConfig.password}`);
        console.log("\nUpdating your .env file with these working credentials...");
    } else {
        console.log("\n❌ Could not connect using any common configuration.");
        console.log("Please check if the PostgreSQL database service is running on your machine.");
    }
    process.exit(0);
}

scan();
