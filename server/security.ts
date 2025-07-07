/**
 * Comprehensive Security Service
 * Handles authentication, authorization, and API protection
 */

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { getEnvironmentConfig } from './environment-config';

export interface AuthenticatedRequest extends Request {
  session: any;
  isAuthenticated?: boolean;
  userType?: 'admin' | 'employee';
  employeeId?: string;
}

export class SecurityService {
  private static instance: SecurityService;
  private allowedUserAgents: Set<string>;
  private allowedIPs: Set<string>;
  private rateLimitMap: Map<string, { count: number; resetTime: number }>;
  private suspiciousActivity: Map<string, number>;

  constructor() {
    this.allowedUserAgents = new Set([
      'Mozilla', 'Chrome', 'Safari', 'Firefox', 'Edge'
    ]);
    this.allowedIPs = new Set();
    this.rateLimitMap = new Map();
    this.suspiciousActivity = new Map();
  }

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  /**
   * Admin Authentication Middleware
   */
  public requireAdminAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    // Check session authentication
    if (!req.session?.isAuthenticated || !req.session?.isAdmin) {
      console.log('[SECURITY] Unauthorized admin access attempt');
      res.status(401).json({ 
        error: 'Admin authentication required',
        code: 'ADMIN_AUTH_REQUIRED'
      });
      return;
    }

    // Additional security checks for admin operations
    if (!this.validateUserAgent(req)) {
      console.log('[SECURITY] Suspicious user agent for admin access:', req.get('User-Agent'));
      res.status(403).json({ 
        error: 'Access denied - invalid client',
        code: 'INVALID_CLIENT'
      });
      return;
    }

