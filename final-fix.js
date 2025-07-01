import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function finalFix() {
  try {
    console.log('Starting final fix for all malformed employee data...');
    
    // Update all records with the specific malformed pattern we saw
    const result = await pool.query(`
      UPDATE shift_reports 
      SET employees = 
        CASE 
          WHEN employees LIKE '"{""{\\"name\\":\\"ryan\\",\\"hours\\":5,\\"cashPaid\\":3}""}"' THEN 
            '[{"name":"ryan","hours":5,"cashPaid":3}]'
          WHEN employees LIKE '"{""{\\"name\\":\\"kevin\\",\\"hours\\":5.5,\\"cashPaid\\":18}""}"' THEN
            '[{"name":"kevin","hours":5.5,"cashPaid":18}]'
          WHEN employees LIKE '"{""{\\"name\\":\\"dave\\",\\"hours\\":5.75,\\"cashPaid\\":11}""}"' THEN
            '[{"name":"dave","hours":5.75,"cashPaid":11}]'
          WHEN employees LIKE '"{""{\\"name\\":\\"jonathan\\",\\"hours\\":6,\\"cashPaid\\":16}""}"' THEN
            '[{"name":"jonathan","hours":6,"cashPaid":16}]'
          WHEN employees LIKE '"{""{\\"name\\":\\"dylan\\",\\"hours\\":6.5,\\"cashPaid\\":0}""}"' THEN
            '[{"name":"dylan","hours":6.5,"cashPaid":0}]'
          -- Handle the general pattern with regex replacement
          ELSE 
            CASE 
              WHEN employees ~ '^"\\{""\\{.*\\}""\\}"$' THEN
                '[' || 
                REPLACE(
                  REPLACE(
                    REPLACE(
                      REPLACE(substring(employees from 5 for length(employees)-8), '\\"', '"'),
                      '""', '"'
                    ),
                    '{"', '{"'
                  ),
                  '"}', '"}'
                ) || 
                ']'
              ELSE employees
            END
        END
      WHERE date >= '2025-06-20' 
      AND employees ~ '^"\\{""\\{.*\\}""\\}"$'
      RETURNING id, date, location_id
    `);
    
    console.log(`Updated ${result.rows.length} records with single employee pattern`);
    
    // Now handle multi-employee records
    const multiResult = await pool.query(`
      UPDATE shift_reports 
      SET employees = 
        '[' || 
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(substring(employees from 3 for length(employees)-4), '\\"', '"'),
                '""', '"'
              ),
              '"","', '","'
            ),
            '{"', '{"'
          ),
          '"}', '"}'
        ) || 
        ']'
      WHERE date >= '2025-06-20' 
      AND employees ~ '^"\\{.*,".*\\}"$'
      AND employees LIKE '%"","%'
      RETURNING id, date, location_id
    `);
    
    console.log(`Updated ${multiResult.rows.length} records with multi-employee pattern`);
    
    console.log('Final fix completed!');
    
  } catch (error) {
    console.error('Error in final fix:', error);
  } finally {
    await pool.end();
  }
}

finalFix();