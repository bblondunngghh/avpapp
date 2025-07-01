import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixEmployeeData() {
  try {
    console.log('Starting employee data fix...');
    
    // Get all shift reports with malformed employee data
    const result = await pool.query(`
      SELECT id, date, employees, location_id 
      FROM shift_reports 
      WHERE date >= '2025-06-20' 
      AND employees LIKE '"{%' 
      ORDER BY date
    `);
    
    // Also check for the other malformed pattern with escaped quotes
    const result2 = await pool.query(`
      SELECT id, date, employees, location_id 
      FROM shift_reports 
      WHERE date >= '2025-06-20' 
      AND (employees LIKE '%\\"name\\"%' OR employees LIKE '%name%')
      AND employees NOT LIKE '[%'
      ORDER BY date
    `);
    
    const allResults = [...result.rows, ...result2.rows];
    
    console.log(`Found ${allResults.length} records with malformed data`);
    
    for (const row of allResults) {
      try {
        const { id, date, employees, location_id } = row;
        
        // Parse the malformed data
        let fixedEmployees = [];
        
        if (employees && employees.includes('","')) {
          // Multiple employees in malformed format
          const employeeStrings = employees.slice(2, -2).split('","');
          
          for (const empStr of employeeStrings) {
            try {
              const cleanStr = empStr.replace(/\\"/g, '"');
              const empData = JSON.parse(cleanStr);
              fixedEmployees.push(empData);
            } catch (e) {
              console.log(`Failed to parse employee: ${empStr}`);
            }
          }
        } else if (employees && employees.startsWith('"{') && employees.endsWith('}"')) {
          // Single employee in malformed format
          try {
            const cleanStr = employees.slice(2, -2).replace(/\\"/g, '"');
            const empData = JSON.parse(cleanStr);
            fixedEmployees.push(empData);
          } catch (e) {
            console.log(`Failed to parse single employee: ${employees}`);
          }
        }
        
        if (fixedEmployees.length > 0) {
          // Update the record with proper JSON format
          await pool.query(
            'UPDATE shift_reports SET employees = $1 WHERE id = $2',
            [JSON.stringify(fixedEmployees), id]
          );
          
          console.log(`Fixed ${date} - Location ${location_id}: ${fixedEmployees.length} employees`);
        }
        
      } catch (error) {
        console.error(`Error processing record ${row.id}:`, error);
      }
    }
    
    console.log('Employee data fix completed!');
    
  } catch (error) {
    console.error('Error fixing employee data:', error);
  } finally {
    await pool.end();
  }
}

fixEmployeeData();