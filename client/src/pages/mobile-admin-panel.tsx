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
  const [reports, setReports] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [ticketDistributions, setTicketDistributions] = useState<any[]>([]);
  
  // Load data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch reports
        const reportsResponse = await fetch('/api/shift-reports');
        if (reportsResponse.ok) {
          const reportsData = await reportsResponse.json();
          setReports(reportsData);
        }
        
        // Fetch employees
        const employeesResponse = await fetch('/api/employees');
        if (employeesResponse.ok) {
          const employeesData = await employeesResponse.json();
          setEmployees(employeesData);
        }
        
        // Fetch ticket distributions
        const ticketsResponse = await fetch('/api/ticket-distributions');
        if (ticketsResponse.ok) {
          const ticketsData = await ticketsResponse.json();
          setTicketDistributions(ticketsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
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
  const refreshData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch reports
      const reportsResponse = await fetch('/api/shift-reports');
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        setReports(reportsData);
      }
      
      // Fetch employees
      const employeesResponse = await fetch('/api/employees');
      if (employeesResponse.ok) {
        const employeesData = await employeesResponse.json();
        setEmployees(employeesData);
      }
      
      // Fetch ticket distributions
      const ticketsResponse = await fetch('/api/ticket-distributions');
      if (ticketsResponse.ok) {
        const ticketsData = await ticketsResponse.json();
        setTicketDistributions(ticketsData);
      }

      toast({
        title: "Data refreshed",
        description: "The latest data has been loaded",
        variant: "default",
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
      
      // Refresh reports after deletion
      const reportsResponse = await fetch('/api/shift-reports');
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        setReports(reportsData);
      }
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
    // Hardcoded location mapping for simplicity and reliability
    const locationMap: Record<number, string> = {
      1: "The Capital Grille",
      2: "Bob's Steak & Chop House",
      3: "Truluck's",
      4: "BOA Steakhouse"
    };
    
    return locationMap[locationId] || "Unknown";
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