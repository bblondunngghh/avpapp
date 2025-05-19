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
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { LogOut, FileSpreadsheet, Users, Home } from "lucide-react";
import { LOCATIONS, EMPLOYEE_NAMES } from "@/lib/constants";

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
    reports: number;
  }[]>([]);

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

  // Calculate employee statistics whenever reports change
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
      }>();

      reports.forEach(report => {
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
            reports: 0
          };
          
          // Update stats
          employeeMap.set(employee.name, {
            ...existingStats,
            totalHours: existingStats.totalHours + employee.hours,
            totalEarnings: existingStats.totalEarnings + employeeTotalEarnings,
            totalCommission: existingStats.totalCommission + employeeCommission,
            totalTips: existingStats.totalTips + employeeTips,
            totalMoneyOwed: existingStats.totalMoneyOwed + employeeMoneyOwed,
            reports: existingStats.reports + 1
          });
        });
      });

      // Convert map to array and sort by total earnings
      const employeeStatsArray = Array.from(employeeMap.values())
        .sort((a, b) => b.totalEarnings - a.totalEarnings);
      
      setEmployeeStats(employeeStatsArray);
    }
  }, [reports]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("admin_authenticated");
    localStorage.removeItem("admin_auth_time");
    navigate("/admin-login");
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
            <CardHeader>
              <CardTitle>Shift Reports</CardTitle>
              <CardDescription>
                View all shift reports across all locations
              </CardDescription>
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
                            <TableCell>{report.shiftLeader}</TableCell>
                            <TableCell className="text-right">{report.totalCars}</TableCell>
                            <TableCell className="text-right">${expectedTurnIn.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{report.employees?.length || 0}</TableCell>
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
            <CardHeader>
              <CardTitle>Employee Payroll Summary</CardTitle>
              <CardDescription>
                View financial summary for all employees
              </CardDescription>
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
                        <TableHead className="text-right">Account</TableHead>
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
                          <TableCell className="text-right">{employee.name}</TableCell>
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