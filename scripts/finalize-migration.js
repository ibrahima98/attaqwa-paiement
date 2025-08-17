const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function finalizeMigration() {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    console.log('🔄 Finalisation de la migration...\n');

    // Renommer les tables pour utiliser la nouvelle structure
    await client.query('ALTER TABLE entitlements RENAME TO entitlements_old');
    await client.query('ALTER TABLE payments RENAME TO payments_old');
    await client.query('ALTER TABLE entitlements_new RENAME TO entitlements');
    await client.query('ALTER TABLE payments_new RENAME TO payments');

    console.log('✅ Tables renommées avec succès');

    // Vérifier la structure finale
    console.log('\n🔍 Vérification de la structure finale...\n');

    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('📋 Tables finales:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Vérifier la structure de la nouvelle table entitlements
    console.log('\n🔍 Structure de la nouvelle table entitlements:');
    const entitlementsStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'entitlements' 
      ORDER BY ordinal_position
    `);

    entitlementsStructure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Vérifier la structure de la nouvelle table payments
    console.log('\n🔍 Structure de la nouvelle table payments:');
    const paymentsStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      ORDER BY ordinal_position
    `);

    paymentsStructure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Tester les nouvelles tables
    console.log('\n🧪 Test des nouvelles tables...\n');

    const entitlementsCount = await client.query('SELECT COUNT(*) FROM entitlements');
    console.log(`✅ entitlements: ${entitlementsCount.rows[0].count} lignes`);
    
    const paymentsCount = await client.query('SELECT COUNT(*) FROM payments');
    console.log(`✅ payments: ${paymentsCount.rows[0].count} lignes`);

    // Tester une requête avec la nouvelle structure
    console.log('\n🧪 Test de requête avec nouvelle structure...\n');
    
    try {
      const testQuery = await client.query(`
        SELECT uid, resource_id, granted_at 
        FROM entitlements 
        WHERE uid = 'GHVYfhx2OYhXllRsnRtqafPJwzH2'
      `);
      console.log(`✅ Requête entitlements OK: ${testQuery.rows.length} résultats`);
    } catch (error) {
      console.log('❌ Erreur entitlements:', error.message);
    }

    console.log('\n🎉 Migration finalisée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la finalisation:', error);
  } finally {
    await client.end();
  }
}

finalizeMigration(); 