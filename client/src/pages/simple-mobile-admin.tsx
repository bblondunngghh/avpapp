import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, RefreshCw } from "lucide-react";
import { formatDateForDisplay } from "@/lib/timezone";

// Extremely simplified mobile admin panel for iOS compatibility
export default function SimpleMobileAdmin() {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
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
    
    // Basic authentication check
    const checkAuth = () => {
      const adminAuthenticated = localStorage.getItem("admin_authenticated") === "true";
      if (!adminAuthenticated) {
        navigate("/admin-login");
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("admin_authenticated");
    localStorage.removeItem("admin_auth_time");
    navigate("/admin-login");
  };
  
  // Format date using timezone-aware function
  const formatDate = (dateStr: string) => {
    return formatDateForDisplay(dateStr);
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Get location name
  const getLocationName = (locationId: number): string => {
    const locations: Record<number, string> = {
      1: "The Capital Grille",
      2: "Bob's Steak & Chop House",
      3: "Truluck's",
      4: "BOA Steakhouse"
    };
    return locations[locationId] || "Unknown";
  };
  
  // Calculate location performance metrics
  const getLocationPerformance = () => {
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
    }> = {};
    
    // Initialize data for each location
    locations.forEach(loc => {
      performance[loc.id] = {
        name: loc.name,
        totalCars: 0,
        totalRevenue: 0
      };
    });
    
    // Process report data
    if (Array.isArray(reports)) {
      reports.forEach((report: any) => {
        if (report && typeof report === 'object') {
          const locationId = report.locationId;
          if (performance[locationId]) {
            const cars = Number(report.totalCars) || 0;
            performance[locationId].totalCars += cars;
            
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p>Loading admin data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pb-20">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-medium">Mobile Admin</h1>
        <Button 
          size="sm" 
          variant="destructive" 
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-1" />
          Logout
        </Button>
      </div>
      
      {/* Dashboard Summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="col-span-1">
          <CardContent className="p-3">
            <div className="flex flex-col">
              <p className="text-sm font-medium">Reports</p>
              <p className="text-xl">{reports.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardContent className="p-3">
            <div className="flex flex-col">
              <p className="text-sm font-medium">Tickets</p>
              <p className="text-xl">{ticketDistributions.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabbed Interface */}
      <Tabs defaultValue="reports" className="mb-6">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
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
                  {reports.slice(0, 8).map((report: any) => (
                    <div key={report.id} className="border rounded p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{getLocationName(report.locationId)}</h3>
                          <p className="text-sm text-gray-600">{formatDate(report.date)} - {report.shift}</p>
                        </div>
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
        </TabsContent>
        
        {/* Performance Tab */}
        <TabsContent value="performance">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Location Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getLocationPerformance().map((location) => (
                  <div key={location.name} className="border rounded p-3">
                    <h3 className="font-medium mb-2">{location.name}</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">Total Cars:</p>
                        <p className="font-medium">{location.totalCars}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total Revenue:</p>
                        <p className="font-medium">{formatCurrency(location.totalRevenue)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}