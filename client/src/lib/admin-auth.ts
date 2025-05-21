// Admin authentication utilities

// Admin session timeout (2 minutes in milliseconds)
export const ADMIN_SESSION_TIMEOUT = 2 * 60 * 1000;

/**
 * Get storage implementation that works across platforms
 * This provides fallbacks in case localStorage is unavailable or restricted
 */
const getStorage = () => {
  // Use a closure to store values in memory as a fallback
  const memoryStore: Record<string, string> = {};
  
  // Test if localStorage is available and working
  let localStorageAvailable = false;
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    localStorageAvailable = true;
  } catch (e) {
    console.warn('localStorage not available, using memory storage fallback');
    localStorageAvailable = false;
  }
  
  return {
    getItem: (key: string): string | null => {
      if (localStorageAvailable) {
        return localStorage.getItem(key);
      }
      return memoryStore[key] || null;
    },
    setItem: (key: string, value: string): void => {
      if (localStorageAvailable) {
        try {
          localStorage.setItem(key, value);
        } catch (e) {
          console.warn('localStorage setItem failed, using memory fallback', e);
          memoryStore[key] = value;
        }
      } else {
        memoryStore[key] = value;
      }
    },
    removeItem: (key: string): void => {
      if (localStorageAvailable) {
        localStorage.removeItem(key);
      }
      delete memoryStore[key];
    }
  };
};

// Create a storage instance
const storage = getStorage();

// Check if admin is authenticated
export const isAdminAuthenticated = (): boolean => {
  try {
    const isAuthenticated = storage.getItem("admin_authenticated") === "true";
    const authTime = Number(storage.getItem("admin_auth_time") || "0");
    const currentTime = Date.now();
    
    // Session expires after ADMIN_SESSION_TIMEOUT of inactivity
    if (isAuthenticated && (currentTime - authTime <= ADMIN_SESSION_TIMEOUT)) {
      // Update the authentication time to extend the session
      storage.setItem("admin_auth_time", currentTime.toString());
      return true;
    }
    
    // If not authenticated or session expired, clear auth data
    storage.removeItem("admin_authenticated");
    storage.removeItem("admin_auth_time");
    return false;
  } catch (error) {
    console.error("Error checking admin authentication:", error);
    return false;
  }
};

// Log out admin user
export const logoutAdmin = (): void => {
  try {
    storage.removeItem("admin_authenticated");
    storage.removeItem("admin_auth_time");
  } catch (error) {
    console.error("Error logging out admin:", error);
  }
};

// Set admin authentication
export const loginAdmin = (): void => {
  try {
    const currentTime = Date.now().toString();
    storage.setItem("admin_authenticated", "true");
    storage.setItem("admin_auth_time", currentTime);
    
    // Double-check that values were set correctly
    const storedAuth = storage.getItem("admin_authenticated");
    const storedTime = storage.getItem("admin_auth_time");
    
    if (storedAuth !== "true" || !storedTime) {
      console.warn("Admin authentication storage issue - values not persisted correctly");
    }
  } catch (error) {
    console.error("Error setting admin authentication:", error);
  }
};

// Refresh admin session (call this on user activity)
export const refreshAdminSession = (): void => {
  try {
    if (storage.getItem("admin_authenticated") === "true") {
      storage.setItem("admin_auth_time", Date.now().toString());
    }
  } catch (error) {
    console.error("Error refreshing admin session:", error);
  }
};