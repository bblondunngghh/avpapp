import { storage } from './storage';
import { ShiftReport, Employee, Location } from '@shared/schema';

interface CalculationResult {
  employeeName: string;
  reportId: number;
  locationName: string;
  date: string;
  hours: number;
  totalJobHours: number;
  hoursPercent: number;
  commission: number;
  tips: number;
  totalEarnings: number;
  isValid: boolean;
  errors: string[];
}

interface ValidationSummary {
  totalEmployees: number;
  validCalculations: number;
  invalidCalculations: number;
  totalEarnings: Record<string, number>;
  results: CalculationResult[];
  criticalErrors: string[];
}

export class CalculationValidator {
  
  static getCommissionRate(locationId: number): number {
    const rates: Record<number, number> = {
      1: 4,  // Capital Grille
      2: 9,  // Bob's Steak and Chop House  
      3: 7,  // Truluck's
      4: 6,  // BOA Steakhouse
      5: 2,  // PPS (special rate)
      6: 4,  // Default rate for new locations
      7: 4   // Default rate for new locations
    };
    return rates[locationId] || 4;
  }

  static getPerCarPrice(locationId: number): number {
    const prices: Record<number, number> = {
      1: 15, // Capital Grille
      2: 15, // Bob's Steak and Chop House
      3: 15, // Truluck's  
      4: 13, // BOA Steakhouse
      5: 15, // PPS
      6: 15, // Default price for new locations
      7: 15  // Default price for new locations
    };
    return prices[locationId] || 15;
  }

  static calculateEarnings(report: ShiftReport, employeeName: string, hours: number): CalculationResult {
    const errors: string[] = [];
    let isValid = true;

    // Basic validation
    if (hours < 0) {
      errors.push(`Invalid hours: ${hours}`);
      isValid = false;
    }

    if (report.totalJobHours <= 0) {
      errors.push(`Invalid total job hours: ${report.totalJobHours}`);
      isValid = false;
    }

    // Get rates
    const commissionRate = this.getCommissionRate(report.locationId);
    const perCarPrice = this.getPerCarPrice(report.locationId);

    // Calculate commission and tips
    const totalCommission = report.totalCars * commissionRate;
    const totalTips = (report.totalCars * perCarPrice) - report.totalCreditSales;
    
    // Calculate hour percentage
    const hoursPercent = report.totalJobHours > 0 ? hours / report.totalJobHours : 0;

    // Calculate employee earnings
    const empCommission = totalCommission * hoursPercent;
    const empTips = totalTips * hoursPercent;
    const totalEarnings = empCommission + empTips;

    // Validation checks
    if (hoursPercent > 1) {
      errors.push(`Hours exceed total job hours: ${hours} > ${report.totalJobHours}`);
      isValid = false;
    }

    if (totalEarnings < 0) {
      errors.push(`Negative earnings calculated: ${totalEarnings}`);
      isValid = false;
    }

    return {
      employeeName,
      reportId: report.id,
      locationName: `Location ${report.locationId}`,
      date: report.date,
      hours,
      totalJobHours: report.totalJobHours,
      hoursPercent,
      commission: empCommission,
      tips: empTips,
      totalEarnings,
      isValid,
      errors
    };
  }

  static async validateAllCalculations(): Promise<ValidationSummary> {
    const reports = await storage.getShiftReports();
    const locations = await storage.getLocations();
    const locationMap = new Map(locations.map(loc => [loc.id, loc.name]));
    
    const results: CalculationResult[] = [];
    const totalEarnings: Record<string, number> = {};
    const criticalErrors: string[] = [];

    for (const report of reports) {
      try {
        // Parse employees from JSON string
        let employees: Array<{name: string, hours: number}> = [];
        
        if (report.employees) {
          try {
            employees = JSON.parse(report.employees);
          } catch (e) {
            criticalErrors.push(`Report ${report.id}: Invalid employee JSON`);
            continue;
          }
        }

        for (const emp of employees) {
          const result = this.calculateEarnings(report, emp.name, emp.hours);
          result.locationName = locationMap.get(report.locationId) || `Location ${report.locationId}`;
          
          results.push(result);

          // Accumulate total earnings per employee
          if (!totalEarnings[emp.name]) {
            totalEarnings[emp.name] = 0;
          }
          totalEarnings[emp.name] += result.totalEarnings;

          // Check for critical errors
          if (!result.isValid) {
            criticalErrors.push(`Report ${report.id} - ${emp.name}: ${result.errors.join(', ')}`);
          }
        }
      } catch (error) {
        criticalErrors.push(`Report ${report.id}: Failed to process - ${error}`);
      }
    }

    const validCalculations = results.filter(r => r.isValid).length;
    const invalidCalculations = results.filter(r => !r.isValid).length;

    return {
      totalEmployees: Object.keys(totalEarnings).length,
      validCalculations,
      invalidCalculations,
      totalEarnings,
      results,
      criticalErrors
    };
  }

  static async fixJonathanHours(): Promise<boolean> {
    try {
      // Get the problematic report
      const report = await storage.getShiftReport(536);
      if (!report) {
        console.error('Report 536 not found');
        return false;
      }

      // Parse current employees
      let employees: Array<{name: string, hours: number}> = [];
      if (report.employees) {
        employees = JSON.parse(report.employees);
      }

      // Find Jonathan and fix his hours
      const jonathanIndex = employees.findIndex(emp => emp.name.toLowerCase().includes('jonathan'));
      if (jonathanIndex !== -1) {
        employees[jonathanIndex].hours = 6.5; // Fix to correct hours
        
        // Update the report
        const updatedReport = await storage.updateShiftReport(536, {
          employees: JSON.stringify(employees)
        });

        if (updatedReport) {
          console.log('Successfully fixed Jonathan\'s hours to 6.5');
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error fixing Jonathan\'s hours:', error);
      return false;
    }
  }

  static generateAuditReport(summary: ValidationSummary): string {
    let report = `
=== PAYROLL CALCULATION AUDIT REPORT ===
Generated: ${new Date().toISOString()}

SUMMARY:
- Total Employees: ${summary.totalEmployees}
- Valid Calculations: ${summary.validCalculations}
- Invalid Calculations: ${summary.invalidCalculations}
- Accuracy Rate: ${((summary.validCalculations / (summary.validCalculations + summary.invalidCalculations)) * 100).toFixed(2)}%

EMPLOYEE TOTAL EARNINGS:
`;

    Object.entries(summary.totalEarnings)
      .sort(([,a], [,b]) => b - a)
      .forEach(([name, total]) => {
        report += `${name}: $${total.toFixed(2)}\n`;
      });

    if (summary.criticalErrors.length > 0) {
      report += `\nCRITICAL ERRORS REQUIRING ATTENTION:\n`;
      summary.criticalErrors.forEach(error => {
        report += `- ${error}\n`;
      });
    }

    return report;
  }
}