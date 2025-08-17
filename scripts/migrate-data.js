const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function migrateData() {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Vérifier si les anciennes tables existent
    const oldTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('entitlements_legacy', 'payments_legacy')
    `);

    if (oldTables.rows.length === 0) {
      console.log('✅ No legacy tables found, migration not needed');
      return;
    }

    console.log('🔄 Migrating data from legacy tables...');

    // Migrer les entitlements
    const entitlementsResult = await client.query(`
      INSERT INTO entitlements (uid, resource_id, granted_at, source_payment_id)
      SELECT 
        user_id as uid,
        CASE 
          WHEN part2 = true THEN 'BOOK_PART_2'
          WHEN part3 = true THEN 'BOOK_PART_3'
        END as resource_id,
        updated_at as granted_at,
        NULL as source_payment_id
      FROM entitlements_legacy
      WHERE part2 = true OR part3 = true
      ON CONFLICT (uid, resource_id) DO NOTHING
    `);

    console.log(`✅ Migrated ${entitlementsResult.rowCount} entitlements`);

    // Migrer les paiements
    const paymentsResult = await client.query(`
      INSERT INTO payments (uid, plan_id, provider, provider_token, status, amount, currency, created_at, updated_at)
      SELECT 
        user_id as uid,
        'BOOK_PART_2' as plan_id, -- Default, peut être ajusté selon les données
        'paydunya' as provider,
        token as provider_token,
        UPPER(status) as status,
        amount,
        'XOF' as currency,
        updated_at as created_at,
        updated_at
      FROM payments_legacy
      ON CONFLICT (provider_token) DO NOTHING
    `);

    console.log(`✅ Migrated ${paymentsResult.rowCount} payments`);

    console.log('✅ Data migration completed successfully');
  } catch (error) {
    console.error('❌ Data migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

migrateData().catch(console.error); 