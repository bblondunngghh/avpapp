import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { BackupService } from "./backup";
import { smsService } from "./sms-service";
import { emailService } from "./email-service";
import { pushNotificationService } from "./push-notification-service";

// Helper function to parse MM/DD/YYYY format to Date object
function parseDateOfBirth(dateStr: string): Date | undefined {
  if (!dateStr) return undefined;
  
  // Handle MM/DD/YYYY format
  const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [, month, day, year] = match;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Try to parse as ISO date if not in MM/DD/YYYY format
  const isoDate = new Date(dateStr);
  return isNaN(isoDate.getTime()) ? undefined : isoDate;
}
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
  insertHelpRequestSchema,
  insertHelpResponseSchema,
  insertCoverCountReportSchema,
  insertPushSubscriptionSchema,
  insertLocationSchema,
  updateLocationSchema,
  ShiftReport,
  TicketDistribution,
  Employee,
  EmployeeTaxPayment,
  Permit,
  TrainingAcknowledgment,
  HelpRequest,
  HelpResponse,
  Location,
  PushSubscription
} from "@shared/schema";
import { z } from "zod";
import { 
  processEmployeeCSV, 
  processEmployeePayrollCSV, 
  processShiftReportsCSV, 
  processTicketDistributionsCSV 
} from "./csv-upload";
import { sendIncidentNotification, sendCustomerConfirmation, type IncidentEmailData, type CustomerConfirmationData } from "./email";
import { 
  validateShiftReportMiddleware, 
  dataIntegrityLoggingMiddleware 
} from "./validation-middleware";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for document uploads
const documentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './uploads/documents';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const category = req.body.category || 'document';
    const ext = path.extname(file.originalname);
    cb(null, `${category}_${timestamp}${ext}`);
  }
});

const uploadDocument = multer({
  storage: documentStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPEG, and PNG files are allowed.'));
    }
  }
});

// Validation functions to prevent critical data integrity issues
function validateEmployeeData(employees: any): any[] {
  if (Array.isArray(employees)) {
    return employees;
  }
  
  if (typeof employees === 'string') {
    try {
      let parsed;
      
      // Handle multiple levels of JSON escaping
      let currentData = employees;
      let attempts = 0;
      
      while (typeof currentData === 'string' && attempts < 3) {
        // Try to parse as JSON
        try {
          currentData = JSON.parse(currentData);
          attempts++;
        } catch (e) {
          // If parsing fails, try to clean up common malformed patterns
          if (currentData.startsWith('"{') && currentData.endsWith('}"')) {
            // Remove outer quotes and try again
            currentData = currentData.slice(1, -1);
          } else {
            // If we can't parse it, break out
            break;
          }
        }
      }
      
      parsed = currentData;
      
      if (!Array.isArray(parsed)) {
        throw new Error('Parsed employee data is not an array');
      }
      
      // Validate each employee object has required fields
      parsed.forEach((emp: any, index: number) => {
        if (!emp.name || typeof emp.name !== 'string') {
          throw new Error(`Employee at index ${index} missing valid name field`);
        }
        if (emp.hours !== undefined && (isNaN(Number(emp.hours)) || Number(emp.hours) < 0)) {
          throw new Error(`Employee at index ${index} has invalid hours value`);
        }
      });
      return parsed;
    } catch (error) {
      throw new Error(`Failed to parse employee JSON: ${error.message}`);
    }
  }
  
  throw new Error('Employee data must be string or array');
}

function validateDateFormat(dateString: string): boolean {
  // Validate YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }
  
  // Validate actual date values
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && 
         date.getMonth() === month - 1 && 
         date.getDate() === day;
}

