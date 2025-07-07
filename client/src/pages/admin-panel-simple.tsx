import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { redirectToLogout } from "@/lib/authUtils";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import houseIcon from "@assets/House-3--Streamline-Ultimate.png";
import logoutIcon from "@assets/Logout-2--Streamline-Ultimate.png";

export default function AdminPanelSimple() {
  const [, navigate] = useLocation();
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Authentication protection
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You need to log in to access the admin panel. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const handleLogout = () => {
    redirectToLogout();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading admin panel...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Redirecting to login...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl text-blue-600">Admin Panel</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate("/")}
              className="flex items-center gap-1"
            >
              <img src={houseIcon} alt="House" className="h-4 w-4" />
              Home
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <img src={logoutIcon} alt="Logout" className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Welcome to the Admin Panel</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-700">Authenticated User:</h3>
              <p className="text-gray-600">{user?.email || 'No email available'}</p>
              <p className="text-gray-600">User ID: {user?.id}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Admin Status:</h3>
              <p className="text-gray-600">Admin Access: {user?.isAdmin ? 'Yes' : 'No'}</p>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500">
                OAuth authentication is working successfully! You can now access the full admin panel.
              </p>
              <Button 
                onClick={() => navigate("/admin-full")} 
                className="mt-4"
                variant="default"
              >
                Go to Full Admin Panel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}