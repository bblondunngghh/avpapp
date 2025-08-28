import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { LOCATIONS } from "@/lib/constants";
import { matchEmployee, extractMonth, parseEmployeesData } from "@/lib/employee-utils";
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
import accountingBillStackIcon from "@assets/Accounting-Bill-Stack-Dollar--Streamline-Ultimate.png";
import cashUserIcon from "@assets/Cash-User--Streamline-Ultimate.png";
import taskListCashIcon from "@assets/Task-List-Cash--Streamline-Ultimate.png";
import newspaperIcon from "@assets/Newspaper--Streamline-Ultimate.png";
import logoutIcon from "@assets/Logout-2--Streamline-Ultimate.png";
import alertTriangleIcon from "@assets/Alert-Triangle--Streamline-Ultimate.png";
import serverSettingsIcon from "@assets/Server-Settings--Streamline-Ultimate.png";

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

  // Time off request state
  const [timeOffDate, setTimeOffDate] = useState("");
  const [timeOffReason, setTimeOffReason] = useState("");
  const [isSubmittingTimeOff, setIsSubmittingTimeOff] = useState(false);

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

  // Check if current employee has completed training using employeeKey
  const hasCompletedTraining = trainingAcknowledgments.some((ack: any) => {
    if (!employeeKey) return false;
    
    // Check if training acknowledgment has employeeKey field (new format)
    if (ack.employeeKey) {
      return ack.employeeKey === employeeKey;
    }
    
    // Fallback to name matching for old records
    if (!employeeName) return false;
    const empName = employeeName.toLowerCase().trim();
    const ackName = ack.employeeName.toLowerCase().trim();
    
    // Exact match
    if (empName === ackName) return true;
    
    // Check if acknowledgment name is contained in employee name or vice versa
    if (empName.includes(ackName) || ackName.includes(empName)) return true;
    
    // Check first and last name separately
    const empParts = empName.split(' ');
    const ackParts = ackName.split(' ');
    
    // If both have at least first and last name, compare them
    if (empParts.length >= 2 && ackParts.length >= 2) {
      const empFirst = empParts[0];
      const empLast = empParts[empParts.length - 1];
      const ackFirst = ackParts[0];
      const ackLast = ackParts[ackParts.length - 1];
      
      // Match if first and last names match
      if (empFirst === ackFirst && empLast === ackLast) return true;
    }
    
    // Check if any part of the acknowledgment name matches first or last name of employee
    if (ackParts.some(part => empParts.includes(part) && part.length > 2)) return true;
    
    return false;
  });

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

  // Fetch scheduled shifts for this employee
  const { data: scheduledShifts = [], isLoading: isLoadingSchedule } = useQuery({
    queryKey: ["/api/shifts", employeeId],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!employeeId,
  });

  // Fetch locations for schedule display
  const { data: locations = [] } = useQuery({
    queryKey: ["/api/locations"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Fetch time off requests for this employee
  const { data: timeOffRequests = [], refetch: refetchTimeOffRequests } = useQuery({
    queryKey: ["/api/time-off-requests", employeeId],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!employeeId,
  });

  // Filter time off requests for this employee
  const myTimeOffRequests = timeOffRequests.filter((request: any) => 
    request.employeeId === parseInt(employeeId || '0')
  );



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

  // Mutation to create time off request
  const timeOffRequestMutation = useMutation({
    mutationFn: async ({ requestDate, reason }: { requestDate: string; reason: string }) => {
      const response = await apiRequest("POST", "/api/time-off-requests", {
        employeeId: parseInt(employeeId || '0'),
        requestDate,
        reason: reason.trim() || null,
        status: 'pending'
      });
      return response.json();
    },
    onSuccess: () => {
      setIsSubmittingTimeOff(false);
      setTimeOffDate("");
      setTimeOffReason("");
      toast({
        title: "Time off request submitted",
        description: "Your request has been submitted for manager approval",
      });
      refetchTimeOffRequests();
    },
    onError: (error: Error) => {
      setIsSubmittingTimeOff(false);
      toast({
        title: "Failed to submit request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTimeOffSubmit = () => {
    if (!timeOffDate) {
      toast({
        title: "Date required",
        description: "Please select a date for your time off request",
        variant: "destructive",
      });
      return;
    }

    // Check if the date is in the past
    const selectedDate = new Date(timeOffDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      toast({
        title: "Invalid date",
        description: "Cannot request time off for past dates",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingTimeOff(true);
    timeOffRequestMutation.mutate({
      requestDate: timeOffDate,
      reason: timeOffReason
    });
  };

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
    // CRITICAL: Use safe date parsing to prevent timezone issues
    const reportMonth = extractMonth(report.date);
    
    // Apply month filter if set
    if (selectedMonth && reportMonth !== selectedMonth) {
      return false;
    }
    
    // CRITICAL: Use safe employee data parsing to prevent JSON corruption
    const employees = parseEmployeesData(report.employees);
    
    // Check if employee worked on this shift using robust matching
    const employeeRecord = { key: employeeKey || '', fullName: employeeName || '' };
    return employees.some((emp: any) => {
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
    
    // CRITICAL: Use safe employee data parsing for payroll calculations
    const employeesList = parseEmployeesData(report.employees);
    
    // Find employee data using the same robust matching logic as filtering
    const employeeRecord = { key: employeeKey || '', fullName: employeeName || '' };
    const employeeData = employeesList.find((emp: any) => {
      return matchEmployee(emp, employeeRecord);
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

  // Filter scheduled shifts for this employee
  const myScheduledShifts = scheduledShifts.filter((shift: any) => 
    shift.employeeId === parseInt(employeeId || '0')
  );

  // Get upcoming shifts (today and future)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingShifts = myScheduledShifts.filter((shift: any) => {
    const shiftDate = new Date(shift.shiftDate);
    return shiftDate >= today;
  }).sort((a: any, b: any) => new Date(a.shiftDate).getTime() - new Date(b.shiftDate).getTime());

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
    <div className="min-h-screen relative">
      <div className="container mx-auto py-6 px-4 max-w-5xl relative">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-white/20 bg-white/10 backdrop-blur-sm">
              <AvatarFallback className="bg-white/10 text-white text-xl">
                {getInitials(employeeName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl text-white">{formatName(employeeName)}</h1>
              <p className="text-gray-300">Employee Dashboard</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
          >
            <img src={logoutIcon} alt="Logout" className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

      {/* Training Completion Gate - Full Overlay */}
        {!hasCompletedTraining && (
          <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm z-50 flex items-center justify-center">
            <Card className="max-w-md mx-4 bg-red-900/30 border border-red-800/50 shadow-lg backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="mx-auto mb-4 w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                    <XCircle className="h-8 w-8 text-red-400" />
                  </div>
                  <h3 className="text-xl font-bold text-red-200 mb-3">Training Required</h3>
                  <p className="text-red-300 mb-6 leading-relaxed">
                    You must complete the mandatory safety training acknowledgment before accessing your employee dashboard and viewing any information.
                  </p>
                  <div className="space-y-3">
                    <Button 
                      onClick={() => navigate("/regulations")}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-3"
                      size="lg"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Complete Safety Training Now
                    </Button>
                    <Button 
                      onClick={handleLogout}
                      variant="outline"
                      className="w-full bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      {/* Content that gets blurred when training not completed */}
      <div className={!hasCompletedTraining ? "blur-sm pointer-events-none select-none" : ""}>
        {/* Training Completion Status */}
        {hasCompletedTraining && (
          <Card className="mb-6 bg-green-900/30 border border-green-800/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-400" />
                <div>
                  <h3 className="text-lg font-semibold text-green-200">Safety Training Complete</h3>
                  <p className="text-green-300">
                    You have successfully completed the mandatory safety training.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/20 p-3 rounded-full">
                <img src={watchTimeIcon} alt="Watch Time" className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-300">Total Hours</p>
                <h3 className="text-2xl font-bold text-white">{paySummary.totalHours.toFixed(1)}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-500/20 p-3 rounded-full">
                <img src={accountingBillStackIcon} alt="Accounting Bill Stack" className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-300">Total Earnings</p>
                <h3 className="text-2xl font-bold text-white">${paySummary.totalEarnings.toFixed(2)}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className={`p-3 rounded-full ${paySummary.totalMoneyOwed > 0 ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                <img src={cashUserIcon} alt="Cash User" className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-300">Money Owed to You</p>
                <h3 className={`text-2xl font-bold ${paySummary.totalMoneyOwed > 0 ? 'text-green-300' : 'text-gray-400'}`}>
                  ${paySummary.totalMoneyOwed.toFixed(2)}
                </h3>
                {paySummary.totalMoneyOwed > 0 ? (
                  <p className="text-xs text-green-400 mt-1">Company owes you this amount</p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">No money owed to you</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={`bg-white/10 backdrop-blur-sm border ${paySummary.totalAdditionalTaxPayments > 0 ? 'border-blue-400/50' : 'border-white/20'}`}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="bg-blue-500/20 p-3 rounded-full">
                <img src={taskListCashIcon} alt="Task List Cash" className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-300">Additional Tax Payments</p>
                <h3 className="text-2xl font-bold text-blue-300">${paySummary.totalAdditionalTaxPayments.toFixed(2)}</h3>
                {paySummary.totalAdditionalTaxPayments > 0 && (
                  <p className="text-xs text-blue-400 mt-1">Credit for tax obligations</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-end gap-4 border border-white/20 p-4 rounded-md bg-white/10 backdrop-blur-sm mb-6">
        <div className="space-y-2">
          <label htmlFor="month-select" className="text-sm font-medium text-white">Filter by Month</label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48 bg-white/10 backdrop-blur-sm border-white/20 text-white">
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
          size="sm"
          className="bg-blue-600/80 hover:bg-blue-700/90 text-white backdrop-blur-sm"
          onClick={() => {
            const now = new Date();
            setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
          }}
        >
          Current Month
        </Button>
      </div>

      <Tabs defaultValue="schedule">
        <TabsList className="mb-6 bg-white/10 backdrop-blur-sm border-white/20">
          <TabsTrigger value="schedule" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-white/20">
            <Calendar className="h-4 w-4 mr-2" />
            My Schedule
          </TabsTrigger>
          <TabsTrigger value="earnings" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-white/20">
            <img src={accountingBillStackIcon} alt="Earnings" className="h-4 w-4 mr-2" />
            Earnings Summary
          </TabsTrigger>
          <TabsTrigger value="details" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-white/20">
            <img src={taskListCashIcon} alt="Shift Details" className="h-4 w-4 mr-2" />
            Shift Details
          </TabsTrigger>
          <TabsTrigger value="timeoff" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-white/20">
            <Calendar className="h-4 w-4 mr-2" />
            Request Time Off
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-white/20">
            <img src={serverSettingsIcon} alt="Settings" className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="schedule">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">My Upcoming Schedule</CardTitle>
              <CardDescription className="text-gray-300">
                View your upcoming scheduled shifts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSchedule ? (
                <div className="text-center py-8 text-gray-300">Loading your schedule...</div>
              ) : upcomingShifts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Calendar className="h-10 w-10 text-gray-400 mb-2" />
                  <h3 className="text-lg font-medium text-white">No upcoming shifts</h3>
                  <p className="text-gray-300 max-w-md">
                    You don't have any scheduled shifts at the moment. Check back later or contact your manager if you have questions.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingShifts.map((shift: any) => {
                    const location = locations.find((loc: any) => loc.id === shift.locationId);
                    const shiftDate = new Date(shift.shiftDate);
                    const isToday = shiftDate.toDateString() === new Date().toDateString();
                    
                    // Color coding based on location (same as admin/public schedule)
                    const getLocationColors = (locationId: number, isShiftLeader: boolean) => {
                      const baseColors = {
                        1: { // The Capital Grille - Blue theme
                          bg: isShiftLeader ? 'bg-blue-600/20 border-blue-500/40' : 'bg-blue-600/10 border-blue-500/30',
                          text: isShiftLeader ? 'text-blue-200' : 'text-blue-300',
                          accent: 'text-blue-400'
                        },
                        2: { // Bob's Steak & Chop House - Green theme
                          bg: isShiftLeader ? 'bg-green-600/20 border-green-500/40' : 'bg-green-600/10 border-green-500/30',
                          text: isShiftLeader ? 'text-green-200' : 'text-green-300',
                          accent: 'text-green-400'
                        },
                        3: { // Truluck's - Purple theme
                          bg: isShiftLeader ? 'bg-purple-600/20 border-purple-500/40' : 'bg-purple-600/10 border-purple-500/30',
                          text: isShiftLeader ? 'text-purple-200' : 'text-purple-300',
                          accent: 'text-purple-400'
                        },
                        4: { // BOA Steakhouse - Orange theme
                          bg: isShiftLeader ? 'bg-orange-600/20 border-orange-500/40' : 'bg-orange-600/10 border-orange-500/30',
                          text: isShiftLeader ? 'text-orange-200' : 'text-orange-300',
                          accent: 'text-orange-400'
                        }
                      };
                      return baseColors[locationId] || baseColors[1]; // Default to Capital Grille colors
                    };

                    const colors = getLocationColors(shift.locationId, shift.position === 'shift-leader');
                    
                    return (
                      <div
                        key={shift.id}
                        className={`${colors.bg} border rounded-lg p-4 ${isToday ? 'ring-2 ring-yellow-400/50' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className={`font-semibold ${colors.text}`}>
                              {shiftDate.toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                              {isToday && (
                                <span className="ml-2 px-2 py-1 text-xs bg-yellow-400/20 text-yellow-300 rounded-full">
                                  Today
                                </span>
                              )}
                            </h4>
                            <p className={`text-sm ${colors.accent}`}>
                              {location?.name || 'Location TBD'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-medium ${colors.text}`}>
                              {new Date(`2000-01-01T${shift.startTime}`).toLocaleTimeString([], {
                                hour: 'numeric',
                                minute: '2-digit'
                              })} - {new Date(`2000-01-01T${shift.endTime}`).toLocaleTimeString([], {
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </p>
                            <p className={`text-xs ${colors.accent}`}>
                              {shift.position === 'shift-leader' ? 'Shift Leader' : 'Valet Attendant'}
                            </p>
                          </div>
                        </div>
                        {shift.notes && (
                          <div className={`text-sm ${colors.accent} mt-2 p-2 bg-black/20 rounded`}>
                            <strong>Notes:</strong> {shift.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="earnings">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Earnings Summary</CardTitle>
              <CardDescription className="text-gray-300">
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
                  <div className="bg-blue-900/20 p-4 rounded-md border border-blue-800/30">
                    <div className="text-sm font-medium mb-2 text-blue-200">Commission Breakdown</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-blue-200">
                        <span>Total Commission:</span>
                        <span>${paySummary.totalCommission.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-blue-200">
                        <span>Total Tips:</span>
                        <span>${paySummary.totalTips.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold pt-1 border-t border-blue-700/50 text-blue-100">
                        <span>Total Earnings:</span>
                        <span>${paySummary.totalEarnings.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3 text-white">Work Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-gray-300">
                        <span>Total Hours Worked:</span>
                        <span className="font-medium text-white">{paySummary.totalHours.toFixed(1)} hours</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Number of Shifts:</span>
                        <span className="font-medium text-white">{paySummary.shifts.length} shifts</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Average Per Shift:</span>
                        <span className="font-medium text-white">${(paySummary.totalEarnings / paySummary.shifts.length).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Average Hourly Rate:</span>
                        <span className="font-medium text-white">${(paySummary.totalEarnings / paySummary.totalHours).toFixed(2)}/hr</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="timeoff">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Request Time Off Card */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Request Time Off</CardTitle>
                <CardDescription className="text-gray-300">
                  Submit a request for time off that requires manager approval
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="timeoff-date" className="text-sm font-medium text-gray-300">
                    Date Requested Off
                  </Label>
                  <Input
                    id="timeoff-date"
                    type="date"
                    value={timeOffDate}
                    onChange={(e) => setTimeOffDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]} // Prevent past dates
                    className="bg-white/10 backdrop-blur-sm border-white/20 text-white"
                    disabled={isSubmittingTimeOff}
                  />
                </div>
                
                <div>
                  <Label htmlFor="timeoff-reason" className="text-sm font-medium text-gray-300">
                    Reason (Optional)
                  </Label>
                  <Input
                    id="timeoff-reason"
                    type="text"
                    placeholder="e.g., Personal appointment, vacation, etc."
                    value={timeOffReason}
                    onChange={(e) => setTimeOffReason(e.target.value)}
                    className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-gray-400"
                    disabled={isSubmittingTimeOff}
                  />
                </div>
                
                <Button
                  onClick={handleTimeOffSubmit}
                  disabled={isSubmittingTimeOff || !timeOffDate}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmittingTimeOff ? "Submitting..." : "Submit Request"}
                </Button>
              </CardContent>
            </Card>

            {/* My Time Off Requests Card */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">My Time Off Requests</CardTitle>
                <CardDescription className="text-gray-300">
                  View your submitted requests and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {myTimeOffRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No time off requests yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myTimeOffRequests
                      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((request: any) => {
                        const requestDate = new Date(request.requestDate);
                        const isPast = requestDate < new Date();
                        
                        return (
                          <div
                            key={request.id}
                            className="p-3 bg-black/20 rounded-lg border border-white/10"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="text-white font-medium">
                                  {requestDate.toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                  {isPast && (
                                    <span className="ml-2 text-xs text-gray-400">(Past)</span>
                                  )}
                                </p>
                                {request.reason && (
                                  <p className="text-gray-400 text-sm">{request.reason}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    request.status === 'approved'
                                      ? 'bg-green-900/30 text-green-300 border-green-500/50'
                                      : request.status === 'denied'
                                      ? 'bg-red-900/30 text-red-300 border-red-500/50'
                                      : 'bg-yellow-900/30 text-yellow-300 border-yellow-500/50'
                                  }`}
                                >
                                  {request.status === 'pending' ? 'Pending' : 
                                   request.status === 'approved' ? 'Approved' : 'Denied'}
                                </Badge>
                              </div>
                            </div>
                            
                            {request.adminNotes && (
                              <div className="mt-2 p-2 bg-black/30 rounded text-sm">
                                <p className="text-gray-300">
                                  <strong className="text-white">Admin notes:</strong> {request.adminNotes}
                                </p>
                              </div>
                            )}
                            
                            <p className="text-xs text-gray-500 mt-2">
                              Requested on {new Date(request.createdAt).toLocaleDateString()}
                              {request.reviewedAt && (
                                <span className="ml-2">
                                  • Reviewed on {new Date(request.reviewedAt).toLocaleDateString()}
                                </span>
                              )}
                            </p>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="details">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Shift Details</CardTitle>
              <CardDescription className="text-gray-300">
                View your individual shift details and earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-gray-300">Loading your data...</div>
              ) : paySummary.shifts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="h-10 w-10 text-amber-400 mb-2" />
                  <h3 className="text-lg font-medium text-white">No shifts found</h3>
                  <p className="text-gray-300 max-w-md">
                    No shift data was found for the selected date range. Try adjusting your filter or contact your manager if you believe this is an error.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/20">
                        <TableHead className="text-gray-300">Date</TableHead>
                        <TableHead className="text-gray-300">Location</TableHead>
                        <TableHead className="text-gray-300">Shift</TableHead>
                        <TableHead className="text-gray-300">Hours</TableHead>
                        <TableHead className="text-right text-gray-300">Commission</TableHead>
                        <TableHead className="text-right text-gray-300">Tips</TableHead>
                        <TableHead className="text-right text-gray-300">Money Owed</TableHead>
                        <TableHead className="text-right text-gray-300">Earnings</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paySummary.shifts.sort((a: any, b: any) => 
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                      ).map((shift: any) => (
                        <TableRow key={`${shift.id}-${shift.date}-${shift.shift}`} className="border-white/20 hover:bg-white/5">
                          <TableCell className="text-gray-300">
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
                                    ? "border-blue-400/50 bg-blue-900/30 text-blue-300"
                                    : shift.locationId === 2
                                    ? "border-purple-400/50 bg-purple-900/30 text-purple-300"
                                    : shift.locationId === 3
                                    ? "border-emerald-400/50 bg-emerald-900/30 text-emerald-300"
                                    : "border-amber-400/50 bg-amber-900/30 text-amber-300"
                                }`}
                              >
                                {shift.locationName}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-300">{shift.shift}</TableCell>
                          <TableCell className="text-gray-300">{shift.hours.toFixed(1)}</TableCell>
                          <TableCell className="text-right text-gray-300">${shift.commission.toFixed(2)}</TableCell>
                          <TableCell className="text-right text-gray-300">${shift.tips.toFixed(2)}</TableCell>
                          <TableCell className="text-right text-green-400 font-medium">${shift.moneyOwed.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium text-white">${shift.earnings.toFixed(2)}</TableCell>
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
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Settings className="h-5 w-5 text-gray-300" />
                Account Settings
              </CardTitle>
              <CardDescription className="text-gray-300">
                Manage your account preferences and login credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Training Status Section */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-4 text-white">Safety Training Status</h3>
                  <div className="bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/10">
                    <div className="flex items-center gap-3">
                      {hasCompletedTraining ? (
                        <>
                          <CheckCircle className="h-6 w-6 text-green-600" />
                          <div>
                            <p className="font-medium text-green-300">Training Completed</p>
                            <p className="text-sm text-green-400">
                              You have successfully completed the safety training acknowledgment.
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-6 w-6 text-red-600" />
                          <div>
                            <p className="font-medium text-red-300">Training Required</p>
                            <p className="text-sm text-red-400 mb-2">
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
                  <h3 className="text-lg font-medium mb-4 text-white">Account Information</h3>
                  <div className="bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/10 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="current-name" className="text-sm font-medium text-gray-300">
                          Full Name
                        </Label>
                        <Input
                          id="current-name"
                          value={employeeName || ""}
                          disabled
                          className="bg-white/10 backdrop-blur-sm border-white/20 text-white"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Contact your manager to change your name
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-300">
                          Authentication
                        </Label>
                        <div className="bg-white/10 backdrop-blur-sm p-3 rounded border border-white/20 text-sm text-gray-300">
                          Login uses SSN verification for security
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
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
                  <h3 className="text-lg font-medium mb-4 text-white">Contact Information</h3>
                  <div className="bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/10 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone-number" className="text-sm font-medium text-gray-300">
                          Phone Number
                        </Label>
                        <Input
                          id="phone-number"
                          type="tel"
                          placeholder="Enter your phone number"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-gray-400"
                          disabled={updateContactMutation.isPending}
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Used for emergency contact and work-related communications
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="email-address" className="text-sm font-medium text-gray-300">
                          Email Address
                        </Label>
                        <Input
                          id="email-address"
                          type="email"
                          placeholder="Enter your email address"
                          value={emailAddress}
                          onChange={(e) => setEmailAddress(e.target.value)}
                          className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-gray-400"
                          disabled={updateContactMutation.isPending}
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Used for important notifications and updates
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        onClick={handleContactUpdate}
                        disabled={updateContactMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 backdrop-blur-sm"
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
                        className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-800/30">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-200">
                      <p className="font-medium mb-1 text-blue-100">Important Security Information</p>
                      <ul className="space-y-1 text-blue-300">
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
      </div>
    </div>
  );
}