import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { BackupService } from "./backup";
import path from "path";

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
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
})();
