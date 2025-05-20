// Script to add employees from EMPLOYEE_NAMES to the database

const { Pool } = require('@neondatabase/serverless');
const ws = require('ws');
const { neonConfig, drizzle } = require('drizzle-orm/neon-serverless');
const { employees } = require('../../shared/schema');

// Setup for neon database
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// Get employee names from constants
const EMPLOYEE_NAMES = {
  "antonio": "Antonio Martinez",
  "arturo": "Arturo Sanchez",
  "brandon": "Brandon Blond",
  "brett": "Brett Willson",
  "dave": "Dave Roehm",
  "devin": "Devin Bean",
  "dylan": "Dylan McMullen",
  "elijah": "Elijah Aguilar",
  "ethan": "Ethan Walker",
  "gabe": "Gabe Ott",
  "jacob": "Jacob Weldon",
  "joe": "Joe Albright",
  "jonathan": "Jonathan Zaccheo",
  "kevin": "Kevin Hanrahan",
  "melvin": "Melvin Lobos",
  "noe": "Noe Coronado",
  "riley": "Riley McIntyre",
  "ryan": "Ryan Hocevar",
  "zane": "Zane Springer"
};

// Create employee objects from names
const employeesToAdd = Object.entries(EMPLOYEE_NAMES).map(([key, fullName]) => ({
  key,
  fullName,
  isActive: true,
  isShiftLeader: false,
  hireDate: new Date(),
  phone: null,
  email: null,
  notes: null
}));

async function addEmployees() {
  console.log('Starting to add employees...');
  
  try {
    // Get existing employees
    const existingEmployees = await db.select().from(employees);
    console.log(`Found ${existingEmployees.length} existing employees`);
    
    // Get the keys of existing employees
    const existingKeys = existingEmployees.map(e => e.key);
    
    // Filter out the employees that already exist
    const newEmployees = employeesToAdd.filter(e => !existingKeys.includes(e.key));
    
    if (newEmployees.length === 0) {
      console.log('All employees already exist in the database.');
      await pool.end();
      return;
    }
    
    console.log(`Adding ${newEmployees.length} new employees...`);
    
    // Add each employee
    for (const employee of newEmployees) {
      try {
        const result = await db.insert(employees).values(employee).returning();
        console.log(`Added employee: ${employee.fullName} (${employee.key})`);
      } catch (error) {
        console.error(`Error adding ${employee.fullName} (${employee.key}):`, error.message);
      }
    }
    
    console.log('Finished adding employees.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

// Run the function
addEmployees();