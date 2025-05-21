import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Define the admin password
const ADMIN_PASSWORD = "cg2023";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  // Check if we're in the browser
  useEffect(() => {
    setIsClient(true);
    
    // Check if already authenticated on page load
    try {
      const isAuthenticated = sessionStorage.getItem("admin_authenticated") === "true";
      if (isAuthenticated) {
        navigate("/admin");
      }
    } catch (e) {
      console.warn("Could not check sessionStorage", e);
    }
  }, [navigate]);

  // Handle form submission
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simple password check
    if (password === ADMIN_PASSWORD) {
      try {
        // Set auth in sessionStorage (more reliable on mobile)
        sessionStorage.setItem("admin_authenticated", "true");
        sessionStorage.setItem("admin_auth_time", Date.now().toString());
        
        // Also try localStorage as backup
        try {
          localStorage.setItem("admin_authenticated", "true");
          localStorage.setItem("admin_auth_time", Date.now().toString());
        } catch (e) {
          console.warn("localStorage not available, using sessionStorage only");
        }
        
        // For extra reliability, set a variable directly on window
        // @ts-ignore
        window.__adminAuthenticated = true;
        
        // Show success toast
        toast({
          title: "Authentication successful",
          description: "Welcome to the admin panel",
          variant: "default",
        });
        
        // Navigate to admin dashboard
        navigate("/admin");
      } catch (error) {
        console.error("Login error:", error);
        toast({
          title: "Authentication error",
          description: "There was a problem processing your login. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    } else {
      // Show error toast
      toast({
        title: "Authentication failed",
        description: "The password you entered is incorrect",
        variant: "destructive",
      });
      
      // Reset form
      setPassword("");
      setIsLoading(false);
    }
  };

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="flex w-full max-w-md justify-end mb-4">
        <Button 
          variant="outline"
          size="sm"
          onClick={() => navigate("/")}
          className="bg-white hover:bg-gray-100 flex items-center gap-1"
        >
          <Home className="h-4 w-4" />
          Return to Home
        </Button>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-blue-100 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
            <Lock className="h-7 w-7 text-blue-700" />
          </div>
          <CardTitle className="text-2xl">Admin Access</CardTitle>
          <CardDescription>
            Enter the admin password to access the administration panel
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <Input 
                id="password"
                type="password" 
                placeholder="Enter admin password" 
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Authenticating..." : "Login"}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="text-center text-sm text-gray-500 border-t pt-4">
          <p className="w-full">
            This area is restricted to authorized personnel only.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}