import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, numeric } from "drizzle-orm/pg-core";
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

// Define type for Employee with cashPaid property used in components
export interface EmployeeWithCashPaid {
  name: string;
  hours: number;
  cashPaid?: number;
}

// Employee schema
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), // Auto-generated from last 4 SSN digits
  fullName: text("full_name").notNull(),
  ssn: text("ssn"), // Last 4 digits of SSN for key generation
  fullSsn: text("full_ssn"), // Full SSN with dashes (e.g., 123-45-6789)
  isActive: boolean("is_active").default(true).notNull(),
  isShiftLeader: boolean("is_shift_leader").default(false).notNull(),
  phone: text("phone"),
  email: text("email"),
  hireDate: timestamp("hire_date").defaultNow().notNull(),
  terminationDate: timestamp("termination_date"),
  notes: text("notes"),
  driversLicenseNumber: text("drivers_license_number"),
  dateOfBirth: timestamp("date_of_birth"),
  motorVehicleRecordsPath: text("motor_vehicle_records_path"),
  // Payroll data fields
  hoursWorked: doublePrecision("hours_worked"),
  creditCardCommission: doublePrecision("credit_card_commission"),
  creditCardTips: doublePrecision("credit_card_tips"),
  cashCommission: doublePrecision("cash_commission"),
  cashTips: doublePrecision("cash_tips"),
  receiptCommission: doublePrecision("receipt_commission"),
  receiptTips: doublePrecision("receipt_tips"),
  totalEarnings: doublePrecision("total_earnings"),
  moneyOwed: doublePrecision("money_owed"),
  taxesOwed: doublePrecision("taxes_owed"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertEmployeeSchema = createInsertSchema(employees)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    terminationDate: true
  })
  .extend({
    hireDate: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    notes: z.string().optional(),
    ssn: z.string().optional(),
    fullSsn: z.string().optional(),
    driversLicenseNumber: z.string().optional(),
    dateOfBirth: z.string().optional(),
    motorVehicleRecordsPath: z.string().optional(),
    // Payroll data fields
    hoursWorked: z.number().optional(),
    creditCardCommission: z.number().optional(),
    creditCardTips: z.number().optional(),
    cashCommission: z.number().optional(),
    cashTips: z.number().optional(),
    receiptCommission: z.number().optional(),
    receiptTips: z.number().optional(),
    totalEarnings: z.number().optional(),
    moneyOwed: z.number().optional(),
    taxesOwed: z.number().optional(),
  });

export const updateEmployeeSchema = createInsertSchema(employees)
  .omit({
    id: true,
    createdAt: true
  })
  .extend({
    key: z.string().optional(),
    fullName: z.string().optional(),
    isActive: z.boolean().optional(),
    isShiftLeader: z.boolean().optional(),
    hireDate: z.string().optional(),
    terminationDate: z.string().optional().nullable(),
    phone: z.string().optional(),
    email: z.string().optional(),
    notes: z.string().optional(),
    ssn: z.string().optional(),
    fullSsn: z.string().optional(),
    driversLicenseNumber: z.string().optional(),
    dateOfBirth: z.string().optional(),
    motorVehicleRecordsPath: z.string().optional(),
  })
  .partial();

export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type UpdateEmployee = z.infer<typeof updateEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;

// Document attachments schema for PDF generation
export const documentAttachments = pgTable("document_attachments", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  category: text("category").notNull(), // authorized_agent, resolution_authority, valet_insurance, business_insurance, parking_agreement
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const insertDocumentAttachmentSchema = createInsertSchema(documentAttachments).omit({
  id: true,
  uploadedAt: true,
});

export type InsertDocumentAttachment = z.infer<typeof insertDocumentAttachmentSchema>;
export type DocumentAttachment = typeof documentAttachments.$inferSelect;

// Locations schema for the different restaurant clients
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  active: boolean("active").notNull().default(true),
  curbsideRate: doublePrecision("curbside_rate").notNull().default(15), // Rate charged to customer per car
  turnInRate: doublePrecision("turn_in_rate").notNull().default(11), // Amount turned in to company per car
  employeeCommission: doublePrecision("employee_commission").notNull().default(4), // Commission paid to employees per car
  logoUrl: text("logo_url"), // URL or path to location's logo image
  address: text("address"), // Full address of the location
  phone: text("phone"), // Location phone number
  website: text("website"), // Location website URL
  smsPhone: text("sms_phone"), // SMS notification phone number for help requests
  notificationEmail: text("notification_email"), // Email for help request notifications
});

