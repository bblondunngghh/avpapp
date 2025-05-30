import { format } from "date-fns";

// Central Time Zone helper functions
export const CENTRAL_TIMEZONE = 'America/Chicago';

/**
 * Get current date in Central Time as YYYY-MM-DD string
 */
export function getCurrentDateCentral(): string {
  const now = new Date();
  // Create a date object in Central Time
  const centralDate = new Date(now.toLocaleString("en-US", { timeZone: CENTRAL_TIMEZONE }));
  return format(centralDate, 'yyyy-MM-dd');
}

/**
 * Convert a date string to Central Time date object
 */
export function parseDateInCentral(dateString: string): Date {
  if (!dateString) return new Date();
  
  // If it's already YYYY-MM-DD format, create date in Central Time
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-').map(Number);
    // Create date object representing midnight in Central Time
    const date = new Date();
    date.setFullYear(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  
  // For other formats, try to parse and convert to Central Time
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return new Date();
  }
  
  return new Date(date.toLocaleString("en-US", { timeZone: CENTRAL_TIMEZONE }));
}

/**
 * Format a date object to display string in Central Time
 */
export function formatDateInCentral(date: Date, formatString: string = 'M/d/yyyy'): string {
  const centralDate = new Date(date.toLocaleString("en-US", { timeZone: CENTRAL_TIMEZONE }));
  return format(centralDate, formatString);
}

/**
 * Get current time in Central Time
 */
export function getCurrentTimeCentral(): Date {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: CENTRAL_TIMEZONE }));
}