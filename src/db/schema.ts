import { boolean, integer, jsonb, pgTable, serial, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

// Table des utilisateurs (pour audit et référence)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: varchar('uid', { length: 128 }).notNull(),
  email: varchar('email', { length: 256 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Table des paiements (remplace l'ancienne structure)
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  uid: varchar('uid', { length: 128 }).notNull(),
  planId: varchar('plan_id', { length: 64 }).notNull(), // BOOK_PART_2|BOOK_PART_3
  provider: varchar('provider', { length: 32 }).notNull().default('paydunya'),
  providerToken: varchar('provider_token', { length: 128 }).notNull(),
  status: varchar('status', { length: 16 }).notNull().default('PENDING'), // PENDING|PAID|CANCELED|EXPIRED
  amount: integer('amount').notNull().default(0),
  currency: varchar('currency', { length: 8 }).notNull().default('XOF'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Table des entitlements (remplace l'ancienne structure)
export const entitlements = pgTable('entitlements', {
  id: serial('id').primaryKey(),
  uid: varchar('uid', { length: 128 }).notNull(),
  resourceId: varchar('resource_id', { length: 64 }).notNull(), // BOOK_PART_2|BOOK_PART_3
  grantedAt: timestamp('granted_at').defaultNow(),
  expiresAt: timestamp('expires_at'),
  sourcePaymentId: integer('source_payment_id'),
}, (t)=>({
  uniq: uniqueIndex('uniq_uid_resource').on(t.uid, t.resourceId),
}));

// Table des événements IPN (pour idempotence)
export const ipnEvents = pgTable('ipn_events', {
  id: serial('id').primaryKey(),
  providerRef: varchar('provider_ref', { length: 128 }).notNull(),
  rawPayload: jsonb('raw_payload').notNull(),
  signatureOk: boolean('signature_ok').notNull(),
  processedAt: timestamp('processed_at').defaultNow(),
}, (t)=>({
  uniq: uniqueIndex('uniq_provider_ref').on(t.providerRef),
}));

// Table des logs d'audit
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  uid: varchar('uid', { length: 128 }),
  action: varchar('action', { length: 64 }).notNull(),
  meta: jsonb('meta').$type<Record<string, any>>().notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Tables legacy pour compatibilité (à supprimer plus tard)
export const entitlementsLegacy = pgTable("entitlements_legacy", {
  userId: varchar("user_id").primaryKey(),
  part2: boolean("part2").default(false),
  part3: boolean("part3").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const paymentsLegacy = pgTable("payments_legacy", {
  token: varchar("token").primaryKey(),
  userId: varchar("user_id").notNull(),
  amount: integer("amount").notNull(),
  status: varchar("status").default("pending"),
  providerData: varchar("provider_data"),
  updatedAt: timestamp("updated_at").defaultNow(),
}); 