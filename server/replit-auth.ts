import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  const userData = {
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
    isAdmin: true, // For now, all Replit Auth users are admins
  };
  
  await storage.upsertUser(userData);
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env.REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/auth/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Admin login route
  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  // Auth callback
  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/admin",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  // Admin logout
  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });

  // Get current authenticated user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user || !req.user.claims) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });
}

// Enhanced admin authentication middleware with brute force protection
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

function checkBruteForce(ip: string): boolean {
  const attempts = loginAttempts.get(ip);
  if (!attempts) return true;
  
  const now = Date.now();
  if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.delete(ip);
    return true;
  }
  
  return attempts.count < MAX_LOGIN_ATTEMPTS;
}

function recordFailedAttempt(ip: string): void {
  const attempts = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 };
  attempts.count++;
  attempts.lastAttempt = Date.now();
  loginAttempts.set(ip, attempts);
}

function clearFailedAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  
  // Check for brute force attacks
  if (!checkBruteForce(clientIp)) {
    console.log(`[SECURITY] Blocked login attempt from ${clientIp} due to too many failed attempts`);
    return res.status(429).json({ 
      message: "Too many failed login attempts. Please try again later.",
      lockoutDuration: LOCKOUT_DURATION / 60000 // in minutes
    });
  }

  if (!req.isAuthenticated()) {
    recordFailedAttempt(clientIp);
    console.log(`[SECURITY] Unauthorized access attempt from ${clientIp}`);
    return res.status(401).json({ message: "Admin authentication required" });
  }

  const user = req.user as any;
  if (!user.expires_at) {
    recordFailedAttempt(clientIp);
    return res.status(401).json({ message: "Invalid session" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    clearFailedAttempts(clientIp);
    return next();
  }

  // Try to refresh token
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    recordFailedAttempt(clientIp);
    res.status(401).json({ message: "Session expired" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    clearFailedAttempts(clientIp);
    return next();
  } catch (error) {
    recordFailedAttempt(clientIp);
    console.log(`[SECURITY] Token refresh failed for ${clientIp}`);
    res.status(401).json({ message: "Authentication expired" });
    return;
  }
};

// Get current authenticated admin user
export const getCurrentUser: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  const user = req.user as any;
  const claims = user.claims;
  
  if (!claims) {
    return res.status(401).json({ message: "Invalid user session" });
  }
  
  try {
    const dbUser = await storage.getUser(claims.sub);
    if (!dbUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      profileImageUrl: dbUser.profileImageUrl,
      isAdmin: dbUser.isAdmin
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    res.status(500).json({ message: "Failed to fetch user data" });
  }
};