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
    // Check authentication status
    const checkAuth = () => {
      const isAdmin = localStorage.getItem("admin_authenticated") === "true";
      const authTime = Number(localStorage.getItem("admin_auth_time") || "0");
      const currentTime = Date.now();
      const fourHoursInMs = 4 * 60 * 60 * 1000;
      
      // If session expired (4 hours), clear auth
      if (currentTime - authTime > fourHoursInMs) {
        localStorage.removeItem("admin_authenticated");
        localStorage.removeItem("admin_auth_time");
        setIsAuthenticated(false);
        return false;
      }

      setIsAuthenticated(isAdmin);
      return isAdmin;
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