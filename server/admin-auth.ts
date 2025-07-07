/**
 * Custom Admin Authentication System
 * Allows specific admin users to login with email/password without requiring Replit accounts
 */

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';

export interface AdminAuthRequest extends Request {
  session: any;
  adminUser?: AdminUser;
}

interface AdminUser {
  email: string;
  name: string;
  hashedPassword: string;
}

// Predefined admin users with hashed passwords
const ADMIN_USERS: AdminUser[] = [
  {
    email: 'brandon@accessvaletparking.com',
    name: 'Brandon',
    hashedPassword: '$2b$12$shODRGP8ITI9n9uHwRn0yuW.8NnO3BTbTtrmcksuD10lTGaJNHAM6' // password: admin123
  },
  {
    email: 'dave@accessvaletparking.com', 
    name: 'Dave',
    hashedPassword: '$2b$12$aw8e/cQfwlfucMh/bvoxfOUfz13RFH6b/uaAi2EwhNuQX88CEFYV.' // password: admin123
  },
  {
    email: 'ryan@accessvaletparking.com',
    name: 'Ryan', 
    hashedPassword: '$2b$12$hhRuckkoSncv1KxQCcf.buBD7d1T2V7z/xK8Qqj2E51YW5V1GB6Cu' // password: admin123
  }
];

// Helper function to hash passwords (for setup/updates)
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

// Find admin user by email
function findAdminUser(email: string): AdminUser | undefined {
  return ADMIN_USERS.find(user => user.email.toLowerCase() === email.toLowerCase());
}

// Verify password
async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

// Admin login route
export async function adminLogin(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ 
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS' 
      });
      return;
    }

    const adminUser = findAdminUser(email);
    if (!adminUser) {
      res.status(401).json({ 
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS' 
      });
      return;
    }

    const isValidPassword = await verifyPassword(password, adminUser.hashedPassword);
    if (!isValidPassword) {
      res.status(401).json({ 
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS' 
      });
      return;
    }

    // Set up admin session
    req.session.isAuthenticated = true;
    req.session.isAdmin = true;
    req.session.adminEmail = adminUser.email;
    req.session.adminName = adminUser.name;

    console.log(`[ADMIN AUTH] Successful login: ${adminUser.email}`);

    res.json({ 
      success: true,
      user: {
        email: adminUser.email,
        name: adminUser.name
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      code: 'LOGIN_ERROR' 
    });
  }
}

// Admin logout route
export async function adminLogout(req: Request, res: Response): Promise<void> {
  try {
    const adminEmail = req.session?.adminEmail;
    
    req.session.destroy((err: any) => {
      if (err) {
        console.error('Session destruction error:', err);
        res.status(500).json({ 
          error: 'Logout failed',
          code: 'LOGOUT_ERROR' 
        });
        return;
      }

      console.log(`[ADMIN AUTH] Successful logout: ${adminEmail}`);
      res.json({ success: true });
    });
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({ 
      error: 'Logout failed',
      code: 'LOGOUT_ERROR' 
    });
  }
}

// Get current admin user
export async function getCurrentAdmin(req: AdminAuthRequest, res: Response): Promise<void> {
  try {
    if (!req.session?.isAuthenticated || !req.session?.isAdmin) {
      res.status(401).json({ 
        error: 'Not authenticated',
        code: 'NOT_AUTHENTICATED' 
      });
      return;
    }

    res.json({
      email: req.session.adminEmail,
      name: req.session.adminName,
      isAdmin: true
    });
  } catch (error) {
    console.error('Get current admin error:', error);
    res.status(500).json({ 
      error: 'Failed to get user info',
      code: 'USER_INFO_ERROR' 
    });
  }
}

// Middleware to require admin authentication
export function requireAdminAuth(req: AdminAuthRequest, res: Response, next: NextFunction): void {
  if (!req.session?.isAuthenticated || !req.session?.isAdmin) {
    res.status(401).json({ 
      error: 'Admin authentication required',
      code: 'ADMIN_AUTH_REQUIRED' 
    });
    return;
  }

  // Set admin user info for downstream middleware
  req.adminUser = {
    email: req.session.adminEmail,
    name: req.session.adminName,
    hashedPassword: '' // Don't expose password hash
  };

  next();
}