import { 
  users, type User, type InsertUser, 
  employees, type Employee, type InsertEmployee, type UpdateEmployee,
  locations, type Location, type InsertLocation, type UpdateLocation,
  shiftReports, type ShiftReport, type InsertShiftReport, type UpdateShiftReport,
  ticketDistributions, type TicketDistribution, type InsertTicketDistribution, type UpdateTicketDistribution,
  employeeTaxPayments, type EmployeeTaxPayment, type InsertEmployeeTaxPayment, type UpdateEmployeeTaxPayment,
  incidentReports, type IncidentReport, type InsertIncidentReport,
  permits, type Permit, type InsertPermit, type UpdatePermit,
  trainingAcknowledgments, type TrainingAcknowledgment, type InsertTrainingAcknowledgment,
  LOCATIONS
} from "@shared/schema";
import { db, withRetry } from "./db";
import { eq, desc } from "drizzle-orm";
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
      return await withRetry(() => db.select().from(employees).orderBy(employees.fullName));
    } catch (error) {
      console.error("Error fetching employees:", error);
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
      // First delete all related tax payment records
      await db.delete(employeeTaxPayments).where(eq(employeeTaxPayments.employeeId, id));
      
      // Then delete the employee record
      await db.delete(employees).where(eq(employees.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting employee:", error);
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
          website: null
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
          website: null
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
          website: null
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
          website: null
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
}

export const storage = new DatabaseStorage();