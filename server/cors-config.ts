/**
 * CORS Configuration for Access Valet Parking System
 * Centralized management of allowed origins and security settings
 */

export interface CorsConfig {
  allowedOrigins: (string | RegExp)[];
  methods: string[];
  allowedHeaders: string[];
  credentials: boolean;
  optionsSuccessStatus: number;
}

/**
 * Get environment-specific CORS configuration
 */
export function getCorsConfig(): CorsConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const replitDomain = process.env.REPLIT_DOMAINS?.split(',') || [];
  
  const baseAllowedOrigins: (string | RegExp)[] = [
    // Replit domains (development and production)
    /^https:\/\/.*\.replit\.dev$/,     // Replit development domains
    /^https:\/\/.*\.replit\.app$/,     // Replit production domains
    /^https:\/\/.*\.replit\.co$/,      // Legacy Replit domains
    /^http:\/\/.*\.replit\.dev$/,      // HTTP Replit development
    /^http:\/\/.*\.replit\.app$/,      // HTTP Replit production
  ];
  
  // Add development origins if in development mode
  if (isDevelopment) {
    baseAllowedOrigins.push(
      'http://localhost:5000',
      'http://localhost:3000',
      'https://localhost:5000',
      'https://localhost:3000'
    );
  }
  
  // Add specific Replit domains from environment
  replitDomain.forEach(domain => {
    if (domain.trim()) {
      baseAllowedOrigins.push(`https://${domain.trim()}`);
      baseAllowedOrigins.push(`http://${domain.trim()}`);
      baseAllowedOrigins.push(domain.trim()); // Raw domain too
    }
  });
  
  // Add production domains if configured
  if (process.env.PRODUCTION_DOMAIN) {
    baseAllowedOrigins.push(process.env.PRODUCTION_DOMAIN);
    baseAllowedOrigins.push(`https://www.${process.env.PRODUCTION_DOMAIN.replace('https://', '')}`);
  }
  
  return {
    allowedOrigins: baseAllowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
      'X-API-Key' // For future API key authentication
    ],
    credentials: true,
    optionsSuccessStatus: 200
  };
}

/**
 * Security headers configuration
 */
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com https://replit.com https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com; connect-src 'self' wss: ws: https:;"
};

/**
 * Rate limiting configuration for API endpoints
 */
export const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  }
};

/**
 * Check if origin is allowed for sensitive operations
 */
export function isOriginAllowedForSensitiveOps(origin: string | undefined): boolean {
  if (!origin) return true; // Allow requests with no origin (mobile apps, etc.)
  
  const config = getCorsConfig();
  return config.allowedOrigins.some(allowedOrigin => {
    if (typeof allowedOrigin === 'string') {
      return origin === allowedOrigin;
    } else {
      return allowedOrigin.test(origin);
    }
  });
}