/**
 * Enhanced CORS Configuration with Security Controls
 */

import { Request, Response, NextFunction } from 'express';

export interface CorsOptions {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  credentials: boolean;
  maxAge: number;
}

export class EnhancedCORS {
  private allowedOrigins: Set<string>;
  private allowedMethods: Set<string>;
  private allowedHeaders: Set<string>;
  private exposedHeaders: string[];
  private credentials: boolean;
  private maxAge: number;

  constructor(options: CorsOptions) {
    this.allowedOrigins = new Set(options.allowedOrigins);
    this.allowedMethods = new Set(options.allowedMethods);
    this.allowedHeaders = new Set(options.allowedHeaders);
    this.exposedHeaders = options.exposedHeaders;
    this.credentials = options.credentials;
    this.maxAge = options.maxAge;

    console.log(`[CORS] Enhanced security configured with ${this.allowedOrigins.size} allowed origins`);
  }

  public middleware = (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.headers.origin;
    const method = req.method;

    // Handle preflight requests
    if (method === 'OPTIONS') {
      this.handlePreflight(req, res);
      return;
    }

    // Validate origin for actual requests
    if (origin && this.isAllowedOrigin(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      console.log(`[CORS] ✓ Allowed origin: ${origin}`);
    } else if (!origin) {
      // Allow same-origin requests (no origin header)
      res.setHeader('Access-Control-Allow-Origin', '*');
    } else {
      console.log(`[CORS] ✗ Blocked origin: ${origin}`);
      res.status(403).json({ 
        error: 'CORS: Origin not allowed',
        code: 'ORIGIN_NOT_ALLOWED'
      });
      return;
    }

    // Set credentials header
    if (this.credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    // Set exposed headers
    if (this.exposedHeaders.length > 0) {
      res.setHeader('Access-Control-Expose-Headers', this.exposedHeaders.join(', '));
    }

    next();
  };

  private handlePreflight(req: Request, res: Response): void {
    const origin = req.headers.origin;
    const requestMethod = req.headers['access-control-request-method'];
    const requestHeaders = req.headers['access-control-request-headers'];

    // Validate origin
    if (origin && !this.isAllowedOrigin(origin)) {
      console.log(`[CORS] ✗ Preflight blocked origin: ${origin}`);
      res.status(403).json({ 
        error: 'CORS: Origin not allowed',
        code: 'ORIGIN_NOT_ALLOWED'
      });
      return;
    }

    // Validate method
    if (requestMethod && !this.allowedMethods.has(requestMethod)) {
      console.log(`[CORS] ✗ Method not allowed: ${requestMethod}`);
      res.status(405).json({ 
        error: 'CORS: Method not allowed',
        code: 'METHOD_NOT_ALLOWED'
      });
      return;
    }

    // Set CORS headers for preflight
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Methods', Array.from(this.allowedMethods).join(', '));
    res.setHeader('Access-Control-Allow-Headers', Array.from(this.allowedHeaders).join(', '));
    
    if (this.credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    res.setHeader('Access-Control-Max-Age', this.maxAge.toString());

    console.log(`[CORS] ✓ Preflight approved for ${origin} ${requestMethod}`);
    res.status(204).end();
  }

  private isAllowedOrigin(origin: string): boolean {
    // Check exact matches
    if (this.allowedOrigins.has(origin)) {
      return true;
    }

    // Check for Replit domain patterns
    const replitPatterns = [
      /^https:\/\/.*\.replit\.dev$/,
      /^https:\/\/.*\.replit\.app$/,
      /^https:\/\/.*\.replit\.com$/,
      /^https:\/\/[a-f0-9-]+\.worf\.replit\.dev$/
    ];

    return replitPatterns.some(pattern => pattern.test(origin));
  }

  public addAllowedOrigin(origin: string): void {
    this.allowedOrigins.add(origin);
    console.log(`[CORS] Added allowed origin: ${origin}`);
  }

  public removeAllowedOrigin(origin: string): void {
    this.allowedOrigins.delete(origin);
    console.log(`[CORS] Removed allowed origin: ${origin}`);
  }

  public getAllowedOrigins(): string[] {
    return Array.from(this.allowedOrigins);
  }
}

// Default CORS configuration for the application
export function createCorsConfig(): EnhancedCORS {
  const replitDomains = process.env.REPLIT_DOMAINS?.split(',') || [];
  
  const allowedOrigins = [
    // Localhost for development
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5000',
    
    // Production domains
    'https://access-valet-parking.replit.app',
    
    // Dynamic Replit domains
    ...replitDomains.map(domain => `https://${domain}`),
    
    // Additional Replit patterns will be handled by regex in isAllowedOrigin
  ];

  const corsOptions: CorsOptions = {
    allowedOrigins,
    allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Cache-Control',
      'Pragma',
      'X-API-Key',
      'X-Client-Version'
    ],
    exposedHeaders: [
      'X-Total-Count',
      'X-Rate-Limit-Remaining',
      'X-Rate-Limit-Reset'
    ],
    credentials: true,
    maxAge: 86400 // 24 hours
  };

  return new EnhancedCORS(corsOptions);
}