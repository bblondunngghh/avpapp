/**
 * Script to identify and remove duplicate shift reports for a specific location
 */
import { pool, db } from '../db.js';
import { shiftReports, eq, desc } from '../../shared/schema.js';

async function removeDuplicateShiftReports() {
  try {
    console.log('Starting duplicate removal for BOA Steakhouse...');
    
    // Get all BOA Steakhouse reports, sorted by most recent (highest ID) first
    const locationId = 4; // BOA Steakhouse
    const reports = await db.select()
      .from(shiftReports)
      .where(eq(shiftReports.locationId, locationId))
      .orderBy(desc(shiftReports.id));
    
    console.log(`Found ${reports.length} BOA Steakhouse reports`);
    
    // Track seen dates to find duplicates
    const seenDates = new Map();
    const duplicatesToRemove = [];
    
    // Identify duplicates - keep the first occurrence (lower ID), remove newer ones
    for (const report of reports) {
      const dateShiftKey = `${report.date}_${report.shift}`;
      
      if (seenDates.has(dateShiftKey)) {
        // This is a duplicate, mark for removal
        duplicatesToRemove.push(report);
      } else {
        // First time seeing this date+shift combination
        seenDates.set(dateShiftKey, report);
      }
    }
    
    console.log(`Found ${duplicatesToRemove.length} duplicate reports to remove`);
    
    // Remove duplicates
    if (duplicatesToRemove.length > 0) {
      // Sort by ID descending so we delete the most recent duplicates
      duplicatesToRemove.sort((a, b) => b.id - a.id);
      
      console.log('Removing the following reports:');
      duplicatesToRemove.forEach(report => {
        console.log(`ID: ${report.id}, Date: ${report.date}, Shift: ${report.shift}`);
      });
      
      // Remove duplicates one by one - the most recent uploads first
      for (const report of duplicatesToRemove) {
        await db.delete(shiftReports)
          .where(eq(shiftReports.id, report.id));
        console.log(`Deleted report ID: ${report.id}`);
      }
      
      console.log('Duplicate removal completed successfully');
    } else {
      console.log('No duplicates found');
    }
    
  } catch (error) {
    console.error('Error removing duplicates:', error);
  } finally {
    // Close the database connection
    await pool.end();
    process.exit(0);
  }
}

removeDuplicateShiftReports();