import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { LOCATIONS } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Calendar, DollarSign, FileText, LogOut, UserCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function EmployeeDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const employeeId = localStorage.getItem("employee_id");
  const employeeName = localStorage.getItem("employee_name");
  const employeeKey = localStorage.getItem("employee_key");

  // Check if employee is authenticated
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("employee_authenticated") === "true";
    const authTime = Number(localStorage.getItem("employee_auth_time") || "0");
    const currentTime = Date.now();
    const fourHoursInMs = 4 * 60 * 60 * 1000;
    
    // If not authenticated or session expired (4 hours), redirect to login
    if (!isAuthenticated || (currentTime - authTime > fourHoursInMs)) {
      localStorage.removeItem("employee_authenticated");
      localStorage.removeItem("employee_id");
      localStorage.removeItem("employee_name");
      localStorage.removeItem("employee_key");
      localStorage.removeItem("employee_auth_time");
      navigate("/employee-login");
    }
  }, [navigate]);

  // Fetch shift reports
  const { data: allReports = [], isLoading } = useQuery({
    queryKey: ["/api/shift-reports"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Filter reports by date range and employee
  const filteredReports = allReports.filter((report: any) => {
    const reportDate = new Date(report.date);
    
    // Apply start date filter if set
    if (startDate && reportDate < startDate) {
      return false;
    }
    
    // Apply end date filter if set
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (reportDate > endOfDay) {
        return false;
      }
    }
    
    // Filter reports where this employee worked
    const employees = typeof report.employees === 'string' 
      ? JSON.parse(report.employees) 
      : Array.isArray(report.employees) 
        ? report.employees 
        : [];
    
    // Check if employee worked on this shift
    return employees.some((emp: any) => emp.name === employeeKey);
  });

  // Calculate employee payroll summary
  const paySummary = filteredReports.reduce((summary: any, report: any) => {
    const locationId = report.locationId;
    const locationName = LOCATIONS.find(loc => loc.id === locationId)?.name || 'Unknown';
    const commissionRate = locationId === 2 ? 9 : 4; // Bob's = $9, others = $4
    const cashCars = report.totalCars - report.creditTransactions - report.totalReceipts;
    
    // Commission calculations
    const totalCommission = (report.creditTransactions * commissionRate) + 
                           (cashCars * commissionRate) + 
                           (report.totalReceipts * commissionRate);
    
    // Tips calculations
    const creditCardTips = Math.abs(report.creditTransactions * 15 - report.totalCreditSales);
    const cashTips = Math.abs(cashCars * 15 - (report.totalCashCollected - report.companyCashTurnIn));
    const receiptTips = report.totalReceipts * 3; // $3 tip per receipt
    const totalTips = creditCardTips + cashTips + receiptTips;
    
    // Get employee data from report
    const employees = typeof report.employees === 'string' 
      ? JSON.parse(report.employees) 
      : report.employees;
    
    const employeeData = employees.find((emp: any) => emp.name === employeeKey);
    
    if (employeeData) {
      const totalJobHours = employees.reduce((sum: number, emp: any) => sum + Number(emp.hours || 0), 0);
      const hoursPercent = totalJobHours > 0 ? employeeData.hours / totalJobHours : 0;
      
      // Calculate employee's share
      const empCommission = totalCommission * hoursPercent;
      const empTips = totalTips * hoursPercent;
      const empEarnings = empCommission + empTips;
      
      // Calculate money owed (if negative company cash turn-in)
      const expectedCompanyCashTurnIn = report.totalTurnIn - report.totalCreditSales - (report.totalReceiptSales || 0);
      const moneyOwed = expectedCompanyCashTurnIn < 0 ? Math.abs(expectedCompanyCashTurnIn) * hoursPercent : 0;
      
      // Calculate tax
      const tax = empEarnings * 0.22;
      
      // Update summary
      summary.totalHours += employeeData.hours;
      summary.totalCommission += empCommission;
      summary.totalTips += empTips;
      summary.totalEarnings += empEarnings;
      summary.totalMoneyOwed += moneyOwed;
      summary.totalTax += tax;
      summary.count += 1;
      
      // Add to shift details
      summary.shifts.push({
        id: report.id,
        date: report.date,
        locationName,
        locationId,
        shift: report.shift,
        hours: employeeData.hours,
        commission: empCommission,
        tips: empTips,
        earnings: empEarnings,
        moneyOwed,
        tax,
        cashPaid: employeeData.cashPaid || 0
      });
    }
    
    return summary;
  }, {
    totalHours: 0,
    totalCommission: 0,
    totalTips: 0,
    totalEarnings: 0,
    totalMoneyOwed: 0,
    totalTax: 0,
    count: 0,
    shifts: []
  });

  const handleLogout = () => {
    localStorage.removeItem("employee_authenticated");
    localStorage.removeItem("employee_id");
    localStorage.removeItem("employee_name");
    localStorage.removeItem("employee_key");
    localStorage.removeItem("employee_auth_time");
    navigate("/");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  const formatName = (name: string) => {
    return name.split(' ').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    ).join(' ');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (!employeeName) {
    navigate("/employee-login");
    return null;
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-indigo-200">
            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xl">
              {getInitials(employeeName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-indigo-800">{formatName(employeeName)}</h1>
            <p className="text-gray-500">Employee Dashboard</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="border-gray-200 text-gray-700"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Hours</p>
                <h3 className="text-2xl font-bold">{paySummary.totalHours.toFixed(1)}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Earnings</p>
                <h3 className="text-2xl font-bold">${paySummary.totalEarnings.toFixed(2)}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-3 rounded-full">
                <FileText className="h-6 w-6 text-amber-700" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Shifts</p>
                <h3 className="text-2xl font-bold">{paySummary.shifts.length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-end gap-4 border p-4 rounded-md bg-gray-50 mb-6">
        <div className="space-y-2">
          <label htmlFor="start-date" className="text-sm font-medium">Start Date</label>
          <div className="relative">
            <input
              id="start-date"
              type="date"
              className="px-3 py-2 rounded-md border border-input bg-background text-sm shadow-sm"
              value={startDate ? startDate.toISOString().substring(0, 10) : ""}
              onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : undefined)}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="end-date" className="text-sm font-medium">End Date</label>
          <div className="relative">
            <input
              id="end-date"
              type="date"
              className="px-3 py-2 rounded-md border border-input bg-background text-sm shadow-sm"
              value={endDate ? endDate.toISOString().substring(0, 10) : ""}
              onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : undefined)}
            />
          </div>
        </div>
        
        <Button 
          variant="secondary" 
          size="sm"
          onClick={() => {
            setStartDate(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1));
            setEndDate(new Date());
          }}
        >
          Reset Filter
        </Button>
      </div>

      <Tabs defaultValue="earnings">
        <TabsList className="mb-6">
          <TabsTrigger value="earnings">
            <DollarSign className="h-4 w-4 mr-2" />
            Earnings Summary
          </TabsTrigger>
          <TabsTrigger value="details">
            <FileText className="h-4 w-4 mr-2" />
            Shift Details
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="earnings">
          <Card>
            <CardHeader>
              <CardTitle>Earnings Summary</CardTitle>
              <CardDescription>
                Your earnings breakdown for the selected date range
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading your data...</div>
              ) : paySummary.shifts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="h-10 w-10 text-amber-500 mb-2" />
                  <h3 className="text-lg font-medium">No shifts found</h3>
                  <p className="text-gray-500 max-w-md">
                    No shift data was found for the selected date range. Try adjusting your filter or contact your manager if you believe this is an error.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-indigo-50 p-4 rounded-md border border-indigo-100">
                      <div className="text-sm font-medium mb-2">Commission Breakdown</div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Total Commission:</span>
                          <span>${paySummary.totalCommission.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total Tips:</span>
                          <span>${paySummary.totalTips.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold pt-1 border-t border-indigo-200">
                          <span>Total Earnings:</span>
                          <span>${paySummary.totalEarnings.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                      <div className="text-sm font-medium mb-2">Tax Obligations</div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Estimated Taxes (22%):</span>
                          <span>${paySummary.totalTax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Money Owed to You:</span>
                          <span>${paySummary.totalMoneyOwed.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold pt-1 border-t border-blue-200">
                          <span>Net Tax Obligation:</span>
                          <span>${Math.max(0, paySummary.totalTax - paySummary.totalMoneyOwed).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Work Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Hours Worked:</span>
                        <span className="font-medium">{paySummary.totalHours.toFixed(1)} hours</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Number of Shifts:</span>
                        <span className="font-medium">{paySummary.shifts.length} shifts</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average Per Shift:</span>
                        <span className="font-medium">${(paySummary.totalEarnings / paySummary.shifts.length).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average Hourly Rate:</span>
                        <span className="font-medium">${(paySummary.totalEarnings / paySummary.totalHours).toFixed(2)}/hr</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Shift Details</CardTitle>
              <CardDescription>
                View your individual shift details and earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading your data...</div>
              ) : paySummary.shifts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="h-10 w-10 text-amber-500 mb-2" />
                  <h3 className="text-lg font-medium">No shifts found</h3>
                  <p className="text-gray-500 max-w-md">
                    No shift data was found for the selected date range. Try adjusting your filter or contact your manager if you believe this is an error.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Shift</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead className="text-right">Commission</TableHead>
                        <TableHead className="text-right">Tips</TableHead>
                        <TableHead className="text-right">Money Owed</TableHead>
                        <TableHead className="text-right">Earnings</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paySummary.shifts.sort((a: any, b: any) => 
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                      ).map((shift: any) => (
                        <TableRow key={`${shift.id}-${shift.date}-${shift.shift}`}>
                          <TableCell>
                            {new Date(shift.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Badge
                                variant="outline"
                                className={`${
                                  shift.locationId === 1
                                    ? "border-blue-200 bg-blue-50 text-blue-700"
                                    : shift.locationId === 2
                                    ? "border-purple-200 bg-purple-50 text-purple-700"
                                    : shift.locationId === 3
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-amber-200 bg-amber-50 text-amber-700"
                                }`}
                              >
                                {shift.locationName}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>{shift.shift}</TableCell>
                          <TableCell>{shift.hours.toFixed(1)}</TableCell>
                          <TableCell className="text-right">${shift.commission.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${shift.tips.toFixed(2)}</TableCell>
                          <TableCell className="text-right text-blue-700">${shift.moneyOwed.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">${shift.earnings.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}