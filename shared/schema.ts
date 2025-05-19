import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users schema (keeping from original)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Locations schema for the different restaurant clients
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  active: boolean("active").notNull().default(true),
});

export const insertLocationSchema = createInsertSchema(locations).pick({
  name: true,
  active: true,
});

export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;

// Shift report schema
export const shiftReports = pgTable("shift_reports", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  shift: text("shift").notNull(), // Lunch, Dinner
  manager: text("manager").notNull(), // Now called "Shift Leader" in the UI
  totalCars: integer("total_cars").notNull(),
  complimentaryCars: integer("complimentary_cars").notNull(),
  creditTransactions: integer("credit_transactions").notNull(),
  totalCreditSales: doublePrecision("total_credit_sales").notNull(),
  totalReceipts: integer("total_receipts").notNull(),
  totalCashCollected: doublePrecision("total_cash_collected").notNull(),
  companyCashTurnIn: doublePrecision("company_cash_turn_in").notNull(), // Company turn-in (totalCars * $11)
  totalTurnIn: doublePrecision("total_turn_in").notNull(), // totalCreditSales + companyCashTurnIn
  overShort: doublePrecision("over_short").notNull(), // totalCashCollected - companyCashTurnIn
  totalJobHours: doublePrecision("total_job_hours").default(0), // Total hours for all employees
  employees: text("employees").notNull().default('[]'), // Store as JSON string
  notes: text("notes"),
  incidents: text("incidents"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Create a custom schema for employees
const employeeSchema = z.array(
  z.object({
    name: z.string(),
    hours: z.number()
  })
);

// Custom insert schema with proper employee handling
export const insertShiftReportSchema = createInsertSchema(shiftReports)
  .omit({
    id: true, 
    createdAt: true,
    updatedAt: true,
    employees: true // We'll handle this separately
  })
  .extend({
    // Allow employees to be passed as an array
    employees: z.union([z.string(), employeeSchema]).optional(),
    // Make overShort optional with default 0
    overShort: z.number().default(0)
  });

// Custom update schema with proper employee handling
export const updateShiftReportSchema = createInsertSchema(shiftReports)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    employees: true // We'll handle this separately
  })
  .extend({
    // Allow employees to be passed as an array
    employees: z.union([z.string(), employeeSchema]).optional(),
    // Make overShort optional with default 0
    overShort: z.number().default(0)
  });

export type InsertShiftReport = z.infer<typeof insertShiftReportSchema>;
export type UpdateShiftReport = z.infer<typeof updateShiftReportSchema>;
export type ShiftReport = typeof shiftReports.$inferSelect;

// Location constants
export const LOCATIONS = {
  CAPITAL_GRILLE: "The Capital Grille",
  BOBS_STEAK: "Bob's Steak and Chop House",
  TRULUCKS: "Truluck's",
  BOA_STEAKHOUSE: "BOA Steakhouse"
};

// Shift constants
export const SHIFTS = {
  LUNCH: "Lunch",
  DINNER: "Dinner"
};

// Ticket distribution schema
export const ticketDistributions = pgTable("ticket_distributions", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id").notNull(),
  allocatedTickets: integer("allocated_tickets").notNull(),
  usedTickets: integer("used_tickets").notNull().default(0),
  batchNumber: text("batch_number").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertTicketDistributionSchema = createInsertSchema(ticketDistributions)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    usedTickets: true
  });

export const updateTicketDistributionSchema = createInsertSchema(ticketDistributions)
  .omit({
    id: true,
    createdAt: true
  });

export type InsertTicketDistribution = z.infer<typeof insertTicketDistributionSchema>;
export type UpdateTicketDistribution = z.infer<typeof updateTicketDistributionSchema>;
export type TicketDistribution = typeof ticketDistributions.$inferSelect;
