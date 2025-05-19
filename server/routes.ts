import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertShiftReportSchema, 
  updateShiftReportSchema,
  insertTicketDistributionSchema,
  updateTicketDistributionSchema,
  ShiftReport,
  TicketDistribution
} from "@shared/schema";
import { z } from "zod";

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
  
  // Register API routes
  app.use('/api', apiRouter);

  const httpServer = createServer(app);
  
  return httpServer;
}
