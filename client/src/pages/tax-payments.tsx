import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle, DollarSign, Download, MoreHorizontal, Users } from "lucide-react";
import { Employee, EmployeeTaxPayment } from "@shared/schema";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { useLocation } from "wouter";

export default function AccountantPage() {
  const [, navigate] = useLocation();
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  
  // Check if admin is authenticated
  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate("/admin-login");
    }
  }, [navigate]);
  
  // Fetch all employees
  const { data: employees } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
    enabled: isAdminAuthenticated()
  });
  

  
  // Fetch tax payments and ensure all employees have records
  const { data: taxPayments, isLoading } = useQuery<EmployeeTaxPayment[]>({
    queryKey: ['/api/tax-payments', selectedEmployee, selectedMonth, employees],
    queryFn: async () => {
      try {
        // First fetch all employees to ensure we have records for each
        if (!employees || employees.length === 0) {
          return [];
        }
        
        // Fetch existing tax payments
        let url = '/api/tax-payments';
        if (selectedEmployee && selectedEmployee !== 'all') {
          url = `/api/tax-payments/employee/${selectedEmployee}`;
        }
        
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch tax payments');
        let payments = await res.json();
        
        // Create a map of employee IDs to their tax payments
        const paymentsByEmployeeId = new Map();
        payments.forEach(payment => {
          if (!paymentsByEmployeeId.has(payment.employeeId)) {
            paymentsByEmployeeId.set(payment.employeeId, []);
          }
          paymentsByEmployeeId.get(payment.employeeId).push(payment);
        });
        
        // Get reports to associate with employees without payments
        const reportsRes = await fetch('/api/shift-reports');
        const reports = reportsRes.ok ? await reportsRes.json() : [];
        
        // Create a complete set of records with all employees
        let allPayments = [];
        let recordId = 1000; // Starting ID for new records
        
        employees.forEach((employee, employeeIndex) => {
          // If employee already has payments, use those
          if (paymentsByEmployeeId.has(employee.id)) {
            allPayments = [...allPayments, ...paymentsByEmployeeId.get(employee.id)];
          } else {
            // Create a record with zeros for this employee
            // Try to find a report this employee was in
            let employeeReport = null;
            if (reports && reports.length > 0) {
              // Find reports this employee participated in
              for (const report of reports) {
                try {
                  let reportEmployees = [];
                  if (typeof report.employees === 'string') {
                    reportEmployees = JSON.parse(report.employees);
                  } else if (Array.isArray(report.employees)) {
                    reportEmployees = report.employees;
                  }
                  
                  if (reportEmployees.some(emp => emp.name === employee.fullName)) {
                    employeeReport = report;
                    break;
                  }
                } catch (e) {
                  console.error("Error parsing employees:", e);
                }
              }
              
              // If no specific report found, use the most recent
              if (!employeeReport) {
                employeeReport = reports[reports.length - 1];
              }
            }
            
            // Create payment record for employee with zeros or calculated amounts
            const reportId = employeeReport ? employeeReport.id : 0;
            const locationId = employeeReport ? employeeReport.locationId : 1;
            
            // Always use zero values for employees with no financial data
            let totalEarnings = "0";
            let taxAmount = "0";
            let paidAmount = "0";
            let remainingAmount = "0";
            let recordDate = new Date();
            
            allPayments.push({
              id: recordId++,
              reportId: reportId,
              employeeId: employee.id,
              locationId: locationId,
              totalEarnings: totalEarnings,
              taxAmount: taxAmount,
              paidAmount: paidAmount,
              remainingAmount: remainingAmount,
              createdAt: recordDate,
              paymentDate: recordDate
            });
          }
        });
        
        return allPayments;
      } catch (error) {
        console.error("Error fetching tax payments:", error);
        return [];
      }
    },
    enabled: isAdminAuthenticated() && !!employees
  });
  
  const handleEmployeeChange = (value: string) => {
    setSelectedEmployee(value);
  };
  
  const handleMonthFilterChange = (value: string) => {
    setSelectedMonth(value === "all" ? null : value);
  };
  
  // Format currency
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(amount));
  };
  
  // Format date
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Filter tax payments by month if selectedMonth is set
  const filteredPayments = taxPayments?.filter(payment => {
    if (!selectedMonth) return true;
    
    const paymentDate = payment.paymentDate || payment.createdAt;
    if (!paymentDate) return false;
    
    const paymentDateObj = new Date(paymentDate);
    const paymentYear = paymentDateObj.getFullYear();
    const paymentMonth = paymentDateObj.getMonth() + 1; // JavaScript months are 0-based
    const filterYear = parseInt(selectedMonth.split('-')[0]);
    const filterMonth = parseInt(selectedMonth.split('-')[1]);
    
    return paymentYear === filterYear && paymentMonth === filterMonth;
  });
  
  // Calculate commission, tips, money owed and advance
  const calculateCommission = (payment: EmployeeTaxPayment) => {
    // Get actual commission from shift report data
    const report = shiftReports?.find(r => r.id === payment.reportId);
    if (!report) return 0;

    try {
      let reportEmployees = [];
      if (typeof report.employees === 'string') {
        reportEmployees = JSON.parse(report.employees);
      } else if (Array.isArray(report.employees)) {
        reportEmployees = report.employees;
      }

      const employee = employees?.find(e => e.id === payment.employeeId);
      if (!employee) return 0;

      const employeeData = reportEmployees.find(emp => emp.name === employee.fullName);
      return employeeData ? (Number(employeeData.commission) || 0) : 0;
    } catch (e) {
      return 0;
    }
  };
  
  const calculateTips = (payment: EmployeeTaxPayment) => {
    // Get actual tips from shift report data
    const report = shiftReports?.find(r => r.id === payment.reportId);
    if (!report) return 0;

    try {
      let reportEmployees = [];
      if (typeof report.employees === 'string') {
        reportEmployees = JSON.parse(report.employees);
      } else if (Array.isArray(report.employees)) {
        reportEmployees = report.employees;
      }

      const employee = employees?.find(e => e.id === payment.employeeId);
      if (!employee) return 0;

      const employeeData = reportEmployees.find(emp => emp.name === employee.fullName);
      return employeeData ? (Number(employeeData.tips) || 0) : 0;
    } catch (e) {
      return 0;
    }
  };
  
  const calculateMoneyOwed = (payment: EmployeeTaxPayment) => {
    return Number(payment.remainingAmount) * 0.5;
  };
  
  const calculateAdvance = (payment: EmployeeTaxPayment) => {
    const commission = calculateCommission(payment);
    const tips = calculateTips(payment);
    const moneyOwed = calculateMoneyOwed(payment);
    return commission + tips - moneyOwed;
  };
  
  // Calculate totals
  const totalEarnings = filteredPayments?.reduce((sum, payment) => sum + Number(payment.totalEarnings), 0) || 0;
  const totalCommission = filteredPayments?.reduce((sum, payment) => sum + calculateCommission(payment), 0) || 0;
  const totalTips = filteredPayments?.reduce((sum, payment) => sum + calculateTips(payment), 0) || 0;
  const totalMoneyOwed = filteredPayments?.reduce((sum, payment) => sum + calculateMoneyOwed(payment), 0) || 0;
  const totalAdvance = filteredPayments?.reduce((sum, payment) => sum + calculateAdvance(payment), 0) || 0;
  const totalTaxes = filteredPayments?.reduce((sum, payment) => sum + Number(payment.taxAmount), 0) || 0;
  const totalPaid = filteredPayments?.reduce((sum, payment) => sum + Number(payment.paidAmount), 0) || 0;
  const totalTaxContributions = filteredPayments?.reduce((sum, payment) => sum + (Number(payment.paidAmount) - calculateMoneyOwed(payment)), 0) || 0;
  const totalRemaining = filteredPayments?.reduce((sum, payment) => sum + Number(payment.remainingAmount), 0) || 0;
  
  // Function to get employee name by ID
  const getEmployeeName = (id: number) => {
    const employee = employees?.find(emp => emp.id === id);
    return employee?.fullName || `Employee ${id}`;
  };
  
  // Export tax data to CSV
  const exportToCSV = () => {
    if (!filteredPayments?.length) return;
    
    const headers = [
      'Employee', 
      'Report ID', 
      'Location ID', 
      'Total Earnings', 
      'Tax Amount', 
      'Paid Amount', 
      'Remaining', 
      'Date'
    ];
    
    const rows = filteredPayments.map(p => [
      getEmployeeName(p.employeeId),
      p.reportId,
      p.locationId,
      Number(p.totalEarnings).toFixed(2),
      Number(p.taxAmount).toFixed(2),
      Number(p.paidAmount).toFixed(2),
      Number(p.remainingAmount).toFixed(2),
      formatDate(p.paymentDate || p.createdAt)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tax_payments_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Accountant Section</h1>
          <p className="text-gray-600">Track employee commissions, tips, advances, and tax contributions</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/admin")}>
          Back to Admin Panel
        </Button>
      </div>
      

      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Employee Financial Records</CardTitle>
          <CardDescription>
            View detailed employee financial information including commissions, tips, money owed, advances, and tax contributions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="w-full md:w-1/3">
              <Label htmlFor="employee-filter">Filter by Employee</Label>
              <Select value={selectedEmployee} onValueChange={handleEmployeeChange}>
                <SelectTrigger id="employee-filter">
                  <SelectValue placeholder="Select Employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees?.map(employee => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-1/3">
              <Label htmlFor="month-filter">Filter by Month</Label>
              <Select
                value={selectedMonth || "all"}
                onValueChange={handleMonthFilterChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
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
            
            <div className="w-full md:w-1/3 flex items-end">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={exportToCSV}
                disabled={!filteredPayments?.length}
              >
                <Download className="h-4 w-4 mr-2" />
                Export to CSV
              </Button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead className="text-right">Tips</TableHead>
                    <TableHead className="text-right">Money Owed</TableHead>
                    <TableHead className="text-right">Advance</TableHead>
                    <TableHead className="text-right">Tax Contribution</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees && employees.length > 0 ? (
                    // Display each employee once with combined totals
                    employees.map(employee => {
                      // Find all payments for this employee
                      const employeePayments = filteredPayments?.filter(
                        payment => payment.employeeId === employee.id
                      ) || [];
                      
                      // Calculate combined totals for this employee
                      const totalCommission = employeePayments.reduce((sum, payment) => 
                        sum + calculateCommission(payment), 0);
                      const totalTips = employeePayments.reduce((sum, payment) => 
                        sum + calculateTips(payment), 0);
                      const totalMoneyOwed = employeePayments.reduce((sum, payment) => 
                        sum + calculateMoneyOwed(payment), 0);
                      const totalAdvance = employeePayments.reduce((sum, payment) => 
                        sum + calculateAdvance(payment), 0);
                      const totalTaxContribution = employeePayments.reduce((sum, payment) => 
                        sum + (Number(payment.paidAmount || 0) - calculateMoneyOwed(payment)), 0);
                      
                      // Get most recent payment date
                      const mostRecentDate = employeePayments.length > 0 
                        ? employeePayments.reduce((latest, payment) => {
                            const paymentDate = new Date(payment.paymentDate || payment.createdAt);
                            const latestDate = new Date(latest);
                            return paymentDate > latestDate ? (payment.paymentDate || payment.createdAt) : latest;
                          }, employeePayments[0].paymentDate || employeePayments[0].createdAt)
                        : null;
                      
                      // Get report IDs for this employee
                      const reportIds = [...new Set(employeePayments.map(p => p.reportId).filter(Boolean))];
                      
                      return (
                        <TableRow key={`employee-${employee.id}`}>
                          <TableCell className="font-medium">
                            {employee.fullName}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(totalCommission)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(totalTips)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(totalMoneyOwed)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(totalAdvance)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(totalTaxContribution)}
                          </TableCell>
                          <TableCell>
                            {mostRecentDate ? formatDate(mostRecentDate) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    Record Payment
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                        No employees found. Please add employees first.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Tax Payment Management</CardTitle>
          <CardDescription>
            Record new payments or update existing records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-sm">
            Record new tax payments through the "Record Payment" action from the table above, 
            or when editing shift reports.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}