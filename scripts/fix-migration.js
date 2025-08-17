const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function fixMigration() {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Terminer la migration des paiements sans ON CONFLICT
    console.log('🔄 Finalisation de la migration des paiements...\n');

    const paymentsResult = await client.query(`
      INSERT INTO payments_new (uid, plan_id, provider, provider_token, status, amount, currency, created_at, updated_at)
      SELECT 
        user_id as uid,
        'BOOK_PART_2' as plan_id,
        'paydunya' as provider,
        token as provider_token,
        UPPER(status) as status,
        amount,
        'XOF' as currency,
        updated_at as created_at,
        updated_at
      FROM payments_old
      WHERE token NOT IN (SELECT provider_token FROM payments_new)
    `);
    console.log(`✅ ${paymentsResult.rowCount} paiements supplémentaires migrés`);

    // Renommer les tables
    console.log('\n🔄 Renommage des tables...\n');

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

    console.log('\n🎉 Migration terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  } finally {
    await client.end();
  }
}

fixMigration(); 