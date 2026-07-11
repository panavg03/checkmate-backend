import * as fs from 'fs';
import * as path from 'path';
import pool from './pg';

// Resolve relative to the current file
const schemaPath = path.join(__dirname, 'schema.sql');

async function runMigration() {
    try {
        console.log('Reading schema.sql...');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('Executing schema in Neon DB...');
        await pool.query(schema);
        
        console.log('Migration completed successfully! ✅');
    } catch (error) {
        console.error('Migration failed! ❌', error);
    } finally {
        await pool.end();
    }
}

runMigration();