// Function to sync cash payments from shift reports to tax payment records
async function syncCashPaymentsToTaxRecords(shiftReport: ShiftReport) {
  try {
    // Use validation function to safely parse employees data
    const employees = validateEmployeeData(shiftReport.employees);

    // Process ALL employees in the shift report (not just those with cash payments)
    for (const emp of employees) {
      // Find the employee by name/key
      const employee = await storage.getEmployeeByKey(emp.name);
      if (employee) {
        // Find existing tax payment record for this employee and report
        const taxPayments = await storage.getEmployeeTaxPayments();
        const existingTaxPayment = taxPayments.find(tp => 
          tp.employeeId === employee.id && tp.reportId === shiftReport.id
        );

        // If employee has cash payment, update or create tax payment record
        if (emp.cashPaid && emp.cashPaid > 0) {
          if (existingTaxPayment) {
            // Update existing tax payment record with new cash paid amount (additive)
            const newPaidAmount = Number(existingTaxPayment.paidAmount) + Number(emp.cashPaid);
            await storage.updateEmployeeTaxPayment(existingTaxPayment.id, {
              paidAmount: newPaidAmount.toString(),
              remainingAmount: Math.max(0, Number(existingTaxPayment.taxAmount) - newPaidAmount).toString()
            });
          } else {
            // Create new tax payment record if none exists
            // Calculate earnings and tax for this employee
            const location = await storage.getLocation(shiftReport.locationId);
            if (location) {
              const totalHours = employees.reduce((sum, e) => sum + e.hours, 0);
              const hoursPercent = emp.hours / totalHours;
              
              // Calculate commission and tips
              const totalCommission = shiftReport.totalCars * location.employeeCommission;
              const totalTips = shiftReport.totalCreditSales * 0.02;
              const empCommission = totalCommission * hoursPercent;
              const empTips = totalTips * hoursPercent;
              const empEarnings = empCommission + empTips;
              
              await storage.createEmployeeTaxPayment({
                employeeId: employee.id,
                reportId: shiftReport.id,
                locationId: shiftReport.locationId,
                totalEarnings: empEarnings.toFixed(2),
                taxAmount: "0.00",
                paidAmount: emp.cashPaid.toString(),
                remainingAmount: "0.00"
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to sync cash payments to tax records:', error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Serve PDF templates
  // Serve PDF templates
  app.get('/api/pdf-template/valet-temporary', (req, res) => {
    const filePath = '/home/runner/workspace/attached_assets/Valet Temporary Zone Application (10)_1750782335056.pdf';
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error serving PDF template:', err);
        res.status(404).send('PDF template not found');
      }
    });
  });

  // PDF template routes for Temporary Valet Zone
  app.get('/api/pdf-template/trulucks-temp', async (req, res) => {
    try {
      const filePath = '/home/runner/workspace/attached_assets/TL TEMP ZONE COPY APP_1750791005405.pdf';
      const fileBuffer = await fs.promises.readFile(filePath);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Length': fileBuffer.length
      });
      res.send(fileBuffer);
    } catch (error) {
      console.error('Error serving Trulucks temporary zone PDF template:', error);
      res.status(404).json({ error: 'PDF template not found' });
    }
  });

  // Document upload endpoint
  app.post('/api/upload-document', uploadDocument.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { category } = req.body;
      
      if (!category) {
        return res.status(400).json({ error: 'Category is required' });
      }

      // Save document information to database
      const documentData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        category: category,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      };

      // Return success with file details
      res.json({
        success: true,
        filename: req.file.filename,
        originalName: req.file.originalname,
        category: category,
        size: req.file.size,
        mimeType: req.file.mimetype,
        message: 'Document uploaded successfully'
      });

    } catch (error) {
      console.error('Document upload error:', error);
      res.status(500).json({ error: 'Upload failed' });
    }
  });

  // Motor vehicle records upload endpoint
  app.post('/api/upload-motor-vehicle-records', uploadDocument.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { employeeId } = req.body;
      
      if (!employeeId) {
        return res.status(400).json({ error: 'Employee ID is required' });
      }

      // Update employee record with motor vehicle records path
      await storage.updateEmployee(parseInt(employeeId), {
        motorVehicleRecordsPath: req.file.filename
      });

      res.json({
        success: true,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        message: 'Motor vehicle records uploaded successfully'
      });

    } catch (error) {
      console.error('Motor vehicle records upload error:', error);
      res.status(500).json({ error: 'Upload failed' });
    }
  });

  // Serve uploaded documents
  app.get('/api/document/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join('./uploads/documents', filename);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(path.resolve(filePath));
    } else {
      res.status(404).json({ error: 'Document not found' });
    }
  });

  app.get('/api/pdf-template/capital-grille-renewal', async (req, res) => {
    try {
      const filePath = '/home/runner/workspace/attached_assets/CG ANNAUL COPY_1750785436469.pdf';
      const fileBuffer = await fs.promises.readFile(filePath);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Length': fileBuffer.length
      });
      res.send(fileBuffer);
    } catch (error) {
      console.error('Error serving Capital Grille PDF template:', error);
      res.status(404).json({ error: 'PDF template not found' });
    }
  });

  app.get('/api/pdf-template/trulucks-renewal', async (req, res) => {
    try {
      const filePath = '/home/runner/workspace/attached_assets/TL ZONE COPY APP_1750788244278.pdf';
      const fileBuffer = await fs.promises.readFile(filePath);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Length': fileBuffer.length
      });
      res.send(fileBuffer);
    } catch (error) {
      console.error('Error serving Trulucks PDF template:', error);
      res.status(404).json({ error: 'PDF template not found' });
    }
  });

  app.get('/api/pdf-template/boa-renewal', async (req, res) => {
    try {
      const filePath = '/home/runner/workspace/attached_assets/BOA ZONE COPY APP_1750788922208.pdf';
      const fileBuffer = await fs.promises.readFile(filePath);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Length': fileBuffer.length
      });
      res.send(fileBuffer);
    } catch (error) {
      console.error('Error serving BOA PDF template:', error);
      res.status(404).json({ error: 'PDF template not found' });
    }
  });

  app.get('/api/pdf-template/bobs-renewal', async (req, res) => {
    try {
      const filePath = '/home/runner/workspace/attached_assets/BOBS ZONE COPY APP_1750789903294.pdf';
      const fileBuffer = await fs.promises.readFile(filePath);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Length': fileBuffer.length
      });
      res.send(fileBuffer);
    } catch (error) {
      console.error('Error serving Bob\'s PDF template:', error);
      res.status(404).json({ error: 'PDF template not found' });
    }
  });
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
  
  // Get all locations
  apiRouter.get('/locations', async (req, res) => {
    try {
      const locations = await storage.getLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch locations' });
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
  apiRouter.post('/shift-reports', 
    dataIntegrityLoggingMiddleware,
    validateShiftReportMiddleware,
    async (req, res) => {
      try {
        const report = insertShiftReportSchema.parse(req.body);
        const createdReport = await storage.createShiftReport(report);
        
        // Sync cash payments from shift report to tax payment records
        await syncCashPaymentsToTaxRecords(createdReport);
        
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
    }
  );
  
  // Update a shift report
  apiRouter.put('/shift-reports/:id',
    dataIntegrityLoggingMiddleware,
    validateShiftReportMiddleware,
    async (req, res) => {
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
        
        // Sync cash payments from updated shift report to tax payment records
        await syncCashPaymentsToTaxRecords(updatedReport);
        
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
    }
  );
  
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

  // Manual sync endpoint for tax payments
  apiRouter.post('/sync-tax-payments/:reportId', async (req, res) => {
    try {
      const reportId = parseInt(req.params.reportId);
      if (isNaN(reportId)) {
        return res.status(400).json({ message: 'Invalid report ID' });
      }
      
      const report = await storage.getShiftReport(reportId);
      if (!report) {
        return res.status(404).json({ message: 'Shift report not found' });
      }
      
      // Sync cash payments from shift report to tax payment records
      await syncCashPaymentsToTaxRecords(report);
      
      res.json({ success: true, message: 'Tax payments synced successfully' });
    } catch (error) {
      console.error('Failed to sync tax payments:', error);
      res.status(500).json({ message: 'Failed to sync tax payments' });
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

  // Auto-consume tickets using FIFO approach
  apiRouter.post('/ticket-distributions/consume', async (req, res) => {
    try {
      const { locationId, ticketsToConsume } = req.body;
      
      if (!locationId || !ticketsToConsume || ticketsToConsume <= 0) {
        return res.status(400).json({ message: 'Invalid location ID or tickets to consume' });
      }
      
      // Get all ticket distributions for the location, sorted by creation date (oldest first)
      const distributions = await storage.getTicketDistributionsByLocation(locationId);
      const sortedDistributions = distributions.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      let remainingTickets = ticketsToConsume;
      const updates = [];
      
      // Process distributions using FIFO
      for (const distribution of sortedDistributions) {
        if (remainingTickets <= 0) break;
        
        const availableTickets = distribution.allocatedTickets - distribution.usedTickets;
        if (availableTickets > 0) {
          const ticketsToUse = Math.min(availableTickets, remainingTickets);
          const newUsedTickets = distribution.usedTickets + ticketsToUse;
          
          // Update the distribution
          const updatedDistribution = await storage.updateTicketDistribution(distribution.id, {
            locationId: distribution.locationId,
            allocatedTickets: distribution.allocatedTickets,
            usedTickets: newUsedTickets,
            batchNumber: distribution.batchNumber,
            notes: distribution.notes
          });
          
          if (updatedDistribution) {
            updates.push({
              batchNumber: distribution.batchNumber,
              ticketsUsed: ticketsToUse,
              newTotal: newUsedTickets,
              remaining: distribution.allocatedTickets - newUsedTickets
            });
          }
          
          remainingTickets -= ticketsToUse;
        }
      }
      
      res.json({
        success: true,
        ticketsConsumed: ticketsToConsume - remainingTickets,
        ticketsRemaining: remainingTickets,
        updates
      });
    } catch (error) {
      console.error('Error consuming tickets:', error);
      res.status(500).json({ message: 'Failed to consume tickets' });
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

  // Get all employees (including inactive) for accounting purposes
  apiRouter.get('/employees/all', async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch all employees' });
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
      
      // Convert date strings to Date objects for database storage
      const employeeData = {
        ...validatedData,
        hireDate: validatedData.hireDate ? new Date(validatedData.hireDate) : undefined,
        dateOfBirth: validatedData.dateOfBirth ? parseDateOfBirth(validatedData.dateOfBirth) : undefined
      };
      
      // Check if employee with this key already exists
      const existingEmployee = await storage.getEmployeeByKey(employeeData.key);
      if (existingEmployee) {
        return res.status(400).json({ message: 'Employee with this key already exists' });
      }
      
      const employee = await storage.createEmployee(employeeData as any);
      console.log("Employee created:", employee);
      
      // Send email notification to accountant for QuickBooks entry
      try {
        const success = await emailService.sendNewEmployeeNotification(
          employee.fullName,
          employeeData.dateOfBirth ? employeeData.dateOfBirth.toLocaleDateString() : 'Not provided',
          employee.driverLicenseNumber || 'Not provided',
          employee.fullSsn || 'Not provided'
        );
        
        if (success) {
          console.log(`[EMAIL] New employee notification sent for ${employee.fullName}`);
        } else {
          console.log(`[EMAIL] Failed to send notification for ${employee.fullName}`);
        }
      } catch (emailError) {
        console.error('[EMAIL] Error sending new employee notification:', emailError);
      }
      
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
      console.log('PUT /employees/:id - ID:', req.params.id, 'Body:', req.body);
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid employee ID' });
      }
      
      const validatedData = updateEmployeeSchema.parse(req.body);
      
      // Convert date strings to Date objects for database storage
      const updateData = {
        ...validatedData,
        hireDate: validatedData.hireDate ? new Date(validatedData.hireDate) : undefined,
        dateOfBirth: validatedData.dateOfBirth ? parseDateOfBirth(validatedData.dateOfBirth) : undefined
      } as any;
      
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
      
      const updatedEmployee = await storage.updateEmployee(id, updateData);
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
  const incidentStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `incident-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  });

  const incidentUpload = multer({ 
    storage: incidentStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  });

  // Incident report submission endpoint
  apiRouter.post('/incident-reports', incidentUpload.array('photos', 10), async (req, res) => {
    try {
      console.log('Incident report submission received');
      console.log('Request body:', req.body);
      console.log('Files uploaded:', req.files);
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

      // Process uploaded photos
      const photoUrls: string[] = [];
      const photoData: string[] = [];
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          // Generate a URL path for the uploaded file
          const photoUrl = `/uploads/${file.filename}`;
          photoUrls.push(photoUrl);
          
          // Convert photo to base64 and store in database
          const fs = require('fs');
          try {
            const photoBuffer = fs.readFileSync(file.path);
            const base64Data = photoBuffer.toString('base64');
            photoData.push(base64Data);
          } catch (error) {
            console.error('Error reading photo file:', error);
            // Still add empty string to maintain array alignment
            photoData.push('');
          }
        }
      }

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
        photoUrls,
        photoData,
      };

      const report = await storage.createIncidentReport(incidentData);

      // Generate claim number using report ID and date
      const claimNumber = `AVP-${report.id.toString().padStart(4, '0')}-${new Date().getFullYear()}`;

      // Prepare email data for admin notification
      const emailData: IncidentEmailData = {
        customerName,
        customerEmail,
        customerPhone,
        incidentDate,
        incidentTime,
        incidentLocation,
        employeeName: employeeId ? 'Employee ID: ' + employeeId : 'Not specified',
        incidentDescription,
        witnessName: witnessName || undefined,
        witnessPhone: witnessPhone || undefined,
        vehicleMake,
        vehicleModel,
        vehicleYear,
        vehicleColor,
        vehicleLicensePlate,
        damageDescription,
        additionalNotes: additionalNotes || undefined
      };

      // Prepare customer confirmation email data
      const customerEmailData: CustomerConfirmationData = {
        customerName,
        customerEmail,
        claimNumber,
        incidentDate,
        incidentTime,
        incidentLocation
      };

      // Send admin notification email (don't block on failure)
      sendIncidentNotification(emailData).catch(error => {
        console.error('Failed to send admin notification email:', error);
      });

      // Send customer confirmation email (don't block on failure)
      sendCustomerConfirmation(customerEmailData).catch(error => {
        console.error('Failed to send customer confirmation email:', error);
      });

      res.status(201).json({ 
        success: true, 
        message: 'Incident report saved successfully',
        reportId: report.id,
        claimNumber
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

  // Update incident report
  apiRouter.put('/incident-reports/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid report ID' });
      }
      
      const updated = await storage.updateIncidentReport(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: 'Incident report not found' });
      }
      
      res.json({ success: true, message: 'Incident report updated successfully' });
    } catch (error) {
      console.error('Error updating incident report:', error);
      res.status(500).json({ message: 'Failed to update incident report' });
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

  // PDF template endpoints
  app.get('/api/pdf-template/trulucks-temp', async (req, res) => {
    try {
      const filePath = '/home/runner/workspace/templates/trulucks-temp-zone.pdf';
      const fileBuffer = await fs.promises.readFile(filePath);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Length': fileBuffer.length
      });
      res.send(fileBuffer);
    } catch (error) {
      console.error('Error serving Trulucks temp PDF template:', error);
      res.status(404).json({ error: 'PDF template not found' });
    }
  });

  app.get('/api/pdf-template/capital-grille-temp', async (req, res) => {
    try {
      const filePath = '/home/runner/workspace/templates/capital-grille-temp-zone.pdf';
      const fileBuffer = await fs.promises.readFile(filePath);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Length': fileBuffer.length
      });
      res.send(fileBuffer);
    } catch (error) {
      console.error('Error serving Capital Grille temp PDF template:', error);
      res.status(404).json({ error: 'PDF template not found' });
    }
  });

  app.get('/api/pdf-template/bobs-temp', async (req, res) => {
    try {
      const filePath = '/home/runner/workspace/templates/bobs-temp-zone-template.pdf';
      const fileBuffer = await fs.promises.readFile(filePath);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Length': fileBuffer.length
      });
      res.send(fileBuffer);
    } catch (error) {
      console.error('Error serving Bob\'s temp PDF template:', error);
      res.status(404).json({ error: 'PDF template not found' });
    }
  });

  app.get('/api/pdf-template/boa-temp', async (req, res) => {
    try {
      const filePath = '/home/runner/workspace/templates/boa-temp-zone-template.pdf';
      const fileBuffer = await fs.promises.readFile(filePath);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Length': fileBuffer.length
      });
      res.send(fileBuffer);
    } catch (error) {
      console.error('Error serving BOA temp PDF template:', error);
      res.status(404).json({ error: 'PDF template not found' });
    }
  });

  // Help request endpoints
  apiRouter.get('/help-requests/active', async (req, res) => {
    try {
      const requests = await storage.getActiveHelpRequests();
      
      // Map location IDs to names and extract request type
      const locationNames = ['', 'The Capital Grille', 'Bob\'s Steak and Chop House', 'Truluck\'s', 'BOA Steakhouse'];
      
      const transformedRequests = requests.map(request => {
        // Extract request type from message (backed up, pulls, parks)
        let requestType = 'Unknown';
        let description = 'Valet Attendants Needed: Unknown';
        
        if (request.message.includes('backed up')) {
          requestType = 'Backed Up';
          description = 'Valet Attendants Needed: Backed Up';
        } else if (request.message.includes('pulls')) {
          requestType = 'Pulls';
          description = 'Valet Attendants Needed: Pulls';
        } else if (request.message.includes('parks')) {
          requestType = 'Parks';
          description = 'Valet Attendants Needed: Parks';
        }
        
        return {
          id: request.id,
          requestingLocation: locationNames[request.requestingLocationId] || 'Unknown Location',
          requestType,
          description,
          status: request.status,
          requestedAt: request.requestedAt,
          resolvedAt: request.resolvedAt,
          completedAt: request.completedAt,
          autoRemoveAt: request.autoRemoveAt
        };
      });
      
      res.json(transformedRequests);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch active help requests' });
    }
  });

  apiRouter.get('/help-requests/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid request ID' });
      }
      
      const request = await storage.getHelpRequest(id);
      if (!request) {
        return res.status(404).json({ message: 'Help request not found' });
      }
      
      res.json(request);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch help request' });
    }
  });

  apiRouter.post('/help-requests', async (req, res) => {
    try {
      const requestData = insertHelpRequestSchema.parse(req.body);
      const request = await storage.createHelpRequest(requestData);
      
      // Send email/SMS notifications to all other locations
      try {
        const locations = await storage.getLocations();
        const requestingLocation = locations.find(loc => loc.id === request.requestingLocationId);
        const appUrl = process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAIN || 'http://localhost:5000';
        
        if (requestingLocation) {
          // Send notifications to all other active locations
          const otherLocations = locations.filter(loc => 
            loc.id !== request.requestingLocationId && 
            loc.active
          );
          
          let notificationsSent = 0;
          
          for (const location of otherLocations) {
            let notificationSent = false;
            
            // Try SMS first if available and configured
            if (location.smsPhone && smsService.isConfigured()) {
              try {
                await smsService.sendHelpRequestNotification(
                  location.smsPhone,
                  requestingLocation.name,
                  1, // Default to 1 attendant needed
                  request.priority || 'normal',
                  appUrl
                );
                notificationsSent++;
                notificationSent = true;
                console.log(`[HELP REQUEST] SMS notification sent to ${location.name}`);
              } catch (error) {
                console.log(`[HELP REQUEST] SMS failed for ${location.name}, trying email...`);
              }
            }
            
            // Fallback to email-to-SMS if SMS didn't work
            if (!notificationSent && location.notificationEmail) {
              try {
                await emailService.sendHelpRequestNotification(
                  location.notificationEmail,
                  requestingLocation.name,
                  1, // Default to 1 attendant needed
                  request.priority || 'normal',
                  appUrl
                );
                notificationsSent++;
                console.log(`[HELP REQUEST] Email notification sent to ${location.name}`);
              } catch (error) {
                console.log(`[HELP REQUEST] All notifications failed for ${location.name}`);
              }
            }
          }
          
          // Also send push notifications
          try {
            const activeSubscriptions = await storage.getActivePushSubscriptions();
            if (activeSubscriptions.length > 0) {
              await pushNotificationService.sendHelpRequestNotification(
                activeSubscriptions,
                requestingLocation.name,
                1, // Default to 1 attendant needed
                request.priority || 'normal',
                appUrl
              );
              console.log(`[HELP REQUEST] Push notifications sent to ${activeSubscriptions.length} subscribers`);
            }
          } catch (pushError) {
            console.log('[HELP REQUEST] Push notification failed:', pushError);
          }
          
          console.log(`[HELP REQUEST] ${notificationsSent} notifications sent for request from ${requestingLocation.name}`);
        }
      } catch (notificationError) {
        console.error('[HELP REQUEST] Failed to send notifications:', notificationError);
        // Don't fail the request if notifications fail
      }
      
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid help request data', 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: 'Failed to create help request' });
    }
  });

  apiRouter.post('/help-requests/respond', async (req, res) => {
    try {
      const responseData = insertHelpResponseSchema.parse(req.body);
      const response = await storage.createHelpResponse(responseData);
      
      // Send SMS notification to the requesting location
      try {
        const locations = await storage.getLocations();
        const helpRequest = await storage.getHelpRequest(response.helpRequestId);
        const respondingLocation = locations.find(loc => loc.id === response.respondingLocationId);
        const requestingLocation = locations.find(loc => loc.id === helpRequest?.requestingLocationId);
        const appUrl = process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAIN || 'http://localhost:5000';
        
        if (respondingLocation && helpRequest && requestingLocation) {
          // Prefer email, fallback to SMS
          if (requestingLocation.notificationEmail) {
            await emailService.sendHelpResponseNotification(
              requestingLocation.notificationEmail,
              respondingLocation.name,
              requestingLocation.name,
              response.message,
              appUrl
            );
            console.log(`[HELP RESPONSE] Email notification sent to ${requestingLocation.name} about response from ${respondingLocation.name}`);
          } else if (requestingLocation.smsPhone) {
            await smsService.sendHelpResponseNotification(
              requestingLocation.smsPhone,
              respondingLocation.name,
              requestingLocation.name,
              response.message,
              appUrl
            );
            console.log(`[HELP RESPONSE] SMS notification sent to ${requestingLocation.name} about response from ${respondingLocation.name}`);
          }
        }
      } catch (smsError) {
        console.error('[HELP RESPONSE] Failed to send SMS notification:', smsError);
        // Don't fail the request if SMS fails
      }
      
      res.status(201).json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid help response data', 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: 'Failed to create help response' });
    }
  });

  apiRouter.put('/help-requests/:id/fulfill', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid request ID' });
      }
      
      const success = await storage.markHelpRequestFulfilled(id);
      if (!success) {
        return res.status(404).json({ message: 'Help request not found' });
      }
      
      res.json({ success: true, message: 'Help request marked as fulfilled' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fulfill help request' });
    }
  });

  // Push Notification Routes
  apiRouter.post('/push-subscription', async (req, res) => {
    try {
      const subscriptionData = insertPushSubscriptionSchema.parse(req.body);
      const subscription = await storage.createPushSubscription(subscriptionData);
      res.status(201).json(subscription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid subscription data', 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: 'Failed to save push subscription' });
    }
  });

  apiRouter.delete('/push-subscription', async (req, res) => {
    try {
      const { endpoint } = req.body;
      if (!endpoint) {
        return res.status(400).json({ message: 'Endpoint is required' });
      }
      
      const success = await storage.deletePushSubscription(endpoint);
      if (!success) {
        return res.status(404).json({ message: 'Subscription not found' });
      }
      
      res.json({ success: true, message: 'Push subscription removed' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to remove push subscription' });
    }
  });

  apiRouter.get('/push-subscriptions', async (req, res) => {
    try {
      const subscriptions = await storage.getPushSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get push subscriptions' });
    }
  });

  apiRouter.post('/push-test', async (req, res) => {
    try {
      const activeSubscriptions = await storage.getActivePushSubscriptions();
      if (activeSubscriptions.length === 0) {
        return res.json({ 
          message: 'No active push subscriptions to test',
          subscriberCount: 0 
        });
      }

      await pushNotificationService.sendHelpRequestNotification(
        activeSubscriptions,
        'Test Location',
        1,
        'normal',
        process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAIN || 'http://localhost:5000'
      );

      res.json({ 
        message: 'Test notifications sent successfully',
        subscriberCount: activeSubscriptions.length 
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to send test notifications' });
    }
  });

  apiRouter.put('/help-requests/:id/complete', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid request ID' });
      }
      
      const success = await storage.markHelpRequestCompleted(id);
      if (!success) {
        return res.status(404).json({ message: 'Help request not found' });
      }
      
      res.json({ success: true, message: 'Help request marked as completed and will be auto-removed in 5 minutes' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to complete help request' });
    }
  });

  // Get all recent help responses for notifications
  apiRouter.get('/help-responses/recent', async (req, res) => {
    try {
      const responses = await storage.getAllRecentHelpResponses();
      
      // Transform responses to include location names
      const locationNames = ['', 'The Capital Grille', "Bob's Steak and Chop House", 'Truluck\'s', 'BOA Steakhouse'];
      
      const transformedResponses = responses.map(response => ({
        ...response,
        respondingLocationName: locationNames[response.respondingLocationId] || 'Unknown Location'
      }));
      
      res.json(transformedResponses);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch help responses' });
    }
  });

  apiRouter.get('/help-requests/:id/responses', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid request ID' });
      }
      
      const responses = await storage.getHelpResponses(id);
      res.json(responses);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch help responses' });
    }
  });

  // Cover count reporting endpoints
  apiRouter.get('/cover-count/today', async (req, res) => {
    try {
      const reports = await storage.getTodaysCoverCountReports();
      
      // Transform to include location names
      const locationNames = ['', 'The Capital Grille', "Bob's Steak and Chop House", 'Truluck\'s', 'BOA Steakhouse'];
      const transformedReports = reports.map(report => ({
        ...report,
        locationName: locationNames[report.locationId] || 'Unknown Location'
      }));
      
      res.json(transformedReports);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch cover count reports' });
    }
  });

  apiRouter.post('/cover-count', async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Add reportDate to request body before validation
      const dataWithDate = {
        ...req.body,
        reportDate: today
      };
      
      const reportData = insertCoverCountReportSchema.parse(dataWithDate);
      
      // Check if report already exists for this location today
      const existingReport = await storage.getCoverCountReport(reportData.locationId, today);
      if (existingReport) {
        // Update existing report
        const updatedReport = await storage.updateCoverCountReport(existingReport.id, {
          coverCount: reportData.coverCount,
          notes: reportData.notes,
          submittedBy: reportData.submittedBy
        });
        return res.json(updatedReport);
      }
      
      // Create new report
      const report = await storage.createCoverCountReport(reportData);
      
      res.status(201).json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Cover count validation error:', error.errors);
        return res.status(400).json({ 
          message: 'Invalid cover count data', 
          errors: error.errors 
        });
      }
      console.error('Cover count creation error:', error);
      res.status(500).json({ message: 'Failed to create cover count report' });
    }
  });

  // Push notification endpoints
  apiRouter.post('/push/subscribe', async (req, res) => {
    try {
      const subscriptionData = insertPushSubscriptionSchema.parse(req.body);
      const subscription = await storage.createPushSubscription(subscriptionData);
      res.status(201).json(subscription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid subscription data', 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: 'Failed to create push subscription' });
    }
  });

  apiRouter.delete('/push/unsubscribe', async (req, res) => {
    try {
      const { endpoint } = req.body;
      if (!endpoint) {
        return res.status(400).json({ message: 'Endpoint is required' });
      }
      
      const success = await storage.deletePushSubscription(endpoint);
      if (!success) {
        return res.status(404).json({ message: 'Subscription not found' });
      }
      
      res.json({ message: 'Successfully unsubscribed' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to unsubscribe' });
    }
  });

  // Cover count notification trigger (manual for testing)
  apiRouter.post('/cover-count/notify', async (req, res) => {
    try {
      // This would typically be triggered by a scheduled job at 5:00 PM
      // For now, it's a manual endpoint for testing
      const subscriptions = await storage.getActivePushSubscriptions();
      
      // Here you would send push notifications to all subscriptions
      // Implementation depends on your push notification service (e.g., web-push library)
      
      res.json({ 
        message: 'Cover count notifications triggered',
        subscriberCount: subscriptions.length 
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to send notifications' });
    }
  });

  // Update location notification settings
  apiRouter.put('/locations/:id/notifications', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid location ID' });
      }

      const { smsPhone, notificationEmail } = req.body;
      if (smsPhone && typeof smsPhone !== 'string') {
        return res.status(400).json({ message: 'SMS phone must be a string' });
      }
      if (notificationEmail && typeof notificationEmail !== 'string') {
        return res.status(400).json({ message: 'Notification email must be a string' });
      }

      const updateData: any = {};
      if (smsPhone !== undefined) updateData.smsPhone = smsPhone;
      if (notificationEmail !== undefined) updateData.notificationEmail = notificationEmail;

      const updated = await storage.updateLocation(id, updateData);
      if (!updated) {
        return res.status(404).json({ message: 'Location not found' });
      }

      res.json({ success: true, message: 'Notification settings updated', location: updated });
    } catch (error) {
      console.error('Error updating location notifications:', error);
      res.status(500).json({ message: 'Failed to update notification settings' });
    }
  });

  // Test email notification endpoint
  apiRouter.post('/email/test', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email address is required' });
      }

      if (!emailService.isConfigured()) {
        return res.status(503).json({ message: 'Email service not configured. Please set EMAIL_USER and EMAIL_PASS environment variables.' });
      }

      const appUrl = process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAIN || 'http://localhost:5000';
      const success = await emailService.sendHelpRequestNotification(
        email,
        'Test Location',
        1,
        'normal',
        appUrl
      );

      if (success) {
        res.json({ success: true, message: 'Test email sent successfully' });
      } else {
        res.status(500).json({ success: false, message: 'Failed to send test email' });
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      res.status(500).json({ message: 'Failed to send test email' });
    }
  });

  // Test SMS notification endpoint
  apiRouter.post('/sms/test', async (req, res) => {
    try {
      const { phoneNumber, message } = req.body;
      
      if (!phoneNumber || !message) {
        return res.status(400).json({ message: 'Phone number and message are required' });
      }

      if (!smsService.isConfigured()) {
        return res.status(503).json({ message: 'SMS service not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER environment variables.' });
      }

      const appUrl = process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAIN || 'http://localhost:5000';
      const success = await smsService.sendHelpRequestNotification(
        phoneNumber,
        'Test Location',
        1,
        'normal',
        appUrl
      );

      if (success) {
        res.json({ success: true, message: 'Test SMS sent successfully' });
      } else {
        res.status(500).json({ success: false, message: 'Failed to send test SMS' });
      }
    } catch (error) {
      console.error('Error sending test SMS:', error);
      res.status(500).json({ message: 'Failed to send test SMS' });
    }
  });

  // Test email endpoint for new employee notifications
  apiRouter.post('/test-employee-email', async (req, res) => {
    try {
      console.log('[EMAIL] Test employee email requested');
      
      const success = await emailService.sendNewEmployeeNotification(
        'John Test Doe',
        '01/15/1990',
        'TX123456789',
        '123-45-6789'
      );

      if (success) {
        console.log('[EMAIL] Test employee notification sent successfully');
        res.json({ success: true, message: 'Test employee email sent successfully to brandon@accessvaletparking.com' });
      } else {
        console.log('[EMAIL] Failed to send test employee notification');
        res.status(500).json({ success: false, message: 'Failed to send test email' });
      }
    } catch (error) {
      console.error('[EMAIL] Error sending test employee email:', error);
      res.status(500).json({ message: 'Failed to send test email' });
    }
  });

  // Register API routes
  app.use('/api', apiRouter);

  const httpServer = createServer(app);
  
  return httpServer;
}
