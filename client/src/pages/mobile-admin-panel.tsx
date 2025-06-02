import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  User, 
  BarChart, 
  Ticket, 
  LogOut, 
  RefreshCw, 
  Trash2, 
  PlusCircle,
  LineChart,
  DollarSign
} from "lucide-react";
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
          console.log('Reports fetched:', reportsData.length);
          setReports(Array.isArray(reportsData) ? reportsData : []);
        } else {
          console.error('Failed to fetch reports');
          setReports([]);
        }
        
        // Fetch employees
        const employeesResponse = await fetch('/api/employees');
        if (employeesResponse.ok) {
          const employeesData = await employeesResponse.json();
          console.log('Employees fetched:', employeesData.length);
          setEmployees(Array.isArray(employeesData) ? employeesData : []);
        } else {
          console.error('Failed to fetch employees');
          setEmployees([]);
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
  
  // Log out function - simplified for mobile
  const handleLogout = () => {
    try {
      // Direct localStorage manipulation for better mobile reliability
      localStorage.removeItem("admin_authenticated");
      localStorage.removeItem("admin_auth_time");
      
      // Show success toast
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of the admin panel",
        variant: "default",
      });
      
      // Short delay before redirecting
      setTimeout(() => {
        // Redirect to login
        navigate("/admin-login");
      }, 100);
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
    const checkAuth = () => {
      try {
        // Use synchronous authentication check to prevent race conditions
        const adminAuthenticated = localStorage.getItem("admin_authenticated") === "true";
        const authTime = Number(localStorage.getItem("admin_auth_time") || "0");
        const currentTime = Date.now();
        const sessionTimeout = 2 * 60 * 1000; // 2 minutes
        
        // Directly check if authenticated and session is valid
        const isAuth = adminAuthenticated && (currentTime - authTime <= sessionTimeout);
        
        if (!isAuth) {
          console.log("Mobile admin panel: Authentication failed, redirecting to login");
          navigate("/admin-login");
        } else {
          console.log("Mobile admin panel: Authentication successful");
          localStorage.setItem("admin_auth_time", currentTime.toString());
        }
      } catch (error) {
        console.error("Auth check error:", error);
        // Don't automatically redirect on error - this could cause redirect loops
      }
    };
    
    // Run auth check with a small delay to ensure component is fully mounted
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, [navigate]);
  
  // Register activity to keep session alive - simplified version for mobile
  useEffect(() => {
    const activityEvents = ["mousedown", "keydown", "touchstart", "scroll"];
    
    // Direct localStorage update without dynamic imports that can cause issues on mobile
    const handleUserActivity = () => {
      try {
        // Only refresh if already authenticated
        if (localStorage.getItem("admin_authenticated") === "true") {
          localStorage.setItem("admin_auth_time", Date.now().toString());
        }
      } catch (error) {
        console.error("Error refreshing session:", error);
      }
    };
    
    // Add event listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });
    
    // Setup periodic refresh as a backup for mobile
    const intervalId = setInterval(handleUserActivity, 30000);
    
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
      clearInterval(intervalId);
    };
  }, []);

  // New state for ticket distribution form
  const [newTicketForm, setNewTicketForm] = useState({
    locationId: 1,
    allocatedTickets: 100,
    usedTickets: 0,
    batchNumber: '',
    notes: ''
  });

  // New state for employee form
  const [newEmployeeForm, setNewEmployeeForm] = useState({
    fullName: '',
    key: '',
    phoneNumber: '',
    hourlyRate: 0,
    isShiftLeader: false,
    isActive: true
  });

  // Handle new employee creation
  const handleCreateEmployee = async () => {
    if (!newEmployeeForm.fullName || !newEmployeeForm.key) {
      toast({
        title: "Missing information",
        description: "Please enter both name and login key",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Create new employee
      await apiRequest("POST", "/api/employees", {
        fullName: newEmployeeForm.fullName,
        key: newEmployeeForm.key,
        phoneNumber: newEmployeeForm.phoneNumber || null,
        hourlyRate: newEmployeeForm.hourlyRate || null,
        isShiftLeader: newEmployeeForm.isShiftLeader,
        isActive: newEmployeeForm.isActive
      });
      
      // Show success message
      toast({
        title: "Employee added",
        description: `${newEmployeeForm.fullName} has been added successfully`,
        variant: "default",
      });
      
      // Reset form
      setNewEmployeeForm({
        fullName: '',
        key: '',
        phoneNumber: '',
        hourlyRate: 0,
        isShiftLeader: false,
        isActive: true
      });
      
      // Refresh employees data
      const employeesResponse = await fetch('/api/employees');
      if (employeesResponse.ok) {
        const employeesData = await employeesResponse.json();
        setEmployees(Array.isArray(employeesData) ? employeesData : []);
      }
    } catch (error) {
      console.error("Error creating employee:", error);
      toast({
        title: "Error",
        description: "Failed to add employee",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle employee deletion
  const handleDeleteEmployee = async (employeeId: number) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) {
      return;
    }

    try {
      setIsLoading(true);
      
      // Delete employee
      await apiRequest("DELETE", `/api/employees/${employeeId}`);
      
      // Show success message
      toast({
        title: "Employee deleted",
        description: "Employee has been removed successfully",
        variant: "default",
      });
      
      // Refresh employees data
      const employeesResponse = await fetch('/api/employees');
      if (employeesResponse.ok) {
        const employeesData = await employeesResponse.json();
        setEmployees(Array.isArray(employeesData) ? employeesData : []);
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle new ticket distribution creation
  const handleCreateTicketDistribution = async () => {
    if (!newTicketForm.batchNumber) {
      toast({
        title: "Missing information",
        description: "Please enter a batch number",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Create new ticket distribution
      await apiRequest("POST", "/api/ticket-distributions", {
        locationId: newTicketForm.locationId,
        allocatedTickets: Number(newTicketForm.allocatedTickets),
        usedTickets: Number(newTicketForm.usedTickets),
        batchNumber: newTicketForm.batchNumber,
        notes: newTicketForm.notes || null
      });
      
      // Show success message
      toast({
        title: "Tickets created",
        description: "New ticket batch has been created successfully",
        variant: "default",
      });
      
      // Reset form
      setNewTicketForm({
        locationId: 1,
        allocatedTickets: 100,
        usedTickets: 0,
        batchNumber: '',
        notes: ''
      });
      
      // Refresh ticket distributions data
      const ticketsResponse = await fetch('/api/ticket-distributions');
      if (ticketsResponse.ok) {
        const ticketsData = await ticketsResponse.json();
        setTicketDistributions(ticketsData);
      }
    } catch (error) {
      console.error("Error creating ticket distribution:", error);
      toast({
        title: "Error",
        description: "Failed to create new tickets",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate location performance metrics
  const getLocationPerformance = () => {
    // Hardcoded location data for reliability
    const locations = [
      { id: 1, name: "The Capital Grille" },
      { id: 2, name: "Bob's Steak & Chop House" },
      { id: 3, name: "Truluck's" },
      { id: 4, name: "BOA Steakhouse" }
    ];
    
    const performance: Record<number, { 
      name: string;
      totalCars: number;
      totalRevenue: number;
      creditTransactions: number;
      cashTransactions: number;
    }> = {};
    
    // Initialize data for each location
    locations.forEach(loc => {
      performance[loc.id] = {
        name: loc.name,
        totalCars: 0,
        totalRevenue: 0,
        creditTransactions: 0,
        cashTransactions: 0
      };
    });
    
    // Process report data safely
    if (Array.isArray(reports)) {
      reports.forEach((report: any) => {
        if (report && typeof report === 'object') {
          const locationId = report.locationId;
          if (performance[locationId]) {
            const cars = Number(report.totalCars) || 0;
            performance[locationId].totalCars += cars;
            performance[locationId].creditTransactions += Number(report.creditTransactions) || 0;
            performance[locationId].cashTransactions += (Number(report.totalCars) - Number(report.creditTransactions)) || 0;
            
            // Calculate revenue based on location-specific rates
            let revenuePerCar = 11; // Default for Capital Grille
            if (locationId === 2) { // Bob's Steak & Chop House
              revenuePerCar = 6;
            } else if (locationId === 3) { // Truluck's
              revenuePerCar = 8;
            } else if (locationId === 4) { // BOA Steakhouse
              revenuePerCar = 7;
            }
            
            performance[locationId].totalRevenue += cars * revenuePerCar;
          }
        }
      });
    }
    
    return Object.values(performance);
  };

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
      
      {/* Tabbed Interface */}
      <Tabs defaultValue="reports" className="mb-6">
        <TabsList className="grid grid-cols-5 mb-4 text-xs w-full overflow-x-auto">
          <TabsTrigger value="reports" className="min-w-0 flex-shrink-0">Reports</TabsTrigger>
          <TabsTrigger value="tickets" className="min-w-0 flex-shrink-0">Tickets</TabsTrigger>
          <TabsTrigger value="performance" className="min-w-0 flex-shrink-0">Performance</TabsTrigger>
          <TabsTrigger value="hours" className="min-w-0 flex-shrink-0">Hours</TabsTrigger>
          <TabsTrigger value="employees" className="min-w-0 flex-shrink-0">Employees</TabsTrigger>
        </TabsList>
        
        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Recent Reports</CardTitle>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <p className="text-gray-500 text-sm">No reports available</p>
              ) : (
                <div className="space-y-3">
                  {reports
                    .sort((a: any, b: any) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime())
                    .slice(0, 15)
                    .map((report: any) => (
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
        </TabsContent>
        
        {/* Tickets Tab */}
        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Issue New Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Select 
                    value={String(newTicketForm.locationId)} 
                    onValueChange={(val) => setNewTicketForm({...newTicketForm, locationId: Number(val)})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">The Capital Grille</SelectItem>
                      <SelectItem value="2">Bob's Steak & Chop House</SelectItem>
                      <SelectItem value="3">Truluck's</SelectItem>
                      <SelectItem value="4">BOA Steakhouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="batchNumber">Batch Number</Label>
                    <Input 
                      id="batchNumber"
                      value={newTicketForm.batchNumber}
                      onChange={(e) => setNewTicketForm({...newTicketForm, batchNumber: e.target.value})}
                      placeholder="e.g., B12345"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="allocatedTickets">Allocated Tickets</Label>
                    <Input 
                      id="allocatedTickets"
                      type="number"
                      value={newTicketForm.allocatedTickets}
                      onChange={(e) => setNewTicketForm({...newTicketForm, allocatedTickets: Number(e.target.value)})}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input 
                    id="notes"
                    value={newTicketForm.notes}
                    onChange={(e) => setNewTicketForm({...newTicketForm, notes: e.target.value})}
                    placeholder="Any additional information"
                  />
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={handleCreateTicketDistribution}
                  disabled={isLoading}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Issue New Tickets
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Recent Ticket Batches</CardTitle>
            </CardHeader>
            <CardContent>
              {ticketDistributions.length === 0 ? (
                <p className="text-gray-500 text-sm">No ticket batches available</p>
              ) : (
                <div className="space-y-3">
                  {ticketDistributions.slice(0, 10).map((dist: any) => (
                    <div key={dist.id} className="border rounded p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{getLocationName(dist.locationId)}</h3>
                          <p className="text-sm text-gray-600">Batch: {dist.batchNumber}</p>
                        </div>
                      </div>
                      <Separator className="my-2" />
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-gray-500">Allocated:</p>
                          <p className="font-medium">{dist.allocatedTickets}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Used:</p>
                          <p className="font-medium">{dist.usedTickets}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Remaining:</p>
                          <p className="font-medium">{dist.allocatedTickets - dist.usedTickets}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Date:</p>
                          <p className="font-medium">{formatDate(dist.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Location Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getLocationPerformance().map((location, index) => (
                  <div key={index} className="border rounded p-3">
                    <h3 className="font-medium text-lg mb-2">{location.name}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 rounded p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-700">Total Cars</p>
                          <p className="text-xl font-bold">{location.totalCars}</p>
                        </div>
                        <BarChart className="h-8 w-8 text-blue-500" />
                      </div>
                      
                      <div className="bg-green-50 rounded p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-700">Revenue</p>
                          <p className="text-xl font-bold">{formatCurrency(location.totalRevenue)}</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-green-500" />
                      </div>
                      
                      <div className="bg-purple-50 rounded p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-700">Credit Trans.</p>
                          <p className="text-xl font-bold">{location.creditTransactions}</p>
                        </div>
                        <LineChart className="h-8 w-8 text-purple-500" />
                      </div>
                      
                      <div className="bg-amber-50 rounded p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-amber-700">Cash Trans.</p>
                          <p className="text-xl font-bold">{location.cashTransactions}</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-amber-500" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Hours Tracker Tab */}
        <TabsContent value="hours" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Weekly Hours Tracker</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                // Calculate weekly hours for each employee
                const weeklyHours = {};
                const today = new Date();
                const currentWeekStart = new Date(today);
                currentWeekStart.setDate(today.getDate() - today.getDay());
                currentWeekStart.setHours(0, 0, 0, 0);
                const currentWeekEnd = new Date(currentWeekStart);
                currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
                currentWeekEnd.setHours(23, 59, 59, 999);

                // Calculate hours from shift reports
                reports.forEach((report) => {
                  const reportDate = new Date(report.date);
                  if (reportDate >= currentWeekStart && reportDate <= currentWeekEnd) {
                    // Parse employees field which contains JSON string
                    let employees = [];
                    try {
                      employees = typeof report.employees === 'string' ? JSON.parse(report.employees) : report.employees || [];
                    } catch (e) {
                      employees = [];
                    }
                    
                    if (Array.isArray(employees)) {
                      employees.forEach((empHour) => {
                        if (!weeklyHours[empHour.name]) {
                          weeklyHours[empHour.name] = { totalHours: 0 };
                        }
                        weeklyHours[empHour.name].totalHours += empHour.hours || 0;
                      });
                    }
                  }
                });

                // Add employees with 0 hours
                employees.forEach((emp) => {
                  if (!weeklyHours[emp.fullName]) {
                    weeklyHours[emp.fullName] = { totalHours: 0 };
                  }
                });

                const hoursEntries = Object.entries(weeklyHours).sort((a, b) => b[1].totalHours - a[1].totalHours);

                return hoursEntries.length === 0 ? (
                  <p className="text-gray-500 text-sm">No hours data available for this week</p>
                ) : (
                  <div className="space-y-3">
                    {hoursEntries.map(([name, data]) => (
                      <div key={name} className="border rounded p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{name}</p>
                          <p className="text-sm text-gray-500">This week</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold">{data.totalHours}h</span>
                          {data.totalHours >= 35 && (
                            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                              {data.totalHours >= 40 ? 'OVERTIME' : 'WARNING'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-4">
          {/* Add New Employee Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <PlusCircle className="h-5 w-5 mr-2" />
                Add New Employee
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="newEmployeeName">Full Name</Label>
                    <Input 
                      id="newEmployeeName"
                      placeholder="Employee name"
                      value={newEmployeeForm.fullName}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, fullName: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="newEmployeeKey">Login Key</Label>
                    <Input 
                      id="newEmployeeKey"
                      placeholder="Unique key"
                      value={newEmployeeForm.key}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, key: e.target.value.toLowerCase()})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="newEmployeePhone">Phone Number</Label>
                    <Input 
                      id="newEmployeePhone"
                      placeholder="Phone number"
                      value={newEmployeeForm.phoneNumber}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, phoneNumber: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="newEmployeeRate">Hourly Rate</Label>
                    <Input 
                      id="newEmployeeRate"
                      type="number"
                      step="0.25"
                      placeholder="Rate"
                      value={newEmployeeForm.hourlyRate}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, hourlyRate: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newEmployeeForm.isShiftLeader}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, isShiftLeader: e.target.checked})}
                      className="rounded"
                    />
                    <span className="text-sm">Shift Leader</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newEmployeeForm.isActive}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, isActive: e.target.checked})}
                      className="rounded"
                    />
                    <span className="text-sm">Active</span>
                  </label>
                </div>
                
                <Button 
                  onClick={handleCreateEmployee}
                  disabled={isLoading || !newEmployeeForm.fullName || !newEmployeeForm.key}
                  className="w-full"
                >
                  {isLoading ? "Adding..." : "Add Employee"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* All Employees List */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">All Employees ({employees.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {employees.length === 0 ? (
                <p className="text-gray-500 text-sm">No employees available</p>
              ) : (
                <div className="space-y-3">
                  {employees.map((emp) => (
                    <div key={emp.id} className="border rounded p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{emp.fullName}</p>
                          <p className="text-sm text-gray-500">Key: {emp.key}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex flex-col items-end space-y-1">
                            {emp.isShiftLeader && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                Shift Leader
                              </span>
                            )}
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              emp.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {emp.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 ml-2" 
                            onClick={() => handleDeleteEmployee(emp.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      
                      {emp.phoneNumber && (
                        <p className="text-sm text-gray-600">Phone: {emp.phoneNumber}</p>
                      )}
                      
                      {emp.hourlyRate && (
                        <p className="text-sm text-gray-600">Rate: ${emp.hourlyRate}/hr</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Footer Note */}
      <p className="text-center text-xs text-gray-500 mt-6">
        This is a mobile-friendly version of the admin panel.
      </p>
    </div>
  );
}