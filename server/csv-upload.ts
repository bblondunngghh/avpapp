import { Request, Response } from 'express';
import { parse } from 'csv-parse/sync';
import { storage } from './storage';

// Process employee payroll CSV
export async function processEmployeePayrollCSV(req: Request, res: Response) {
  try {
    if (!req.body.csvData) {
      return res.status(400).json({ error: 'No CSV data provided' });
    }
    
    // Test database connection before processing
    try {
      await storage.getEmployees();
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return res.status(503).json({ 
        error: 'Database connection issue. Your CSV data has been saved locally and will be processed when the connection is restored.',
        connectionError: true
      });
    }

    const csvData = req.body.csvData;
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    const results = {
      success: [] as any[],
      errors: [] as any[]
    };

    // Process each row in the CSV
    for (const record of records) {
      try {
        // Check if employee exists
        const existingEmployee = await storage.getEmployeeByKey(record.key);
        
        // Update employee with payroll data
        const payrollData = {
          hoursWorked: parseFloat(record.hoursWorked),
          creditCardCommission: parseFloat(record.creditCardCommission),
          creditCardTips: parseFloat(record.creditCardTips),
          cashCommission: parseFloat(record.cashCommission),
          cashTips: parseFloat(record.cashTips),
          receiptCommission: parseFloat(record.receiptCommission),
          receiptTips: parseFloat(record.receiptTips),
          totalEarnings: parseFloat(record.totalEarnings),
          moneyOwed: parseFloat(record.moneyOwed),
          taxesOwed: parseFloat(record.taxesOwed)
        };

        // If employee doesn't exist, create new record
        if (!existingEmployee) {
          const newEmployee = await storage.createEmployee({
            key: record.key,
            fullName: record.fullName,
            isActive: record.isActive === 'TRUE',
            isShiftLeader: record.isShiftLeader === 'TRUE',
            phone: record.phone || null,
            email: record.email || null,
            hireDate: record.hireDate || new Date().toISOString().split('T')[0],
            notes: record.notes || null,
            payrollData: payrollData
          });
          
          results.success.push({
            key: record.key,
            fullName: record.fullName,
            status: 'created'
          });
        } else {
          // Update existing employee
          await storage.updateEmployee(existingEmployee.id, {
            key: record.key,
            fullName: record.fullName,
            isActive: record.isActive === 'TRUE',
            isShiftLeader: record.isShiftLeader === 'TRUE',
            phone: record.phone || null,
            email: record.email || null,
            hireDate: record.hireDate || existingEmployee.hireDate,
            notes: record.notes || existingEmployee.notes,
            terminationDate: existingEmployee.terminationDate,
            payrollData: payrollData
          });
          
          results.success.push({
            key: record.key,
            fullName: record.fullName,
            status: 'updated'
          });
        }
      } catch (error) {
        results.errors.push({
          key: record.key,
          fullName: record.fullName,
          error: error.message
        });
      }
    }

    return res.status(200).json({
      message: `Processed ${records.length} records: ${results.success.length} successful, ${results.errors.length} errors`,
      results
    });
  } catch (error) {
    console.error('Error processing CSV:', error);
    return res.status(500).json({ error: 'Failed to process CSV: ' + error.message });
  }
}

// Process regular employee CSV
export async function processEmployeeCSV(req: Request, res: Response) {
  try {
    if (!req.body.csvData) {
      return res.status(400).json({ error: 'No CSV data provided' });
    }
    
    // Test database connection before processing
    try {
      await storage.getEmployees();
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return res.status(503).json({ 
        error: 'Database connection issue. Your CSV data has been saved locally and will be processed when the connection is restored.',
        connectionError: true
      });
    }

    const csvData = req.body.csvData;
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    const results = {
      success: [] as any[],
      errors: [] as any[]
    };

    // Process each row in the CSV
    for (const record of records) {
      try {
        // Check if employee exists
        const existingEmployee = await storage.getEmployeeByKey(record.key);
        
        // If employee doesn't exist, create new record
        if (!existingEmployee) {
          const newEmployee = await storage.createEmployee({
            key: record.key,
            fullName: record.fullName,
            isActive: record.isActive === 'TRUE',
            isShiftLeader: record.isShiftLeader === 'TRUE',
            phone: record.phone || null,
            email: record.email || null,
            hireDate: record.hireDate || new Date().toISOString().split('T')[0],
            notes: record.notes || null
          });
          
          results.success.push({
            key: record.key,
            fullName: record.fullName,
            status: 'created'
          });
        } else {
          // Update existing employee
          await storage.updateEmployee(existingEmployee.id, {
            key: record.key,
            fullName: record.fullName,
            isActive: record.isActive === 'TRUE',
            isShiftLeader: record.isShiftLeader === 'TRUE',
            phone: record.phone || null,
            email: record.email || null,
            hireDate: record.hireDate || existingEmployee.hireDate,
            notes: record.notes || existingEmployee.notes,
            terminationDate: existingEmployee.terminationDate
          });
          
          results.success.push({
            key: record.key,
            fullName: record.fullName,
            status: 'updated'
          });
        }
      } catch (error) {
        results.errors.push({
          key: record.key,
          fullName: record.fullName,
          error: error.message
        });
      }
    }

    return res.status(200).json({
      message: `Processed ${records.length} records: ${results.success.length} successful, ${results.errors.length} errors`,
      results
    });
  } catch (error) {
    console.error('Error processing CSV:', error);
    return res.status(500).json({ error: 'Failed to process CSV: ' + error.message });
  }
}

