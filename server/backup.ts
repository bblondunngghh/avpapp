import { db } from "./db";
import { storage } from "./storage";

export class BackupService {
  // Create a backup of all critical business data
  static async createBackup(): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // Get all data
      const [
        employees,
        shiftReports,
        ticketDistributions,
        employeeTaxPayments,
        incidentReports,
        permits,
        trainingAcknowledgments
      ] = await Promise.all([
        storage.getEmployees(),
        storage.getShiftReports(),
        storage.getTicketDistributions(),
        storage.getEmployeeTaxPayments(),
        storage.getIncidentReports(),
        storage.getPermits(),
        storage.getTrainingAcknowledgments()
      ]);

      const backup = {
        timestamp,
        version: "1.0",
        data: {
          employees,
          shiftReports,
          ticketDistributions,
          employeeTaxPayments,
          incidentReports,
          permits,
          trainingAcknowledgments
        }
      };

      const backupJson = JSON.stringify(backup, null, 2);
      console.log(`[BACKUP] Created backup at ${timestamp} - ${backupJson.length} bytes`);
      
      return backupJson;
    } catch (error) {
      console.error('[BACKUP ERROR]', error);
      throw new Error('Failed to create backup');
    }
  }

  // Validate data integrity
  static async validateDataIntegrity(): Promise<boolean> {
    try {
      const reports = await storage.getShiftReports();
      const employees = await storage.getEmployees();
      const taxPayments = await storage.getEmployeeTaxPayments();

      // Validate financial calculations
      for (const report of reports) {
        const employees_data = typeof report.employees === 'string' 
          ? JSON.parse(report.employees) 
          : report.employees;
        
        if (Array.isArray(employees_data)) {
          const totalHours = employees_data.reduce((sum, emp) => sum + (emp.hours || 0), 0);
          if (Math.abs(totalHours - (report.totalJobHours || 0)) > 0.01) {
            console.warn(`[DATA INTEGRITY] Hours mismatch in report ${report.id}`);
          }
        }
      }

      // Validate employee records
      for (const employee of employees) {
        if (!employee.fullName || !employee.key) {
          console.warn(`[DATA INTEGRITY] Invalid employee record ${employee.id}`);
        }
      }

      console.log(`[DATA INTEGRITY] Validated ${reports.length} reports, ${employees.length} employees, ${taxPayments.length} tax payments`);
      return true;
    } catch (error) {
      console.error('[DATA INTEGRITY ERROR]', error);
      return false;
    }
  }

  // Schedule regular backups
  static startBackupSchedule() {
    // Create backup every 6 hours
    setInterval(async () => {
      try {
        await this.createBackup();
        await this.validateDataIntegrity();
      } catch (error) {
        console.error('[SCHEDULED BACKUP ERROR]', error);
      }
    }, 6 * 60 * 60 * 1000); // 6 hours

    console.log('[BACKUP SCHEDULER] Started - backups every 6 hours');
  }
}