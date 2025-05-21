import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, LockKeyhole, ArrowLeft } from "lucide-react";
import LocationSelectorModal from "@/components/location-selector-modal";
import ReportCard from "@/components/report-card";
import { LOCATIONS } from "@/lib/constants";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { useLocation } from "wouter";

export default function Reports() {
  const [, navigate] = useLocation();
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // Check if user is authenticated as admin
  useEffect(() => {
    const checkAuth = () => {
      if (!isAdminAuthenticated()) {
        navigate("/admin");
      } else {
        setIsAuthorized(true);
      }
    };
    
    checkAuth();
    
    // Check authorization every 30 seconds to ensure session hasn't timed out
    const interval = setInterval(checkAuth, 30000);
    return () => clearInterval(interval);
  }, [navigate]);
  
  // Fetch all shift reports
  const { data: reports, isLoading } = useQuery({
    queryKey: ['/api/shift-reports'],
  });
  
  // Filter reports
  const filteredReports = reports ? reports.filter((report: any) => {
    let matchesLocation = true;
    let matchesDate = true;
    
    if (locationFilter && locationFilter !== "all") {
      matchesLocation = report.locationId === parseInt(locationFilter);
    }
    
    if (dateFilter) {
      matchesDate = report.date === dateFilter;
    }
    
    return matchesLocation && matchesDate;
  }) : [];
  
  // Handle new report
  const handleNewReport = () => {
    setIsModalOpen(true);
  };
  
  // Show unauthorized state if user is not an admin
  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="p-8 rounded-lg border shadow-lg bg-white max-w-lg w-full text-center">
          <LockKeyhole size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-semibold mb-2">Access Restricted</h2>
          <p className="text-gray-600 mb-6">
            The Reports page is only accessible through the Admin Panel.
            Please log in as an administrator to view this content.
          </p>
          <Button 
            onClick={() => navigate("/")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate("/admin")}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin Panel
          </Button>
          <h2 className="text-2xl font-normal text-primary">All Reports</h2>
        </div>
        <Button
          onClick={handleNewReport}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Plus className="mr-1 h-4 w-4" /> New Report
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-3">Filter Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="locationFilter">
                Location
              </label>
              <Select
                value={locationFilter}
                onValueChange={setLocationFilter}
              >
                <SelectTrigger id="locationFilter">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {LOCATIONS.map(location => (
                    <SelectItem key={location.id} value={location.id.toString()}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="dateFilter">
                Date
              </label>
              <div className="relative">
                <Input
                  id="dateFilter"
                  type="date"
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                />
                {dateFilter && (
                  <Button
                    variant="ghost" 
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setDateFilter("")}
                  >
                    <span className="sr-only">Clear date</span>
                    &times;
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex items-end">
              <Button
                className="w-full"
                variant={locationFilter || dateFilter ? "default" : "outline"}
                onClick={() => {
                  if (locationFilter || dateFilter) {
                    setLocationFilter("");
                    setDateFilter("");
                  }
                }}
              >
                <Search className="mr-1 h-4 w-4" /> 
                {locationFilter || dateFilter ? "Reset Filters" : "Filter"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isLoading ? (
        // Loading state
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="mb-4">
              <CardContent className="p-4">
                <div className="flex justify-between">
                  <div>
                    <Skeleton className="h-5 w-40 mb-2" />
                    <Skeleton className="h-4 w-32 mb-3" />
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredReports.length > 0 ? (
        // Reports list
        <div>
          {filteredReports.map(report => (
            <ReportCard
              key={report.id}
              id={report.id}
              locationId={report.locationId}
              date={report.date}
              shift={report.shift}
              shiftLeader={report.shiftLeader}
              totalCars={report.totalCars}
              totalCreditSales={report.totalCreditSales || 0}
              totalCashCollected={report.totalCashCollected || 0}
              companyCashTurnIn={report.companyCashTurnIn || 0}
              totalTurnIn={report.totalTurnIn || 0}
              creditTransactions={report.creditTransactions}
              totalReceipts={report.totalReceipts}
              totalReceiptSales={report.totalReceiptSales}
              employees={report.employees}
              totalJobHours={report.totalJobHours}
              createdAt={report.createdAt}
            />
          ))}
        </div>
      ) : (
        // No reports state
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500 mb-4">
              {locationFilter || dateFilter
                ? "No reports match your filter criteria"
                : "No reports found"}
            </p>
            <Button 
              onClick={handleNewReport} 
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Create a New Report
            </Button>
          </CardContent>
        </Card>
      )}
      
      <LocationSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
