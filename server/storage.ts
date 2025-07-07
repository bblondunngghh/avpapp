import { 
  users, type User, 
  employees, type Employee, type InsertEmployee, type UpdateEmployee,
  locations, type Location, type InsertLocation, type UpdateLocation,
  shiftReports, type ShiftReport, type InsertShiftReport, type UpdateShiftReport,
  ticketDistributions, type TicketDistribution, type InsertTicketDistribution, type UpdateTicketDistribution,
  employeeTaxPayments, type EmployeeTaxPayment, type InsertEmployeeTaxPayment, type UpdateEmployeeTaxPayment,
  incidentReports, type IncidentReport, type InsertIncidentReport,
  permits, type Permit, type InsertPermit, type UpdatePermit,
  trainingAcknowledgments, type TrainingAcknowledgment, type InsertTrainingAcknowledgment,
  helpRequests, type HelpRequest, type InsertHelpRequest,
  helpResponses, type HelpResponse, type InsertHelpResponse,
  coverCountReports, type CoverCountReport, type InsertCoverCountReport,
  pushSubscriptions, type PushSubscription, type InsertPushSubscription,
  LOCATIONS
} from "@shared/schema";
import { db, withRetry } from "./db";
import { eq, desc, gte, and, or, gt, lt } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.Store;
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Employee methods
  getEmployees(): Promise<Employee[]>;
  getAllEmployees(): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  getEmployeeByKey(key: string): Promise<Employee | undefined>;
  getActiveEmployees(): Promise<Employee[]>;
  getShiftLeaders(): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: UpdateEmployee): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;
  
  // Location methods
  getLocations(): Promise<Location[]>;
  getLocation(id: number): Promise<Location | undefined>;
  getLocationByName(name: string): Promise<Location | undefined>;
  createLocation(location: InsertLocation): Promise<Location>;
  updateLocation(id: number, location: UpdateLocation): Promise<Location | undefined>;
  deleteLocation(id: number): Promise<boolean>;
  
  // Shift report methods
  getShiftReports(): Promise<ShiftReport[]>;
  getShiftReport(id: number): Promise<ShiftReport | undefined>;
  getShiftReportsByLocation(locationId: number): Promise<ShiftReport[]>;
  createShiftReport(report: InsertShiftReport): Promise<ShiftReport>;
  updateShiftReport(id: number, report: UpdateShiftReport): Promise<ShiftReport | undefined>;
  deleteShiftReport(id: number): Promise<boolean>;
  
  // Ticket distribution methods
  getTicketDistributions(): Promise<TicketDistribution[]>;
  getTicketDistribution(id: number): Promise<TicketDistribution | undefined>;
  getTicketDistributionsByLocation(locationId: number): Promise<TicketDistribution[]>;
  createTicketDistribution(distribution: InsertTicketDistribution): Promise<TicketDistribution>;
  updateTicketDistribution(id: number, distribution: UpdateTicketDistribution): Promise<TicketDistribution | undefined>;
  deleteTicketDistribution(id: number): Promise<boolean>;
  consumeTickets(locationId: number, ticketsToConsume: number): Promise<boolean>;
  
  // Employee tax payment methods
  getEmployeeTaxPayments(): Promise<EmployeeTaxPayment[]>;
  getEmployeeTaxPayment(id: number): Promise<EmployeeTaxPayment | undefined>;
  getEmployeeTaxPaymentsByEmployee(employeeId: number): Promise<EmployeeTaxPayment[]>;
  getEmployeeTaxPaymentsByReport(reportId: number): Promise<EmployeeTaxPayment[]>;
  createEmployeeTaxPayment(payment: InsertEmployeeTaxPayment): Promise<EmployeeTaxPayment>;
  updateEmployeeTaxPayment(id: number, payment: UpdateEmployeeTaxPayment): Promise<EmployeeTaxPayment | undefined>;
  deleteEmployeeTaxPayment(id: number): Promise<boolean>;
  
  // Incident report methods
  getIncidentReports(): Promise<IncidentReport[]>;
  getIncidentReport(id: number): Promise<IncidentReport | undefined>;
  createIncidentReport(report: InsertIncidentReport): Promise<IncidentReport>;
  updateIncidentReport(id: number, report: Partial<IncidentReport>): Promise<IncidentReport | undefined>;
  deleteIncidentReport(id: number): Promise<boolean>;
  
  // Permit methods
  getPermits(): Promise<Permit[]>;
  getPermit(id: number): Promise<Permit | undefined>;
  createPermit(permitData: InsertPermit): Promise<Permit>;
  updatePermit(id: number, permitData: UpdatePermit): Promise<Permit | undefined>;
  deletePermit(id: number): Promise<boolean>;
  
  // Training acknowledgment methods
  getTrainingAcknowledgments(): Promise<TrainingAcknowledgment[]>;
  getTrainingAcknowledgment(id: number): Promise<TrainingAcknowledgment | undefined>;
  createTrainingAcknowledgment(acknowledgmentData: InsertTrainingAcknowledgment): Promise<TrainingAcknowledgment>;
  
  // Help request methods
  getActiveHelpRequests(): Promise<HelpRequest[]>;
  getHelpRequest(id: number): Promise<HelpRequest | undefined>;
  createHelpRequest(requestData: InsertHelpRequest): Promise<HelpRequest>;
  markHelpRequestFulfilled(id: number): Promise<boolean>;
  markHelpRequestCompleted(id: number): Promise<boolean>;
  getHelpResponses(helpRequestId: number): Promise<HelpResponse[]>;
  createHelpResponse(responseData: InsertHelpResponse): Promise<HelpResponse>;
  getAllRecentHelpResponses(): Promise<HelpResponse[]>;
  
  // Cover count report methods
  getTodaysCoverCountReports(): Promise<CoverCountReport[]>;
  getCoverCountReport(locationId: number, reportDate: string): Promise<CoverCountReport | undefined>;
  createCoverCountReport(reportData: InsertCoverCountReport): Promise<CoverCountReport>;
  updateCoverCountReport(id: number, reportData: Partial<CoverCountReport>): Promise<CoverCountReport | undefined>;
  
  // Push notification methods
  getPushSubscriptions(): Promise<PushSubscription[]>;
  getActivePushSubscriptions(): Promise<PushSubscription[]>;
  createPushSubscription(subscriptionData: InsertPushSubscription): Promise<PushSubscription>;
  updatePushSubscription(id: number, data: Partial<PushSubscription>): Promise<PushSubscription | undefined>;
  deletePushSubscription(endpoint: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  sessionStore = new PostgresSessionStore({ 
    pool, 
    createTableIfMissing: true 
  });

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user || undefined;
    } catch (error) {
      console.error("Error fetching user:", error);
      throw new Error("Failed to fetch user");
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user || undefined;
    } catch (error) {
      console.error("Error fetching user by username:", error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const [newUser] = await db.insert(users).values(user).returning();
      return newUser;
    } catch (error) {
      console.error("Error creating user:", error);
      throw new Error("Failed to create user");
    }
  }

  // Employee methods
  async getEmployees(): Promise<Employee[]> {
    try {
      // Only return active employees by default
      return await withRetry(() => 
        db.select()
          .from(employees)
          .where(eq(employees.isActive, true))
          .orderBy(employees.fullName)
      );
    } catch (error) {
      console.error("Error fetching employees:", error);
      return [];
    }
  }

  async getAllEmployees(): Promise<Employee[]> {
    try {
      // Return all employees (both active and inactive) for accounting purposes
      return await withRetry(() => 
        db.select()
          .from(employees)
          .orderBy(employees.fullName)
      );
    } catch (error) {
      console.error("Error fetching all employees:", error);
      return [];
    }
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    try {
      const [employee] = await db.select().from(employees).where(eq(employees.id, id));
      return employee || undefined;
    } catch (error) {
      console.error("Error fetching employee:", error);
      return undefined;
    }
  }

  async getEmployeeByKey(key: string): Promise<Employee | undefined> {
    try {
      const [employee] = await db.select().from(employees).where(eq(employees.key, key));
      return employee || undefined;
    } catch (error) {
      console.error("Error fetching employee by key:", error);
      return undefined;
    }
  }

  async getActiveEmployees(): Promise<Employee[]> {
    try {
      return await db.select().from(employees).where(eq(employees.isActive, true));
    } catch (error) {
      console.error("Error fetching active employees:", error);
      return [];
    }
  }

  async getShiftLeaders(): Promise<Employee[]> {
    try {
      return await db.select().from(employees).where(eq(employees.isShiftLeader, true));
    } catch (error) {
      console.error("Error fetching shift leaders:", error);
      return [];
    }
  }

  async createEmployee(employeeData: InsertEmployee): Promise<Employee> {
    try {
      const [employee] = await db.insert(employees).values(employeeData).returning();
      return employee;
    } catch (error) {
      console.error("Error creating employee:", error);
      throw new Error("Failed to create employee");
    }
  }

  async updateEmployee(id: number, employeeData: UpdateEmployee): Promise<Employee | undefined> {
    try {
      const [updatedEmployee] = await db
        .update(employees)
        .set(employeeData)
        .where(eq(employees.id, id))
        .returning();
      return updatedEmployee || undefined;
    } catch (error) {
      console.error("Error updating employee:", error);
      return undefined;
    }
  }

  async deleteEmployee(id: number): Promise<boolean> {
    try {
      // First check if employee exists
      const employee = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
      if (employee.length === 0) {
        console.log(`Employee with ID ${id} not found`);
        return false;
      }

      // Soft delete: mark employee as inactive and set termination date
      console.log(`Soft deleting employee ${id} - marking as inactive`);
      await db.update(employees)
        .set({ 
          isActive: false, 
          terminationDate: new Date(),
          updatedAt: new Date()
        })
        .where(eq(employees.id, id));
      
      console.log(`Successfully deactivated employee with ID ${id}`);
      return true;
    } catch (error) {
      console.error("Error deactivating employee:", error);
      return false;
    }
  }

  // Location methods
  async getLocations(): Promise<Location[]> {
    try {
      const results = await withRetry(() => db.select().from(locations));
      return results;
    } catch (error) {
      console.error("Error fetching locations:", error);
      // Fallback to hardcoded locations during DB outage - data preserved in DB
      return [
        {
          id: 1,
          name: "The Capital Grille",
          phone: "(214) 303-0500",
          active: true,
          curbsideRate: 5.00,
          turnInRate: 3.00,
          employeeCommission: 0.60,
          logoUrl: null,
          address: "500 Crescent Ct, Dallas, TX 75201",
          website: null,
          smsPhone: null,
          notificationEmail: null
        },
        {
          id: 2,
          name: "Bob's Steak & Chop House",
          phone: "(214) 528-9446",
          active: true,
          curbsideRate: 8.00,
          turnInRate: 5.00,
          employeeCommission: 0.60,
          logoUrl: null,
          address: "4300 Lemmon Ave, Dallas, TX 75219",
          website: null,
          smsPhone: null,
          notificationEmail: null
        },
        {
          id: 3,
          name: "Truluck's",
          phone: "(214) 220-2401",
          active: true,
          curbsideRate: 12.00,
          turnInRate: 7.00,
          employeeCommission: 0.75,
          logoUrl: null,
          address: "2401 McKinney Ave, Dallas, TX 75201",
          website: null,
          smsPhone: null,
          notificationEmail: null
        },
        {
          id: 4,
          name: "BOA Steakhouse",
          phone: "(214) 219-8283",
          active: true,
          curbsideRate: 10.00,
          turnInRate: 6.00,
          employeeCommission: 0.70,
          logoUrl: null,
          address: "4322 Lemmon Ave, Dallas, TX 75219",
          website: null,
          smsPhone: null,
          notificationEmail: null
        }
      ];
    }
  }

  async getLocation(id: number): Promise<Location | undefined> {
    try {
      const [location] = await db.select().from(locations).where(eq(locations.id, id));
      return location || undefined;
    } catch (error) {
      console.error("Error fetching location:", error);
      return undefined;
    }
  }

  async getLocationByName(name: string): Promise<Location | undefined> {
    try {
      const [location] = await db.select().from(locations).where(eq(locations.name, name));
      return location || undefined;
    } catch (error) {
      console.error("Error fetching location by name:", error);
      return undefined;
    }
  }

  async createLocation(locationData: InsertLocation): Promise<Location> {
    try {
      const [location] = await db.insert(locations).values(locationData).returning();
      return location;
    } catch (error) {
      console.error("Error creating location:", error);
      throw new Error("Failed to create location");
    }
  }

  async updateLocation(id: number, locationData: UpdateLocation): Promise<Location | undefined> {
    try {
      const [updatedLocation] = await db
        .update(locations)
        .set(locationData)
        .where(eq(locations.id, id))
        .returning();
      return updatedLocation || undefined;
    } catch (error) {
      console.error("Error updating location:", error);
      return undefined;
    }
  }

  async deleteLocation(id: number): Promise<boolean> {
    try {
      await db.delete(locations).where(eq(locations.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting location:", error);
      return false;
    }
  }

  // Shift report methods
  async getShiftReports(): Promise<ShiftReport[]> {
    try {
      return await db.select().from(shiftReports).orderBy(desc(shiftReports.createdAt));
    } catch (error) {
      console.error("Error fetching shift reports:", error);
      return [];
    }
  }

  async getShiftReport(id: number): Promise<ShiftReport | undefined> {
    try {
      const [report] = await db.select().from(shiftReports).where(eq(shiftReports.id, id));
      return report || undefined;
    } catch (error) {
      console.error("Error fetching shift report:", error);
      return undefined;
    }
  }

  async getShiftReportsByLocation(locationId: number): Promise<ShiftReport[]> {
    try {
      return await db.select().from(shiftReports)
        .where(eq(shiftReports.locationId, locationId))
        .orderBy(desc(shiftReports.createdAt));
    } catch (error) {
      console.error("Error fetching shift reports by location:", error);
      return [];
    }
  }

  async createShiftReport(reportData: InsertShiftReport): Promise<ShiftReport> {
    try {
      const [report] = await db.insert(shiftReports).values({
        ...reportData,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return report;
    } catch (error) {
      console.error("Error creating shift report:", error);
      throw new Error("Failed to create shift report");
    }
  }

  async updateShiftReport(id: number, reportData: UpdateShiftReport): Promise<ShiftReport | undefined> {
    try {
      const [updatedReport] = await db
        .update(shiftReports)
        .set({
          ...reportData,
          updatedAt: new Date()
        })
        .where(eq(shiftReports.id, id))
        .returning();
      return updatedReport || undefined;
    } catch (error) {
      console.error("Error updating shift report:", error);
      return undefined;
    }
  }

  async deleteShiftReport(id: number): Promise<boolean> {
    try {
      await db.delete(shiftReports).where(eq(shiftReports.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting shift report:", error);
      return false;
    }
  }

  // Ticket distribution methods
  async getTicketDistributions(): Promise<TicketDistribution[]> {
    try {
      return await db.select().from(ticketDistributions).orderBy(desc(ticketDistributions.createdAt));
    } catch (error) {
      console.error("Error fetching ticket distributions:", error);
      return [];
    }
  }

  async getTicketDistribution(id: number): Promise<TicketDistribution | undefined> {
    try {
      const [distribution] = await db.select().from(ticketDistributions).where(eq(ticketDistributions.id, id));
      return distribution || undefined;
    } catch (error) {
      console.error("Error fetching ticket distribution:", error);
      return undefined;
    }
  }

  async getTicketDistributionsByLocation(locationId: number): Promise<TicketDistribution[]> {
    try {
      return await db.select().from(ticketDistributions)
        .where(eq(ticketDistributions.locationId, locationId))
        .orderBy(desc(ticketDistributions.createdAt));
    } catch (error) {
      console.error("Error fetching ticket distributions by location:", error);
      return [];
    }
  }

  async createTicketDistribution(distributionData: InsertTicketDistribution): Promise<TicketDistribution> {
    try {
      const [distribution] = await db.insert(ticketDistributions).values({
        ...distributionData,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return distribution;
    } catch (error) {
      console.error("Error creating ticket distribution:", error);
      throw new Error("Failed to create ticket distribution");
    }
  }

  async updateTicketDistribution(id: number, distributionData: UpdateTicketDistribution): Promise<TicketDistribution | undefined> {
    try {
      const [updatedDistribution] = await db
        .update(ticketDistributions)
        .set({
          ...distributionData,
          updatedAt: new Date()
        })
        .where(eq(ticketDistributions.id, id))
        .returning();
      return updatedDistribution || undefined;
    } catch (error) {
      console.error("Error updating ticket distribution:", error);
      return undefined;
    }
  }

  async deleteTicketDistribution(id: number): Promise<boolean> {
    try {
      await db.delete(ticketDistributions).where(eq(ticketDistributions.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting ticket distribution:", error);
      return false;
    }
  }

  async consumeTickets(locationId: number, ticketsToConsume: number): Promise<boolean> {
    try {
      const distributions = await db.select().from(ticketDistributions)
        .where(eq(ticketDistributions.locationId, locationId));
      
      const availableDistributions = distributions
        .filter(d => d.usedTickets < d.allocatedTickets)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      let remainingToConsume = ticketsToConsume;
      
      for (const distribution of availableDistributions) {
        if (remainingToConsume <= 0) break;
        
        const availableTickets = distribution.allocatedTickets - distribution.usedTickets;
        const toConsume = Math.min(availableTickets, remainingToConsume);
        
        await db.update(ticketDistributions)
          .set({
            usedTickets: distribution.usedTickets + toConsume,
            updatedAt: new Date()
          })
          .where(eq(ticketDistributions.id, distribution.id));
        
        remainingToConsume -= toConsume;
      }
      
      return remainingToConsume === 0;
    } catch (error) {
      console.error("Error consuming tickets:", error);
      return false;
    }
  }

  // Employee tax payment methods
  async getEmployeeTaxPayments(): Promise<EmployeeTaxPayment[]> {
    try {
      return await db.select().from(employeeTaxPayments).orderBy(desc(employeeTaxPayments.createdAt));
    } catch (error) {
      console.error("Error fetching employee tax payments:", error);
      return [];
    }
  }

  async getEmployeeTaxPayment(id: number): Promise<EmployeeTaxPayment | undefined> {
    try {
      const [payment] = await db.select().from(employeeTaxPayments).where(eq(employeeTaxPayments.id, id));
      return payment || undefined;
    } catch (error) {
      console.error("Error fetching employee tax payment:", error);
      return undefined;
    }
  }

  async getEmployeeTaxPaymentsByEmployee(employeeId: number): Promise<EmployeeTaxPayment[]> {
    try {
      return await db.select().from(employeeTaxPayments)
        .where(eq(employeeTaxPayments.employeeId, employeeId))
        .orderBy(desc(employeeTaxPayments.createdAt));
    } catch (error) {
      console.error("Error fetching employee tax payments by employee:", error);
      return [];
    }
  }

  async getEmployeeTaxPaymentsByReport(reportId: number): Promise<EmployeeTaxPayment[]> {
    try {
      return await db.select().from(employeeTaxPayments)
        .where(eq(employeeTaxPayments.reportId, reportId))
        .orderBy(desc(employeeTaxPayments.createdAt));
    } catch (error) {
      console.error("Error fetching employee tax payments by report:", error);
      return [];
    }
  }

  async createEmployeeTaxPayment(paymentData: InsertEmployeeTaxPayment): Promise<EmployeeTaxPayment> {
    try {
      const [payment] = await db.insert(employeeTaxPayments).values(paymentData).returning();
      return payment;
    } catch (error) {
      console.error("Error creating employee tax payment:", error);
      throw new Error("Failed to create employee tax payment");
    }
  }

  async updateEmployeeTaxPayment(id: number, paymentData: UpdateEmployeeTaxPayment): Promise<EmployeeTaxPayment | undefined> {
    try {
      const [updatedPayment] = await db
        .update(employeeTaxPayments)
        .set(paymentData)
        .where(eq(employeeTaxPayments.id, id))
        .returning();
      return updatedPayment || undefined;
    } catch (error) {
      console.error("Error updating employee tax payment:", error);
      return undefined;
    }
  }

  async deleteEmployeeTaxPayment(id: number): Promise<boolean> {
    try {
      await db.delete(employeeTaxPayments).where(eq(employeeTaxPayments.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting employee tax payment:", error);
      return false;
    }
  }

  // Incident report methods
  async getIncidentReports(): Promise<IncidentReport[]> {
    try {
      return await db.select().from(incidentReports).orderBy(desc(incidentReports.submittedAt));
    } catch (error) {
      console.error("Error fetching incident reports:", error);
      return [];
    }
  }

  async getIncidentReport(id: number): Promise<IncidentReport | undefined> {
    try {
      const [report] = await db.select().from(incidentReports).where(eq(incidentReports.id, id));
      return report || undefined;
    } catch (error) {
      console.error("Error fetching incident report:", error);
      return undefined;
    }
  }

  async createIncidentReport(reportData: InsertIncidentReport): Promise<IncidentReport> {
    try {
      const [report] = await db.insert(incidentReports).values({
        ...reportData,
        submittedAt: new Date()
      }).returning();
      return report;
    } catch (error) {
      console.error("Error creating incident report:", error);
      throw new Error("Failed to create incident report");
    }
  }

  async updateIncidentReport(id: number, reportData: Partial<IncidentReport>): Promise<IncidentReport | undefined> {
    try {
      const [updatedReport] = await db
        .update(incidentReports)
        .set(reportData)
        .where(eq(incidentReports.id, id))
        .returning();
      return updatedReport || undefined;
    } catch (error) {
      console.error("Error updating incident report:", error);
      return undefined;
    }
  }

  async deleteIncidentReport(id: number): Promise<boolean> {
    try {
      await db.delete(incidentReports).where(eq(incidentReports.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting incident report:", error);
      return false;
    }
  }

  // Permit methods
  async getPermits(): Promise<Permit[]> {
    try {
      return await db.select().from(permits).orderBy(desc(permits.createdAt));
    } catch (error) {
      console.error("Error getting permits:", error);
      return [];
    }
  }

  async getPermit(id: number): Promise<Permit | undefined> {
    try {
      const [permit] = await db.select().from(permits).where(eq(permits.id, id));
      return permit || undefined;
    } catch (error) {
      console.error("Error getting permit:", error);
      return undefined;
    }
  }

  async createPermit(permitData: InsertPermit): Promise<Permit> {
    try {
      const [permit] = await db.insert(permits).values({
        ...permitData,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return permit;
    } catch (error) {
      console.error("Error creating permit:", error);
      throw new Error("Failed to create permit");
    }
  }

  async updatePermit(id: number, permitData: UpdatePermit): Promise<Permit | undefined> {
    try {
      const [updatedPermit] = await db
        .update(permits)
        .set({
          ...permitData,
          updatedAt: new Date()
        })
        .where(eq(permits.id, id))
        .returning();
      return updatedPermit || undefined;
    } catch (error) {
      console.error("Error updating permit:", error);
      throw new Error("Failed to update permit");
    }
  }

  async deletePermit(id: number): Promise<boolean> {
    try {
      await db.delete(permits).where(eq(permits.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting permit:", error);
      return false;
    }
  }

  // Training acknowledgment methods
  async getTrainingAcknowledgments(): Promise<TrainingAcknowledgment[]> {
    try {
      return await db.select().from(trainingAcknowledgments).orderBy(desc(trainingAcknowledgments.createdAt));
    } catch (error) {
      console.error("Error getting training acknowledgments:", error);
      return [];
    }
  }

  async getTrainingAcknowledgment(id: number): Promise<TrainingAcknowledgment | undefined> {
    try {
      const [acknowledgment] = await db.select().from(trainingAcknowledgments).where(eq(trainingAcknowledgments.id, id));
      return acknowledgment || undefined;
    } catch (error) {
      console.error("Error getting training acknowledgment by ID:", error);
      return undefined;
    }
  }

  async createTrainingAcknowledgment(acknowledgmentData: InsertTrainingAcknowledgment): Promise<TrainingAcknowledgment> {
    try {
      const [acknowledgment] = await db
        .insert(trainingAcknowledgments)
        .values(acknowledgmentData)
        .returning();
      return acknowledgment;
    } catch (error) {
      console.error("Error creating training acknowledgment:", error);
      throw new Error("Failed to create training acknowledgment");
    }
  }

  // Help request methods
  async getActiveHelpRequests(): Promise<HelpRequest[]> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
      
      // First, auto-expire any active requests older than 1 hour
      await db
        .update(helpRequests)
        .set({ 
          status: 'expired',
          resolvedAt: now,
          autoRemoveAt: now
        })
        .where(
          and(
            eq(helpRequests.status, "active"),
            lt(helpRequests.requestedAt, oneHourAgo)
          )
        );
      
      // Then return only truly active requests
      return await db
        .select()
        .from(helpRequests)
        .where(
          or(
            and(
              eq(helpRequests.status, "active"),
              gte(helpRequests.requestedAt, oneHourAgo) // Only requests from last hour
            ),
            and(
              eq(helpRequests.status, "completed"),
              gt(helpRequests.autoRemoveAt, now)
            )
          )
        )
        .orderBy(desc(helpRequests.requestedAt));
    } catch (error) {
      console.error("Error getting active help requests:", error);
      return [];
    }
  }

  async getHelpRequest(id: number): Promise<HelpRequest | undefined> {
    try {
      const [request] = await db.select().from(helpRequests).where(eq(helpRequests.id, id));
      return request || undefined;
    } catch (error) {
      console.error("Error getting help request:", error);
      return undefined;
    }
  }

  async createHelpRequest(requestData: InsertHelpRequest): Promise<HelpRequest> {
    try {
      const [request] = await db
        .insert(helpRequests)
        .values(requestData)
        .returning();
      return request;
    } catch (error) {
      console.error("Error creating help request:", error);
      throw new Error("Failed to create help request");
    }
  }

  async markHelpRequestFulfilled(id: number): Promise<boolean> {
    try {
      await db
        .update(helpRequests)
        .set({ 
          status: "fulfilled",
          resolvedAt: new Date()
        })
        .where(eq(helpRequests.id, id));
      return true;
    } catch (error) {
      console.error("Error marking help request as fulfilled:", error);
      return false;
    }
  }

  async getHelpResponses(helpRequestId: number): Promise<HelpResponse[]> {
    try {
      return await db
        .select()
        .from(helpResponses)
        .where(eq(helpResponses.helpRequestId, helpRequestId))
        .orderBy(desc(helpResponses.respondedAt));
    } catch (error) {
      console.error("Error getting help responses:", error);
      return [];
    }
  }

  async createHelpResponse(responseData: InsertHelpResponse): Promise<HelpResponse> {
    try {
      const [response] = await db
        .insert(helpResponses)
        .values(responseData)
        .returning();
      return response;
    } catch (error) {
      console.error("Error creating help response:", error);
      throw new Error("Failed to create help response");
    }
  }

  async getAllRecentHelpResponses(): Promise<HelpResponse[]> {
    try {
      // Get responses from the last 30 minutes for notifications
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      return await db
        .select()
        .from(helpResponses)
        .where(gte(helpResponses.respondedAt, thirtyMinutesAgo))
        .orderBy(desc(helpResponses.respondedAt));
    } catch (error) {
      console.error("Error getting recent help responses:", error);
      return [];
    }
  }

  async markHelpResponsesCompleted(helpRequestId: number): Promise<boolean> {
    try {
      const result = await db
        .update(helpResponses)
        .set({ 
          status: 'completed',
          completedAt: new Date()
        })
        .where(eq(helpResponses.helpRequestId, helpRequestId))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Error marking help responses as completed:", error);
      return false;
    }
  }

  async markHelpRequestCompleted(id: number): Promise<boolean> {
    try {
      const now = new Date();
      const autoRemoveTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
      
      // Mark the help request as completed
      await db
        .update(helpRequests)
        .set({ 
          status: "completed",
          completedAt: now,
          autoRemoveAt: autoRemoveTime
        })
        .where(eq(helpRequests.id, id));
      
      // Also mark all help responses as completed
      await this.markHelpResponsesCompleted(id);
      
      return true;
    } catch (error) {
      console.error("Error marking help request as completed:", error);
      return false;
    }
  }

  // Cover count report methods
  async getTodaysCoverCountReports(): Promise<CoverCountReport[]> {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const reports = await db
        .select()
        .from(coverCountReports)
        .where(eq(coverCountReports.reportDate, today))
        .orderBy(coverCountReports.submittedAt);
      return reports;
    } catch (error) {
      console.error("Error fetching today's cover count reports:", error);
      return [];
    }
  }

  async getCoverCountReport(locationId: number, reportDate: string): Promise<CoverCountReport | undefined> {
    try {
      const [report] = await db
        .select()
        .from(coverCountReports)
        .where(and(
          eq(coverCountReports.locationId, locationId),
          eq(coverCountReports.reportDate, reportDate)
        ));
      return report || undefined;
    } catch (error) {
      console.error("Error fetching cover count report:", error);
      return undefined;
    }
  }

  async createCoverCountReport(reportData: InsertCoverCountReport): Promise<CoverCountReport> {
    try {
      const [report] = await db
        .insert(coverCountReports)
        .values(reportData)
        .returning();
      return report;
    } catch (error) {
      console.error("Error creating cover count report:", error);
      throw new Error("Failed to create cover count report");
    }
  }

  async updateCoverCountReport(id: number, reportData: Partial<CoverCountReport>): Promise<CoverCountReport | undefined> {
    try {
      const [updatedReport] = await db
        .update(coverCountReports)
        .set(reportData)
        .where(eq(coverCountReports.id, id))
        .returning();
      return updatedReport || undefined;
    } catch (error) {
      console.error("Error updating cover count report:", error);
      return undefined;
    }
  }

  // Push notification methods
  async getPushSubscriptions(): Promise<PushSubscription[]> {
    try {
      const subscriptions = await db
        .select()
        .from(pushSubscriptions)
        .orderBy(pushSubscriptions.createdAt);
      return subscriptions;
    } catch (error) {
      console.error("Error fetching push subscriptions:", error);
      return [];
    }
  }

  async getActivePushSubscriptions(): Promise<PushSubscription[]> {
    try {
      const subscriptions = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.isActive, true))
        .orderBy(pushSubscriptions.createdAt);
      return subscriptions;
    } catch (error) {
      console.error("Error fetching active push subscriptions:", error);
      return [];
    }
  }

  async createPushSubscription(subscriptionData: InsertPushSubscription): Promise<PushSubscription> {
    try {
      const [subscription] = await db
        .insert(pushSubscriptions)
        .values(subscriptionData)
        .returning();
      return subscription;
    } catch (error) {
      console.error("Error creating push subscription:", error);
      throw new Error("Failed to create push subscription");
    }
  }

  async updatePushSubscription(id: number, data: Partial<PushSubscription>): Promise<PushSubscription | undefined> {
    try {
      const [updatedSubscription] = await db
        .update(pushSubscriptions)
        .set(data)
        .where(eq(pushSubscriptions.id, id))
        .returning();
      return updatedSubscription || undefined;
    } catch (error) {
      console.error("Error updating push subscription:", error);
      return undefined;
    }
  }

  async deletePushSubscription(endpoint: string): Promise<boolean> {
    try {
      await db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, endpoint));
      return true;
    } catch (error) {
      console.error("Error deleting push subscription:", error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();