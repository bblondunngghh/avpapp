import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function comprehensiveFix() {
  try {
    console.log('Starting comprehensive employee data fix...');
    
    // Get ALL shift reports from June 20th onwards to fix all patterns
    const result = await pool.query(`
      SELECT id, date, employees, location_id 
      FROM shift_reports 
      WHERE date >= '2025-06-20' 
      AND employees IS NOT NULL 
      AND employees != ''
      AND employees != '{}'
      ORDER BY date
    `);
    
    console.log(`Found ${result.rows.length} records to check`);
    
    let fixedCount = 0;
    
    for (const row of result.rows) {
      try {
        const { id, date, employees, location_id } = row;
        
        // Skip if already properly formatted
        if (employees.startsWith('[') && employees.endsWith(']')) {
          continue;
        }
        
        let fixedEmployees = [];
        
        // Handle various malformed patterns
        if (employees.includes('"name"')) {
          // Pattern 1: Single employee with escaped quotes: "{\"name\":\"ryan\",\"hours\":5,\"cashPaid\":3}"
          if (employees.startsWith('"{') && employees.endsWith('}"')) {
            try {
              const cleanStr = employees.slice(2, -2).replace(/\\"/g, '"');
              const empData = JSON.parse(cleanStr);
              fixedEmployees.push(empData);
            } catch (e) {
              console.log(`Failed pattern 1: ${employees}`);
            }
          }
          // Pattern 2: Multiple employees with comma separation
          else if (employees.includes('","')) {
            try {
              const employeeStrings = employees.slice(2, -2).split('","');
              for (const empStr of employeeStrings) {
                const cleanStr = empStr.replace(/\\"/g, '"');
                const empData = JSON.parse(cleanStr);
                fixedEmployees.push(empData);
              }
            } catch (e) {
              console.log(`Failed pattern 2: ${employees}`);
            }
          }
          // Pattern 3: Try direct parsing if it looks like JSON
          else {
            try {
              // Try to clean up the string and parse it
              let cleanStr = employees;
              if (cleanStr.startsWith('"') && cleanStr.endsWith('"')) {
                cleanStr = cleanStr.slice(1, -1);
              }
              cleanStr = cleanStr.replace(/\\"/g, '"');
              
              // If it starts with { try as single object
              if (cleanStr.startsWith('{')) {
                const empData = JSON.parse(cleanStr);
                fixedEmployees.push(empData);
              }
            } catch (e) {
              console.log(`Failed pattern 3: ${employees}`);
            }
          }
        }
        
        if (fixedEmployees.length > 0) {
          // Update the record with proper JSON format
          await pool.query(
            'UPDATE shift_reports SET employees = $1 WHERE id = $2',
            [JSON.stringify(fixedEmployees), id]
          );
          
          console.log(`Fixed ${date} - Location ${location_id}: ${fixedEmployees.length} employees`);
          fixedCount++;
        }
        
      } catch (error) {
        console.error(`Error processing record ${row.id}:`, error);
      }
    }
    
    console.log(`Comprehensive fix completed! Fixed ${fixedCount} records.`);
    
  } catch (error) {
    console.error('Error in comprehensive fix:', error);
  } finally {
    await pool.end();
  }
}

comprehensiveFix();