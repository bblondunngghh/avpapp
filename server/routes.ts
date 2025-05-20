import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertShiftReportSchema, 
  updateShiftReportSchema,
  insertTicketDistributionSchema,
  updateTicketDistributionSchema,
  insertEmployeeSchema,
  updateEmployeeSchema,
  ShiftReport,
  TicketDistribution,
  Employee
} from "@shared/schema";
import { z } from "zod";
import { 
  processEmployeeCSV, 
  processEmployeePayrollCSV, 
  processShiftReportsCSV, 
  processTicketDistributionsCSV 
} from "./csv-upload";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create API routes
  const apiRouter = express.Router();
  
  // Get all locations
  apiRouter.get('/locations', async (req, res) => {
    try {
      const locations = await storage.getLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch locations' });
    }
  });
  
  // Get all shift reports
  apiRouter.get('/shift-reports', async (req, res) => {
    try {
      const reports = await storage.getShiftReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch shift reports' });
    }
  });
  
  // Get shift reports by location
  apiRouter.get('/shift-reports/location/:locationId', async (req, res) => {
    try {
      const locationId = parseInt(req.params.locationId);
      if (isNaN(locationId)) {
        return res.status(400).json({ message: 'Invalid location ID' });
      }
      
      const reports = await storage.getShiftReportsByLocation(locationId);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch shift reports by location' });
    }
  });
  
  // Get shift report by ID
  apiRouter.get('/shift-reports/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid report ID' });
      }
      
      const report = await storage.getShiftReport(id);
      if (!report) {
        return res.status(404).json({ message: 'Shift report not found' });
      }
      
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch shift report' });
    }
  });
  
  // Create a new shift report
  apiRouter.post('/shift-reports', async (req, res) => {
    try {
      const report = insertShiftReportSchema.parse(req.body);
      const createdReport = await storage.createShiftReport(report);
      res.status(201).json(createdReport);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid shift report data', 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: 'Failed to create shift report' });
    }
  });
  
  // Update a shift report
  apiRouter.put('/shift-reports/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid report ID' });
      }
      
      const report = updateShiftReportSchema.parse(req.body);
      const updatedReport = await storage.updateShiftReport(id, report);
      
      if (!updatedReport) {
        return res.status(404).json({ message: 'Shift report not found' });
      }
      
      res.json(updatedReport);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid shift report data', 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: 'Failed to update shift report' });
    }
  });
  
  // Delete a shift report
  apiRouter.delete('/shift-reports/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid report ID' });
      }
      
      const success = await storage.deleteShiftReport(id);
      if (!success) {
        return res.status(404).json({ message: 'Shift report not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete shift report' });
    }
  });
  
  // Ticket Distribution API Routes
  // Get all ticket distributions
  apiRouter.get('/ticket-distributions', async (req, res) => {
    try {
      const distributions = await storage.getTicketDistributions();
      res.json(distributions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch ticket distributions' });
    }
  });
  
  // Get ticket distributions by location
  apiRouter.get('/ticket-distributions/location/:locationId', async (req, res) => {
    try {
      const locationId = parseInt(req.params.locationId);
      if (isNaN(locationId)) {
        return res.status(400).json({ message: 'Invalid location ID' });
      }
      
      const distributions = await storage.getTicketDistributionsByLocation(locationId);
      res.json(distributions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch ticket distributions by location' });
    }
  });
  
  // Get ticket distribution by ID
  apiRouter.get('/ticket-distributions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid distribution ID' });
      }
      
      const distribution = await storage.getTicketDistribution(id);
      if (!distribution) {
        return res.status(404).json({ message: 'Ticket distribution not found' });
      }
      
      res.json(distribution);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch ticket distribution' });
    }
  });
  
  // Create a new ticket distribution
  apiRouter.post('/ticket-distributions', async (req, res) => {
    try {
      const distribution = insertTicketDistributionSchema.parse(req.body);
      const createdDistribution = await storage.createTicketDistribution(distribution);
      res.status(201).json(createdDistribution);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid ticket distribution data', 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: 'Failed to create ticket distribution' });
    }
  });
  
  // Update a ticket distribution
  apiRouter.put('/ticket-distributions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid distribution ID' });
      }
      
      const distribution = updateTicketDistributionSchema.parse(req.body);
      const updatedDistribution = await storage.updateTicketDistribution(id, distribution);
      
      if (!updatedDistribution) {
        return res.status(404).json({ message: 'Ticket distribution not found' });
      }
      
      res.json(updatedDistribution);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid ticket distribution data', 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: 'Failed to update ticket distribution' });
    }
  });
  
  // Delete a ticket distribution
  apiRouter.delete('/ticket-distributions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid distribution ID' });
      }
      
      const success = await storage.deleteTicketDistribution(id);
      if (!success) {
        return res.status(404).json({ message: 'Ticket distribution not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete ticket distribution' });
    }
  });
  
  // Employee routes
  
  // Get all employees
  apiRouter.get('/employees', async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch employees' });
    }
  });
  
  // Get active employees
  apiRouter.get('/employees/active', async (req, res) => {
    try {
      const employees = await storage.getActiveEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch active employees' });
    }
  });
  
  // Get shift leaders
  apiRouter.get('/employees/shift-leaders', async (req, res) => {
    try {
      const employees = await storage.getShiftLeaders();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch shift leaders' });
    }
  });
  
  // Get employee by ID
  apiRouter.get('/employees/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid employee ID' });
      }
      
      const employee = await storage.getEmployee(id);
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch employee' });
    }
  });
  
  // Create a new employee
  apiRouter.post('/employees', async (req, res) => {
    try {
      console.log("POST /employees - Request Body:", req.body);
      
      const validatedData = insertEmployeeSchema.parse(req.body);
      
      // Check if employee with this key already exists
      const existingEmployee = await storage.getEmployeeByKey(validatedData.key);
      if (existingEmployee) {
        return res.status(400).json({ message: 'Employee with this key already exists' });
      }
      
      const employee = await storage.createEmployee(validatedData);
      console.log("Employee created:", employee);
      res.status(200).json(employee);
    } catch (error: any) {
      console.error("Error creating employee:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid employee data', 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: error.message || 'Failed to create employee' 
      });
    }
  });
  
  // Update an employee
  apiRouter.put('/employees/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid employee ID' });
      }
      
      const validatedData = updateEmployeeSchema.parse(req.body);
      
      // Check if employee exists
      const existingEmployee = await storage.getEmployee(id);
      if (!existingEmployee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      
      // If key is being changed, check if the new key is already in use
      if (validatedData.key && validatedData.key !== existingEmployee.key) {
        const employeeWithSameKey = await storage.getEmployeeByKey(validatedData.key);
        if (employeeWithSameKey && employeeWithSameKey.id !== id) {
          return res.status(400).json({ message: 'Another employee with this key already exists' });
        }
      }
      
      const updatedEmployee = await storage.updateEmployee(id, validatedData);
      res.json(updatedEmployee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid employee data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update employee' });
    }
  });
  
  // Employee login API endpoint
  apiRouter.post('/employee-login', async (req, res) => {
    try {
      console.log('Employee login attempt:', req.body);
      
      const { key, fullName } = req.body;
      
      if (!key || !fullName) {
        console.log('Missing key or fullName in request');
        return res.status(400).json({ message: 'Employee key and full name are required' });
      }
      
      // Find employee by key
      const employee = await storage.getEmployeeByKey(key);
      console.log('Employee found by key:', employee ? `${employee.key} (${employee.fullName})` : 'none');
      
      if (!employee) {
        return res.status(401).json({ message: 'Invalid employee credentials' });
      }
      
      // Debug fullname comparison
      console.log('Fullname comparison:', {
        provided: fullName.toLowerCase(),
        stored: employee.fullName.toLowerCase(),
        matches: employee.fullName.toLowerCase() === fullName.toLowerCase()
      });
      
      // Check if the full name matches
      if (employee.fullName.toLowerCase() !== fullName.toLowerCase()) {
        return res.status(401).json({ message: 'Invalid employee credentials' });
      }
      
      // If inactive employee
      if (!employee.isActive) {
        return res.status(401).json({ message: 'Your account is inactive. Please contact your manager.' });
      }
      
      // Return employee info (excluding password)
      const employeeResponse = {
        id: employee.id,
        key: employee.key,
        fullName: employee.fullName,
        isActive: employee.isActive,
        isShiftLeader: employee.isShiftLeader
      };
      
      console.log('Login successful, returning:', employeeResponse);
      res.json(employeeResponse);
    } catch (error) {
      console.error('Employee login error:', error);
      res.status(500).json({ message: 'An error occurred during login' });
    }
  });

  // Delete an employee
  apiRouter.delete('/employees/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid employee ID' });
      }
      
      const success = await storage.deleteEmployee(id);
      if (!success) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete employee' });
    }
  });

  // CSV Upload Routes
  apiRouter.post('/upload/employees', processEmployeeCSV);
  apiRouter.post('/upload/employee-payroll', processEmployeePayrollCSV);
  apiRouter.post('/upload/shift-reports', processShiftReportsCSV);
  apiRouter.post('/upload/ticket-distributions', processTicketDistributionsCSV);

  // Register API routes
  app.use('/api', apiRouter);

  const httpServer = createServer(app);
  
  return httpServer;
}
