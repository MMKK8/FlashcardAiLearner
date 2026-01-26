require('dotenv').config({ path: '../../.env' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function testConnection() {
    try {
        console.log('Testing connection to:', process.env.DATABASE_URL.replace(/:[^:@]*@/, ':****@')); // Hide password
        const client = await pool.connect();
        console.log('Successfully connected to DB');

        const res = await client.query('SELECT count(*) FROM users');
        console.log('User count:', res.rows[0].count);

        client.release();
    } catch (err) {
        console.error('Connection failed:', err);
    } finally {
        await pool.end();
    }
}

testConnection();
