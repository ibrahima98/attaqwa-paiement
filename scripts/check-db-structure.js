const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkDatabaseStructure() {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Vérifier les tables existantes
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('📋 Tables existantes:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Vérifier la structure de la table entitlements
    console.log('\n🔍 Structure de la table entitlements:');
    const entitlementsStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'entitlements' 
      ORDER BY ordinal_position
    `);

    entitlementsStructure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Vérifier la structure de la table payments
    console.log('\n🔍 Structure de la table payments:');
    const paymentsStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      ORDER BY ordinal_position
    `);

    paymentsStructure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Vérifier les données existantes
    console.log('\n📊 Données existantes:');
    
    const entitlementsCount = await client.query('SELECT COUNT(*) FROM entitlements');
    console.log(`  - entitlements: ${entitlementsCount.rows[0].count} lignes`);
    
    const paymentsCount = await client.query('SELECT COUNT(*) FROM payments');
    console.log(`  - payments: ${paymentsCount.rows[0].count} lignes`);

    // Tester une requête simple
    console.log('\n🧪 Test de requête simple:');
    try {
      const testQuery = await client.query('SELECT * FROM entitlements LIMIT 1');
      console.log('  ✅ Requête entitlements OK');
    } catch (error) {
      console.log('  ❌ Erreur entitlements:', error.message);
    }

    try {
      const testQuery = await client.query('SELECT * FROM payments LIMIT 1');
      console.log('  ✅ Requête payments OK');
    } catch (error) {
      console.log('  ❌ Erreur payments:', error.message);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.end();
  }
}

checkDatabaseStructure(); 