import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Define the admin password - hardcoded for simplicity
const ADMIN_PASSWORD = "cg2023";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Super simple, reliable direct approach
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === ADMIN_PASSWORD) {
      // Immediately redirect with no async operations
      window.location.href = "/admin";
    } else {
      // Error message
      toast({
        title: "Login failed",
        description: "Invalid password",
        variant: "destructive",
      });
      
      setPassword("");
    }
  };

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
              {isLoading ? "Logging in..." : "Login"}
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