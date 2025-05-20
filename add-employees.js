// Sample employee data to populate the employees section in admin panel
const employees = [
  { key: "antonio", fullName: "Antonio Martinez", isActive: true, isShiftLeader: false },
  { key: "arturo", fullName: "Arturo Sanchez", isActive: true, isShiftLeader: false },
  { key: "brandon", fullName: "Brandon Blond", isActive: true, isShiftLeader: false },
  { key: "brett", fullName: "Brett Willson", isActive: true, isShiftLeader: true },
  { key: "dave", fullName: "Dave Roehm", isActive: true, isShiftLeader: true },
  { key: "devin", fullName: "Devin Bean", isActive: true, isShiftLeader: false },
  { key: "dylan", fullName: "Dylan McMullen", isActive: true, isShiftLeader: false },
  { key: "elijah", fullName: "Elijah Aguilar", isActive: true, isShiftLeader: false },
  { key: "ethan", fullName: "Ethan Walker", isActive: true, isShiftLeader: false },
  { key: "gabe", fullName: "Gabe Ott", isActive: true, isShiftLeader: false },
  { key: "jacob", fullName: "Jacob Weldon", isActive: true, isShiftLeader: false },
  { key: "joe", fullName: "Joe Albright", isActive: true, isShiftLeader: false },
  { key: "jonathan", fullName: "Jonathan Zaccheo", isActive: true, isShiftLeader: true },
  { key: "kevin", fullName: "Kevin Hanrahan", isActive: true, isShiftLeader: false },
  { key: "melvin", fullName: "Melvin Lobos", isActive: true, isShiftLeader: false },
  { key: "noe", fullName: "Noe Coronado", isActive: true, isShiftLeader: false },
  { key: "riley", fullName: "Riley McIntyre", isActive: true, isShiftLeader: true },
  { key: "ryan", fullName: "Ryan Hocevar", isActive: true, isShiftLeader: false },
  { key: "zane", fullName: "Zane Springer", isActive: true, isShiftLeader: false }
];

// Script to add employees to the database
const { db } = require('./server/db');
const { employees: employeesTable } = require('./shared/schema');
const { eq } = require('drizzle-orm');

async function addEmployees() {
  console.log('Adding employees...');

  // First, clear any existing employees
  console.log('Clearing existing employees...');
  try {
    // We're not actually deleting, just checking if we need to add them
    const existingEmployees = await db.select().from(employeesTable);
    
    if (existingEmployees.length > 0) {
      console.log(`Found ${existingEmployees.length} existing employees. No need to add more.`);
      process.exit(0);
    }
  } catch (error) {
    console.error('Error checking existing employees:', error);
  }

  // Add each employee
  console.log('Adding new employees...');
  for (const employee of employees) {
    try {
      const now = new Date();
      const hireDate = new Date('2024-01-01');
      
      const result = await db.insert(employeesTable).values({
        key: employee.key,
        fullName: employee.fullName,
        isActive: employee.isActive,
        isShiftLeader: employee.isShiftLeader,
        hireDate,
        createdAt: now
      }).returning();
      
      console.log(`Added employee: ${employee.fullName}`);
    } catch (error) {
      console.error(`Error adding employee ${employee.fullName}:`, error);
    }
  }

  console.log('Finished adding employees');
  process.exit(0);
}

addEmployees().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});