// Process ticket distributions CSV
export async function processTicketDistributionsCSV(req: Request, res: Response) {
  try {
    if (!req.body.csvData) {
      return res.status(400).json({ error: 'No CSV data provided' });
    }
    
    // Test database connection before processing
    try {
      await storage.getTicketDistributions();
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return res.status(503).json({ 
        error: 'Database connection issue. Your CSV data has been saved locally and will be processed when the connection is restored.',
        connectionError: true
      });
    }

    const csvData = req.body.csvData;
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    const results = {
      success: [] as any[],
      errors: [] as any[]
    };

    // Process each row in the CSV
    for (const record of records) {
      try {
        const newDistribution = await storage.createTicketDistribution({
          locationId: parseInt(record.locationId),
          allocatedTickets: parseInt(record.allocatedTickets),
          usedTickets: parseInt(record.usedTickets),
          batchNumber: record.batchNumber,
          notes: record.notes || null
        });
        
        results.success.push({
          locationId: record.locationId,
          batchNumber: record.batchNumber,
          status: 'created'
        });
      } catch (error) {
        results.errors.push({
          locationId: record.locationId,
          batchNumber: record.batchNumber,
          error: error.message
        });
      }
    }

    return res.status(200).json({
      message: `Processed ${records.length} records: ${results.success.length} successful, ${results.errors.length} errors`,
      results
    });
  } catch (error) {
    console.error('Error processing CSV:', error);
    return res.status(500).json({ error: 'Failed to process CSV: ' + error.message });
  }
}

// Process shift reports CSV
export async function processShiftReportsCSV(req: Request, res: Response) {
  try {
    if (!req.body.csvData) {
      return res.status(400).json({ error: 'No CSV data provided' });
    }

    const csvData = req.body.csvData;
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    const results = {
      success: [] as any[],
      errors: [] as any[]
    };

    // Process each row in the CSV
    for (const record of records) {
      try {
        const newReport = await storage.createShiftReport({
          locationId: parseInt(record.locationId),
          date: record.date,
          shift: record.shift,
          manager: record.manager,
          totalCars: parseInt(record.totalCars),
          complimentaryCars: parseInt(record.complimentaryCars),
          creditTransactions: parseInt(record.creditTransactions),
          totalCreditSales: parseFloat(record.totalCreditSales),
          totalReceipts: parseInt(record.totalReceipts),
          totalCashCollected: parseFloat(record.totalCashCollected),
          companyCashTurnIn: parseFloat(record.companyCashTurnIn),
          totalTurnIn: parseFloat(record.totalTurnIn),
          overShort: parseFloat(record.overShort),
          totalJobHours: parseFloat(record.totalJobHours),
          employees: '[]', // Default empty array
          notes: record.notes || null,
          incidents: record.incidents || null
        });
        
        results.success.push({
          locationId: record.locationId,
          date: record.date,
          shift: record.shift,
          status: 'created'
        });
      } catch (error) {
        results.errors.push({
          locationId: record.locationId,
          date: record.date,
          shift: record.shift,
          error: error.message
        });
      }
    }

    return res.status(200).json({
      message: `Processed ${records.length} records: ${results.success.length} successful, ${results.errors.length} errors`,
      results
    });
  } catch (error) {
    console.error('Error processing CSV:', error);
    return res.status(500).json({ error: 'Failed to process CSV: ' + error.message });
  }
}