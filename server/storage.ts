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

// Extend interface with CRUD methods
export interface IStorage {
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
  
  // Employee Tax Payment methods
  getEmployeeTaxPayments(): Promise<EmployeeTaxPayment[]>;
  getEmployeeTaxPayment(id: number): Promise<EmployeeTaxPayment | undefined>;
  getEmployeeTaxPaymentsByEmployee(employeeId: number): Promise<EmployeeTaxPayment[]>;
  getEmployeeTaxPaymentsByReport(reportId: number): Promise<EmployeeTaxPayment[]>;
  createEmployeeTaxPayment(payment: InsertEmployeeTaxPayment): Promise<EmployeeTaxPayment>;
  updateEmployeeTaxPayment(id: number, payment: UpdateEmployeeTaxPayment): Promise<EmployeeTaxPayment | undefined>;
  deleteEmployeeTaxPayment(id: number): Promise<boolean>;
  
  // Incident Report methods
  getIncidentReports(): Promise<IncidentReport[]>;
  getIncidentReport(id: number): Promise<IncidentReport | undefined>;
  createIncidentReport(report: InsertIncidentReport): Promise<IncidentReport>;
  deleteIncidentReport(id: number): Promise<boolean>;
  
  // Permits methods
  getPermits(): Promise<Permit[]>;
  getPermit(id: number): Promise<Permit | undefined>;
  createPermit(permit: InsertPermit): Promise<Permit>;
  updatePermit(id: number, permit: UpdatePermit): Promise<Permit | undefined>;
  deletePermit(id: number): Promise<boolean>;
  
  // Training Acknowledgment methods
  getTrainingAcknowledgments(): Promise<TrainingAcknowledgment[]>;
  getTrainingAcknowledgment(id: number): Promise<TrainingAcknowledgment | undefined>;
  createTrainingAcknowledgment(acknowledgment: InsertTrainingAcknowledgment): Promise<TrainingAcknowledgment>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private employees: Map<number, Employee>;
  private locations: Map<number, Location>;
  private shiftReports: Map<number, ShiftReport>;
  private ticketDistributions: Map<number, TicketDistribution>;
  private employeeTaxPayments: Map<number, EmployeeTaxPayment>;
  private incidentReports: Map<number, IncidentReport>;
  private permits: Map<number, Permit>;
  private trainingAcknowledgments: Map<number, TrainingAcknowledgment>;
  private userCurrentId: number;
  private employeeCurrentId: number;
  private locationCurrentId: number;
  private shiftReportCurrentId: number;
  private ticketDistributionCurrentId: number;
  private employeeTaxPaymentCurrentId: number;
  private incidentReportCurrentId: number;
  private permitCurrentId: number;
  private trainingAcknowledgmentCurrentId: number;

  constructor() {
    this.users = new Map();
    this.employees = new Map();
    this.locations = new Map();
    this.shiftReports = new Map();
    this.ticketDistributions = new Map();
    this.employeeTaxPayments = new Map();
    this.incidentReports = new Map();
    this.permits = new Map();
    this.trainingAcknowledgments = new Map();
    this.userCurrentId = 1;
    this.employeeCurrentId = 1;
    this.locationCurrentId = 1;
    this.shiftReportCurrentId = 1;
    this.ticketDistributionCurrentId = 1;
    this.employeeTaxPaymentCurrentId = 1;
    this.incidentReportCurrentId = 1;
    this.permitCurrentId = 1;
    this.trainingAcknowledgmentCurrentId = 1;
    
    // Initialize with default locations
    this.initializeLocations();
    
    // Initialize with employees from constants
    this.initializeEmployees();
  }

  private initializeLocations() {
    const defaultLocations: InsertLocation[] = [
      { name: LOCATIONS.CAPITAL_GRILLE, active: true },
      { name: LOCATIONS.BOBS_STEAK, active: true },
      { name: LOCATIONS.TRULUCKS, active: true },
      { name: LOCATIONS.BOA_STEAKHOUSE, active: true },
    ];
    
    defaultLocations.forEach(loc => {
      this.createLocation(loc);
    });
  }
  
