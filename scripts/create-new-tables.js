const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function createNewTables() {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Créer les nouvelles tables avec la structure refactorisée
    console.log('🔨 Création des nouvelles tables...\n');

    // Table users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users_new (
        id SERIAL PRIMARY KEY,
        uid VARCHAR(128) NOT NULL,
        email VARCHAR(256),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Table users_new créée');

    // Table payments (nouvelle structure)
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments_new (
        id SERIAL PRIMARY KEY,
        uid VARCHAR(128) NOT NULL,
        plan_id VARCHAR(64) NOT NULL,
        provider VARCHAR(32) NOT NULL DEFAULT 'paydunya',
        provider_token VARCHAR(128) NOT NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
        amount INTEGER NOT NULL DEFAULT 0,
        currency VARCHAR(8) NOT NULL DEFAULT 'XOF',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Table payments_new créée');

    // Table entitlements (nouvelle structure)
    await client.query(`
      CREATE TABLE IF NOT EXISTS entitlements_new (
        id SERIAL PRIMARY KEY,
        uid VARCHAR(128) NOT NULL,
        resource_id VARCHAR(64) NOT NULL,
        granted_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP,
        source_payment_id INTEGER,
        UNIQUE(uid, resource_id)
      )
    `);
    console.log('✅ Table entitlements_new créée');

    // Table ipn_events
    await client.query(`
      CREATE TABLE IF NOT EXISTS ipn_events (
        id SERIAL PRIMARY KEY,
        provider_ref VARCHAR(128) NOT NULL,
        raw_payload JSONB NOT NULL,
        signature_ok BOOLEAN NOT NULL,
        processed_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(provider_ref)
      )
    `);
    console.log('✅ Table ipn_events créée');

    // Table audit_logs
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        uid VARCHAR(128),
        action VARCHAR(64) NOT NULL,
        meta JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Table audit_logs créée');

    // Migrer les données existantes
    console.log('\n🔄 Migration des données existantes...\n');

    // Migrer les entitlements
    const entitlementsResult = await client.query(`
      INSERT INTO entitlements_new (uid, resource_id, granted_at, source_payment_id)
      SELECT 
        user_id as uid,
        CASE 
          WHEN part2 = true THEN 'BOOK_PART_2'
          WHEN part3 = true THEN 'BOOK_PART_3'
        END as resource_id,
        updated_at as granted_at,
        NULL as source_payment_id
      FROM entitlements
      WHERE part2 = true OR part3 = true
      ON CONFLICT (uid, resource_id) DO NOTHING
    `);
    console.log(`✅ ${entitlementsResult.rowCount} entitlements migrés`);

    // Migrer les paiements
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
      FROM payments
      ON CONFLICT (provider_token) DO NOTHING
    `);
    console.log(`✅ ${paymentsResult.rowCount} paiements migrés`);

    // Renommer les tables
    console.log('\n🔄 Renommage des tables...\n');

    await client.query('ALTER TABLE entitlements RENAME TO entitlements_old');
    await client.query('ALTER TABLE payments RENAME TO payments_old');
    await client.query('ALTER TABLE entitlements_new RENAME TO entitlements');
    await client.query('ALTER TABLE payments_new RENAME TO payments');

    console.log('✅ Tables renommées avec succès');

    console.log('\n🎉 Migration terminée avec succès !');
    console.log('\n📋 Structure finale:');
    console.log('  - entitlements (nouvelle structure)');
    console.log('  - payments (nouvelle structure)');
    console.log('  - entitlements_old (ancienne structure)');
    console.log('  - payments_old (ancienne structure)');
    console.log('  - ipn_events');
    console.log('  - audit_logs');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    await client.end();
  }
}

createNewTables(); 