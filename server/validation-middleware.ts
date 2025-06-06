/**
 * Comprehensive validation middleware to prevent critical data integrity issues
 * This middleware ensures data consistency and prevents corruption patterns
 */

import { Request, Response, NextFunction } from 'express';

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Validate employee data structure and content
 */
export function validateEmployeeDataMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.body.employees) {
    return next();
  }

  try {
    let employees = req.body.employees;
    
    // Parse if string
    if (typeof employees === 'string') {
      try {
        employees = JSON.parse(employees);
      } catch (parseError) {
        return res.status(400).json({
          message: 'Invalid employee JSON format',
          field: 'employees',
          error: 'Failed to parse employee data'
        });
      }
    }

    // Validate array structure
    if (!Array.isArray(employees)) {
      return res.status(400).json({
        message: 'Employee data must be an array',
        field: 'employees',
        received: typeof employees
      });
    }

    // Validate each employee object
    const errors: ValidationError[] = [];
    employees.forEach((emp: any, index: number) => {
      if (!emp.name || typeof emp.name !== 'string' || emp.name.trim().length === 0) {
        errors.push({
          field: `employees[${index}].name`,
          message: 'Employee name is required and must be a non-empty string',
          value: emp.name
        });
      }

      if (emp.hours !== undefined) {
        const hours = Number(emp.hours);
        if (isNaN(hours) || hours < 0 || hours > 24) {
          errors.push({
            field: `employees[${index}].hours`,
            message: 'Employee hours must be a valid number between 0 and 24',
            value: emp.hours
          });
        }
      }

      if (emp.cashPaid !== undefined) {
        const cashPaid = Number(emp.cashPaid);
        if (isNaN(cashPaid) || cashPaid < 0) {
          errors.push({
            field: `employees[${index}].cashPaid`,
            message: 'Cash paid must be a non-negative number',
            value: emp.cashPaid
          });
        }
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        message: 'Employee data validation failed',
        errors
      });
    }

    // Store validated data back to request
    req.body.employees = employees;
    next();
  } catch (error) {
    return res.status(500).json({
      message: 'Employee data validation error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Validate date format and prevent timezone issues
 */
export function validateDateMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.body.date) {
    return next();
  }

  const dateString = req.body.date;
  
  // Validate YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return res.status(400).json({
      message: 'Invalid date format. Must be YYYY-MM-DD',
      field: 'date',
      received: dateString
    });
  }

  // Validate actual date values
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  if (date.getFullYear() !== year || 
      date.getMonth() !== month - 1 || 
      date.getDate() !== day) {
    return res.status(400).json({
      message: 'Invalid date values',
      field: 'date',
      received: dateString
    });
  }

  // Prevent future dates beyond 1 day
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  if (date > tomorrow) {
    return res.status(400).json({
      message: 'Date cannot be more than 1 day in the future',
      field: 'date',
      received: dateString
    });
  }

  // Prevent dates older than 1 year
  const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
  if (date < oneYearAgo) {
    return res.status(400).json({
      message: 'Date cannot be older than 1 year',
      field: 'date',
      received: dateString
    });
  }

  next();
}

/**
 * Validate numeric fields to prevent calculation errors
 */
export function validateNumericFieldsMiddleware(req: Request, res: Response, next: NextFunction) {
  const numericFields = [
    'totalCars', 'creditCardCars', 'totalCashCollected', 'companyCashTurnIn',
    'totalReceipts', 'totalJobHours', 'overShort'
  ];

  const errors: ValidationError[] = [];

  numericFields.forEach(field => {
    if (req.body[field] !== undefined) {
      const value = Number(req.body[field]);
      if (isNaN(value)) {
        errors.push({
          field,
          message: `${field} must be a valid number`,
          value: req.body[field]
        });
      } else if (value < 0 && field !== 'overShort') {
        errors.push({
          field,
          message: `${field} cannot be negative`,
          value: req.body[field]
        });
      }
    }
  });

  if (errors.length > 0) {
    return res.status(400).json({
      message: 'Numeric field validation failed',
      errors
    });
  }

  next();
}

/**
 * Combined validation middleware for shift reports
 */
export function validateShiftReportMiddleware(req: Request, res: Response, next: NextFunction) {
  validateDateMiddleware(req, res, (err) => {
    if (err) return next(err);
    
    validateEmployeeDataMiddleware(req, res, (err) => {
      if (err) return next(err);
      
      validateNumericFieldsMiddleware(req, res, next);
    });
  });
}

/**
 * Logging middleware to track data integrity issues
 */
export function dataIntegrityLoggingMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalSend = res.json;
  
  res.json = function(data: any) {
    // Log validation failures for monitoring
    if (res.statusCode >= 400 && data.message && data.message.includes('validation')) {
      console.error('[DATA INTEGRITY ALERT]', {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        validationError: data,
        requestBody: req.body,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
}