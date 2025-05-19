import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { LogOut, FileSpreadsheet, Users, Home, Download, FileDown } from "lucide-react";
import { LOCATIONS, EMPLOYEE_NAMES } from "@/lib/constants";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Define types for our data
interface Employee {
  name: string;
  hours: number;
}

interface ShiftReport {
  id: number;
  locationId: number;
  date: string;
  shift: string;
  shiftLeader: string;
  totalCars: number;
  totalCreditSales: number;
  totalCashCollected: number;
  companyCashTurnIn: number;
  totalTurnIn: number;
  creditTransactions: number;
  totalReceipts: number;
  totalReceiptSales: number;
  employees: Employee[];
  totalJobHours: number;
  createdAt: string;
}

export default function AdminPanel() {
  const [, navigate] = useLocation();
  const [employeeStats, setEmployeeStats] = useState<{
    name: string;
    totalHours: number;
    totalEarnings: number;
    totalCommission: number;
    totalTips: number;
    totalMoneyOwed: number;
    reports: number;
    locationId: number;
  }[]>([]);
  
  // Date filter state
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Check if admin is authenticated
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("admin_authenticated") === "true";
    const authTime = Number(localStorage.getItem("admin_auth_time") || "0");
    const currentTime = Date.now();
    const fourHoursInMs = 4 * 60 * 60 * 1000;
    
    // If not authenticated or session expired (4 hours), redirect to login
    if (!isAuthenticated || (currentTime - authTime > fourHoursInMs)) {
      localStorage.removeItem("admin_authenticated");
      localStorage.removeItem("admin_auth_time");
      navigate("/admin-login");
    }
  }, [navigate]);

  // Fetch all shift reports
  const { data: reports = [], isLoading } = useQuery<ShiftReport[]>({
    queryKey: ["/api/shift-reports"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Calculate employee statistics whenever reports or date filters change
  useEffect(() => {
    if (reports && reports.length > 0) {
      const employeeMap = new Map<string, {
        name: string;
        totalHours: number;
        totalEarnings: number;
        totalCommission: number;
        totalTips: number;
        totalMoneyOwed: number;
        reports: number;
        locationId: number;
      }>();
      
      // Filter reports by date range if filters are set
      const filteredReports = reports.filter(report => {
        const reportDate = new Date(report.date);
        
        // Apply start date filter if set
        if (startDate && reportDate < startDate) {
          return false;
        }
        
        // Apply end date filter if set
        if (endDate) {
          // Set to end of day for the end date to include the entire day
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          if (reportDate > endOfDay) {
            return false;
          }
        }
        
        return true;
      });

      filteredReports.forEach(report => {
        const commissionRate = report.locationId === 2 ? 9 : 4; // Bob's = $9, others = $4
        const cashCars = report.totalCars - report.creditTransactions - report.totalReceipts;
        
        // Commission calculations
        const creditCardCommission = report.creditTransactions * commissionRate;
        const cashCommission = cashCars * commissionRate;
        const receiptCommission = report.totalReceipts * commissionRate;
        const totalCommission = creditCardCommission + cashCommission + receiptCommission;
        
        // Tips calculations
        const creditCardTransactionsTotal = report.creditTransactions * 15;
        const creditCardTips = Math.abs(report.totalCreditSales - creditCardTransactionsTotal);
        const cashCarsTotal = cashCars * 15;
        const cashTips = Math.abs(report.totalCashCollected - cashCarsTotal);
        const receiptTips = report.totalReceipts * 3;
        const totalTips = creditCardTips + cashTips + receiptTips;

        // Parse employee data from JSON string
        let employees = [];
        try {
          if (report.employees && typeof report.employees === 'string') {
            employees = JSON.parse(report.employees);
          } else if (Array.isArray(report.employees)) {
            employees = report.employees;
          }
        } catch (err) {
          console.error("Failed to parse employee data:", err);
          employees = [];
        }

        // Process each employee
        employees.forEach(employee => {
          // Skip employees with no name
          if (!employee.name) return;
          
          const totalHours = Number(report.totalJobHours || 0);
          const hoursPercent = totalHours > 0 ? employee.hours / totalHours : 0;
          
          // Calculate money owed (if negative cashTurnIn) 
          const expectedCompanyCashTurnIn = report.totalTurnIn - report.totalCreditSales - (report.totalReceiptSales || 0);
          const employeeMoneyOwed = expectedCompanyCashTurnIn < 0 ? 
            hoursPercent * Math.abs(expectedCompanyCashTurnIn) : 0;

          // Calculate employee's portion of commission and tips
          const employeeCommission = hoursPercent * totalCommission;
          const employeeTips = hoursPercent * totalTips;
          const employeeTotalEarnings = employeeCommission + employeeTips;
          
          // Get or create employee stats
          const existingStats = employeeMap.get(employee.name) || {
            name: employee.name,
            totalHours: 0,
            totalEarnings: 0,
            totalCommission: 0,
            totalTips: 0,
            totalMoneyOwed: 0,
            reports: 0,
            locationId: report.locationId
          };
          
          // Update stats
          employeeMap.set(employee.name, {
            ...existingStats,
            totalHours: existingStats.totalHours + employee.hours,
            totalEarnings: existingStats.totalEarnings + employeeTotalEarnings,
            totalCommission: existingStats.totalCommission + employeeCommission,
            totalTips: existingStats.totalTips + employeeTips,
            totalMoneyOwed: existingStats.totalMoneyOwed + employeeMoneyOwed,
            reports: existingStats.reports + 1,
            locationId: report.locationId // Keep using the most recent location
          });
        });
      });

      // Convert map to array and sort by total earnings
      const employeeStatsArray = Array.from(employeeMap.values())
        .sort((a, b) => b.totalEarnings - a.totalEarnings);
      
      setEmployeeStats(employeeStatsArray);
    }
  }, [reports, startDate, endDate]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("admin_authenticated");
    localStorage.removeItem("admin_auth_time");
    navigate("/admin-login");
  };
  
  // Function to export shift reports to CSV
  const exportReportsToCSV = () => {
    if (!reports.length) return;
    
    // CSV header
    let csvContent = "ID,Date,Location,Shift,Leader,Cars,Turn-In,Employees,Submitted\n";
    
    // Add each row of data
    reports.forEach(report => {
      const date = new Date(report.date).toLocaleDateString();
      const submittedDate = new Date(report.createdAt).toLocaleDateString();
      const locationName = getLocationName(report.locationId);
      const turnInRate = report.locationId === 2 ? 6 : 11;
      const expectedTurnIn = report.totalCars * turnInRate;
      const leaderName = EMPLOYEE_NAMES[report.manager] || report.manager;
      const employeeCount = typeof report.employees === 'string' 
        ? JSON.parse(report.employees).length 
        : Array.isArray(report.employees) 
          ? report.employees.length 
          : 0;
      
      // Format the CSV row
      csvContent += `${report.id},"${date}","${locationName}","${report.shift}","${leaderName}",${report.totalCars},${expectedTurnIn.toFixed(2)},${employeeCount},"${submittedDate}"\n`;
    });
    
    // Create a download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'shift-reports.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Function to export employee data to CSV
  const exportEmployeesToCSV = () => {
    if (!employeeStats.length) return;
    
    // CSV header
    let csvContent = "Employee,Total Hours,Location,Commission,Tips,Money Owed,Total Earnings,Est. Taxes (22%)\n";
    
    // Add each row of data
    employeeStats.forEach(employee => {
      const employeeName = EMPLOYEE_NAMES[employee.name] || employee.name;
      const locationName = LOCATIONS.find(loc => loc.id === employee.locationId)?.name || '-';
      const taxes = (employee.totalEarnings * 0.22).toFixed(2);
      
      // Format the CSV row
      csvContent += `"${employeeName}",${employee.totalHours.toFixed(1)},"${locationName}",${employee.totalCommission.toFixed(2)},${employee.totalTips.toFixed(2)},${employee.totalMoneyOwed.toFixed(2)},${employee.totalEarnings.toFixed(2)},${taxes}\n`;
    });
    
    // Create a download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'employee-payroll.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Function to export shift reports to PDF
  const exportReportsToPDF = () => {
    if (!reports.length) return;
    
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text("Access Valet Parking - Shift Reports", 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Prepare table data
    const tableColumn = ["ID", "Date", "Location", "Shift", "Leader", "Cars", "Turn-In", "Employees"];
    const tableRows = reports.map(report => {
      const date = new Date(report.date).toLocaleDateString();
      const locationName = getLocationName(report.locationId);
      const turnInRate = report.locationId === 2 ? 6 : 11;
      const expectedTurnIn = report.totalCars * turnInRate;
      const leaderName = EMPLOYEE_NAMES[report.manager] || report.manager;
      const employeeCount = typeof report.employees === 'string' 
        ? JSON.parse(report.employees).length 
        : Array.isArray(report.employees) 
          ? report.employees.length 
          : 0;
      
      return [
        report.id,
        date,
        locationName,
        report.shift,
        leaderName,
        report.totalCars,
        `$${expectedTurnIn.toFixed(2)}`,
        employeeCount
      ];
    });
    
    // Generate table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0, 101, 189] }
    });
    
    // Save PDF
    doc.save("shift-reports.pdf");
  };
  
  // Function to export employee data to PDF
  const exportEmployeesToPDF = () => {
    if (!employeeStats.length) return;
    
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text("Access Valet Parking - Employee Payroll", 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Prepare table data
    const tableColumn = ["Employee", "Hours", "Location", "Commission", "Tips", "Money Owed", "Total Earnings", "Est. Taxes (22%)"];
    const tableRows = employeeStats.map(employee => {
      const employeeName = EMPLOYEE_NAMES[employee.name] || employee.name;
      const locationName = LOCATIONS.find(loc => loc.id === employee.locationId)?.name || '-';
      const taxes = (employee.totalEarnings * 0.22).toFixed(2);
      
      return [
        employeeName,
        employee.totalHours.toFixed(1),
        locationName,
        `$${employee.totalCommission.toFixed(2)}`,
        `$${employee.totalTips.toFixed(2)}`,
        `$${employee.totalMoneyOwed.toFixed(2)}`,
        `$${employee.totalEarnings.toFixed(2)}`,
        `$${taxes}`
      ];
    });
    
    // Generate table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0, 101, 189] }
    });
    
    // Save PDF
    doc.save("employee-payroll.pdf");
  };

  // Get location name by ID
  const getLocationName = (locationId: number) => {
    return LOCATIONS.find(loc => loc.id === locationId)?.name || "Unknown";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-blue-800">Admin Panel</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate("/")}
            className="flex items-center gap-1"
          >
            <Home className="h-4 w-4" />
            Home
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="reports" className="flex items-center">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Employee Payroll
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="reports">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Shift Reports</CardTitle>
                <CardDescription>
                  View all shift reports across all locations
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={exportReportsToCSV}
                  className="flex items-center gap-1"
                >
                  <FileDown className="h-4 w-4" />
                  Export CSV
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={exportReportsToPDF}
                  className="flex items-center gap-1"
                >
                  <Download className="h-4 w-4" />
                  Export PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading reports...</div>
              ) : reports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No reports found. Create a report to get started.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableCaption>A list of all shift reports.</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Shift</TableHead>
                        <TableHead>Leader</TableHead>
                        <TableHead className="text-right">Cars</TableHead>
                        <TableHead className="text-right">Turn-In</TableHead>
                        <TableHead className="text-right">Employees</TableHead>
                        <TableHead className="text-right">Submitted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.map((report) => {
                        const date = new Date(report.date);
                        const submittedDate = new Date(report.createdAt);
                        const turnInRate = report.locationId === 2 ? 6 : 11;
                        const expectedTurnIn = report.totalCars * turnInRate;
                        
                        return (
                          <TableRow key={report.id}>
                            <TableCell className="font-medium">{report.id}</TableCell>
                            <TableCell>{date.toLocaleDateString()}</TableCell>
                            <TableCell>{getLocationName(report.locationId)}</TableCell>
                            <TableCell>{report.shift}</TableCell>
                            <TableCell>{EMPLOYEE_NAMES[report.manager] || report.manager}</TableCell>
                            <TableCell className="text-right">{report.totalCars}</TableCell>
                            <TableCell className="text-right">${expectedTurnIn.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              {typeof report.employees === 'string' 
                                ? JSON.parse(report.employees).length 
                                : Array.isArray(report.employees) 
                                  ? report.employees.length 
                                  : 0}
                            </TableCell>
                            <TableCell className="text-right">{submittedDate.toLocaleDateString()}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees">
          <Card>
            <CardHeader className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Employee Payroll Summary</CardTitle>
                  <CardDescription>
                    View financial summary for all employees
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={exportEmployeesToCSV}
                    className="flex items-center gap-1"
                  >
                    <FileDown className="h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={exportEmployeesToPDF}
                    className="flex items-center gap-1"
                  >
                    <Download className="h-4 w-4" />
                    Export PDF
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-wrap items-end gap-4 border p-4 rounded-md bg-gray-50 dark:bg-gray-900">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
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
                  <Label htmlFor="end-date">End Date</Label>
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
                    setStartDate(undefined);
                    setEndDate(undefined);
                  }}
                >
                  Clear Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading employee data...</div>
              ) : employeeStats.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No employee data found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableCaption>Employee financial summary across all reports.</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead className="text-right">Total Hours</TableHead>
                        <TableHead className="text-right">Location</TableHead>
                        <TableHead className="text-right">Commission</TableHead>
                        <TableHead className="text-right">Tips</TableHead>
                        <TableHead className="text-right">Money Owed</TableHead>
                        <TableHead className="text-right">Total Earnings</TableHead>
                        <TableHead className="text-right">Est. Taxes (22%)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeeStats.map((employee) => (
                        <TableRow key={employee.name}>
                          <TableCell className="font-medium">
                            {EMPLOYEE_NAMES[employee.name] || employee.name}
                          </TableCell>
                          <TableCell className="text-right">{employee.totalHours.toFixed(1)}</TableCell>
                          <TableCell className="text-right">
                            {LOCATIONS.find(loc => loc.id === employee.locationId)?.name || '-'}
                          </TableCell>
                          <TableCell className="text-right">${employee.totalCommission.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${employee.totalTips.toFixed(2)}</TableCell>
                          <TableCell className="text-right text-blue-700">
                            ${employee.totalMoneyOwed.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-medium text-blue-800">
                            ${employee.totalEarnings.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-red-700">
                            ${(employee.totalEarnings * 0.22).toFixed(2)}
                          </TableCell>
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