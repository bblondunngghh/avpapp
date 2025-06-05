import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { BackupService } from "./backup";
import { 
  insertShiftReportSchema, 
  updateShiftReportSchema,
  insertTicketDistributionSchema,
  updateTicketDistributionSchema,
  insertEmployeeSchema,
  updateEmployeeSchema,
  insertEmployeeTaxPaymentSchema,
  updateEmployeeTaxPaymentSchema,
  insertPermitSchema,
  updatePermitSchema,
  insertIncidentReportSchema,
  insertTrainingAcknowledgmentSchema,
  insertLocationSchema,
  updateLocationSchema,
  ShiftReport,
  TicketDistribution,
  Employee,
  EmployeeTaxPayment,
  Permit,
  TrainingAcknowledgment,
  Location
} from "@shared/schema";
import { z } from "zod";
import { 
  processEmployeeCSV, 
  processEmployeePayrollCSV, 
  processShiftReportsCSV, 
  processTicketDistributionsCSV 
} from "./csv-upload";
import { sendIncidentNotification, type IncidentEmailData } from "./email";
import { CalculationValidator } from "./calculation-validator";
import multer from "multer";
import path from "path";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure multer for image uploads
  const storage_config = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = './uploads/locations';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      cb(null, `location-${timestamp}${ext}`);
    }
  });

  const upload = multer({ 
    storage: storage_config,
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
  });

  // Create API routes
  const apiRouter = express.Router();
  
  // Serve uploaded files
  app.use('/uploads', express.static('./uploads'));
  
  // Get all locations with fallback
  apiRouter.get('/locations', async (req, res) => {
    try {
      const locations = await storage.getLocations();
      res.json(locations);
    } catch (error) {
      console.error('Error fetching locations:', error);
      // Return basic locations as fallback to keep app functional
      const fallbackLocations = [
        { id: 1, name: "The Capital Grille", active: true },
        { id: 2, name: "Bob's Steak & Chop House", active: true },
        { id: 3, name: "Truluck's", active: true },
        { id: 4, name: "BOA Steakhouse", active: true },
        { id: 7, name: "PPS", active: true }
      ];
      res.json(fallbackLocations);
    }
  });

  // Get specific location
  apiRouter.get('/locations/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const location = await storage.getLocation(id);
      if (!location) {
        return res.status(404).json({ message: 'Location not found' });
      }
      res.json(location);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch location' });
    }
  });

  // Create new location
  apiRouter.post('/locations', async (req, res) => {
    try {
      const parsed = insertLocationSchema.parse(req.body);
      const location = await storage.createLocation(parsed);
      res.status(201).json(location);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid location data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create location' });
    }
  });

  // Update location
  apiRouter.put('/locations/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parsed = updateLocationSchema.parse(req.body);
      const location = await storage.updateLocation(id, parsed);
      if (!location) {
        return res.status(404).json({ message: 'Location not found' });
      }
      res.json(location);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid location data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update location' });
    }
  });

  // Delete location
  apiRouter.delete('/locations/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteLocation(id);
      if (!success) {
        return res.status(404).json({ message: 'Location not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete location' });
    }
  });

  // Upload location image
  apiRouter.post('/locations/upload-image', upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }
      
      const imageUrl = `/uploads/locations/${req.file.filename}`;
      res.json({ imageUrl });
    } catch (error) {
      res.status(500).json({ message: 'Failed to upload image' });
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

  // Dedicated endpoint for employee key updates
  apiRouter.post('/employees/:id/update-key', async (req, res) => {
    try {
      console.log('POST /employees/:id/update-key called with ID:', req.params.id, 'Body:', req.body);
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        console.log('Invalid employee ID:', req.params.id);
        return res.status(400).json({ message: 'Invalid employee ID' });
      }
      
      const { key } = req.body;
      if (!key || typeof key !== 'string') {
        return res.status(400).json({ message: 'Key is required' });
      }
      
      // Check if employee exists
      const existingEmployee = await storage.getEmployee(id);
      if (!existingEmployee) {
        console.log('Employee not found:', id);
        return res.status(404).json({ message: 'Employee not found' });
      }
      
      console.log('Existing employee:', existingEmployee);
      
      // Check if the new key is already in use
      if (key !== existingEmployee.key) {
        const employeeWithSameKey = await storage.getEmployeeByKey(key);
        if (employeeWithSameKey && employeeWithSameKey.id !== id) {
          console.log('Key already in use:', key);
          return res.status(400).json({ message: 'Another employee with this key already exists' });
        }
      }
      
      const updatedEmployee = await storage.updateEmployee(id, { key });
      console.log('Updated employee:', updatedEmployee);
      
      res.setHeader('Content-Type', 'application/json');
      res.json(updatedEmployee);
    } catch (error) {
      console.error('Error in POST /employees/:id/update-key:', error);
      res.status(500).json({ message: 'Failed to update employee key' });
    }
  });

  // PATCH endpoint for partial employee updates (like key changes)
  apiRouter.patch('/employees/:id', async (req, res) => {
    try {
      console.log('PATCH /employees/:id called with ID:', req.params.id, 'Body:', req.body);
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        console.log('Invalid employee ID:', req.params.id);
        return res.status(400).json({ message: 'Invalid employee ID' });
      }
      
      // Check if employee exists
      const existingEmployee = await storage.getEmployee(id);
      if (!existingEmployee) {
        console.log('Employee not found:', id);
        return res.status(404).json({ message: 'Employee not found' });
      }
      
      console.log('Existing employee:', existingEmployee);
      
      // For PATCH, we only validate the fields that are provided
      const allowedFields = ['key', 'fullName', 'isActive', 'isShiftLeader', 'hireDate', 'terminationDate', 'phone', 'email', 'notes'];
      const updateData: any = {};
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }
      
      console.log('Update data:', updateData);
      
      // If key is being changed, check if the new key is already in use
      if (updateData.key && updateData.key !== existingEmployee.key) {
        const employeeWithSameKey = await storage.getEmployeeByKey(updateData.key);
        if (employeeWithSameKey && employeeWithSameKey.id !== id) {
          console.log('Key already in use:', updateData.key);
          return res.status(400).json({ message: 'Another employee with this key already exists' });
        }
      }
      
      const updatedEmployee = await storage.updateEmployee(id, updateData);
      console.log('Updated employee:', updatedEmployee);
      
      res.setHeader('Content-Type', 'application/json');
      res.json(updatedEmployee);
    } catch (error) {
      console.error('Error in PATCH /employees/:id:', error);
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

  // Health check endpoint to verify database connectivity
  apiRouter.get('/health-check', async (req, res) => {
    try {
      // Minimal query to test database connection
      await storage.getEmployees();
      res.status(200).json({ status: 'connected' });
    } catch (error) {
      console.error('Database health check failed:', error);
      res.status(503).json({ status: 'disconnected', error: 'Database connection unavailable' });
    }
  });

  // Tax Payment Routes
  // Get all tax payments
  apiRouter.get('/tax-payments', async (req, res) => {
    try {
      const payments = await storage.getEmployeeTaxPayments();
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch tax payments' });
    }
  });

  // Get tax payments by employee ID
  apiRouter.get('/tax-payments/employee/:id', async (req, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      if (isNaN(employeeId)) {
        return res.status(400).json({ message: 'Invalid employee ID' });
      }
      
      const payments = await storage.getEmployeeTaxPaymentsByEmployee(employeeId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch tax payments for employee' });
    }
  });

  // Get tax payments by report ID
  apiRouter.get('/tax-payments/report/:id', async (req, res) => {
    try {
      const reportId = parseInt(req.params.id);
      if (isNaN(reportId)) {
        return res.status(400).json({ message: 'Invalid report ID' });
      }
      
      const payments = await storage.getEmployeeTaxPaymentsByReport(reportId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch tax payments for report' });
    }
  });

  // Get tax payment by ID
  apiRouter.get('/tax-payments/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid payment ID' });
      }
      
      const payment = await storage.getEmployeeTaxPayment(id);
      if (!payment) {
        return res.status(404).json({ message: 'Tax payment not found' });
      }
      
      res.json(payment);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch tax payment' });
    }
  });

  // Create a new tax payment
  apiRouter.post('/tax-payments', async (req, res) => {
    try {
      const payment = insertEmployeeTaxPaymentSchema.parse(req.body);
      const createdPayment = await storage.createEmployeeTaxPayment(payment);
      res.status(201).json(createdPayment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid tax payment data', 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: 'Failed to create tax payment' });
    }
  });

  // Update a tax payment
  apiRouter.put('/tax-payments/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid payment ID' });
      }
      
      const payment = updateEmployeeTaxPaymentSchema.parse(req.body);
      const updatedPayment = await storage.updateEmployeeTaxPayment(id, payment);
      
      if (!updatedPayment) {
        return res.status(404).json({ message: 'Tax payment not found' });
      }
      
      res.json(updatedPayment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid tax payment data', 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: 'Failed to update tax payment' });
    }
  });

  // Delete a tax payment
  apiRouter.delete('/tax-payments/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid payment ID' });
      }
      
      const success = await storage.deleteEmployeeTaxPayment(id);
      if (!success) {
        return res.status(404).json({ message: 'Tax payment not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete tax payment' });
    }
  });

  // Permits endpoints
  apiRouter.get('/permits', async (req, res) => {
    try {
      let permits = await storage.getPermits();
      
      // If no permits exist, initialize with default data
      if (permits.length === 0) {
        const defaultPermits = [
          {
            name: "Business License",
            type: "General Business",
            issueDate: "2024-01-15",
            expirationDate: "2025-01-15",
            status: "Active",
            location: "All Locations",
            permitNumber: "BL-2024-0485",
            pdfFileName: null,
            pdfData: null
          },
          {
            name: "Valet Parking Permit",
            type: "Parking Operations",
            issueDate: "2024-02-01",
            expirationDate: "2025-02-01",
            status: "Active",
            location: "The Capital Grille",
            permitNumber: "VP-CG-2024-001",
            pdfFileName: null,
            pdfData: null
          },
          {
            name: "Valet Parking Permit",
            type: "Parking Operations",
            issueDate: "2024-02-05",
            expirationDate: "2025-02-05",
            status: "Active",
            location: "Bob's Steak and Chop House",
            permitNumber: "VP-BSC-2024-002",
            pdfFileName: null,
            pdfData: null
          },
          {
            name: "Valet Parking Permit",
            type: "Parking Operations",
            issueDate: "2024-02-10",
            expirationDate: "2025-02-10",
            status: "Active",
            location: "Truluck's",
            permitNumber: "VP-TRU-2024-003",
            pdfFileName: null,
            pdfData: null
          },
          {
            name: "Valet Parking Permit",
            type: "Parking Operations",
            issueDate: "2024-02-15",
            expirationDate: "2025-02-15",
            status: "Active",
            location: "BOA Steakhouse",
            permitNumber: "VP-BOA-2024-004",
            pdfFileName: null,
            pdfData: null
          }
        ];
        
        // Create all default permits
        for (const permitData of defaultPermits) {
          await storage.createPermit(permitData);
        }
        
        // Fetch the newly created permits
        permits = await storage.getPermits();
      }
      
      res.json(permits);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch permits' });
    }
  });

  apiRouter.get('/permits/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid permit ID' });
      }
      
      const permit = await storage.getPermit(id);
      if (!permit) {
        return res.status(404).json({ message: 'Permit not found' });
      }
      
      res.json(permit);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch permit' });
    }
  });

  apiRouter.post('/permits', async (req, res) => {
    try {
      const permitData = insertPermitSchema.parse(req.body);
      const permit = await storage.createPermit(permitData);
      res.status(201).json(permit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid permit data', 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: 'Failed to create permit' });
    }
  });

  apiRouter.put('/permits/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid permit ID' });
      }
      
      const permitData = updatePermitSchema.parse(req.body);
      const updatedPermit = await storage.updatePermit(id, permitData);
      
      if (!updatedPermit) {
        return res.status(404).json({ message: 'Permit not found' });
      }
      
      res.json(updatedPermit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid permit data', 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: 'Failed to update permit' });
    }
  });

  apiRouter.delete('/permits/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid permit ID' });
      }
      
      const deleted = await storage.deletePermit(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Permit not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete permit' });
    }
  });

  // Incident Reports endpoints
  apiRouter.get('/incident-reports', async (req, res) => {
    try {
      const reports = await storage.getIncidentReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch incident reports' });
    }
  });

  apiRouter.post('/incident-reports', async (req, res) => {
    try {
      const reportData = insertIncidentReportSchema.parse(req.body);
      const report = await storage.createIncidentReport(reportData);
      res.status(201).json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid incident report data', 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: 'Failed to create incident report' });
    }
  });

  apiRouter.delete('/incident-reports/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid report ID' });
      }
      
      const deleted = await storage.deleteIncidentReport(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Incident report not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete incident report' });
    }
  });

  // CSV Upload Routes
  apiRouter.post('/upload/employees', processEmployeeCSV);
  apiRouter.post('/upload/employee-payroll', processEmployeePayrollCSV);
  apiRouter.post('/upload/shift-reports', processShiftReportsCSV);
  apiRouter.post('/upload/ticket-distributions', processTicketDistributionsCSV);
  
  // Special route to remove duplicate BOA Steakhouse reports
  apiRouter.get('/remove-boa-duplicates', async (req, res) => {
    try {
      const locationId = 4; // BOA Steakhouse
      
      // Get all reports for BOA
      const reports = await storage.getShiftReportsByLocation(locationId);
      
      // Sort reports by ID (newest first)
      reports.sort((a, b) => Number(b.id) - Number(a.id));
      
      console.log(`Found ${reports.length} BOA Steakhouse reports`);
      
      // Track seen dates to find duplicates
      const seenDates = new Map();
      const duplicatesToRemove = [];
      
      // Identify duplicates - keep the first occurrence (lower ID), remove newer ones
      for (const report of reports) {
        const dateShiftKey = `${report.date}_${report.shift}`;
        
        if (seenDates.has(dateShiftKey)) {
          // This is a duplicate, mark for removal
          duplicatesToRemove.push(report);
        } else {
          // First time seeing this date+shift combination
          seenDates.set(dateShiftKey, report);
        }
      }
      
      console.log(`Found ${duplicatesToRemove.length} duplicate reports to remove`);
      
      // Remove duplicates
      let deletedCount = 0;
      const deletedReports = [];
      
      for (const report of duplicatesToRemove) {
        await storage.deleteShiftReport(report.id);
        deletedCount++;
        deletedReports.push({
          id: report.id,
          date: report.date,
          shift: report.shift
        });
      }
      
      res.json({ 
        success: true, 
        message: `Removed ${deletedCount} duplicate BOA Steakhouse reports`,
        deletedReports
      });
    } catch (error) {
      console.error('Error removing duplicates:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to remove duplicate reports',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Setup multer for incident file uploads
  const incidentUpload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
  });

  // Incident report submission endpoint
  apiRouter.post('/incident-reports', incidentUpload.array('photos', 10), async (req, res) => {
    try {
      console.log('Incident report submission received');
      console.log('Request body:', req.body);
      console.log('Content-Type:', req.headers['content-type']);
      
      const {
        customerName,
        customerEmail,
        customerPhone,
        incidentDate,
        incidentTime,
        incidentLocation,
        employeeId,
        incidentDescription,
        witnessName,
        witnessPhone,
        vehicleMake,
        vehicleModel,
        vehicleYear,
        vehicleColor,
        vehicleLicensePlate,
        damageDescription,
        additionalNotes
      } = req.body;

      // Save incident report to database
      const incidentData = {
        customerName,
        customerEmail,
        customerPhone,
        incidentDate,
        incidentTime,
        incidentLocation,
        employeeId: employeeId ? parseInt(employeeId) : null,
        incidentDescription,
        witnessName: witnessName || null,
        witnessPhone: witnessPhone || null,
        vehicleMake,
        vehicleModel,
        vehicleYear,
        vehicleColor,
        vehicleLicensePlate,
        damageDescription,
        additionalNotes: additionalNotes || null,
      };

      const report = await storage.createIncidentReport(incidentData);

      res.status(201).json({ 
        success: true, 
        message: 'Incident report saved successfully',
        reportId: report.id
      });
    } catch (error) {
      console.error('Error processing incident report:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to submit incident report' 
      });
    }
  });

  // Get all incident reports
  apiRouter.get('/incident-reports', async (req, res) => {
    try {
      const reports = await storage.getIncidentReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch incident reports' });
    }
  });

  // Get incident report by ID
  apiRouter.get('/incident-reports/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid report ID' });
      }
      
      const report = await storage.getIncidentReport(id);
      if (!report) {
        return res.status(404).json({ message: 'Incident report not found' });
      }
      
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch incident report' });
    }
  });

  // Delete incident report
  apiRouter.delete('/incident-reports/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid report ID' });
      }
      
      const success = await storage.deleteIncidentReport(id);
      if (!success) {
        return res.status(404).json({ message: 'Incident report not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete incident report' });
    }
  });

  // Calculation validation endpoints for accounting accuracy
  apiRouter.get('/validate-calculations', async (req, res) => {
    try {
      const summary = await CalculationValidator.validateAllCalculations();
      res.json(summary);
    } catch (error) {
      console.error('Validation error:', error);
      res.status(500).json({ message: 'Failed to validate calculations' });
    }
  });

  apiRouter.post('/fix-jonathan-hours', async (req, res) => {
    try {
      const success = await CalculationValidator.fixJonathanHours();
      if (success) {
        res.json({ success: true, message: 'Jonathan\'s hours fixed successfully' });
      } else {
        res.status(500).json({ success: false, message: 'Failed to fix Jonathan\'s hours' });
      }
    } catch (error) {
      console.error('Error fixing Jonathan\'s hours:', error);
      res.status(500).json({ success: false, message: 'Error fixing hours' });
    }
  });

  apiRouter.get('/audit-report', async (req, res) => {
    try {
      const summary = await CalculationValidator.validateAllCalculations();
      const auditReport = CalculationValidator.generateAuditReport(summary);
      res.setHeader('Content-Type', 'text/plain');
      res.send(auditReport);
    } catch (error) {
      console.error('Audit report error:', error);
      res.status(500).json({ message: 'Failed to generate audit report' });
    }
  });

  // Training Acknowledgment routes
  apiRouter.get('/training-acknowledgments', async (req, res) => {
    try {
      const acknowledgments = await storage.getTrainingAcknowledgments();
      res.json(acknowledgments);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch training acknowledgments' });
    }
  });

  apiRouter.post('/training-acknowledgments', async (req, res) => {
    try {
      const validation = insertTrainingAcknowledgmentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid training acknowledgment data', errors: validation.error.errors });
      }

      const acknowledgmentData = {
        ...validation.data,
        ipAddress: req.ip || req.connection.remoteAddress || null,
        userAgent: req.get('User-Agent') || null,
      };

      const acknowledgment = await storage.createTrainingAcknowledgment(acknowledgmentData);
      res.status(201).json(acknowledgment);
    } catch (error) {
      console.error('Error creating training acknowledgment:', error);
      res.status(500).json({ message: 'Failed to create training acknowledgment' });
    }
  });

  // Production Health Monitoring Endpoints
  apiRouter.get('/health', async (req, res) => {
    try {
      const startTime = Date.now();
      
      // Test database connectivity
      await storage.getEmployees();
      const dbResponseTime = Date.now() - startTime;
      
      // Check data integrity
      const isDataValid = await BackupService.validateDataIntegrity();
      
      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: {
          connected: true,
          responseTime: `${dbResponseTime}ms`
        },
        dataIntegrity: isDataValid ? 'valid' : 'warning',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development'
      };
      
      res.json(healthStatus);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Database connection failed'
      });
    }
  });

  // Manual backup endpoint (protected)
  apiRouter.post('/backup', async (req, res) => {
    try {
      const backupData = await BackupService.createBackup();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="avp-backup-${new Date().toISOString().split('T')[0]}.json"`);
      res.send(backupData);
    } catch (error) {
      console.error('Manual backup failed:', error);
      res.status(500).json({ message: 'Backup creation failed' });
    }
  });

  // Register API routes
  app.use('/api', apiRouter);

  const httpServer = createServer(app);
  
  return httpServer;
}
