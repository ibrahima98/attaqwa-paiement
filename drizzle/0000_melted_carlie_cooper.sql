CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" varchar(128),
	"action" varchar(64) NOT NULL,
	"meta" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "entitlements" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" varchar(128) NOT NULL,
	"resource_id" varchar(64) NOT NULL,
	"granted_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	"source_payment_id" integer
);
--> statement-breakpoint
CREATE TABLE "entitlements_legacy" (
	"user_id" varchar PRIMARY KEY NOT NULL,
	"part2" boolean DEFAULT false,
	"part3" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ipn_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_ref" varchar(128) NOT NULL,
	"raw_payload" jsonb NOT NULL,
	"signature_ok" boolean NOT NULL,
	"processed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" varchar(128) NOT NULL,
	"plan_id" varchar(64) NOT NULL,
	"provider" varchar(32) DEFAULT 'paydunya' NOT NULL,
	"provider_token" varchar(128) NOT NULL,
	"status" varchar(16) DEFAULT 'PENDING' NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"currency" varchar(8) DEFAULT 'XOF' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payments_legacy" (
	"token" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"amount" integer NOT NULL,
	"status" varchar DEFAULT 'pending',
	"provider_data" varchar,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" varchar(128) NOT NULL,
	"email" varchar(256),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_uid_resource" ON "entitlements" USING btree ("uid","resource_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_provider_ref" ON "ipn_events" USING btree ("provider_ref");