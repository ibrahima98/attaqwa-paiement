const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Lire le fichier de migration
    const migrationPath = path.join(__dirname, '../drizzle/0000_melted_carlie_cooper.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Exécuter les migrations
    const statements = migrationSQL.split('--> statement-breakpoint');
    
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed) {
        console.log('Executing:', trimmed.substring(0, 50) + '...');
        await client.query(trimmed);
      }
    }

    console.log('✅ Database migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

migrate().catch(console.error); 