  private initializeEmployees() {
    // Import the employee name mapping from lib constants
    const { EMPLOYEE_NAMES } = require("../client/src/lib/constants");
    
    // Convert the existing employee names to the new employee format
    Object.entries(EMPLOYEE_NAMES).forEach(([key, fullName]) => {
      // Set some employees as shift leaders
      const isShiftLeader = ["brett", "dave", "riley", "jonathan"].includes(key);
      
      const employee: InsertEmployee = {
        key,
        fullName: fullName as string,
        isActive: true,
        isShiftLeader,
        hireDate: new Date().toISOString()
      };
      
      this.createEmployee(employee);
    });
  }
  
  // Employee methods
  async getEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values());
  }
  
  async getEmployee(id: number): Promise<Employee | undefined> {
    return this.employees.get(id);
  }
  
  async getEmployeeByKey(key: string): Promise<Employee | undefined> {
    return Array.from(this.employees.values()).find(emp => emp.key === key);
  }
  
  async getActiveEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values()).filter(emp => emp.isActive);
  }
  
  async getShiftLeaders(): Promise<Employee[]> {
    return Array.from(this.employees.values()).filter(emp => emp.isShiftLeader && emp.isActive);
  }
  
  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const id = this.employeeCurrentId++;
    const now = new Date();
    
    const newEmployee: Employee = {
      id,
      key: employee.key,
      fullName: employee.fullName,
      isActive: employee.isActive,
      isShiftLeader: employee.isShiftLeader,
      hireDate: employee.hireDate ? new Date(employee.hireDate) : now,
      terminationDate: null,
      phone: employee.phone || null,
      email: employee.email || null,
      notes: employee.notes || null,
      createdAt: now,
      updatedAt: null
    };
    
    this.employees.set(id, newEmployee);
    return newEmployee;
  }
  
  async updateEmployee(id: number, employeeUpdate: UpdateEmployee): Promise<Employee | undefined> {
    const employee = this.employees.get(id);
    if (!employee) return undefined;
    
    const updatedEmployee: Employee = {
      ...employee,
      ...employeeUpdate,
      updatedAt: new Date(),
      hireDate: employeeUpdate.hireDate ? new Date(employeeUpdate.hireDate) : employee.hireDate,
      terminationDate: employeeUpdate.terminationDate ? new Date(employeeUpdate.terminationDate) : employee.terminationDate,
      phone: employeeUpdate.phone || null,
      email: employeeUpdate.email || null,
      notes: employeeUpdate.notes || null
    };
    
    this.employees.set(id, updatedEmployee);
    return updatedEmployee;
  }
  
  async deleteEmployee(id: number): Promise<boolean> {
    if (!this.employees.has(id)) return false;
    this.employees.delete(id);
    return true;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Location methods
  async getLocations(): Promise<Location[]> {
    return Array.from(this.locations.values());
  }
  
  async getLocation(id: number): Promise<Location | undefined> {
    return this.locations.get(id);
  }
  
  async getLocationByName(name: string): Promise<Location | undefined> {
    return Array.from(this.locations.values()).find(
      (location) => location.name === name
    );
  }
  
  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const id = this.locationCurrentId++;
    const location: Location = { 
      ...insertLocation, 
      id,
      active: insertLocation.active ?? true,
      curbsideRate: insertLocation.curbsideRate ?? 15,
      turnInRate: insertLocation.turnInRate ?? 11,
      employeeCommission: insertLocation.employeeCommission ?? 4
    };
    this.locations.set(id, location);
    return location;
  }

  async updateLocation(id: number, locationUpdate: UpdateLocation): Promise<Location | undefined> {
    const location = this.locations.get(id);
    if (!location) {
      return undefined;
    }
    
    const updatedLocation: Location = {
      ...location,
      ...locationUpdate
    };
    this.locations.set(id, updatedLocation);
    return updatedLocation;
  }

  async deleteLocation(id: number): Promise<boolean> {
    return this.locations.delete(id);
  }
  
  // Shift report methods
  async getShiftReports(): Promise<ShiftReport[]> {
    return Array.from(this.shiftReports.values())
      .sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }
  
  async getShiftReport(id: number): Promise<ShiftReport | undefined> {
    return this.shiftReports.get(id);
  }
  
  async getShiftReportsByLocation(locationId: number): Promise<ShiftReport[]> {
    return Array.from(this.shiftReports.values())
      .filter(report => report.locationId === locationId)
      .sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }
  
  async createShiftReport(insertReport: InsertShiftReport): Promise<ShiftReport> {
    const id = this.shiftReportCurrentId++;
    const now = new Date();
    const report: ShiftReport = { 
      ...insertReport, 
      id, 
      createdAt: now,
      updatedAt: now,
      notes: insertReport.notes || null,
      incidents: insertReport.incidents || null
    };
    this.shiftReports.set(id, report);
    return report;
  }
  
  async updateShiftReport(id: number, updateReport: UpdateShiftReport): Promise<ShiftReport | undefined> {
    const report = this.shiftReports.get(id);
    if (!report) {
      return undefined;
    }
    
    const updatedReport: ShiftReport = {
      ...report,
      ...updateReport,
      notes: updateReport.notes || report.notes || null,
      incidents: updateReport.incidents || report.incidents || null,
      updatedAt: new Date()
    };
    
    this.shiftReports.set(id, updatedReport);
    return updatedReport;
  }
  
  async deleteShiftReport(id: number): Promise<boolean> {
    return this.shiftReports.delete(id);
  }
  
  // Ticket distribution methods
  async getTicketDistributions(): Promise<TicketDistribution[]> {
    return Array.from(this.ticketDistributions.values()).sort((a, b) => b.id - a.id);
  }
  
  async getTicketDistribution(id: number): Promise<TicketDistribution | undefined> {
    return this.ticketDistributions.get(id);
  }
  
  async getTicketDistributionsByLocation(locationId: number): Promise<TicketDistribution[]> {
    return Array.from(this.ticketDistributions.values())
      .filter(distribution => distribution.locationId === locationId)
      .sort((a, b) => b.id - a.id);
  }
  
  async createTicketDistribution(insertDistribution: InsertTicketDistribution): Promise<TicketDistribution> {
    const id = this.ticketDistributionCurrentId++;
    const createdAt = new Date();
    
    const distribution: TicketDistribution = { 
      id,
      ...insertDistribution,
      usedTickets: 0,
      createdAt,
      updatedAt: null
    };
    
    this.ticketDistributions.set(id, distribution);
    return distribution;
  }
  
  async updateTicketDistribution(id: number, updateDistribution: UpdateTicketDistribution): Promise<TicketDistribution | undefined> {
    const existingDistribution = this.ticketDistributions.get(id);
    if (!existingDistribution) return undefined;
    
    const updatedDistribution: TicketDistribution = {
      ...existingDistribution,
      ...updateDistribution,
      updatedAt: new Date()
    };
    
    this.ticketDistributions.set(id, updatedDistribution);
    return updatedDistribution;
  }
  
  async deleteTicketDistribution(id: number): Promise<boolean> {
    return this.ticketDistributions.delete(id);
  }
  
  // Employee Tax Payment methods
  async getEmployeeTaxPayments(): Promise<EmployeeTaxPayment[]> {
    return Array.from(this.employeeTaxPayments.values());
  }
  
  async getEmployeeTaxPayment(id: number): Promise<EmployeeTaxPayment | undefined> {
    return this.employeeTaxPayments.get(id);
  }
  
  async getEmployeeTaxPaymentsByEmployee(employeeId: number): Promise<EmployeeTaxPayment[]> {
    return Array.from(this.employeeTaxPayments.values())
      .filter(payment => payment.employeeId === employeeId);
  }
  
  async getEmployeeTaxPaymentsByReport(reportId: number): Promise<EmployeeTaxPayment[]> {
    return Array.from(this.employeeTaxPayments.values())
      .filter(payment => payment.reportId === reportId);
  }
  
  async createEmployeeTaxPayment(payment: InsertEmployeeTaxPayment): Promise<EmployeeTaxPayment> {
    const id = this.employeeTaxPaymentCurrentId++;
    const newPayment: EmployeeTaxPayment = {
      ...payment,
      id,
      createdAt: new Date()
    };
    this.employeeTaxPayments.set(id, newPayment);
    return newPayment;
  }
  
  async updateEmployeeTaxPayment(id: number, payment: UpdateEmployeeTaxPayment): Promise<EmployeeTaxPayment | undefined> {
    const existingPayment = this.employeeTaxPayments.get(id);
    if (!existingPayment) return undefined;
    
    const updatedPayment: EmployeeTaxPayment = {
      ...existingPayment,
      ...payment
    };
    
    this.employeeTaxPayments.set(id, updatedPayment);
    return updatedPayment;
  }
  
  async deleteEmployeeTaxPayment(id: number): Promise<boolean> {
    return this.employeeTaxPayments.delete(id);
  }

  // Incident Report methods
  async getIncidentReports(): Promise<IncidentReport[]> {
    return Array.from(this.incidentReports.values());
  }

  async getIncidentReport(id: number): Promise<IncidentReport | undefined> {
    return this.incidentReports.get(id);
  }

  async createIncidentReport(insertReport: InsertIncidentReport): Promise<IncidentReport> {
    const id = this.incidentReportCurrentId++;
    const report: IncidentReport = {
      ...insertReport,
      id,
      submittedAt: new Date(),
    };
    
    this.incidentReports.set(id, report);
    return report;
  }

  async deleteIncidentReport(id: number): Promise<boolean> {
    return this.incidentReports.delete(id);
  }

  // Permits methods for MemStorage
  async getPermits(): Promise<Permit[]> {
    return Array.from(this.permits.values());
  }

  async getPermit(id: number): Promise<Permit | undefined> {
    return this.permits.get(id);
  }

  async createPermit(permit: InsertPermit): Promise<Permit> {
    const id = ++this.permitCurrentId;
    const newPermit: Permit = {
      ...permit,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.permits.set(id, newPermit);
    return newPermit;
  }

  async updatePermit(id: number, permitUpdate: UpdatePermit): Promise<Permit | undefined> {
    const existing = this.permits.get(id);
    if (!existing) return undefined;
    
    const updatedPermit: Permit = {
      ...existing,
      ...permitUpdate,
      updatedAt: new Date(),
    };
    this.permits.set(id, updatedPermit);
    return updatedPermit;
  }

  async deletePermit(id: number): Promise<boolean> {
    return this.permits.delete(id);
  }

  // Training Acknowledgment methods
  async getTrainingAcknowledgments(): Promise<TrainingAcknowledgment[]> {
    return Array.from(this.trainingAcknowledgments.values());
  }

  async getTrainingAcknowledgment(id: number): Promise<TrainingAcknowledgment | undefined> {
    return this.trainingAcknowledgments.get(id);
  }

  async createTrainingAcknowledgment(acknowledgmentData: InsertTrainingAcknowledgment): Promise<TrainingAcknowledgment> {
    const id = this.trainingAcknowledgmentCurrentId++;
    const acknowledgment: TrainingAcknowledgment = {
      id,
      ...acknowledgmentData,
      createdAt: new Date(),
    };
    this.trainingAcknowledgments.set(id, acknowledgment);
    return acknowledgment;
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // Tax Payment Methods
  async getEmployeeTaxPayments(): Promise<EmployeeTaxPayment[]> {
    try {
      return await db.select().from(employeeTaxPayments).orderBy(desc(employeeTaxPayments.createdAt));
    } catch (error) {
      console.error("Error getting employee tax payments:", error);
      return [];
    }
  }

  async getEmployeeTaxPayment(id: number): Promise<EmployeeTaxPayment | undefined> {
    try {
      const [payment] = await db.select().from(employeeTaxPayments).where(eq(employeeTaxPayments.id, id));
      return payment;
    } catch (error) {
      console.error("Error getting employee tax payment by ID:", error);
      return undefined;
    }
  }

  async getEmployeeTaxPaymentsByEmployee(employeeId: number): Promise<EmployeeTaxPayment[]> {
    try {
      return await db.select().from(employeeTaxPayments)
        .where(eq(employeeTaxPayments.employeeId, employeeId))
        .orderBy(desc(employeeTaxPayments.createdAt));
    } catch (error) {
      console.error("Error getting employee tax payments by employee ID:", error);
      return [];
    }
  }

  async getEmployeeTaxPaymentsByReport(reportId: number): Promise<EmployeeTaxPayment[]> {
    try {
      return await db.select().from(employeeTaxPayments)
        .where(eq(employeeTaxPayments.reportId, reportId))
        .orderBy(desc(employeeTaxPayments.createdAt));
    } catch (error) {
      console.error("Error getting employee tax payments by report ID:", error);
      return [];
    }
  }

  async createEmployeeTaxPayment(payment: InsertEmployeeTaxPayment): Promise<EmployeeTaxPayment> {
    try {
      const [createdPayment] = await db.insert(employeeTaxPayments).values(payment).returning();
      return createdPayment;
    } catch (error) {
      console.error("Error creating employee tax payment:", error);
      throw new Error("Failed to create employee tax payment");
    }
  }

  async updateEmployeeTaxPayment(id: number, payment: UpdateEmployeeTaxPayment): Promise<EmployeeTaxPayment | undefined> {
    try {
      const [updatedPayment] = await db.update(employeeTaxPayments)
        .set(payment)
        .where(eq(employeeTaxPayments.id, id))
        .returning();
      return updatedPayment;
    } catch (error) {
      console.error("Error updating employee tax payment:", error);
      return undefined;
    }
  }

  async deleteEmployeeTaxPayment(id: number): Promise<boolean> {
    try {
      const [deletedPayment] = await db.delete(employeeTaxPayments)
        .where(eq(employeeTaxPayments.id, id))
        .returning();
      return !!deletedPayment;
    } catch (error) {
      console.error("Error deleting employee tax payment:", error);
      return false;
    }
  }
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
  
  // Employee methods
  async getEmployees(): Promise<Employee[]> {
    try {
      const employeesList = await db.select().from(employees).orderBy(employees.fullName);
      return employeesList;
    } catch (error) {
      console.error("Error fetching employees:", error);
      return []; // Return empty array instead of throwing
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
      const activeEmployees = await db.select()
        .from(employees)
        .where(eq(employees.isActive, true));
      return activeEmployees;
    } catch (error) {
      console.error("Error fetching active employees:", error);
      return [];
    }
  }
  
  async getShiftLeaders(): Promise<Employee[]> {
    try {
      const results = await db.select()
        .from(employees)
        .where(eq(employees.isShiftLeader, true));
      return results;
    } catch (error) {
      console.error("Error fetching shift leaders:", error);
      return [];
    }
  }
  
  async createEmployee(employeeData: InsertEmployee): Promise<Employee> {
    try {
      // Basic validation
      if (!employeeData.key || !employeeData.fullName) {
        throw new Error("Employee key and full name are required");
      }

      // Set defaults for optional values
      const data = {
        key: employeeData.key,
        fullName: employeeData.fullName,
        isActive: employeeData.isActive === undefined ? true : employeeData.isActive,
        isShiftLeader: employeeData.isShiftLeader === undefined ? false : employeeData.isShiftLeader,
        hireDate: employeeData.hireDate ? new Date(employeeData.hireDate) : new Date(),
        phone: employeeData.phone || null,
        email: employeeData.email || null,
        notes: employeeData.notes || null
      };
      
      // Insert and return new employee
      const [employee] = await db.insert(employees).values(data).returning();
      return employee;
    } catch (error: any) {
      console.error("Error creating employee:", error);
      // Make error message more user-friendly
      if (error.message?.includes('duplicate key')) {
        throw new Error("An employee with this key already exists");
      }
      throw new Error(`Failed to create employee: ${error.message || "Unknown error"}`);
    }
  }
  
  async updateEmployee(id: number, employeeData: UpdateEmployee): Promise<Employee | undefined> {
    try {
      // Process dates and ensure proper formats
      const updateData = {
        ...employeeData,
        isActive: employeeData.isActive ?? undefined,
        isShiftLeader: employeeData.isShiftLeader ?? undefined,
        hireDate: employeeData.hireDate ? new Date(employeeData.hireDate) : undefined,
        terminationDate: employeeData.terminationDate ? new Date(employeeData.terminationDate) : null,
        phone: employeeData.phone || null,
        email: employeeData.email || null,
        notes: employeeData.notes || null,
        updatedAt: new Date()
      };
      
      const [employee] = await db.update(employees)
        .set(updateData)
        .where(eq(employees.id, id))
        .returning();
      
      return employee || undefined;
    } catch (error) {
      console.error("Error updating employee:", error);
      throw new Error(`Failed to update employee: ${error.message || "Unknown error"}`);
    }
  }
  
  async deleteEmployee(id: number): Promise<boolean> {
    try {
      const result = await db.delete(employees).where(eq(employees.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting employee:", error);
      throw new Error(`Failed to delete employee: ${error.message || "Unknown error"}`);
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user || undefined;
    } catch (error) {
      console.error("Error fetching user by username:", error);
      throw new Error("Failed to fetch user by username");
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values(insertUser)
        .returning();
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw new Error("Failed to create user");
    }
  }
  
  async getLocations(): Promise<Location[]> {
    try {
      return await db.select().from(locations);
    } catch (error) {
      console.error("Error fetching locations:", error);
      throw new Error("Failed to fetch locations");
    }
  }
  
  async getLocation(id: number): Promise<Location | undefined> {
    try {
      const [location] = await db.select().from(locations).where(eq(locations.id, id));
      return location || undefined;
    } catch (error) {
      console.error("Error fetching location:", error);
      throw new Error("Failed to fetch location");
    }
  }
  
  async getLocationByName(name: string): Promise<Location | undefined> {
    try {
      const [location] = await db.select().from(locations).where(eq(locations.name, name));
      return location || undefined;
    } catch (error) {
      console.error("Error fetching location by name:", error);
      throw new Error("Failed to fetch location by name");
    }
  }
  
  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    try {
      const [location] = await db
        .insert(locations)
        .values(insertLocation)
        .returning();
      return location;
    } catch (error) {
      console.error("Error creating location:", error);
      throw new Error("Failed to create location");
    }
  }

  async updateLocation(id: number, locationData: UpdateLocation): Promise<Location | undefined> {
    try {
      const [location] = await db
        .update(locations)
        .set(locationData)
        .where(eq(locations.id, id))
        .returning();
      return location || undefined;
    } catch (error) {
      console.error("Error updating location:", error);
      throw new Error("Failed to update location");
    }
  }

  async deleteLocation(id: number): Promise<boolean> {
    try {
      const result = await db.delete(locations).where(eq(locations.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting location:", error);
      throw new Error("Failed to delete location");
    }
  }
  
  async getShiftReports(): Promise<ShiftReport[]> {
    try {
      return await db.select().from(shiftReports).orderBy(desc(shiftReports.createdAt));
    } catch (error) {
      console.error("Error fetching shift reports:", error);
      throw new Error("Failed to fetch shift reports");
    }
  }
  
  async getShiftReport(id: number): Promise<ShiftReport | undefined> {
    try {
      const [report] = await db.select().from(shiftReports).where(eq(shiftReports.id, id));
      return report || undefined;
    } catch (error) {
      console.error("Error fetching shift report:", error);
      throw new Error("Failed to fetch shift report");
    }
  }
  
  async getShiftReportsByLocation(locationId: number): Promise<ShiftReport[]> {
    try {
      return await db
        .select()
        .from(shiftReports)
        .where(eq(shiftReports.locationId, locationId))
        .orderBy(desc(shiftReports.createdAt));
    } catch (error) {
      console.error("Error fetching shift reports by location:", error);
      throw new Error("Failed to fetch shift reports by location");
    }
  }
  
  async createShiftReport(insertReport: InsertShiftReport): Promise<ShiftReport> {
    try {
      // Handle employee data - need to stringify it for storage
      const processedReport = {
        ...insertReport,
        notes: insertReport.notes || null,
        incidents: insertReport.incidents || null,
        totalJobHours: insertReport.totalJobHours || 0,
        // Convert employees array to JSON string if it exists
        employees: insertReport.employees ? JSON.stringify(insertReport.employees) : '[]',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const [report] = await db
        .insert(shiftReports)
        .values(processedReport)
        .returning();
      return report;
    } catch (error) {
      console.error("Error creating shift report:", error);
      throw new Error("Failed to create shift report");
    }
  }
  
  async updateShiftReport(id: number, updateReport: UpdateShiftReport): Promise<ShiftReport | undefined> {
    try {
      // Process the report data including employee information
      const processedReport = {
        ...updateReport,
        notes: updateReport.notes || null,
        incidents: updateReport.incidents || null,
        totalJobHours: updateReport.totalJobHours || 0,
        // Convert employees array to JSON string if it exists
        employees: updateReport.employees ? JSON.stringify(updateReport.employees) : '[]',
        updatedAt: new Date()
      };
      
      const [report] = await db
        .update(shiftReports)
        .set(processedReport)
        .where(eq(shiftReports.id, id))
        .returning();
      return report || undefined;
    } catch (error) {
      console.error("Error updating shift report:", error);
      throw new Error("Failed to update shift report");
    }
  }
  
  async deleteShiftReport(id: number): Promise<boolean> {
    try {
      // First, delete all associated tax payment records
      await db
        .delete(employeeTaxPayments)
        .where(eq(employeeTaxPayments.reportId, id));
      
      // Then delete the shift report
      await db
        .delete(shiftReports)
        .where(eq(shiftReports.id, id));
      
      return true;
    } catch (error) {
      console.error("Error deleting shift report:", error);
      throw new Error("Failed to delete shift report");
    }
  }
  
  // Ticket distribution methods
  async getTicketDistributions(): Promise<TicketDistribution[]> {
    try {
      return await db.select().from(ticketDistributions).orderBy(desc(ticketDistributions.id));
    } catch (error) {
      console.error("Error fetching ticket distributions:", error);
      throw new Error("Failed to fetch ticket distributions");
    }
  }
  
  async getTicketDistribution(id: number): Promise<TicketDistribution | undefined> {
    try {
      const [distribution] = await db.select().from(ticketDistributions).where(eq(ticketDistributions.id, id));
      return distribution;
    } catch (error) {
      console.error("Error fetching ticket distribution:", error);
      throw new Error("Failed to fetch ticket distribution");
    }
  }
  
  async getTicketDistributionsByLocation(locationId: number): Promise<TicketDistribution[]> {
    try {
      return await db
        .select()
        .from(ticketDistributions)
        .where(eq(ticketDistributions.locationId, locationId))
        .orderBy(desc(ticketDistributions.id));
    } catch (error) {
      console.error("Error fetching ticket distributions by location:", error);
      throw new Error("Failed to fetch ticket distributions by location");
    }
  }
  
  async createTicketDistribution(distribution: InsertTicketDistribution): Promise<TicketDistribution> {
    try {
      const [createdDistribution] = await db
        .insert(ticketDistributions)
        .values({
          ...distribution,
          usedTickets: 0,
          createdAt: new Date()
        })
        .returning();
      return createdDistribution;
    } catch (error) {
      console.error("Error creating ticket distribution:", error);
      throw new Error("Failed to create ticket distribution");
    }
  }
  
  async updateTicketDistribution(id: number, distribution: UpdateTicketDistribution): Promise<TicketDistribution | undefined> {
    try {
      const [updatedDistribution] = await db
        .update(ticketDistributions)
        .set({
          ...distribution,
          updatedAt: new Date()
        })
        .where(eq(ticketDistributions.id, id))
        .returning();
      return updatedDistribution;
    } catch (error) {
      console.error("Error updating ticket distribution:", error);
      throw new Error("Failed to update ticket distribution");
    }
  }
  
  async deleteTicketDistribution(id: number): Promise<boolean> {
    try {
      await db
        .delete(ticketDistributions)
        .where(eq(ticketDistributions.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting ticket distribution:", error);
      throw new Error("Failed to delete ticket distribution");
    }
  }

  // Incident Report methods
  async getIncidentReports(): Promise<IncidentReport[]> {
    try {
      return await db.select().from(incidentReports).orderBy(desc(incidentReports.submittedAt));
    } catch (error) {
      console.error("Error getting incident reports:", error);
      return [];
    }
  }

  async getIncidentReport(id: number): Promise<IncidentReport | undefined> {
    try {
      const [report] = await db.select().from(incidentReports).where(eq(incidentReports.id, id));
      return report || undefined;
    } catch (error) {
      console.error("Error getting incident report by ID:", error);
      return undefined;
    }
  }

  async createIncidentReport(insertReport: InsertIncidentReport): Promise<IncidentReport> {
    try {
      const [report] = await db
        .insert(incidentReports)
        .values(insertReport)
        .returning();
      return report;
    } catch (error) {
      console.error("Error creating incident report:", error);
      throw new Error("Failed to create incident report");
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
      const [permit] = await db
        .insert(permits)
        .values({
          ...permitData,
          pdfFileName: permitData.pdfFileName || null,
          pdfData: permitData.pdfData || null,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
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
          pdfFileName: permitData.pdfFileName !== undefined ? permitData.pdfFileName : undefined,
          pdfData: permitData.pdfData !== undefined ? permitData.pdfData : undefined,
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

  // Training Acknowledgment methods
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

// Use the Database Storage
export const storage = new DatabaseStorage();