    req.isAuthenticated = true;
    req.userType = 'admin';
    next();
  };

  /**
   * Employee Authentication Middleware
   */
  public requireEmployeeAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    // Check employee session
    if (!req.session?.employeeId) {
      console.log('[SECURITY] Unauthorized employee access attempt');
      res.status(401).json({ 
        error: 'Employee authentication required',
        code: 'EMPLOYEE_AUTH_REQUIRED'
      });
      return;
    }

    req.isAuthenticated = true;
    req.userType = 'employee';
    req.employeeId = req.session.employeeId;
    next();
  };

  /**
   * General Authentication (Admin or Employee)
   */
  public requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const isAdminAuth = req.session?.isAuthenticated && req.session?.isAdmin;
    const isEmployeeAuth = req.session?.employeeId;

    if (!isAdminAuth && !isEmployeeAuth) {
      console.log('[SECURITY] Unauthorized access attempt');
      res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    req.isAuthenticated = true;
    req.userType = isAdminAuth ? 'admin' : 'employee';
    if (isEmployeeAuth) {
      req.employeeId = req.session.employeeId;
    }

    next();
  };

  /**
   * Rate Limiting Middleware
   */
  public rateLimit = (maxRequests: number = 100, windowMs: number = 900000): ((req: Request, res: Response, next: NextFunction) => void) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const clientId = this.getClientIdentifier(req);
      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean old entries
      for (const [key, data] of this.rateLimitMap.entries()) {
        if (data.resetTime < windowStart) {
          this.rateLimitMap.delete(key);
        }
      }

      const clientData = this.rateLimitMap.get(clientId);
      
      if (!clientData) {
        this.rateLimitMap.set(clientId, { count: 1, resetTime: now + windowMs });
        next();
        return;
      }

      if (clientData.count >= maxRequests) {
        console.log(`[SECURITY] Rate limit exceeded for ${clientId}`);
        res.status(429).json({ 
          error: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
        });
        return;
      }

      clientData.count++;
      next();
    };
  };

  /**
   * Sensitive Operation Protection (for employee data endpoints)
   */
  public protectSensitiveOperation = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    // Enhanced logging for sensitive operations
    const clientId = this.getClientIdentifier(req);
    const userAgent = req.get('User-Agent') || 'unknown';
    const referer = req.get('Referer') || 'direct';

    console.log(`[SECURITY] ${req.method} ${req.originalUrl} from origin: ${req.get('Origin') || 'no-origin'}`);
    console.log(`[SECURITY] Client: ${clientId}, UA: ${userAgent.slice(0, 100)}`);

    // Check for suspicious patterns
    if (this.detectSuspiciousActivity(req)) {
      console.log(`[SECURITY] Suspicious activity detected from ${clientId}`);
      res.status(403).json({ 
        error: 'Access denied - suspicious activity detected',
        code: 'SUSPICIOUS_ACTIVITY'
      });
      return;
    }

    // Additional validation for employee data operations
    if (req.path.includes('/employees') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      if (!req.session?.isAuthenticated || !req.session?.isAdmin) {
        console.log('[SECURITY] Unauthorized employee data modification attempt');
        res.status(403).json({ 
          error: 'Admin privileges required for employee data operations',
          code: 'ADMIN_REQUIRED'
        });
        return;
      }
    }

    next();
  };

  /**
   * API Key Validation for External Access
   */
  public validateApiKey = (req: Request, res: Response, next: NextFunction): void => {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKey) {
      res.status(401).json({ 
        error: 'API key required',
        code: 'API_KEY_REQUIRED'
      });
      return;
    }

    // In a production environment, you would validate against a database of API keys
    // For now, we'll use a simple validation against environment variable
    const validApiKey = process.env.API_KEY;
    if (validApiKey && apiKey !== validApiKey) {
      console.log('[SECURITY] Invalid API key attempt');
      res.status(401).json({ 
        error: 'Invalid API key',
        code: 'INVALID_API_KEY'
      });
      return;
    }

    next();
  };

  /**
   * Content Security Policy Headers
   */
  public setSecurityHeaders = (req: Request, res: Response, next: NextFunction): void => {
    // Content Security Policy
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https: wss: ws:; " +
      "frame-src 'none'; " +
      "object-src 'none';"
    );

    // Additional security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 
      'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
    );

    // HTTPS enforcement in production
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    next();
  };

  /**
   * PII Data Sanitization
   */
  public static sanitizePII(data: any): any {
    if (!data) return data;

    const sensitiveFields = ['ssn', 'fullSsn', 'socialSecurityNumber', 'driverLicense', 'dateOfBirth'];
    const sanitized = { ...data };

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        const value = sanitized[field];
        if (typeof value === 'string' && value.length > 4) {
          // Show only last 4 characters
          sanitized[field] = '*'.repeat(value.length - 4) + value.slice(-4);
        }
      }
    });

    return sanitized;
  }

  /**
   * Hash sensitive data before storage
   */
  public static async hashSensitiveData(data: string): Promise<string> {
    const config = getEnvironmentConfig();
    return await bcrypt.hash(data, config.bcryptRounds);
  }

  /**
   * Verify hashed sensitive data
   */
  public static async verifySensitiveData(plaintext: string, hashedData: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plaintext, hashedData);
    } catch (error) {
      console.error('[SECURITY] Failed to verify sensitive data:', error);
      return false;
    }
  }

  // Private helper methods
  private getClientIdentifier(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? String(forwarded).split(',')[0] : req.connection.remoteAddress;
    return `${ip}_${req.get('User-Agent')?.slice(0, 50) || 'unknown'}`;
  }

  private validateUserAgent(req: Request): boolean {
    const userAgent = req.get('User-Agent') || '';
    
    // Check for common browsers
    const hasValidUA = Array.from(this.allowedUserAgents).some(ua => 
      userAgent.includes(ua)
    );

    // Block obviously malicious user agents
    const maliciousPatterns = ['bot', 'crawler', 'spider', 'scraper'];
    const isMalicious = maliciousPatterns.some(pattern => 
      userAgent.toLowerCase().includes(pattern)
    );

    return hasValidUA && !isMalicious;
  }

  private detectSuspiciousActivity(req: Request): boolean {
    const clientId = this.getClientIdentifier(req);
    const userAgent = req.get('User-Agent') || '';

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /curl/i,
      /wget/i,
      /python/i,
      /node/i,
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));

    if (isSuspicious) {
      const count = this.suspiciousActivity.get(clientId) || 0;
      this.suspiciousActivity.set(clientId, count + 1);
      
      // Block if too many suspicious requests
      return count >= 3;
    }

    return false;
  }
}

// Export singleton instance
export const securityService = SecurityService.getInstance();