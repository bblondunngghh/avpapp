ALTER TABLE "employees" ADD COLUMN "availability" json;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "receipt_rate" double precision DEFAULT 15 NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "receipt_commission" double precision DEFAULT 4 NOT NULL;