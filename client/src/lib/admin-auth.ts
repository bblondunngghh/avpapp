// Admin authentication utilities

// Admin session timeout (2 minutes in milliseconds)
export const ADMIN_SESSION_TIMEOUT = 2 * 60 * 1000;

// Check if admin is authenticated
export const isAdminAuthenticated = (): boolean => {
  const isAuthenticated = localStorage.getItem("admin_authenticated") === "true";
  const authTime = Number(localStorage.getItem("admin_auth_time") || "0");
  const currentTime = Date.now();
  
  // Session expires after ADMIN_SESSION_TIMEOUT of inactivity
  if (isAuthenticated && (currentTime - authTime <= ADMIN_SESSION_TIMEOUT)) {
    // Update the authentication time to extend the session
    localStorage.setItem("admin_auth_time", currentTime.toString());
    return true;
  }
  
  // If not authenticated or session expired, clear auth data
  localStorage.removeItem("admin_authenticated");
  localStorage.removeItem("admin_auth_time");
  return false;
};

// Log out admin user
export const logoutAdmin = (): void => {
  localStorage.removeItem("admin_authenticated");
  localStorage.removeItem("admin_auth_time");
};

// Set admin authentication
export const loginAdmin = (): void => {
  localStorage.setItem("admin_authenticated", "true");
  localStorage.setItem("admin_auth_time", Date.now().toString());
};

// Refresh admin session (call this on user activity)
export const refreshAdminSession = (): void => {
  if (localStorage.getItem("admin_authenticated") === "true") {
    localStorage.setItem("admin_auth_time", Date.now().toString());
  }
};