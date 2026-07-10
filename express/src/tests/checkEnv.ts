import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log("--- Credentials Inspection ---");
console.log("Client ID Length:", process.env.GOOGLE_CLIENT_ID?.length);
console.log("Client ID String:", JSON.stringify(process.env.GOOGLE_CLIENT_ID));
console.log("Client Secret String:", JSON.stringify(process.env.GOOGLE_CLIENT_SECRET));
process.exit(0);
