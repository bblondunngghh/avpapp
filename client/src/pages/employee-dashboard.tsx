import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { LOCATIONS } from "@/lib/constants";
import { matchEmployee } from "@/lib/employee-utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { AlertCircle, Calendar, DollarSign, FileText, LogOut, UserCircle, Info, Settings, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import watchTimeIcon from "@assets/Watch-Time-1--Streamline-Ultimate.png";

export default function EmployeeDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [phoneNumber, setPhoneNumber] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [isUpdatingContact, setIsUpdatingContact] = useState(false);

  const employeeId = localStorage.getItem("employee_id");
  const employeeName = localStorage.getItem("employee_name");
  const employeeKey = localStorage.getItem("employee_key");

  // Check for training acknowledgments
  const { data: trainingAcknowledgments = [] } = useQuery({
    queryKey: ["/api/training-acknowledgments"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Fetch current employee data
  const { data: currentEmployee } = useQuery({
    queryKey: ["/api/employees", employeeId],
    queryFn: async () => {
      const response = await fetch(`/api/employees/${employeeId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!employeeId,
  });

  // Set initial contact info when employee data loads
  useEffect(() => {
    if (currentEmployee) {
      setPhoneNumber(currentEmployee.phone || "");
      setEmailAddress(currentEmployee.email || "");
    }
  }, [currentEmployee]);

  // Check if current employee has completed training
  const hasCompletedTraining = trainingAcknowledgments.some(
    (ack: any) => ack.employeeName.toLowerCase() === employeeName?.toLowerCase()
  );

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



  // Mutation to update contact information
  const updateContactMutation = useMutation({
    mutationFn: async ({ phone, email }: { phone: string; email: string }) => {
      const response = await apiRequest("PATCH", `/api/employees/${employeeId}`, {
        phone: phone.trim() || null,
        email: email.trim() || null
      });
      return response.json();
    },
    onSuccess: () => {
      setIsUpdatingContact(false);
      toast({
        title: "Contact information updated",
        description: "Your phone number and email have been successfully updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update contact info",
        description: error.message,
        variant: "destructive",
      });
    },
  });



  const handleContactUpdate = () => {
    // Basic email validation
    if (emailAddress && !/\S+@\S+\.\S+/.test(emailAddress)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    // Basic phone validation
    if (phoneNumber && !/^[\+]?[1-9][\d]{0,15}$/.test(phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    updateContactMutation.mutate({
      phone: phoneNumber,
      email: emailAddress
    });
  };

  // Filter reports by selected month and employee
  const filteredReports = allReports.filter((report: any) => {
    const reportDate = new Date(report.date);
    const reportMonth = `${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Apply month filter if set
    if (selectedMonth && reportMonth !== selectedMonth) {
      return false;
    }
    
    // Filter reports where this employee worked
    let employees = [];
    try {
      if (typeof report.employees === 'string') {
        employees = JSON.parse(report.employees);
      } else if (Array.isArray(report.employees)) {
        employees = report.employees;
      }
    } catch (err) {
      console.error("Failed to parse employee data:", err);
    }
    
    // Safety check to ensure employees is an array before using .some()
    if (!Array.isArray(employees)) {
      console.warn("employees is not an array, converting to empty array:", employees);
      employees = [];
      return false; // No match if not an array
    }
    
    // Check if employee worked on this shift using robust matching
    return employees.some((emp: any) => {
      // Use robust employee matching that handles key changes
      const employeeRecord = { key: employeeKey, fullName: employeeName };
      return matchEmployee(emp, employeeRecord);
    });
  });

  // Calculate employee payroll summary
  const paySummary = filteredReports.reduce((summary: any, report: any) => {
    const locationId = report.locationId;
    const locationName = LOCATIONS.find(loc => loc.id === locationId)?.name || 'Unknown';
    // Commission rates by location
    let commissionRate = 4; // Default
    if (locationId === 1) { // Capital Grille
      commissionRate = 4;
    } else if (locationId === 2) { // Bob's
      commissionRate = 9;
    } else if (locationId === 3) { // Truluck's
      commissionRate = 7;
    } else if (locationId === 4) { // BOA
      commissionRate = 6;
    } else if (locationId === 7) { // PPS
      commissionRate = 2;
    }
    const cashCars = report.totalCars - report.creditTransactions - report.totalReceipts;
    
    // Commission calculations
    const totalCommission = (report.creditTransactions * commissionRate) + 
                           (cashCars * commissionRate) + 
                           (report.totalReceipts * commissionRate);
    
    // Tips calculations - use correct tip rates per location
    let tipRate = 15; // Default for original locations
    if (locationId === 7) tipRate = 6; // PPS = $6
    
    const creditCardTips = Math.abs(report.creditTransactions * tipRate - report.totalCreditSales);
    const cashTips = Math.abs(cashCars * tipRate - (report.totalCashCollected - report.companyCashTurnIn));
    const receiptTips = report.totalReceipts * 3; // $3 tip per receipt
    const totalTips = creditCardTips + cashTips + receiptTips;
    
    // Get employee data from report
    // Parse employee data safely
    let employeesList = [];
    try {
      if (typeof report.employees === 'string') {
        employeesList = JSON.parse(report.employees);
      } else if (Array.isArray(report.employees)) {
        employeesList = report.employees;
      }
    } catch (err) {
      console.error("Failed to parse employee data:", err);
    }
    
    // Make sure employees is an array before searching
    if (!Array.isArray(employeesList)) {
      console.warn("employees is not an array for finding employee data, converting to empty array:", employeesList);
      employeesList = [];
    }
    
    // Find employee data using the same matching logic as above
    const employeeData = employeesList.find((emp: any) => {
      if (!emp) return false;
      
      if (emp.name === employeeKey) return true;
      
      if (employeeName && emp.name && typeof emp.name === 'string') {
        const empNameLower = emp.name.toLowerCase();
        const employeeNameLower = employeeName.toLowerCase();
        const employeeNameParts = employeeNameLower.split(' ');
        if (employeeNameParts.some(part => empNameLower.includes(part))) return true;
      }
      
      return false;
    });
    
    if (employeeData) {
      const totalJobHours = employeesList.reduce((sum: number, emp: any) => sum + Number(emp.hours || 0), 0);
      const hoursPercent = totalJobHours > 0 ? employeeData.hours / totalJobHours : 0;
      
      // Calculate employee's share
      const empCommission = totalCommission * hoursPercent;
      const empTips = totalTips * hoursPercent;
      const empEarnings = empCommission + empTips;
      
      // Calculate money owed: when credit card sales + receipt sales exceed total turn in
      // Receipt sales = total receipts × $18 per receipt
      // For your example: 296 (credit) + 162 (9 receipts × $18) = 458 - 418 (turn in) = 40 total money owed
      const receiptSales = report.totalReceipts * 18;
      const totalCollections = report.totalCreditSales + receiptSales;
      const totalMoneyOwedOnShift = Math.max(0, totalCollections - report.totalTurnIn);
      const moneyOwed = totalMoneyOwedOnShift * hoursPercent;
      
      // Calculate tax obligation
      const tax = empEarnings * 0.22;
      
      // Additional tax payments = actual cash paid when there's a tax shortfall
      const taxNotCoveredByMoneyOwed = Math.max(0, tax - moneyOwed);
      const employeeCashPaid = Number(employeeData.cashPaid || 0);
      const additionalTaxPayments = taxNotCoveredByMoneyOwed > 0 ? employeeCashPaid : 0;
      
      // Update summary
      summary.totalHours += employeeData.hours;
      summary.totalCommission += empCommission;
      summary.totalTips += empTips;
      summary.totalEarnings += empEarnings;
      summary.totalMoneyOwed += moneyOwed;
      summary.totalAdditionalTaxPayments += additionalTaxPayments;
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
        additionalTaxPayments,
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
    totalAdditionalTaxPayments: 0,
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
            <h1 className="text-2xl text-indigo-800">{formatName(employeeName)}</h1>
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

      {/* Training Requirement Warning */}
      {!hasCompletedTraining && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-orange-600" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-orange-800 mb-2">Safety Training Required</h3>
                <p className="text-orange-700 mb-3">
                  You must complete the safety training acknowledgment before accessing all employee features.
                </p>
                <Button 
                  onClick={() => navigate("/regulations")}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Complete Safety Training
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-full">
                <img src={watchTimeIcon} alt="Watch Time" className="h-6 w-6" />
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
        
        <Card className={paySummary.totalMoneyOwed > 0 ? "border-2 border-green-300 shadow-md" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${paySummary.totalMoneyOwed > 0 ? 'bg-green-100' : 'bg-gray-100'}`}>
                <DollarSign className={`h-6 w-6 ${paySummary.totalMoneyOwed > 0 ? 'text-green-700' : 'text-gray-500'}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Money Owed to You</p>
                <h3 className={`text-2xl font-bold ${paySummary.totalMoneyOwed > 0 ? 'text-green-700' : 'text-gray-500'}`}>
                  ${paySummary.totalMoneyOwed.toFixed(2)}
                </h3>
                {paySummary.totalMoneyOwed > 0 ? (
                  <p className="text-xs text-green-600 mt-1">Company owes you this amount</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">No money owed to you</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={paySummary.totalAdditionalTaxPayments > 0 ? "border-2 border-blue-300 shadow-md" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-full">
                <FileText className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Additional Tax Payments</p>
                <h3 className="text-2xl font-bold text-blue-700">${paySummary.totalAdditionalTaxPayments.toFixed(2)}</h3>
                {paySummary.totalAdditionalTaxPayments > 0 && (
                  <p className="text-xs text-blue-500 mt-1">Credit for tax obligations</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-full">
                <AlertCircle className="h-6 w-6 text-purple-700" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Money Owed After Tax Coverage</p>
                <h3 className="text-2xl font-bold text-purple-700">
                  ${Math.max(0, paySummary.totalTax - paySummary.totalAdditionalTaxPayments).toFixed(2)}
                </h3>
                <p className="text-xs text-purple-500 mt-1">Amount owed after covering tax obligations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-end gap-4 border p-4 rounded-md bg-gray-50 mb-6">
        <div className="space-y-2">
          <label htmlFor="month-select" className="text-sm font-medium">Filter by Month</label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select a month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025-01">January 2025</SelectItem>
              <SelectItem value="2025-02">February 2025</SelectItem>
              <SelectItem value="2025-03">March 2025</SelectItem>
              <SelectItem value="2025-04">April 2025</SelectItem>
              <SelectItem value="2025-05">May 2025</SelectItem>
              <SelectItem value="2025-06">June 2025</SelectItem>
              <SelectItem value="2025-07">July 2025</SelectItem>
              <SelectItem value="2025-08">August 2025</SelectItem>
              <SelectItem value="2025-09">September 2025</SelectItem>
              <SelectItem value="2025-10">October 2025</SelectItem>
              <SelectItem value="2025-11">November 2025</SelectItem>
              <SelectItem value="2025-12">December 2025</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          variant="secondary" 
          size="sm"
          onClick={() => {
            const now = new Date();
            setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
          }}
        >
          Current Month
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
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
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
                          <div className="flex items-center gap-1">
                            <span>Estimated Taxes (22%):</span>
                          </div>
                          <span>${paySummary.totalTax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <div>
                            <span>Additional Tax Payments:</span>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Credit applied toward tax obligations from negative cash turn-in
                            </p>
                          </div>
                          <span>${paySummary.totalMoneyOwed.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold pt-1 border-t border-blue-200">
                          <div>
                            <span>Net Tax Obligation:</span>
                            <p className="text-xs text-gray-500 mt-0.5 font-normal">
                              Final tax amount after subtracting money owed to you
                            </p>
                          </div>
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
                            {(() => {
                              // Parse date safely without timezone conversion
                              const [year, month, day] = shift.date.split('-');
                              const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                              return date.toLocaleDateString();
                            })()}
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
                          <TableCell className="text-right text-green-700 font-medium">${shift.moneyOwed.toFixed(2)}</TableCell>
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

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Manage your account preferences and login credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Training Status Section */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-4">Safety Training Status</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      {hasCompletedTraining ? (
                        <>
                          <CheckCircle className="h-6 w-6 text-green-600" />
                          <div>
                            <p className="font-medium text-green-800">Training Completed</p>
                            <p className="text-sm text-green-600">
                              You have successfully completed the safety training acknowledgment.
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-6 w-6 text-red-600" />
                          <div>
                            <p className="font-medium text-red-800">Training Required</p>
                            <p className="text-sm text-red-600 mb-2">
                              You must complete safety training to access all features.
                            </p>
                            <Button 
                              size="sm"
                              onClick={() => navigate("/regulations")}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Complete Training
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-4">Account Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="current-name" className="text-sm font-medium">
                          Full Name
                        </Label>
                        <Input
                          id="current-name"
                          value={employeeName || ""}
                          disabled
                          className="bg-white"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Contact your manager to change your name
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Authentication
                        </Label>
                        <div className="bg-white p-3 rounded border text-sm text-gray-600">
                          Login uses SSN verification for security
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Secure authentication with last 4 digits of SSN
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-4">Contact Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone-number" className="text-sm font-medium">
                          Phone Number
                        </Label>
                        <Input
                          id="phone-number"
                          type="tel"
                          placeholder="Enter your phone number"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="bg-white"
                          disabled={updateContactMutation.isPending}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Used for emergency contact and work-related communications
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="email-address" className="text-sm font-medium">
                          Email Address
                        </Label>
                        <Input
                          id="email-address"
                          type="email"
                          placeholder="Enter your email address"
                          value={emailAddress}
                          onChange={(e) => setEmailAddress(e.target.value)}
                          className="bg-white"
                          disabled={updateContactMutation.isPending}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Used for important notifications and updates
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        onClick={handleContactUpdate}
                        disabled={updateContactMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {updateContactMutation.isPending ? "Updating..." : "Update Contact Info"}
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (currentEmployee) {
                            setPhoneNumber(currentEmployee.phone || "");
                            setEmailAddress(currentEmployee.email || "");
                          }
                        }}
                        disabled={updateContactMutation.isPending}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Important Security Information</p>
                      <ul className="space-y-1 text-blue-700">
                        <li>• Your login key is case-insensitive and will be converted to lowercase</li>
                        <li>• Use a key that's easy for you to remember but hard for others to guess</li>
                        <li>• You'll need your new key to log in next time</li>
                        <li>• If you forget your key, contact your manager for assistance</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}