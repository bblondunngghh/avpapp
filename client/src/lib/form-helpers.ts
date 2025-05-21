/**
 * Helper functions for form handling
 */

/**
 * Parse employees data from different possible formats
 * This helps handle the different ways employees data might be stored or returned from API
 */
export function parseEmployeesData(employeesField: any): { name: string; hours: number; cashPaid?: number }[] {
  // Return empty array for undefined/null
  if (!employeesField) return [];
  
  // If already an array, return it
  if (Array.isArray(employeesField)) {
    return employeesField;
  }
  
  // If it's a string, try to parse as JSON
  if (typeof employeesField === 'string' && employeesField) {
    try {
      const parsed = JSON.parse(employeesField);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      console.warn("Failed to parse employees JSON:", e);
    }
  }
  
  // Default: return empty array
  return [];
}