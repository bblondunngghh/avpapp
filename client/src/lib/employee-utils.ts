/**
 * Utility functions for robust employee matching that survives key changes
 */

export interface EmployeeRecord {
  key: string;
  fullName: string;
  [key: string]: any;
}

export interface ShiftEmployee {
  name: string;
  hours: number;
  [key: string]: any;
}

/**
 * Robust employee matching that handles key changes by checking multiple criteria
 * @param shiftEmployee - Employee data from shift report
 * @param employeeRecord - Employee record from database
 * @returns boolean indicating if they match
 */
export function matchEmployee(shiftEmployee: ShiftEmployee, employeeRecord: EmployeeRecord): boolean {
  if (!shiftEmployee?.name || !employeeRecord) return false;
  
  const shiftName = shiftEmployee.name.toLowerCase().trim();
  const employeeKey = employeeRecord.key?.toLowerCase().trim();
  const employeeFullName = employeeRecord.fullName?.toLowerCase().trim();
  
  // Debug logging for Ryan specifically
  if (employeeRecord.fullName === 'Ryan Hocevar' || shiftName === 'ryan') {
    console.log('Matching attempt:', {
      shiftName,
      employeeKey,
      employeeFullName,
      employeeRecord
    });
  }
  
  // Primary match: current employee key
  if (shiftName === employeeKey) return true;
  
  // Fallback match: check against full name parts for robustness
  if (employeeFullName) {
    const employeeNameParts = employeeFullName.split(/\s+/);
    
    // Check if shift name matches any part of full name (first name, last name, etc.)
    const match = employeeNameParts.some(part => {
      const partLower = part.toLowerCase().trim();
      return partLower === shiftName || shiftName === partLower;
    });
    
    if (match && (employeeRecord.fullName === 'Ryan Hocevar' || shiftName === 'ryan')) {
      console.log('Match found for Ryan!', { shiftName, employeeFullName });
    }
    
    if (match) return true;
  }
  
  return false;
}

/**
 * Find employee data in shift report that matches the given employee record
 * @param shiftEmployees - Array of employees from shift report
 * @param employeeRecord - Employee record to match against
 * @returns matching employee data or undefined
 */
export function findEmployeeInShift(
  shiftEmployees: ShiftEmployee[], 
  employeeRecord: EmployeeRecord
): ShiftEmployee | undefined {
  if (!Array.isArray(shiftEmployees)) return undefined;
  
  return shiftEmployees.find(shiftEmp => matchEmployee(shiftEmp, employeeRecord));
}

/**
 * Check if employee worked in a shift report
 * @param shiftReport - Shift report object
 * @param employeeRecord - Employee record to check for
 * @returns boolean indicating if employee worked this shift
 */
export function employeeWorkedInShift(shiftReport: any, employeeRecord: EmployeeRecord): boolean {
  let employees = [];
  
  try {
    if (typeof shiftReport.employees === 'string') {
      employees = JSON.parse(shiftReport.employees);
    } else if (Array.isArray(shiftReport.employees)) {
      employees = shiftReport.employees;
    }
  } catch (e) {
    return false;
  }
  
  return Array.isArray(employees) && employees.some(emp => matchEmployee(emp, employeeRecord));
}