const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Spojeno na MySQL bazu');
        connection.release();
    } catch (error) {
        console.error('Greška pri spajanju s MySQL bazom:', error);

        if (process.env.NODE_ENV !== 'test') {
            process.exit(1);
        }

        throw error;
    }
}

module.exports = { pool, testConnection };