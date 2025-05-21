import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, BarChart, Ticket, LogOut, RefreshCw, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { LOCATIONS, ShiftReport, Employee, TicketDistribution } from "@shared/schema";

// Simple mobile-friendly admin panel that works on iOS
export default function MobileAdminPanel() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Data queries with proper typing
  const reportsQuery = useQuery<ShiftReport[]>({
    queryKey: ["/api/shift-reports"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  const reports = reportsQuery.data || [];
  
  const employeesQuery = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  const employees = employeesQuery.data || [];
  
  const ticketDistributionsQuery = useQuery<TicketDistribution[]>({
    queryKey: ["/api/ticket-distributions"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  const ticketDistributions = ticketDistributionsQuery.data || [];
  
  // Log out function
  const handleLogout = async () => {
    try {
      // Import admin auth utility
      const { logoutAdmin } = await import("@/lib/admin-auth");
      logoutAdmin();
      
      // Show success toast
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of the admin panel",
        variant: "default",
      });
      
      // Redirect to login
      navigate("/admin-login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  
  // Refresh data
  const refreshData = () => {
    setIsLoading(true);
    queryClient.invalidateQueries({ queryKey: ["/api/shift-reports"] });
    queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
    queryClient.invalidateQueries({ queryKey: ["/api/ticket-distributions"] });
    setTimeout(() => setIsLoading(false), 1000);
  };
  
  // Delete report
  const handleDeleteReport = async (reportId: number) => {
    if (!window.confirm("Are you sure you want to delete this report?")) {
      return;
    }
    
    try {
      await apiRequest("DELETE", `/api/shift-reports/${reportId}`);
      toast({
        title: "Report deleted",
        description: "The report has been successfully deleted",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shift-reports"] });
    } catch (error) {
      console.error("Error deleting report:", error);
      toast({
        title: "Error",
        description: "Failed to delete the report",
        variant: "destructive",
      });
    }
  };
  
  // Get location name by ID
  const getLocationName = (locationId: number): string => {
    // Type safety for LOCATIONS
    type LocationType = {
      id: number;
      name: string;
    };
    
    // Convert locations to array with proper types
    const locationsArray: LocationType[] = [];
    
    // Manually add locations to ensure type safety
    for (const key in LOCATIONS) {
      if (Object.prototype.hasOwnProperty.call(LOCATIONS, key)) {
        const loc = LOCATIONS[key as keyof typeof LOCATIONS];
        locationsArray.push({
          id: Number(loc.id),
          name: String(loc.name)
        });
      }
    }
    
    // Find location by ID
    const location = locationsArray.find(loc => loc.id === locationId);
    return location ? location.name : "Unknown";
  };
  
  // Format date for display
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Unknown";
    
    try {
      // Try to handle multiple date formats
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(date);
    } catch (e) {
      return dateStr;
    }
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Verify authentication on load
  useEffect(() => {
    // Double check authentication on component mount
    const checkAuth = async () => {
      try {
        const { isAdminAuthenticated } = await import("@/lib/admin-auth");
        const isAuth = isAdminAuthenticated();
        
        if (!isAuth) {
          navigate("/admin-login");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        navigate("/admin-login");
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  // Register activity to keep session alive
  useEffect(() => {
    const activityEvents = ["mousedown", "keydown", "touchstart", "scroll"];
    
    const handleUserActivity = async () => {
      try {
        const { refreshAdminSession } = await import("@/lib/admin-auth");
        refreshAdminSession();
      } catch (error) {
        console.error("Error refreshing session:", error);
      }
    };
    
    // Add event listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });
    
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, []);

  return (
    <div className="container mx-auto p-4 pb-20">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-medium">Admin Panel</h1>
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={refreshData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing' : 'Refresh'}
          </Button>
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-1" />
            Logout
          </Button>
        </div>
      </div>
      
      {/* Dashboard Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card className="col-span-1">
          <CardContent className="p-3">
            <div className="flex items-center">
              <User className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium">Employees</p>
                <p className="text-xl">{employees.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardContent className="p-3">
            <div className="flex items-center">
              <BarChart className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm font-medium">Reports</p>
                <p className="text-xl">{reports.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardContent className="p-3">
            <div className="flex items-center">
              <Ticket className="h-5 w-5 text-purple-600 mr-2" />
              <div>
                <p className="text-sm font-medium">Tickets</p>
                <p className="text-xl">{ticketDistributions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Reports */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-gray-500 text-sm">No reports available</p>
          ) : (
            <div className="space-y-3">
              {reports.slice(0, 10).map((report: any) => (
                <div key={report.id} className="border rounded p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">{getLocationName(report.locationId)}</h3>
                      <p className="text-sm text-gray-600">{formatDate(report.date)} - {report.shift}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0" 
                      onClick={() => handleDeleteReport(report.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  <Separator className="my-2" />
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500">Total Cars:</p>
                      <p className="font-medium">{report.totalCars}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Cash Collected:</p>
                      <p className="font-medium">{formatCurrency(report.totalCashCollected)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Credit Sales:</p>
                      <p className="font-medium">{formatCurrency(report.totalCreditSales)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Turn-In:</p>
                      <p className="font-medium">{formatCurrency(report.totalTurnIn)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Active Employees */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Active Employees</CardTitle>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <p className="text-gray-500 text-sm">No employees available</p>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {employees
                .filter((emp: any) => emp.isActive)
                .slice(0, 10)
                .map((emp: any) => (
                  <div key={emp.id} className="border rounded p-2 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{emp.fullName}</p>
                      <p className="text-xs text-gray-500">ID: {emp.key}</p>
                    </div>
                    {emp.isShiftLeader && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Shift Leader
                      </span>
                    )}
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Footer Note */}
      <p className="text-center text-xs text-gray-500 mt-6">
        This is a mobile-friendly version of the admin panel.
      </p>
    </div>
  );
}