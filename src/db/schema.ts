import { boolean, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const entitlements = pgTable("entitlements", {
  userId: varchar("user_id").primaryKey(),
  part2: boolean("part2").default(false),
  part3: boolean("part3").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const payments = pgTable("payments", {
  token: varchar("token").primaryKey(),
  userId: varchar("user_id").notNull(),
  amount: integer("amount").notNull(),
  status: varchar("status").default("pending"),
  providerData: text("provider_data"),
  updatedAt: timestamp("updated_at").defaultNow(),
}); 