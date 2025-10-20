const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

(async () => {
  try {
    // Get all tables
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('=== DATABASE TABLES ===');
    console.log(tables.rows.map(r => r.table_name).join(', '));
    console.log('\n');

    // For each table, show count and sample data
    for (const table of tables.rows) {
      const tableName = table.table_name;
      const count = await pool.query(`SELECT COUNT(*) FROM "${tableName}"`);

      console.log(`\n=== ${tableName.toUpperCase()} (${count.rows[0].count} rows) ===`);

      const data = await pool.query(`SELECT * FROM "${tableName}" LIMIT 10`);

      if (data.rows.length > 0) {
        console.log(JSON.stringify(data.rows, null, 2));
      } else {
        console.log('(empty)');
      }
    }

    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
