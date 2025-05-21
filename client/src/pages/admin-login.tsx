import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Home } from "lucide-react";

// Define the admin password
const ADMIN_PASSWORD = "cg2023";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  // Handle direct admin access
  const goToAdmin = () => {
    // Use the special direct HTML page
    window.location.href = "/admin.html";
  };
  
  // Regular form login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === ADMIN_PASSWORD) {
      // Go to admin page using the HTML redirect
      window.location.href = "/admin.html";
    } else {
      // Show error
      setError("Invalid password. Please try again.");
      setPassword("");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="flex w-full max-w-md justify-end mb-4">
        <Link href="/">
          <Button 
            variant="outline"
            size="sm"
            className="bg-white hover:bg-gray-100 flex items-center gap-1"
          >
            <Home className="h-4 w-4" />
            Return to Home
          </Button>
        </Link>
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
              {error && (
                <div className="text-red-500 text-sm mt-1">{error}</div>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
            >
              Login
            </Button>
            
            <div className="mt-4 text-center">
              <button 
                type="button" 
                onClick={goToAdmin}
                className="underline text-blue-600"
              >
                Go directly to admin panel
              </button>
            </div>
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