import { 
  users, type User, type InsertUser, 
  locations, type Location, type InsertLocation,
  shiftReports, type ShiftReport, type InsertShiftReport, type UpdateShiftReport,
  LOCATIONS
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

// Extend interface with CRUD methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Location methods
  getLocations(): Promise<Location[]>;
  getLocation(id: number): Promise<Location | undefined>;
  getLocationByName(name: string): Promise<Location | undefined>;
  createLocation(location: InsertLocation): Promise<Location>;
  
  // Shift report methods
  getShiftReports(): Promise<ShiftReport[]>;
  getShiftReport(id: number): Promise<ShiftReport | undefined>;
  getShiftReportsByLocation(locationId: number): Promise<ShiftReport[]>;
  createShiftReport(report: InsertShiftReport): Promise<ShiftReport>;
  updateShiftReport(id: number, report: UpdateShiftReport): Promise<ShiftReport | undefined>;
  deleteShiftReport(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private locations: Map<number, Location>;
  private shiftReports: Map<number, ShiftReport>;
  private userCurrentId: number;
  private locationCurrentId: number;
  private shiftReportCurrentId: number;

  constructor() {
    this.users = new Map();
    this.locations = new Map();
    this.shiftReports = new Map();
    this.userCurrentId = 1;
    this.locationCurrentId = 1;
    this.shiftReportCurrentId = 1;
    
    // Initialize with default locations
    this.initializeLocations();
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
      active: insertLocation.active ?? true
    };
    this.locations.set(id, location);
    return location;
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
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
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
      await db
        .delete(shiftReports)
        .where(eq(shiftReports.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting shift report:", error);
      throw new Error("Failed to delete shift report");
    }
  }
}

// Use the Database Storage
export const storage = new DatabaseStorage();
