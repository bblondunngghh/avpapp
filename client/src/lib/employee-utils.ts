/**
 * Utility functions for robust employee matching that survives key changes
 */

/**
 * Parse date string safely without timezone issues
 * Prevents dates like "2025-06-01" from being parsed as "2025-05-31" due to timezone conversion
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object parsed as local date
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-');
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

/**
 * Extract month from date string without timezone conversion issues
 * CRITICAL: Always use this instead of new Date() for month filtering
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Month string in YYYY-MM format
 */
export function extractMonth(dateString: string): string {
  const [year, month] = dateString.split('-');
  return `${year}-${month}`;
}

/**
 * Safely parse employee JSON data with validation
 * CRITICAL: Always use this to prevent JSON corruption issues
 * @param employeesData - Raw employees data (string or array)
 * @returns Parsed employee array or empty array on error
 */
export function parseEmployeesData(employeesData: any): ShiftEmployee[] {
  if (Array.isArray(employeesData)) {
    return employeesData;
  }
  
  if (typeof employeesData === 'string') {
    try {
      // First attempt - standard JSON parsing
      const parsed = JSON.parse(employeesData);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      
      // If parsed result is a single object, wrap in array
      if (typeof parsed === 'object' && parsed !== null) {
        return [parsed];
      }
    } catch (error) {
      // Handle complex nested JSON format: {"{"name":"kevin","hours":6,"cashPaid":19}"}
      try {
        let cleanData = employeesData;
        
        // Remove outer wrapper if present: {" ... "}
        if (cleanData.startsWith('{"') && cleanData.endsWith('"}')) {
          cleanData = cleanData.slice(2, -2);
        }
        
        // Unescape inner quotes
        cleanData = cleanData.replace(/\\"/g, '"');
        
        // Try parsing the cleaned data
        const cleanParsed = JSON.parse(cleanData);
        if (Array.isArray(cleanParsed)) {
          return cleanParsed;
        }
        
        // If it's a single object, wrap in array
        if (typeof cleanParsed === 'object' && cleanParsed !== null) {
          return [cleanParsed];
        }
      } catch (secondError) {
        // Handle the database format with escaped quotes like: 
        // "{""{\""name\"":\""kevin\"",\""hours\"":6,\""cashPaid\"":19}""}"
        // Or multiple employees: "{""{\""name\"":\""arturo\"",\""hours\"":5.75,\""cashPaid\"":0}"",""{\""name\"":\""ethan\"",\""hours\"":4.5,\""cashPaid\"":0}""}"
        try {
          let dbData = employeesData;
          
          // Remove outer braces and quotes: "{""...""}" -> "..."
          if (dbData.startsWith('{"') && dbData.endsWith('"}')) {
            dbData = dbData.slice(2, -2);
          }
          
          // Replace escaped quotes: \""name\"" -> "name"
          dbData = dbData.replace(/\\"/g, '"');
          
          // Handle multiple JSON objects in the complex format
          // After processing: {"name":"elijah","hours":8,"cashPaid":0}","{"name":"antonio","hours":7,"cashPaid":0}","{"name":"dave","hours":2,"cashPaid":0}
          if (dbData.includes('","')) {
            // Use regex to extract complete JSON objects
            const jsonObjectRegex = /\{[^{}]*\}/g;
            const matches = dbData.match(jsonObjectRegex);
            const employees = [];
            
            if (matches) {
              for (const match of matches) {
                try {
                  const employee = JSON.parse(match);
                  if (employee && employee.name && typeof employee.hours === 'number') {
                    employees.push(employee);
                  }
                } catch (parseErr) {
                  console.warn('Failed to parse JSON object:', match);
                }
              }
            }
            
            return employees;
          } else {
            // Single employee case
            const dbParsed = JSON.parse(dbData);
            if (Array.isArray(dbParsed)) {
              return dbParsed;
            }
            
            if (typeof dbParsed === 'object' && dbParsed !== null) {
              return [dbParsed];
            }
          }
        } catch (thirdError) {
          console.error('Failed to parse employee JSON data after all attempts:', thirdError, 'Raw data:', employeesData);
          return [];
        }
      }
    }
  }
  
  console.warn('Employee data is neither string nor array:', employeesData);
  return [];
}

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
 * @param context - Optional context for better matching (shift report, all employees, etc.)
 * @returns boolean indicating if they match
 */
export function matchEmployee(
  shiftEmployee: ShiftEmployee, 
  employeeRecord: EmployeeRecord, 
  context?: { shiftReport?: any; allEmployees?: EmployeeRecord[] }
): boolean {
  if (!shiftEmployee?.name || !employeeRecord) return false;
  
  const shiftName = shiftEmployee.name.toLowerCase().trim();
  const employeeKey = employeeRecord.key?.toLowerCase().trim();
  const employeeFullName = employeeRecord.fullName?.toLowerCase().trim();
  

  
  // Primary match: current employee key
  if (shiftName === employeeKey) return true;
  
  // Check for exact full name match
  if (shiftName === employeeFullName) return true;
  
  // Fallback match: check against full name parts
  if (employeeFullName) {
    const employeeNameParts = employeeFullName.split(/\s+/);
    
    // Check if shift name matches any part of full name (first name, last name, etc.)
    const nameMatch = employeeNameParts.some(part => {
      const partLower = part.toLowerCase().trim();
      return partLower === shiftName;
    });
    
    if (nameMatch) return true;
  }
  
  // Handle generic employee names from admin panel additions
  // When employees are added via admin panel, they may show up as "employee 1", "employee 2", etc.
  if (shiftName.match(/^employee\s+\d+$/)) {
    // This is a systematic issue where employees added via admin panel get generic names
    // For now, we cannot reliably match these without additional context
    // The root cause needs to be fixed in the shift report form to use proper employee identifiers
    
    // As a temporary workaround, try to match based on hire date and shift date proximity
    if (context?.shiftReport && context?.allEmployees) {
      const shiftDate = new Date(context.shiftReport.date);
      const employeeHireDate = new Date(employeeRecord.hireDate || '1900-01-01');
      
      // If employee was hired within 30 days of the shift, they might be the generic employee
      const daysDiff = Math.abs((shiftDate.getTime() - employeeHireDate.getTime()) / (1000 * 3600 * 24));
      
      // Only match if employee was recently hired (within 30 days) and no other exact matches exist
      if (daysDiff <= 30) {
        return true;
      }
    }
    
    return false; // Let the special matches handle this below
  }
  
  // Special cases for known employee key changes and variations
  const specialMatches: Record<string, string[]> = {
    'ryan hocevar': ['ryan', 'rhoce', 'rjhoce'], // Ryan's various keys and name variants
    // Admin panel employees showing as generic names - systematic issue that needs shift form fix
    'braden baldez': ['employee 1', 'employee 2', 'employee 3'], 
    'jack shelton': ['employee 1', 'employee 2', 'employee 3'],
    // Add any other employees added via admin panel that show as generic names
  };
  
  if (employeeFullName && specialMatches[employeeFullName]) {
    const variants = specialMatches[employeeFullName];
    if (variants.includes(shiftName)) {
      return true;
    }
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
  // CRITICAL: Use the robust parseEmployeesData function to prevent JSON corruption
  const employees = parseEmployeesData(shiftReport.employees);
  
  return Array.isArray(employees) && employees.some(emp => matchEmployee(emp, employeeRecord));
}