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
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async getLocations(): Promise<Location[]> {
    return await db.select().from(locations);
  }
  
  async getLocation(id: number): Promise<Location | undefined> {
    const [location] = await db.select().from(locations).where(eq(locations.id, id));
    return location || undefined;
  }
  
  async getLocationByName(name: string): Promise<Location | undefined> {
    const [location] = await db.select().from(locations).where(eq(locations.name, name));
    return location || undefined;
  }
  
  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const [location] = await db
      .insert(locations)
      .values(insertLocation)
      .returning();
    return location;
  }
  
  async getShiftReports(): Promise<ShiftReport[]> {
    return await db.select().from(shiftReports).orderBy(desc(shiftReports.createdAt));
  }
  
  async getShiftReport(id: number): Promise<ShiftReport | undefined> {
    const [report] = await db.select().from(shiftReports).where(eq(shiftReports.id, id));
    return report || undefined;
  }
  
  async getShiftReportsByLocation(locationId: number): Promise<ShiftReport[]> {
    return await db
      .select()
      .from(shiftReports)
      .where(eq(shiftReports.locationId, locationId))
      .orderBy(desc(shiftReports.createdAt));
  }
  
  async createShiftReport(insertReport: InsertShiftReport): Promise<ShiftReport> {
    const [report] = await db
      .insert(shiftReports)
      .values({
        ...insertReport,
        notes: insertReport.notes || null,
        incidents: insertReport.incidents || null,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return report;
  }
  
  async updateShiftReport(id: number, updateReport: UpdateShiftReport): Promise<ShiftReport | undefined> {
    const [report] = await db
      .update(shiftReports)
      .set({
        ...updateReport,
        notes: updateReport.notes || null,
        incidents: updateReport.incidents || null,
        updatedAt: new Date()
      })
      .where(eq(shiftReports.id, id))
      .returning();
    return report || undefined;
  }
  
  async deleteShiftReport(id: number): Promise<boolean> {
    const result = await db
      .delete(shiftReports)
      .where(eq(shiftReports.id, id));
    return true; // If deletion completes without error, return true
  }
}

// Use the Database Storage
export const storage = new DatabaseStorage();
