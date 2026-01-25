require('dotenv').config({ path: '../../.env' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function initDB() {
    try {
        console.log('Connecting to database...');
        let client;
        try {
            client = await pool.connect();
        } catch (err) {
            if (err.code === '3D000') { // invalid_catalog_name
                console.log('Database "flashcards" does not exist. Attempting to create it...');
                // Connect to 'postgres' database to create the new one
                const defaultDbUrl = process.env.DATABASE_URL.replace(/\/flashcards$/, '/postgres');
                const defaultPool = new Pool({ connectionString: defaultDbUrl });
                const defaultClient = await defaultPool.connect();

                try {
                    await defaultClient.query('CREATE DATABASE flashcards');
                    console.log('Database "flashcards" created successfully.');
                } catch (createErr) {
                    console.error('Failed to create database:', createErr);
                    throw createErr;
                } finally {
                    defaultClient.release();
                    await defaultPool.end();
                }

                // Retry connection
                client = await pool.connect();
            } else {
                throw err;
            }
        }

        console.log('Connected successfully.');

        const schemaPath = path.join(__dirname, '../db/schema.sql'); // Adjusted path: script is in src/scripts, schema is in src/db
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Running schema migration...');
        await client.query(schemaSql);
        console.log('Schema applied successfully.');

        client.release();
    } catch (err) {
        console.error('Error initializing database:', err);
    } finally {
        await pool.end();
    }
}

initDB();
