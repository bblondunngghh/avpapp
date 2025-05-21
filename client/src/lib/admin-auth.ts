// Admin authentication utilities

// Admin session timeout (2 minutes in milliseconds)
export const ADMIN_SESSION_TIMEOUT = 2 * 60 * 1000;

// Use a variable in memory to track authentication state
// This is more reliable on mobile devices where localStorage can be problematic
let inMemoryAuthState = {
  isAuthenticated: false,
  authTime: 0
};

// Safely check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Try to initialize from localStorage if available
try {
  if (isBrowser) {
    const storedAuth = localStorage.getItem("admin_authenticated");
    const storedTime = localStorage.getItem("admin_auth_time");
    
    if (storedAuth === "true" && storedTime) {
      inMemoryAuthState.isAuthenticated = true;
      inMemoryAuthState.authTime = Number(storedTime);
    }
  }
} catch (e) {
  console.warn("Could not initialize auth state from localStorage");
}

// Check if admin is authenticated
export const isAdminAuthenticated = (): boolean => {
  try {
    const currentTime = Date.now();
    
    // First check in-memory state
    if (inMemoryAuthState.isAuthenticated) {
      // Check if session is still valid
      if (currentTime - inMemoryAuthState.authTime <= ADMIN_SESSION_TIMEOUT) {
        // Update the authentication time to extend the session
        inMemoryAuthState.authTime = currentTime;
        
        // Try to update localStorage if available
        try {
          if (isBrowser) {
            localStorage.setItem("admin_auth_time", currentTime.toString());
          }
        } catch (e) {
          console.warn("Could not update localStorage, but in-memory auth is still valid");
        }
        
        return true;
      }
    }
    
    // If we get here, either not authenticated or session expired
    // Clear all auth data
    inMemoryAuthState.isAuthenticated = false;
    inMemoryAuthState.authTime = 0;
    
    try {
      if (isBrowser) {
        localStorage.removeItem("admin_authenticated");
        localStorage.removeItem("admin_auth_time");
      }
    } catch (e) {
      console.warn("Could not clear localStorage");
    }
    
    return false;
  } catch (error) {
    console.error("Error checking admin authentication:", error);
    return false;
  }
};

// Log out admin user
export const logoutAdmin = (): void => {
  try {
    // Clear in-memory state
    inMemoryAuthState.isAuthenticated = false;
    inMemoryAuthState.authTime = 0;
    
    // Try to clear localStorage
    try {
      if (isBrowser) {
        localStorage.removeItem("admin_authenticated");
        localStorage.removeItem("admin_auth_time");
      }
    } catch (e) {
      console.warn("Could not clear localStorage, but in-memory auth has been cleared");
    }
  } catch (error) {
    console.error("Error logging out admin:", error);
  }
};

// Set admin authentication
export const loginAdmin = (): boolean => {
  try {
    const currentTime = Date.now();
    
    // Set in-memory state
    inMemoryAuthState.isAuthenticated = true;
    inMemoryAuthState.authTime = currentTime;
    
    // Try to set localStorage
    try {
      if (isBrowser) {
        localStorage.setItem("admin_authenticated", "true");
        localStorage.setItem("admin_auth_time", currentTime.toString());
        
        // Verify localStorage was set correctly
        const storedAuth = localStorage.getItem("admin_authenticated");
        const storedTime = localStorage.getItem("admin_auth_time");
        
        if (storedAuth !== "true" || !storedTime) {
          console.warn("localStorage values not set correctly, but in-memory auth is still valid");
        }
      }
    } catch (e) {
      console.warn("Could not set localStorage, but in-memory auth is still valid");
    }
    
    return true;
  } catch (error) {
    console.error("Error setting admin authentication:", error);
    return false;
  }
};

// Refresh admin session (call this on user activity)
export const refreshAdminSession = (): boolean => {
  try {
    if (inMemoryAuthState.isAuthenticated) {
      const currentTime = Date.now();
      inMemoryAuthState.authTime = currentTime;
      
      // Try to update localStorage
      try {
        if (isBrowser) {
          localStorage.setItem("admin_auth_time", currentTime.toString());
        }
      } catch (e) {
        console.warn("Could not update localStorage, but in-memory auth is still valid");
      }
      
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error refreshing admin session:", error);
    return false;
  }
};

// Get current auth status (for debugging purposes)
export const getAuthStatus = () => {
  return {
    inMemory: { ...inMemoryAuthState },
    localStorage: isBrowser ? {
      isAuthenticated: localStorage.getItem("admin_authenticated") === "true",
      authTime: Number(localStorage.getItem("admin_auth_time") || "0")
    } : "Not in browser environment"
  };
};