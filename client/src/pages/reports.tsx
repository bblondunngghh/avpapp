import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, LockKeyhole, ArrowLeft } from "lucide-react";
import houseIcon from "@assets/House-3--Streamline-Ultimate.png";
import LocationSelectorModal from "@/components/location-selector-modal";
import ReportCard from "@/components/report-card";
import { LOCATIONS } from "@/lib/constants";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { useLocation } from "wouter";
import { formatDateForDisplay, formatDateInCentral, parseDateInCentral } from "@/lib/timezone";

export default function Reports() {
  const [, navigate] = useLocation();
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const REPORTS_PER_PAGE = 10;
  
  // Check if user is authenticated as admin
  useEffect(() => {
    const checkAuth = () => {
      if (!isAdminAuthenticated()) {
        navigate("/admin-login");
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

  // Pagination
  const totalPages = Math.ceil(filteredReports.length / REPORTS_PER_PAGE);
  const startIndex = (currentPage - 1) * REPORTS_PER_PAGE;
  const endIndex = startIndex + REPORTS_PER_PAGE;
  const currentReports = filteredReports.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [locationFilter, dateFilter]);
  
  // Handle new report
  const handleNewReport = () => {
    setIsModalOpen(true);
  };
  
  // Show unauthorized state if user is not an admin
  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900/80 via-blue-900/80 to-indigo-900/80 rounded-2xl border border-white/20 backdrop-blur-xl shadow-2xl p-8 max-w-lg w-full text-center">
          {/* Enhanced Glass morphism overlay */}
          <div className="absolute inset-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
          
          <div className="relative z-10">
            <LockKeyhole size={48} className="mx-auto mb-4 text-red-400" />
            <h2 className="text-2xl font-semibold mb-2 text-white">Access Restricted</h2>
            <p className="text-slate-300 mb-6">
              The Reports page is only accessible through the Admin Panel.
              Please log in as an administrator to view this content.
            </p>
            <Button 
              onClick={() => navigate("/")}
              className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-6">
      {/* Enhanced Glass morphism overlay */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
      
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
      
      {/* Content with z-index */}
      <div className="relative z-10">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => navigate("/admin")}
            className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-1"
          >
            <img src={houseIcon} alt="House" className="h-4 w-4" />
            Back to Admin Panel
          </Button>
          <h2 className="text-2xl font-normal text-white">All Reports</h2>
        </div>
        <Button
          onClick={handleNewReport}
          className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Plus className="mr-1 h-4 w-4" /> New Report
        </Button>
      </div>
      
      <div className="relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl mb-6">
        {/* Enhanced Glass morphism overlay */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
        
        {/* Content with z-index */}
        <div className="relative z-10 pt-6 p-6">
          <h3 className="text-lg font-medium mb-3 text-white">Filter Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="locationFilter">
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
              <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="dateFilter">
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
                className="w-full bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300"
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
        </div>
      </div>
      
      {isLoading ? (
        // Loading state
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="relative overflow-hidden bg-gradient-to-r from-slate-900/80 via-blue-900/80 to-indigo-900/80 rounded-2xl border border-white/20 backdrop-blur-xl shadow-2xl mb-4">
              {/* Enhanced Glass morphism overlay */}
              <div className="absolute inset-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
              
              <div className="relative z-10 p-4">
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
              </div>
            </div>
          ))}
        </div>
      ) : filteredReports.length > 0 ? (
        // Reports list
        <div>
          {currentReports.map(report => (
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-900/80 via-blue-900/80 to-indigo-900/80 rounded-2xl border border-white/20 backdrop-blur-xl shadow-2xl mt-6">
              {/* Enhanced Glass morphism overlay */}
              <div className="absolute inset-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
              
              <div className="relative z-10 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-300">
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredReports.length)} of {filteredReports.length} reports
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-slate-300">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Summary Totals Table */}
          {(() => {
            // Calculate totals from filtered reports
            const totals = filteredReports.reduce((acc, report) => {
              acc.totalCars += report.totalCars || 0;
              acc.totalCash += report.companyCashTurnIn || 0;
              acc.totalCredit += report.totalCreditSales || 0;
              acc.totalTurnIn += report.totalTurnIn || 0;
              return acc;
            }, {
              totalCars: 0,
              totalCash: 0,
              totalCredit: 0,
              totalTurnIn: 0
            });

            return (
              <div className="relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl mt-6">
                {/* Enhanced Glass morphism overlay */}
                <div className="absolute inset-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
                
                <div className="relative z-10 p-6">
                  <h3 className="text-lg font-semibold mb-4 text-white">
                    Summary Totals {(locationFilter || dateFilter) && (
                      <span className="text-sm font-normal text-slate-300">
                        (Filtered Results)
                      </span>
                    )}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-md border border-white/20">
                      <div className="text-sm font-medium text-slate-300">Total Cars Parked</div>
                      <div className="text-2xl font-bold text-blue-300">{totals.totalCars.toLocaleString()}</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-md border border-white/20">
                      <div className="text-sm font-medium text-slate-300">Total Cash Sales</div>
                      <div className="text-2xl font-bold text-green-300">${totals.totalCash.toLocaleString()}</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-md border border-white/20">
                      <div className="text-sm font-medium text-slate-300">Total Credit Sales</div>
                      <div className="text-2xl font-bold text-purple-300">${totals.totalCredit.toLocaleString()}</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-md border border-white/20">
                      <div className="text-sm font-medium text-slate-300">Total Turn-In</div>
                      <div className="text-2xl font-bold text-orange-300">${totals.totalTurnIn.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-slate-300">
                    Showing totals for {filteredReports.length} report(s)
                    {locationFilter && ` • Location: ${LOCATIONS.find(l => l.id.toString() === locationFilter)?.name}`}
                    {dateFilter && ` • Date: ${formatDateInCentral(parseDateInCentral(dateFilter), 'M/d/yyyy')}`}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        // No reports state
        <div className="relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl">
          {/* Enhanced Glass morphism overlay */}
          <div className="absolute inset-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
          
          <div className="relative z-10 text-center py-8 px-6">
            <p className="text-slate-300 mb-4">
              {locationFilter || dateFilter
                ? "No reports match your filter criteria"
                : "No reports found"}
            </p>
            <Button 
              onClick={handleNewReport} 
              className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Create a New Report
            </Button>
          </div>
        </div>
      )}
      
      <LocationSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      </div>
    </div>
  );
}
