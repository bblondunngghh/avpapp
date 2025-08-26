CREATE TABLE "company_payroll_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"location" text NOT NULL,
	"date" text NOT NULL,
	"shift" text NOT NULL,
	"shift_leader" text NOT NULL,
	"cars_parked" integer NOT NULL,
	"cc_transactions" integer NOT NULL,
	"total_cc_sales" double precision NOT NULL,
	"total_receipts" integer NOT NULL,
	"cash_collected" double precision NOT NULL,
	"money_owed" double precision DEFAULT 0,
	"cash_turn_in" double precision DEFAULT 0,
	"cash_comm" double precision NOT NULL,
	"cc_comm" double precision NOT NULL,
	"receipt_comm" double precision NOT NULL,
	"total_comm" double precision NOT NULL,
	"cash_tips" double precision NOT NULL,
	"cc_tips" double precision NOT NULL,
	"receipt_tips" double precision NOT NULL,
	"total_tips" double precision NOT NULL,
	"total_comm_and_tips" double precision NOT NULL,
	"company_cash_turn_in" double precision NOT NULL,
	"shift_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "cover_count_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"location_id" integer NOT NULL,
	"cover_count" integer NOT NULL,
	"report_date" text NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"submitted_by" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "document_attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"original_name" text NOT NULL,
	"category" text NOT NULL,
	"file_path" text NOT NULL,
	"file_size" integer,
	"mime_type" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_payroll_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_payroll_id" integer NOT NULL,
	"location" text NOT NULL,
	"total_job_hours" double precision NOT NULL,
	"employee_name" text NOT NULL,
	"employee_hours_worked" double precision NOT NULL,
	"cash_comm" double precision NOT NULL,
	"cc_comm" double precision NOT NULL,
	"receipt_comm" double precision NOT NULL,
	"cash_tips" double precision NOT NULL,
	"cc_tips" double precision NOT NULL,
	"receipt_tips" double precision NOT NULL,
	"money_owed" double precision NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "employee_shift_payroll" (
	"id" serial PRIMARY KEY NOT NULL,
	"shift_report_id" integer NOT NULL,
	"location" text NOT NULL,
	"total_job_hours" double precision NOT NULL,
	"employee_name" text NOT NULL,
	"employee_hours_worked" double precision NOT NULL,
	"cash_comm" double precision NOT NULL,
	"cc_comm" double precision NOT NULL,
	"receipt_comm" double precision NOT NULL,
	"cash_tips" double precision NOT NULL,
	"cc_tips" double precision NOT NULL,
	"receipt_tips" double precision NOT NULL,
	"money_owed" double precision NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "employee_tax_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"report_id" integer NOT NULL,
	"location_id" integer NOT NULL,
	"total_earnings" numeric NOT NULL,
	"tax_amount" numeric NOT NULL,
	"paid_amount" numeric DEFAULT '0' NOT NULL,
	"remaining_amount" numeric NOT NULL,
	"payment_date" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"full_name" text NOT NULL,
	"ssn" text,
	"full_ssn" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_shift_leader" boolean DEFAULT false NOT NULL,
	"phone" text,
	"email" text,
	"hire_date" timestamp DEFAULT now() NOT NULL,
	"termination_date" timestamp,
	"notes" text,
	"drivers_license_number" text,
	"date_of_birth" timestamp,
	"motor_vehicle_records_path" text,
	"hours_worked" double precision,
	"credit_card_commission" double precision,
	"credit_card_tips" double precision,
	"cash_commission" double precision,
	"cash_tips" double precision,
	"receipt_commission" double precision,
	"receipt_tips" double precision,
	"total_earnings" double precision,
	"money_owed" double precision,
	"taxes_owed" double precision,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "employees_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "help_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"requesting_location_id" integer NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"message" text NOT NULL,
	"staff_count" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"completed_at" timestamp,
	"auto_remove_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "help_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"help_request_id" integer NOT NULL,
	"responding_location_id" integer NOT NULL,
	"attendants_offered" integer DEFAULT 0 NOT NULL,
	"estimated_arrival" text,
	"message" text,
	"responded_at" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'dispatched' NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "incident_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"customer_phone" text NOT NULL,
	"incident_date" text NOT NULL,
	"incident_time" text NOT NULL,
	"incident_location" text NOT NULL,
	"employee_id" integer,
	"incident_description" text NOT NULL,
	"witness_name" text,
	"witness_phone" text,
	"vehicle_make" text NOT NULL,
	"vehicle_model" text NOT NULL,
	"vehicle_year" text NOT NULL,
	"vehicle_color" text NOT NULL,
	"vehicle_license_plate" text NOT NULL,
	"damage_description" text NOT NULL,
	"additional_notes" text,
	"photo_urls" text[] DEFAULT '{}',
	"photo_data" text[] DEFAULT '{}',
	"fault_status" text,
	"repair_cost" numeric,
	"repair_status" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"curbside_rate" double precision DEFAULT 15 NOT NULL,
	"turn_in_rate" double precision DEFAULT 11 NOT NULL,
	"employee_commission" double precision DEFAULT 4 NOT NULL,
	"logo_url" text,
	"address" text,
	"phone" text,
	"website" text,
	"sms_phone" text,
	"notification_email" text,
	CONSTRAINT "locations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "permits" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"permit_number" text NOT NULL,
	"status" text NOT NULL,
	"location" text NOT NULL,
	"issue_date" text NOT NULL,
	"expiration_date" text NOT NULL,
	"pdf_file_name" text,
	"pdf_data" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh_key" text NOT NULL,
	"auth_key" text NOT NULL,
	"location_id" integer,
	"device_type" text,
	"user_agent" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_notification_at" timestamp,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "shift_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"location_id" integer NOT NULL,
	"date" text NOT NULL,
	"shift" text NOT NULL,
	"manager" text NOT NULL,
	"total_cars" integer NOT NULL,
	"complimentary_cars" integer NOT NULL,
	"credit_transactions" integer NOT NULL,
	"total_credit_sales" double precision NOT NULL,
	"total_receipts" integer NOT NULL,
	"total_receipt_sales" double precision DEFAULT 0 NOT NULL,
	"total_cash_collected" double precision NOT NULL,
	"company_cash_turn_in" double precision NOT NULL,
	"total_turn_in" double precision NOT NULL,
	"over_short" double precision NOT NULL,
	"total_job_hours" double precision DEFAULT 0,
	"employees" text DEFAULT '[]' NOT NULL,
	"notes" text,
	"incidents" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"location_id" integer NOT NULL,
	"shift_date" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"position" text NOT NULL,
	"notes" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ticket_distributions" (
	"id" serial PRIMARY KEY NOT NULL,
	"location_id" integer NOT NULL,
	"allocated_tickets" integer NOT NULL,
	"used_tickets" integer DEFAULT 0 NOT NULL,
	"batch_number" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "time_off_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"request_date" text NOT NULL,
	"reason" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "training_acknowledgments" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_key" text,
	"employee_name" text NOT NULL,
	"date" text NOT NULL,
	"signature_data" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "cover_count_reports" ADD CONSTRAINT "cover_count_reports_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_shift_payroll" ADD CONSTRAINT "employee_shift_payroll_shift_report_id_shift_reports_id_fk" FOREIGN KEY ("shift_report_id") REFERENCES "public"."shift_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_tax_payments" ADD CONSTRAINT "employee_tax_payments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_tax_payments" ADD CONSTRAINT "employee_tax_payments_report_id_shift_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."shift_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_requests" ADD CONSTRAINT "help_requests_requesting_location_id_locations_id_fk" FOREIGN KEY ("requesting_location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_responses" ADD CONSTRAINT "help_responses_help_request_id_help_requests_id_fk" FOREIGN KEY ("help_request_id") REFERENCES "public"."help_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_responses" ADD CONSTRAINT "help_responses_responding_location_id_locations_id_fk" FOREIGN KEY ("responding_location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_reports" ADD CONSTRAINT "incident_reports_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_reviewed_by_employees_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;