import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { BackupService } from "./backup";
import { initializeSquareService } from "./square-service";
import path from "path";
import fs from "fs";

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Ensure uploads directory exists and serve uploaded files statically
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log('[STARTUP] Creating uploads directory:', uploadsDir);
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Log all incoming requests for debugging
  console.log(`[REQUEST] ${new Date().toISOString()} - ${req.method} ${req.path} from ${req.ip}`);

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    } else {
      // Also log non-API requests for debugging
      console.log(`[RESPONSE] ${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  // Add error handler for this middleware
  res.on('error', (err) => {
    console.error(`[RESPONSE ERROR] ${req.method} ${path}:`, err.message);
  });

  next();
});

(async () => {
  try {
    console.log('[STARTUP] Starting server initialization...');
    
    // Initialize Square service
    initializeSquareService();
    
    // Add a simple test route to verify server is reachable
    app.get('/test', (req, res) => {
      console.log(`[TEST ROUTE] Accessed at ${new Date().toISOString()}`);
      res.json({ 
        message: 'Server is working!', 
        timestamp: new Date().toISOString(),
        port: process.env.PORT,
        host: '0.0.0.0'
      });
    });
    
    const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Handle database connection errors specifically
    if (err.code === 'ECONNRESET' || err.code === 'ENOTFOUND' || err.message?.includes('connection')) {
      console.error('[DATABASE ERROR] Connection issue detected, server continuing:', err.message);
      return res.status(503).json({ 
        message: "Database temporarily unavailable. Please try again in a moment." 
      });
    }

    // Log error details for debugging and monitoring
    console.error(`[ERROR] ${new Date().toISOString()} - ${req.method} ${req.path}`, {
      error: err.message,
      stack: err.stack,
      body: req.body,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    // Don't expose internal error details in production
    const responseMessage = app.get("env") === "production" && status === 500 
      ? "Internal Server Error" 
      : message;

    res.status(status).json({ message: responseMessage });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    console.log('[STARTUP] Setting up Vite development middleware...');
    await setupVite(app, server);
  } else {
    console.log('[STARTUP] Setting up static file serving...');
    try {
      serveStatic(app);
      console.log('[STARTUP] Static file serving configured');
    } catch (staticError) {
      console.error('[STARTUP] Static file setup failed:', staticError);
      // Continue anyway - the app can still serve API routes
    }
  }

  // Serve the app on the configured port
  // this serves both the API and the client.
  const port = parseInt(process.env.PORT || "8080"); // Use Railway's PORT or fallback to 8080
  const host = '0.0.0.0'; // Listen on all interfaces for Railway
  
  console.log('[STARTUP] Environment variables:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- PORT:', process.env.PORT);
  console.log('- All env vars:', Object.keys(process.env).filter(k => k.includes('PORT')));
  console.log('- Final port:', port);
  console.log('- Host:', host);
  
  server.on('error', (err) => {
    console.error('[SERVER ERROR]', err);
    if (err.code === 'EADDRINUSE') {
      console.error(`[SERVER ERROR] Port ${port} is already in use`);
    }
  });

  // Add global error handlers BEFORE starting the server
  process.on('uncaughtException', (error) => {
    console.error('[UNCAUGHT EXCEPTION] Critical error occurred:', error.message);
    console.error('[UNCAUGHT EXCEPTION] Stack:', error.stack);
    console.error('[UNCAUGHT EXCEPTION] Type:', error.name);
    console.error('[UNCAUGHT EXCEPTION] Time:', new Date().toISOString());
    // Don't exit the process - let it continue running
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[UNHANDLED REJECTION] Promise rejection detected:', reason);
    console.error('[UNHANDLED REJECTION] Promise:', promise);
    console.error('[UNHANDLED REJECTION] Time:', new Date().toISOString());
    // Don't exit the process - let it continue running
  });

  // Add more detailed server error handling
  process.on('SIGTERM', () => {
    console.log('[SIGNAL] SIGTERM received - Server shutting down gracefully');
  });

  process.on('SIGINT', () => {
    console.log('[SIGNAL] SIGINT received - Server shutting down gracefully');
  });

  server.listen(port, host, () => {
    console.log(`[STARTUP] ✅ Server successfully started on ${host}:${port}`);
    console.log(`[STARTUP] Server should be accessible at http://${host}:${port}`);
    console.log(`[STARTUP] Railway should route public traffic to this server`);
    log(`serving on ${host}:${port}`);
    
    // Set up heartbeat to monitor server health
    const startTime = Date.now();
    const heartbeat = setInterval(() => {
      const uptime = Math.floor((Date.now() - startTime) / 1000);
      console.log(`[HEARTBEAT] Server alive for ${uptime} seconds at ${new Date().toISOString()}`);
    }, 30000); // Log every 30 seconds
    
    // Add server close handler
    server.on('close', () => {
      console.log('[SERVER] HTTP server closed');
      clearInterval(heartbeat);
    });
    
    // Delayed startup of backup services to allow database connection to stabilize
    setTimeout(() => {
      try {
        // Temporarily disabled backup service to resolve server crashes
        // BackupService.startBackupSchedule();
        console.log('[STARTUP] Backup service temporarily disabled');
      } catch (error) {
        console.error('[STARTUP] Backup service failed to start:', error);
      }
    }, 10000); // Wait 10 seconds for database to be ready
  });

  } catch (startupError) {
    console.error('[STARTUP] ❌ Critical startup error:', startupError);
    console.error('[STARTUP] Stack trace:', startupError.stack);
    process.exit(1);
  }
})();
