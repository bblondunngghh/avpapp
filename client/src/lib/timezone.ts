import { format } from "date-fns";

// Central Time Zone helper functions
export const CENTRAL_TIMEZONE = 'America/Chicago';

/**
 * Get current date in Central Time as YYYY-MM-DD string
 */
export function getCurrentDateCentral(): string {
  // Simple approach - get current date and adjust for Central Time offset
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const centralOffset = -6; // Central Time is UTC-6 (Standard Time)
  const central = new Date(utc + (centralOffset * 3600000));
  return format(central, 'yyyy-MM-dd');
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
 * Get current time in Central Time
 */
export function getCurrentTimeCentral(): Date {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: CENTRAL_TIMEZONE }));
}