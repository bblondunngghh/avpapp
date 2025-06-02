import { format } from "date-fns";

// Central Time Zone helper functions
export const CENTRAL_TIMEZONE = 'America/Chicago';

/**
 * Get current date in Central Time as YYYY-MM-DD string
 */
export function getCurrentDateCentral(): string {
  // Use proper timezone handling with Intl API
  const now = new Date();
  const centralTime = new Date(now.toLocaleString("en-US", { timeZone: CENTRAL_TIMEZONE }));
  return format(centralTime, 'yyyy-MM-dd');
}

/**
 * Convert a date string to Central Time date object
 */
export function parseDateInCentral(dateString: string): Date {
  if (!dateString) return new Date();
  
  // Simple parsing for YYYY-MM-DD format
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  
  return new Date(dateString);
}

/**
 * Format a date object to display string in Central Time
 */
export function formatDateInCentral(date: Date, formatString: string = 'M/d/yyyy'): string {
  return format(date, formatString);
}

/**
 * Convert any date string to consistent display format in Central Time
 */
export function formatDateForDisplay(dateString: string): string {
  if (!dateString) return "Unknown";
  
  try {
    // Handle ISO date strings from database
    if (dateString.includes('T') && dateString.includes('Z')) {
      const date = new Date(dateString);
      // Convert to Central Time for display
      const centralTime = new Date(date.toLocaleString("en-US", { timeZone: CENTRAL_TIMEZONE }));
      return format(centralTime, 'M/d/yyyy');
    }
    
    // Handle YYYY-MM-DD format
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return format(date, 'M/d/yyyy');
    }
    
    // Handle M/D/YYYY format
    if (dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const date = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
        if (!isNaN(date.getTime())) {
          return format(date, 'M/d/yyyy');
        }
      }
    }
    
    // Fallback - try to parse as regular date
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const centralTime = new Date(date.toLocaleString("en-US", { timeZone: CENTRAL_TIMEZONE }));
      return format(centralTime, 'M/d/yyyy');
    }
    
    return dateString;
  } catch (error) {
    console.error('Date formatting error:', error);
    return dateString;
  }
}

/**
 * Get current time in Central Time
 */
export function getCurrentTimeCentral(): Date {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: CENTRAL_TIMEZONE }));
}