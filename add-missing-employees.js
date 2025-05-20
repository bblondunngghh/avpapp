// Script to add missing employees to the database
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq } from 'drizzle-orm';
import { employees } from './shared/schema.js';

// Get today's date in ISO format (YYYY-MM-DD)
const today = new Date().toISOString().split('T')[0];

// List of employees to add
const employeesToAdd = [
  { key: 'antonio', fullName: 'Antonio Martinez', isActive: true, isShiftLeader: false, hireDate: today },
  { key: 'arturo', fullName: 'Arturo Sanchez', isActive: true, isShiftLeader: false, hireDate: today },
  { key: 'brandon', fullName: 'Brandon Blond', isActive: true, isShiftLeader: false, hireDate: today },
  { key: 'brett', fullName: 'Brett Willson', isActive: true, isShiftLeader: false, hireDate: today },
  { key: 'dave', fullName: 'Dave Roehm', isActive: true, isShiftLeader: false, hireDate: today },
  { key: 'devin', fullName: 'Devin Bean', isActive: true, isShiftLeader: false, hireDate: today },
  { key: 'dylan', fullName: 'Dylan McMullen', isActive: true, isShiftLeader: false, hireDate: today },
  { key: 'elijah', fullName: 'Elijah Aguilar', isActive: true, isShiftLeader: false, hireDate: today },
  { key: 'ethan', fullName: 'Ethan Walker', isActive: true, isShiftLeader: false, hireDate: today },
  { key: 'gabe', fullName: 'Gabe Ott', isActive: true, isShiftLeader: false, hireDate: today },
  { key: 'jacob', fullName: 'Jacob Weldon', isActive: true, isShiftLeader: false, hireDate: today },
  { key: 'joe', fullName: 'Joe Albright', isActive: true, isShiftLeader: false, hireDate: today },
  { key: 'jonathan', fullName: 'Jonathan Zaccheo', isActive: true, isShiftLeader: false, hireDate: today },
  { key: 'kevin', fullName: 'Kevin Hanrahan', isActive: true, isShiftLeader: false, hireDate: today },
  { key: 'melvin', fullName: 'Melvin Lobos', isActive: true, isShiftLeader: false, hireDate: today },
  { key: 'noe', fullName: 'Noe Coronado', isActive: true, isShiftLeader: false, hireDate: today },
  { key: 'riley', fullName: 'Riley McIntyre', isActive: true, isShiftLeader: false, hireDate: today },
  { key: 'ryan', fullName: 'Ryan Hocevar', isActive: true, isShiftLeader: false, hireDate: today },
  { key: 'zane', fullName: 'Zane Springer', isActive: true, isShiftLeader: false, hireDate: today }
];

// Configure the database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// Function to add employees
async function addEmployees() {
  console.log('Starting to add employees...');
  
  try {
    // Get existing employees to avoid duplicates
    const existingEmployees = await db.select().from(employees);
    const existingKeys = existingEmployees.map(emp => emp.key);
    
    // Filter out employees that already exist
    const newEmployees = employeesToAdd.filter(emp => !existingKeys.includes(emp.key));
    
    if (newEmployees.length === 0) {
      console.log('All employees already exist in the database.');
      return;
    }
    
    // Add each new employee
    for (const employee of newEmployees) {
      console.log(`Adding employee: ${employee.fullName}`);
      
      try {
        const result = await db.insert(employees).values(employee).returning();
        console.log(`Successfully added ${employee.fullName} with ID: ${result[0].id}`);
      } catch (error) {
        console.error(`Error adding ${employee.fullName}:`, error.message);
      }
    }
    
    console.log('Finished adding employees.');
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the function
addEmployees();