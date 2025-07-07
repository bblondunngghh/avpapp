/**
 * Environment Configuration Manager
 * Centralizes all environment variable management and validation
 */

export interface EnvironmentConfig {
  // Database
  databaseUrl: string;
  
  // Email Configuration  
  emailHost: string;
  emailPort: number;
  emailUser: string;
  emailPass: string;
  
  // Push Notifications
  vapidPublicKey: string;
  vapidPrivateKey: string;
  vapidEmail: string;
  
  // SMS/Twilio (optional)
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  
  // Security
  sessionSecret: string;
  bcryptRounds: number;
  
  // Application
  nodeEnv: string;
  port: number;
  appUrl: string;
  
  // Rate Limiting
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}

/**
 * Load and validate environment variables
 */
export function loadEnvironmentConfig(): EnvironmentConfig {
  // Required environment variables
  const requiredVars = [
    'DATABASE_URL',
    'EMAIL_USER', 
    'EMAIL_PASS',
    'VAPID_PUBLIC_KEY',
    'VAPID_PRIVATE_KEY',
    'SESSION_SECRET'
  ];
  
  // Check for missing required variables
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  return {
    // Database
    databaseUrl: process.env.DATABASE_URL!,
    
    // Email Configuration
    emailHost: process.env.EMAIL_HOST || 'smtp.gmail.com',
    emailPort: parseInt(process.env.EMAIL_PORT || '587'),
    emailUser: process.env.EMAIL_USER!,
    emailPass: process.env.EMAIL_PASS!,
    
    // Push Notifications
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY!,
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY!,
    vapidEmail: process.env.VAPID_EMAIL || process.env.EMAIL_USER!,
    
    // SMS/Twilio (optional)
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
    
    // Security
    sessionSecret: process.env.SESSION_SECRET!,
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
    
    // Application
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000'),
    appUrl: process.env.APP_URL || getDefaultAppUrl(),
    
    // Rate Limiting
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
  };
}

/**
 * Generate default app URL based on environment
 */
function getDefaultAppUrl(): string {
  const replitDomain = process.env.REPLIT_DOMAINS;
  if (replitDomain) {
    return `https://${replitDomain}`;
  }
  
  const nodeEnv = process.env.NODE_ENV || 'development';
  const port = process.env.PORT || '5000';
  
  if (nodeEnv === 'development') {
    return `http://localhost:${port}`;
  }
  
  // Production fallback
  return 'https://access-valet-parking.replit.app';
}

/**
 * Validate email configuration
 */
export function validateEmailConfig(config: EnvironmentConfig): boolean {
  if (!config.emailUser || !config.emailPass) {
    console.warn('[ENV] Email configuration incomplete - notifications disabled');
    return false;
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(config.emailUser)) {
    console.warn('[ENV] Invalid email format for EMAIL_USER');
    return false;
  }
  
  return true;
}

/**
 * Validate VAPID keys configuration
 */
export function validateVapidConfig(config: EnvironmentConfig): boolean {
  if (!config.vapidPublicKey || !config.vapidPrivateKey) {
    console.warn('[ENV] VAPID keys missing - push notifications disabled');
    return false;
  }
  
  // Basic VAPID key format validation
  if (config.vapidPublicKey.length < 80 || config.vapidPrivateKey.length < 40) {
    console.warn('[ENV] VAPID keys appear to be invalid format');
    return false;
  }
  
  return true;
}

/**
 * Sanitized configuration for logging (removes sensitive data)
 */
export function getSanitizedConfig(config: EnvironmentConfig): Record<string, any> {
  return {
    databaseUrl: config.databaseUrl ? '[CONFIGURED]' : '[MISSING]',
    emailHost: config.emailHost,
    emailPort: config.emailPort,
    emailUser: config.emailUser ? '[CONFIGURED]' : '[MISSING]',
    emailPass: config.emailPass ? '[CONFIGURED]' : '[MISSING]',
    vapidPublicKey: config.vapidPublicKey ? '[CONFIGURED]' : '[MISSING]',
    vapidPrivateKey: config.vapidPrivateKey ? '[CONFIGURED]' : '[MISSING]',
    vapidEmail: config.vapidEmail ? '[CONFIGURED]' : '[MISSING]',
    twilioConfigured: !!(config.twilioAccountSid && config.twilioAuthToken),
    sessionSecret: config.sessionSecret ? '[CONFIGURED]' : '[MISSING]',
    nodeEnv: config.nodeEnv,
    port: config.port,
    appUrl: config.appUrl,
    bcryptRounds: config.bcryptRounds
  };
}

// Global configuration instance
let environmentConfig: EnvironmentConfig | null = null;

/**
 * Get the global environment configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  if (!environmentConfig) {
    environmentConfig = loadEnvironmentConfig();
  }
  return environmentConfig;
}

/**
 * Initialize and validate all environment configurations
 */
export function initializeEnvironment(): void {
  try {
    const config = getEnvironmentConfig();
    const sanitized = getSanitizedConfig(config);
    
    console.log('[ENV] Environment configuration loaded:');
    console.log('[ENV]', JSON.stringify(sanitized, null, 2));
    
    // Validate critical services
    const emailValid = validateEmailConfig(config);
    const vapidValid = validateVapidConfig(config);
    
    console.log(`[ENV] Email service: ${emailValid ? 'READY' : 'DISABLED'}`);
    console.log(`[ENV] Push notifications: ${vapidValid ? 'READY' : 'DISABLED'}`);
    console.log(`[ENV] SMS service: ${config.twilioAccountSid ? 'READY' : 'DISABLED'}`);
    
  } catch (error) {
    console.error('[ENV] Failed to initialize environment configuration:', error);
    process.exit(1);
  }
}