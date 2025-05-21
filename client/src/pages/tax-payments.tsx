import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
  const [filterDate, setFilterDate] = useState<string>('');
  
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
  
  // Fetch tax payments
  const { data: taxPayments, isLoading } = useQuery<EmployeeTaxPayment[]>({
    queryKey: ['/api/tax-payments', selectedEmployee, filterDate],
    queryFn: async () => {
      let url = '/api/tax-payments';
      
      if (selectedEmployee && selectedEmployee !== 'all') {
        url = `/api/tax-payments/employee/${selectedEmployee}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch tax payments');
      return res.json();
    },
    enabled: isAdminAuthenticated()
  });
  
  const handleEmployeeChange = (value: string) => {
    setSelectedEmployee(value);
  };
  
  const handleDateFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterDate(e.target.value);
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
  
  // Filter tax payments by date if filterDate is set
  const filteredPayments = taxPayments?.filter(payment => {
    if (!filterDate) return true;
    
    const paymentDate = payment.paymentDate || payment.createdAt;
    if (!paymentDate) return false;
    
    const paymentDateObj = new Date(paymentDate);
    const filterDateObj = new Date(filterDate);
    
    return paymentDateObj.toDateString() === filterDateObj.toDateString();
  });
  
  // Calculate totals
  const totalEarnings = filteredPayments?.reduce((sum, payment) => sum + Number(payment.totalEarnings), 0) || 0;
  const totalTaxes = filteredPayments?.reduce((sum, payment) => sum + Number(payment.taxAmount), 0) || 0;
  const totalPaid = filteredPayments?.reduce((sum, payment) => sum + Number(payment.paidAmount), 0) || 0;
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
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accountant Section</h1>
          <p className="text-gray-600">Track employee commissions, tips, advances, and tax contributions</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/admin-panel")}>
          Back to Admin Panel
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-gray-700">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-blue-600 mr-1" />
              <span className="text-2xl font-bold">{formatCurrency(totalEarnings)}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-gray-700">Total Tax Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-purple-600 mr-1" />
              <span className="text-2xl font-bold">{formatCurrency(totalTaxes)}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-gray-700">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-2xl font-bold">{formatCurrency(totalPaid)}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-gray-700">Remaining Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-amber-600 mr-1" />
              <span className="text-2xl font-bold">{formatCurrency(totalRemaining)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tax Payment Records</CardTitle>
          <CardDescription>
            View and filter employee tax payment records
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
              <Label htmlFor="date-filter">Filter by Date</Label>
              <Input
                id="date-filter"
                type="date"
                value={filterDate}
                onChange={handleDateFilterChange}
              />
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
                    <TableHead>Report ID</TableHead>
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
                  {filteredPayments?.length ? (
                    filteredPayments.map(payment => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {getEmployeeName(payment.employeeId)}
                        </TableCell>
                        <TableCell>{payment.reportId}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(payment.totalEarnings))}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(payment.taxAmount))}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(payment.paidAmount))}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(payment.remainingAmount))}
                        </TableCell>
                        <TableCell>
                          {formatDate(payment.paymentDate || payment.createdAt)}
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
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                        No tax payment records found
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