export const insertLocationSchema = createInsertSchema(locations).pick({
  name: true,
  active: true,
  curbsideRate: true,
  turnInRate: true,
  employeeCommission: true,
  logoUrl: true,
  address: true,
  phone: true,
  website: true,
  smsPhone: true,
  notificationEmail: true,
});

export const updateLocationSchema = createInsertSchema(locations).pick({
  name: true,
  active: true,
  curbsideRate: true,
  turnInRate: true,
  employeeCommission: true,
  logoUrl: true,
  address: true,
  phone: true,
  website: true,
  smsPhone: true,
}).partial();

export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type UpdateLocation = z.infer<typeof updateLocationSchema>;
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
  totalReceiptSales: doublePrecision("total_receipt_sales").notNull().default(0),
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
    hours: z.number(),
    cashPaid: z.number().optional()
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

// Location constants with ID mapping
export const LOCATIONS = {
  CAPITAL_GRILLE: "The Capital Grille",
  BOBS_STEAK: "Bob's Steak and Chop House",
  TRULUCKS: "Truluck's",
  BOA_STEAKHOUSE: "BOA Steakhouse"
};

// Location ID to Code Mapping
export const LOCATION_CODE_MAP: Record<number, string> = {
  1: "CG", // Capital Grille
  2: "BS", // Bob's Steak and Chop House
  3: "TL", // Truluck's
  4: "BOA", // BOA Steakhouse
};

// Helper function to get location code from ID
export function getLocationCode(locationId: number): string {
  return LOCATION_CODE_MAP[locationId] || `LOC${locationId}`;
}

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
    updatedAt: true
  })
  .extend({
    usedTickets: z.number().optional()
  });

export const updateTicketDistributionSchema = createInsertSchema(ticketDistributions)
  .omit({
    id: true,
    createdAt: true
  });

export type InsertTicketDistribution = z.infer<typeof insertTicketDistributionSchema>;
export type UpdateTicketDistribution = z.infer<typeof updateTicketDistributionSchema>;
export type TicketDistribution = typeof ticketDistributions.$inferSelect;

