import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Reports from "@/pages/reports";

export default function ReportsWrapper() {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { isAdminAuthenticated } = await import("@/lib/admin-auth");
        const isAuth = isAdminAuthenticated();
        setIsAuthenticated(isAuth);
        setIsChecking(false);
        
        if (!isAuth) {
          setLocation("/admin-login");
        }
      } catch (err) {
        console.error("Auth check error:", err);
        setIsAuthenticated(false);
        setIsChecking(false);
        setLocation("/admin-login");
      }
    };

    checkAuth();
  }, [setLocation]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Checking authentication...</div>
      </div>
    );
  }

  return isAuthenticated ? <Reports /> : null;
}