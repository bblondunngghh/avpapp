import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

/**
 * This component protects admin routes - redirects to login if not authenticated
 */
export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const [, navigate] = useLocation();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication status using multiple methods
    const checkAuth = () => {
      // Try multiple storage types for better cross-platform reliability
      let isAuthenticated = false;
      
      // Check sessionStorage (best for iOS)
      try {
        if (sessionStorage.getItem("admin_authenticated") === "true") {
          isAuthenticated = true;
        }
      } catch (e) {
        console.warn("Error checking sessionStorage", e);
      }
      
      // If not found in sessionStorage, check localStorage as backup
      if (!isAuthenticated) {
        try {
          if (localStorage.getItem("admin_authenticated") === "true") {
            isAuthenticated = true;
            // Copy to sessionStorage for future checks
            try {
              sessionStorage.setItem("admin_authenticated", "true");
              sessionStorage.setItem("admin_auth_time", Date.now().toString());
            } catch (e) {
              console.warn("Could not set sessionStorage", e);
            }
          }
        } catch (e) {
          console.warn("Error checking localStorage", e);
        }
      }
      
      // Check window property as last resort
      // @ts-ignore
      if (!isAuthenticated && window.__adminAuthenticated === true) {
        isAuthenticated = true;
        // Try to save to storages
        try {
          sessionStorage.setItem("admin_authenticated", "true");
          sessionStorage.setItem("admin_auth_time", Date.now().toString());
        } catch (e) {
          console.warn("Could not set sessionStorage", e);
        }
      }
      
      // Set state and return result
      setIsAuthenticated(isAuthenticated);
      return isAuthenticated;
    };

    const isAuth = checkAuth();
    setIsCheckingAuth(false);

    // Redirect to login if not authenticated
    if (!isAuth) {
      navigate("/admin-login");
    }
  }, [navigate]);

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // If authenticated, render children
  return isAuthenticated ? <>{children}</> : null;
}