// Company Payroll Data Table - Main shift report data
export const companyPayrollData = pgTable("company_payroll_data", {
  id: serial("id").primaryKey(),
  
  // Shift Information Card
  location: text("location").notNull(), // CG, TL, BS, BOA etc.
  date: text("date").notNull(), // YYYY-MM-DD format
  shift: text("shift").notNull(), // Lunch, Dinner
  shiftLeader: text("shift_leader").notNull(),
  carsParked: integer("cars_parked").notNull(),
  
  // Shift Details Card
  ccTransactions: integer("cc_transactions").notNull(),
  totalCcSales: doublePrecision("total_cc_sales").notNull(),
  totalReceipts: integer("total_receipts").notNull(),
  cashCollected: doublePrecision("cash_collected").notNull(),
  moneyOwed: doublePrecision("money_owed").default(0), // When money is owed to company
  cashTurnIn: doublePrecision("cash_turn_in").default(0), // When company has cash to turn in
  
  // Financial Summary Card - All calculated values
  cashComm: doublePrecision("cash_comm").notNull(),
  ccComm: doublePrecision("cc_comm").notNull(),
  receiptComm: doublePrecision("receipt_comm").notNull(),
  totalComm: doublePrecision("total_comm").notNull(),
  cashTips: doublePrecision("cash_tips").notNull(),
  ccTips: doublePrecision("cc_tips").notNull(),
  receiptTips: doublePrecision("receipt_tips").notNull(),
  totalTips: doublePrecision("total_tips").notNull(),
  totalCommAndTips: doublePrecision("total_comm_and_tips").notNull(),
  companyCashTurnIn: doublePrecision("company_cash_turn_in").notNull(),
  
  // Shift Notes
  shiftNotes: text("shift_notes"),
  
  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Employee Payroll Data Table - Individual employee data per shift
export const employeePayrollData = pgTable("employee_payroll_data", {
  id: serial("id").primaryKey(),
  companyPayrollId: integer("company_payroll_id").notNull(), // Foreign key to company_payroll_data
  
  // Basic Info
  location: text("location").notNull(), // CG, TL, BS, BOA etc.
  totalJobHours: doublePrecision("total_job_hours").notNull(),
  
  // Employee Details
  employeeName: text("employee_name").notNull(),
  employeeHoursWorked: doublePrecision("employee_hours_worked").notNull(),
  
  // Individual Employee Commission
  cashComm: doublePrecision("cash_comm").notNull(),
  ccComm: doublePrecision("cc_comm").notNull(),
  receiptComm: doublePrecision("receipt_comm").notNull(),
  
  // Individual Employee Tips
  cashTips: doublePrecision("cash_tips").notNull(),
  ccTips: doublePrecision("cc_tips").notNull(),
  receiptTips: doublePrecision("receipt_tips").notNull(),
  
  // Money Owed to Employee
  moneyOwed: doublePrecision("money_owed").notNull(),
  
  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Schemas for the new tables
export const insertCompanyPayrollDataSchema = createInsertSchema(companyPayrollData)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

export const updateCompanyPayrollDataSchema = insertCompanyPayrollDataSchema.partial();

export const insertEmployeePayrollDataSchema = createInsertSchema(employeePayrollData)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

export const updateEmployeePayrollDataSchema = insertEmployeePayrollDataSchema.partial();

export type InsertCompanyPayrollData = z.infer<typeof insertCompanyPayrollDataSchema>;
export type UpdateCompanyPayrollData = z.infer<typeof updateCompanyPayrollDataSchema>;
export type CompanyPayrollData = typeof companyPayrollData.$inferSelect;

export type InsertEmployeePayrollData = z.infer<typeof insertEmployeePayrollDataSchema>;
export type UpdateEmployeePayrollData = z.infer<typeof updateEmployeePayrollDataSchema>;
export type EmployeePayrollData = typeof employeePayrollData.$inferSelect;

// Employee Payroll Data Table - Individual employee data per shift
export const employeeShiftPayroll = pgTable("employee_shift_payroll", {
  id: serial("id").primaryKey(),
  shiftReportId: integer("shift_report_id").notNull().references(() => shiftReports.id, { onDelete: "cascade" }),
  
  // Basic Info
  location: text("location").notNull(), // CG, TL, BS, BOA etc.
  totalJobHours: doublePrecision("total_job_hours").notNull(),
  
  // Employee Details
  employeeName: text("employee_name").notNull(),
  employeeHoursWorked: doublePrecision("employee_hours_worked").notNull(),
  
  // Individual Employee Commission
  cashComm: doublePrecision("cash_comm").notNull(),
  ccComm: doublePrecision("cc_comm").notNull(),
  receiptComm: doublePrecision("receipt_comm").notNull(),
  
  // Individual Employee Tips
  cashTips: doublePrecision("cash_tips").notNull(),
  ccTips: doublePrecision("cc_tips").notNull(),
  receiptTips: doublePrecision("receipt_tips").notNull(),
  
  // Money Owed to Employee
  moneyOwed: doublePrecision("money_owed").notNull(),
  
  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertEmployeeShiftPayrollSchema = createInsertSchema(employeeShiftPayroll)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

export const updateEmployeeShiftPayrollSchema = insertEmployeeShiftPayrollSchema.partial();

export type InsertEmployeeShiftPayroll = z.infer<typeof insertEmployeeShiftPayrollSchema>;
export type UpdateEmployeeShiftPayroll = z.infer<typeof updateEmployeeShiftPayrollSchema>;
export type EmployeeShiftPayroll = typeof employeeShiftPayroll.$inferSelect;

// Employee Tax Payments schema
export const employeeTaxPayments = pgTable("employee_tax_payments", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  reportId: integer("report_id").notNull().references(() => shiftReports.id, { onDelete: "cascade" }),
  locationId: integer("location_id").notNull(),
  totalEarnings: numeric("total_earnings").notNull(),
  taxAmount: numeric("tax_amount").notNull(),
  paidAmount: numeric("paid_amount").notNull().default("0"),
  remainingAmount: numeric("remaining_amount").notNull(),
  paymentDate: timestamp("payment_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEmployeeTaxPaymentSchema = createInsertSchema(employeeTaxPayments).omit({
  id: true,
  createdAt: true
});

export const updateEmployeeTaxPaymentSchema = createInsertSchema(employeeTaxPayments).omit({
  id: true,
  createdAt: true
});

export type InsertEmployeeTaxPayment = z.infer<typeof insertEmployeeTaxPaymentSchema>;
export type UpdateEmployeeTaxPayment = z.infer<typeof updateEmployeeTaxPaymentSchema>;
export type EmployeeTaxPayment = typeof employeeTaxPayments.$inferSelect;

// Incident Reports table
export const incidentReports = pgTable("incident_reports", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  incidentDate: text("incident_date").notNull(),
  incidentTime: text("incident_time").notNull(),
  incidentLocation: text("incident_location").notNull(),
  employeeId: integer("employee_id").references(() => employees.id),
  incidentDescription: text("incident_description").notNull(),
  witnessName: text("witness_name"),
  witnessPhone: text("witness_phone"),
  vehicleMake: text("vehicle_make").notNull(),
  vehicleModel: text("vehicle_model").notNull(),
  vehicleYear: text("vehicle_year").notNull(),
  vehicleColor: text("vehicle_color").notNull(),
  vehicleLicensePlate: text("vehicle_license_plate").notNull(),
  damageDescription: text("damage_description").notNull(),
  additionalNotes: text("additional_notes"),
  photoUrls: text("photo_urls").array().default([]),
  photoData: text("photo_data").array().default([]), // Base64 encoded photo data
  faultStatus: text("fault_status"), // "at-fault", "not-at-fault", null
  repairCost: numeric("repair_cost"),
  repairStatus: text("repair_status"), // "pending", "completed", null
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const insertIncidentReportSchema = createInsertSchema(incidentReports).omit({
  id: true,
  submittedAt: true,
});

export const updateIncidentReportSchema = createInsertSchema(incidentReports).omit({
  id: true,
  submittedAt: true,
}).partial();

export type InsertIncidentReport = z.infer<typeof insertIncidentReportSchema>;
export type UpdateIncidentReport = z.infer<typeof updateIncidentReportSchema>;
export type IncidentReport = typeof incidentReports.$inferSelect;

// Permits schema
export const permits = pgTable("permits", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  permitNumber: text("permit_number").notNull(),
  status: text("status").notNull(),
  location: text("location").notNull(),
  issueDate: text("issue_date").notNull(),
  expirationDate: text("expiration_date").notNull(),
  pdfFileName: text("pdf_file_name"),
  pdfData: text("pdf_data"), // Base64 encoded PDF data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPermitSchema = createInsertSchema(permits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updatePermitSchema = createInsertSchema(permits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export type InsertPermit = z.infer<typeof insertPermitSchema>;
export type UpdatePermit = z.infer<typeof updatePermitSchema>;
export type Permit = typeof permits.$inferSelect;

// Training Acknowledgments schema
export const trainingAcknowledgments = pgTable("training_acknowledgments", {
  id: serial("id").primaryKey(),
  employeeKey: text("employee_key"), // Links to employees table - optional for backward compatibility
  employeeName: text("employee_name").notNull(), // Keep for backup/display
  date: text("date").notNull(),
  signatureData: text("signature_data").notNull(), // Base64 encoded signature image
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTrainingAcknowledgmentSchema = createInsertSchema(trainingAcknowledgments).omit({
  id: true,
  createdAt: true,
});

export type InsertTrainingAcknowledgment = z.infer<typeof insertTrainingAcknowledgmentSchema>;
export type TrainingAcknowledgment = typeof trainingAcknowledgments.$inferSelect;

// Help Request system for staff assistance
export const helpRequests = pgTable("help_requests", {
  id: serial("id").primaryKey(),
  requestingLocationId: integer("requesting_location_id").notNull().references(() => locations.id),
  priority: text("priority").notNull().default("normal"), // "urgent", "normal", "low"
  message: text("message").notNull(),
  staffCount: integer("staff_count").notNull().default(1), // How many staff currently working
  status: text("status").notNull().default("active"), // "active", "fulfilled", "cancelled", "completed"
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
  completedAt: timestamp("completed_at"), // When help was marked as completed
  autoRemoveAt: timestamp("auto_remove_at"), // When request should be auto-removed (15 minutes after completion)
});

export const helpResponses = pgTable("help_responses", {
  id: serial("id").primaryKey(),
  helpRequestId: integer("help_request_id").notNull().references(() => helpRequests.id),
  respondingLocationId: integer("responding_location_id").notNull().references(() => locations.id),
  attendantsOffered: integer("attendants_offered").notNull().default(0), // 0 means "too busy to help"
  estimatedArrival: text("estimated_arrival"), // "5 minutes", "10 minutes", etc.
  message: text("message"),
  respondedAt: timestamp("responded_at").defaultNow().notNull(),
  status: text("status").notNull().default("dispatched"), // "dispatched", "completed", "cancelled"
  completedAt: timestamp("completed_at"),
});

export const insertHelpRequestSchema = createInsertSchema(helpRequests).pick({
  requestingLocationId: true,
  priority: true,
  message: true,
  staffCount: true,
});

export const insertHelpResponseSchema = createInsertSchema(helpResponses).pick({
  helpRequestId: true,
  respondingLocationId: true,
  attendantsOffered: true,
  estimatedArrival: true,
  message: true,
});

export type InsertHelpRequest = z.infer<typeof insertHelpRequestSchema>;
export type HelpRequest = typeof helpRequests.$inferSelect;
export type InsertHelpResponse = z.infer<typeof insertHelpResponseSchema>;
export type HelpResponse = typeof helpResponses.$inferSelect;

// Cover Count Reports schema for daily 5PM reporting
export const coverCountReports = pgTable("cover_count_reports", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id").notNull().references(() => locations.id),
  coverCount: integer("cover_count").notNull(), // Number of covers expected for evening service
  reportDate: text("report_date").notNull(), // YYYY-MM-DD format
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  submittedBy: text("submitted_by"), // Who submitted the report
  notes: text("notes"), // Optional notes about the evening's expectations
});

// Push Notification Subscriptions schema
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  endpoint: text("endpoint").notNull().unique(),
  p256dhKey: text("p256dh_key").notNull(),
  authKey: text("auth_key").notNull(),
  locationId: integer("location_id").references(() => locations.id), // Optional: associate with a location
  deviceType: text("device_type"), // "desktop", "mobile", "tablet"
  userAgent: text("user_agent"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastNotificationAt: timestamp("last_notification_at"),
});

export const insertCoverCountReportSchema = createInsertSchema(coverCountReports).omit({
  id: true,
  submittedAt: true,
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
  id: true,
  createdAt: true,
  lastNotificationAt: true,
});

export type InsertCoverCountReport = z.infer<typeof insertCoverCountReportSchema>;
export type CoverCountReport = typeof coverCountReports.$inferSelect;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;

// Employee Shifts schema for scheduler
export const shifts = pgTable("shifts", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  locationId: integer("location_id").notNull().references(() => locations.id),
  shiftDate: text("shift_date").notNull(), // YYYY-MM-DD format
  startTime: text("start_time").notNull(), // HH:MM format (24-hour)
  endTime: text("end_time").notNull(), // HH:MM format (24-hour)
  position: text("position").notNull(), // 'valet' or 'shift-leader'
  notes: text("notes"), // Optional notes about the shift
  isPublished: boolean("is_published").default(false).notNull(), // Whether shift is published to employee
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertShiftSchema = createInsertSchema(shifts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateShiftSchema = createInsertSchema(shifts).omit({
  id: true,
  createdAt: true,
}).partial();

export type InsertShift = z.infer<typeof insertShiftSchema>;
export type UpdateShift = z.infer<typeof updateShiftSchema>;
export type Shift = typeof shifts.$inferSelect;

// Time Off Requests schema
export const timeOffRequests = pgTable("time_off_requests", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  requestDate: text("request_date").notNull(), // YYYY-MM-DD format - the date they want off
  reason: text("reason"), // Optional reason for the time off
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'denied'
  adminNotes: text("admin_notes"), // Optional notes from admin when approving/denying
  reviewedBy: integer("reviewed_by").references(() => employees.id), // Admin who reviewed the request
  reviewedAt: timestamp("reviewed_at"), // When the request was reviewed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertTimeOffRequestSchema = createInsertSchema(timeOffRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateTimeOffRequestSchema = createInsertSchema(timeOffRequests).omit({
  id: true,
  createdAt: true,
}).partial();

export type InsertTimeOffRequest = z.infer<typeof insertTimeOffRequestSchema>;
export type UpdateTimeOffRequest = z.infer<typeof updateTimeOffRequestSchema>;
export type TimeOffRequest = typeof timeOffRequests.$inferSelect;

// Schedule Templates schema
export const scheduleTemplates = pgTable("schedule_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  shifts: text("shifts").notNull().default("[]"), // JSON string of shift patterns
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertScheduleTemplateSchema = createInsertSchema(scheduleTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateScheduleTemplateSchema = createInsertSchema(scheduleTemplates).omit({
  id: true,
  createdAt: true,
}).partial();

export type InsertScheduleTemplate = z.infer<typeof insertScheduleTemplateSchema>;
export type UpdateScheduleTemplate = z.infer<typeof updateScheduleTemplateSchema>;
export type ScheduleTemplate = typeof scheduleTemplates.$inferSelect;

// Custom Shift Presets schema
export const customShiftPresets = pgTable("custom_shift_presets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startTime: text("start_time").notNull(), // Format: "HH:MM"
  endTime: text("end_time").notNull(), // Format: "HH:MM"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertCustomShiftPresetSchema = createInsertSchema(customShiftPresets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateCustomShiftPresetSchema = createInsertSchema(customShiftPresets).omit({
  id: true,
  createdAt: true,
}).partial();

export type InsertCustomShiftPreset = z.infer<typeof insertCustomShiftPresetSchema>;
export type UpdateCustomShiftPreset = z.infer<typeof updateCustomShiftPresetSchema>;
export type CustomShiftPreset = typeof customShiftPresets.$inferSelect;
