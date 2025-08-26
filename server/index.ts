import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { BackupService } from "./backup";
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
    }
  });

  next();
});

(async () => {
  try {
    console.log('[STARTUP] Starting server initialization...');
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
  const port = parseInt(process.env.PORT || "3000"); // Railway uses PORT env var
  
  console.log('[STARTUP] Environment variables:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- PORT:', process.env.PORT);
  console.log('- All env vars:', Object.keys(process.env).filter(k => k.includes('PORT')));
  console.log('- Final port:', port);
  
  server.on('error', (err) => {
    console.error('[SERVER ERROR]', err);
    if (err.code === 'EADDRINUSE') {
      console.error(`[SERVER ERROR] Port ${port} is already in use`);
    }
  });

  server.listen(port, () => {
    console.log(`[STARTUP] ✅ Server successfully started on port ${port}`);
    log(`serving on port ${port}`);
    
    // Add global error handlers to prevent crashes
    process.on('uncaughtException', (error) => {
      console.error('[UNCAUGHT EXCEPTION] Server will continue running:', error.message);
      // Don't exit the process - let it continue running
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('[UNHANDLED REJECTION] Server will continue running:', reason);
      // Don't exit the process - let it continue running
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
