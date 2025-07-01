import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function manualFix() {
  try {
    console.log('Starting manual fix for employee data...');
    
    // Get all problematic records
    const result = await pool.query(`
      SELECT id, date, location_id, employees 
      FROM shift_reports 
      WHERE date >= '2025-06-20' 
      AND employees LIKE '%name%'
      AND employees NOT LIKE '[%'
      ORDER BY date, id
    `);
    
    console.log(`Found ${result.rows.length} records to fix`);
    
    for (const row of result.rows) {
      const { id, date, location_id, employees } = row;
      
      try {
        // Extract employee data from the malformed string
        let fixedEmployees = [];
        
        // Try to extract JSON objects from the malformed string
        const nameMatches = employees.match(/"name":"([^"]+)"/g);
        const hoursMatches = employees.match(/"hours":([0-9.]+)/g);
        const cashPaidMatches = employees.match(/"cashPaid":([0-9.]+)/g);
        
        if (nameMatches && hoursMatches && cashPaidMatches) {
          for (let i = 0; i < nameMatches.length; i++) {
            const name = nameMatches[i].match(/"name":"([^"]+)"/)[1];
            const hours = parseFloat(hoursMatches[i].match(/"hours":([0-9.]+)/)[1]);
            const cashPaid = parseFloat(cashPaidMatches[i].match(/"cashPaid":([0-9.]+)/)[1]);
            
            fixedEmployees.push({
              name: name,
              hours: hours,
              cashPaid: cashPaid
            });
          }
        }
        
        if (fixedEmployees.length > 0) {
          // Update with proper JSON format
          await pool.query(
            'UPDATE shift_reports SET employees = $1 WHERE id = $2',
            [JSON.stringify(fixedEmployees), id]
          );
          
          console.log(`Fixed record ${id} (${date}, Location ${location_id}): ${fixedEmployees.length} employees`);
        } else {
          console.log(`Could not parse record ${id}: ${employees}`);
        }
        
      } catch (error) {
        console.error(`Error processing record ${id}:`, error);
      }
    }
    
    console.log('Manual fix completed!');
    
  } catch (error) {
    console.error('Error in manual fix:', error);
  } finally {
    await pool.end();
  }
}

manualFix();