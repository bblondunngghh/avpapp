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
    // Async function to import auth utilities and check authentication
    const checkAuthentication = async () => {
      try {
        // Import the auth utilities
        const { isAdminAuthenticated } = await import("@/lib/admin-auth");
        
        // Check if admin is authenticated
        const isAuth = isAdminAuthenticated();
        
        // Update state
        setIsAuthenticated(isAuth);
        setIsCheckingAuth(false);
        
        // Redirect to login if not authenticated
        if (!isAuth) {
          navigate("/admin-login");
        }
      } catch (error) {
        console.error("Error checking admin authentication:", error);
        setIsCheckingAuth(false);
        navigate("/admin-login");
      }
    };
    
    // Run the authentication check
    checkAuthentication();
  }, [navigate]);

  // Show loading indicator while checking authentication
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