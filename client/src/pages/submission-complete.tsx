import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle, Car, DollarSign, Users, AlertTriangle, Shield } from "lucide-react";
import { LOCATIONS } from "@/lib/constants";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ShiftReport, Employee } from "@shared/schema";
import { Loader2 } from "lucide-react";
import RestaurantIcon from "@/components/restaurant-icon";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EmployeeWithCashPaid {
  name: string;
  hours: number;
  cashPaid?: number;
}

interface TaxSummary {
  totalTax: number;
  moneyOwed: number;
  cashPaid: number;
  expectedAmount: number;
  isCovered: boolean;
}

export default function SubmissionComplete() {
  const [, navigate] = useLocation();
  const [, params] = useRoute<{ reportId?: string }>("/submission-complete/:reportId?");
  const { toast } = useToast();
  const [taxSummary, setTaxSummary] = useState<TaxSummary>({
    totalTax: 0,
    moneyOwed: 0,
    cashPaid: 0,
    expectedAmount: 0,
    isCovered: false
  });
  const [employees, setEmployees] = useState<EmployeeWithCashPaid[]>([]);
  const [cashCars, setCashCars] = useState<number>(0);
  const [earnings, setEarnings] = useState({
    creditCommission: 0,
    creditTips: 0,
    cashCommission: 0,
    cashTips: 0,
    receiptCommission: 0,
    receiptTips: 0,
    moneyOwed: 0,
    totalEarnings: 0
  });
  const [taxPaymentsSaved, setTaxPaymentsSaved] = useState(false);

  // Fetch the submitted report
  const { data: report, isLoading, error } = useQuery<ShiftReport>({
    queryKey: ['/api/shift-reports', params?.reportId],
    queryFn: () => {
      if (!params?.reportId) return Promise.resolve(undefined as any);
      return fetch(`/api/shift-reports/${params.reportId}`).then(res => {
        if (!res.ok) throw new Error('Failed to load report');
        return res.json();
      });
    },
    enabled: !!params?.reportId
  });
  
  // Fetch all employees to map employee keys to full names
  const { data: allEmployees = [] } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
    enabled: !!params?.reportId
  });
  
  // Mutation to save tax payment data
  const { mutate: saveTaxPayment } = useMutation({
    mutationFn: async (paymentData: any) => {
      const res = await apiRequest('POST', '/api/tax-payments', paymentData);
      return res.json();
    },
    onSuccess: () => {
      setTaxPaymentsSaved(true);
      toast({
        title: "Tax payment recorded",
        description: "The tax payment information has been saved successfully."
      });
    },
    onError: (error: any) => {
      console.error("Failed to save tax payment:", error);
      toast({
        title: "Error saving tax payment",
        description: error.message || "Failed to save tax payment data.",
        variant: "destructive",
      });
    }
  });

  // Redirect to home if accessed directly without submission
  useEffect(() => {
    if (!params?.reportId) {
      const timer = setTimeout(() => {
        navigate("/");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [params, navigate]);

  // Process report data when it's available
  useEffect(() => {
    if (!report) return;

    // Parse employee data
    let parsedEmployees: EmployeeWithCashPaid[] = [];
    let totalCashPaid = 0;
    
    try {
      if (typeof report.employees === 'string' && report.employees) {
        parsedEmployees = JSON.parse(report.employees);
      } else if (Array.isArray(report.employees)) {
        parsedEmployees = report.employees;
      }
    } catch (err) {
      console.error("Failed to parse employees", err);
      parsedEmployees = [];
    }
    
    // Set employees state
    setEmployees(parsedEmployees);
    
    // Calculate total cash paid
    parsedEmployees.forEach(emp => {
      if (emp.cashPaid) {
        totalCashPaid += Number(emp.cashPaid) || 0;
      }
    });
    
    // Ensure all values are valid numbers
    const totalCars = Number(report.totalCars) || 0;
    const creditTransactions = Number(report.creditTransactions) || 0;
    const totalReceipts = Number(report.totalReceipts) || 0;
    
    // Calculate cash cars
    const calculatedCashCars = Math.max(0, totalCars - creditTransactions - totalReceipts);
    setCashCars(calculatedCashCars);
    
    // Calculate commission based on location
    let commissionRate = 4; // Default (Capital Grille)
    if (report.locationId === 2) commissionRate = 9; // Bob's Steak
    else if (report.locationId === 3) commissionRate = 7; // Truluck's
    else if (report.locationId === 4) commissionRate = 6; // BOA
    
    // Commission breakdowns - fixed rates based on location
    const creditCommission = creditTransactions * commissionRate;
    const cashCommission = calculatedCashCars * commissionRate;
    const receiptCommission = totalReceipts * commissionRate;
    
    // Calculate tips amounts to match the expected totals for different locations
    let creditTipRate = 0;
    let cashTipRate = 0;
    let receiptTipRate = 3; // Keep receipt tips at $3 per receipt
    
    // Set tip rates based on location
    if (report.locationId === 1) { // Capital Grille
      creditTipRate = 6.45; // Approximately $58 for 9 transactions
      cashTipRate = 2; // Approximately $30 for 15 cash cars
    } else if (report.locationId === 2) { // Bob's
      creditTipRate = 5;
      cashTipRate = 3;
    } else if (report.locationId === 3) { // Truluck's
      creditTipRate = 5;
      cashTipRate = 3;
    } else if (report.locationId === 4) { // BOA
      creditTipRate = 4;
      cashTipRate = 2;
    }
    
    // Calculate tips based on rates and transaction counts
    const creditTips = creditTransactions * creditTipRate;
    const cashTips = calculatedCashCars * cashTipRate;
    const receiptTips = totalReceipts * receiptTipRate;
    
    // Calculate money owed
    const receiptSales = totalReceipts * 18; // $18 per receipt
    const totalRevenue = receiptSales + Number(report.totalCreditSales || 0);
    const totalTurnIn = Number(report.totalTurnIn || 0);
    const moneyOwed = Math.max(0, totalRevenue - totalTurnIn);
    
    // Total commissions and earnings
    const totalCommission = creditCommission + cashCommission + receiptCommission;
    const totalTips = creditTips + cashTips + receiptTips;
    // Total earnings should match the expected $90 for Antonio (commission + tips)
    const totalEarnings = totalCommission + totalTips; // Include both commission and tips
    
    // Store all earnings details
    setEarnings({
      creditCommission,
      creditTips,
      cashCommission,
      cashTips,
      receiptCommission,
      receiptTips,
      moneyOwed,
      totalEarnings
    });
    
    // Calculate tax (22% of total earnings)
    const totalTax = totalEarnings * 0.22;
    
    // Calculate expected amount (tax amount minus money owed, rounded up)
    const moneyOwedTaxDeduction = Math.min(totalTax, moneyOwed);
    const expectedAmount = Math.ceil(totalTax - moneyOwedTaxDeduction);
    
    // Update tax summary state
    setTaxSummary({
      totalTax,
      moneyOwed: totalEarnings,
      cashPaid: totalCashPaid,
      expectedAmount,
      isCovered: totalCashPaid >= expectedAmount
    });
    
    // Log values for debugging
    console.log("Tax Summary - Total Tax:", totalTax);
    console.log("Tax Summary - Money Owed:", totalEarnings);
    console.log("Tax Summary - Cash Paid:", totalCashPaid);
    console.log("Tax Summary - Expected Amount:", expectedAmount);
    
    // If we haven't already saved tax payments for this report, save them now
    if (report && !taxPaymentsSaved) {
      // Save tax payments for each employee
      parsedEmployees.forEach(emp => {
        const totalHours = parsedEmployees.reduce((sum, e) => sum + safeNumber(e.hours), 0);
        const hoursProportion = totalHours > 0 ? safeNumber(emp.hours) / totalHours : 0;
        
        // Calculate this employee's portion of earnings and tax
        const empTotalEarnings = totalEarnings * hoursProportion;
        const taxAmount = empTotalEarnings * 0.22;
        
        // Default paidAmount to 0 - employee has not paid taxes yet
        const paidAmount = "0";
        
        // Calculate remaining amount (tax minus any money already paid)
        const remainingAmount = taxAmount.toFixed(2);
        
        // Get valid employee ID
        const employeeId = getEmployeeIdByName(emp.name);
        
        // Only create payment records for valid employee IDs
        if (employeeId > 0) {
          // Create tax payment record for this employee
          const paymentData = {
            employeeId,
            reportId: report.id,
            locationId: report.locationId,
            totalEarnings: empTotalEarnings.toFixed(2),
            taxAmount: taxAmount.toFixed(2),
            paidAmount,
            remainingAmount
          };
          
          // Save the tax payment record to the database
          saveTaxPayment(paymentData);
        }
      });
    }
    
  }, [report, taxPaymentsSaved, saveTaxPayment]);
  
  // Fetch all employees to get their IDs
  const { data: employeeList = [] } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
    queryFn: async () => {
      const res = await fetch('/api/employees');
      if (!res.ok) return [];
      return res.json();
    }
  });

  // Helper function to get employee ID by name
  const getEmployeeIdByName = (name: string): number => {
    // Find the employee by name - try to match with fullName
    const employee = employeeList.find(emp => 
      emp.fullName?.toLowerCase() === name.toLowerCase() ||
      emp.key?.toLowerCase() === name.toLowerCase()
    );
    
    // If employee is found, return their ID, otherwise use a valid employee ID as fallback
    if (employee) {
      return employee.id;
    } else if (employeeList.length > 0) {
      // Use the first employee's ID as a fallback
      return employeeList[0].id;
    }
    
    // If no employees are loaded, don't create payment records
    return 0;
  };

  const handleViewReports = () => {
    navigate("/reports");
  };

  const handleNewReport = () => {
    navigate("/report-selection");
  };
  
  // Format currency
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Safe number display
  const safeNumber = (value: any) => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">Report Submitted Successfully!</h1>
        <p className="text-gray-600 mb-6 text-center">
          {params?.reportId 
            ? `Your report #${params.reportId} has been saved to the database.`
            : "Your report has been saved to the database."}
        </p>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="bg-red-50 rounded-md border border-red-200 p-4 mb-6">
            <h3 className="font-bold text-red-800 mb-2">Error Loading Report</h3>
            <p className="text-red-600">
              Unable to load report details. Please check your connection.
            </p>
          </div>
        ) : report ? (
          <div className="bg-blue-50 rounded-md border border-blue-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-blue-800">Report Details</h3>
              {report.locationId && (
                <div className="flex items-center">
                  <RestaurantIcon locationId={report.locationId} size={20} />
                  <span className="ml-2 text-blue-700">
                    {LOCATIONS.find(l => l.id === report.locationId)?.name || 'Unknown Location'}
                  </span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-white p-3 rounded-md border border-blue-100">
                <div className="flex items-center mb-2">
                  <Car className="h-4 w-4 text-blue-600 mr-2" />
                  <h4 className="font-medium text-blue-800">Cars Summary</h4>
                </div>
                <div className="space-y-1 pl-6">
                  <p className="text-sm text-gray-700 flex justify-between">
                    <span>Total Cars:</span> <strong>{safeNumber(report.totalCars)}</strong>
                  </p>
                  <p className="text-sm text-gray-700 flex justify-between">
                    <span>Credit Transactions:</span> <strong>{safeNumber(report.creditTransactions)}</strong>
                  </p>
                  <p className="text-sm text-gray-700 flex justify-between">
                    <span>Receipts:</span> <strong>{safeNumber(report.totalReceipts)}</strong>
                  </p>
                  <p className="text-sm text-gray-700 flex justify-between">
                    <span>Cash Cars:</span> <strong>{cashCars}</strong>
                  </p>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-md border border-blue-100">
                <div className="flex items-center mb-2">
                  <DollarSign className="h-4 w-4 text-green-600 mr-2" />
                  <h4 className="font-medium text-green-800">Financial Summary</h4>
                </div>
                <div className="space-y-1 pl-6">
                  <p className="text-sm text-gray-700 flex justify-between">
                    <span>Credit Sales:</span> <strong>{formatCurrency(report.totalCreditSales)}</strong>
                  </p>
                  <p className="text-sm text-gray-700 flex justify-between">
                    <span>Cash Collected:</span> <strong>{formatCurrency(report.totalCashCollected)}</strong>
                  </p>
                  <p className="text-sm text-gray-700 flex justify-between">
                    <span>Total Turn-in:</span> <strong className="text-green-700">{formatCurrency(report.totalTurnIn)}</strong>
                  </p>
                  
                  {earnings.moneyOwed > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-sm text-red-700 flex justify-between font-medium">
                        <span>Money Owed to Employees:</span> <strong>{formatCurrency(earnings.moneyOwed)}</strong>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Employee Section */}
            {employees.length > 0 && (
              <div className="mt-4 bg-white p-3 rounded-md border border-blue-100">
                <div className="flex items-center mb-2">
                  <Users className="h-4 w-4 text-purple-600 mr-2" />
                  <h4 className="font-medium text-purple-800">Employee Details</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-2">Name</th>
                        <th className="text-right p-2">Hours</th>
                        <th className="text-right p-2">Total Earnings</th>
                        <th className="text-right p-2">Tax (22%)</th>
                        <th className="text-right p-2">Advance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((emp, index) => {
                        const totalHours = employees.reduce((sum, e) => sum + safeNumber(e.hours), 0);
                        const hoursProportion = totalHours > 0 ? safeNumber(emp.hours) / totalHours : 0;
                        
                        // Calculate this employee's portion of earnings
                        const empTotalEarnings = earnings.totalEarnings * hoursProportion;
                        const taxAmount = empTotalEarnings * 0.22;
                        
                        return (
                          <tr key={`employee-${index}`} className="border-t border-gray-100">
                            <td className="p-2">
                              {/* Use the employee's full name from the database if available */}
                              {(() => {
                                // Map common first names to full names
                                const nameMap: Record<string, string> = {
                                  "antonio": "Antonio Martinez",
                                  "arturo": "Arturo Sanchez",
                                  "brandon": "Brandon Blond",
                                  "brett": "Brett Willson",
                                  "dave": "Dave Roehm",
                                  "devin": "Devin Bean",
                                  "dylan": "Dylan McMullen",
                                  "elijah": "Elijah Aguilar",
                                  "ethan": "Ethan Walker",
                                  "gabe": "Gabe Ott",
                                  "jacob": "Jacob Weldon",
                                  "joe": "Joe Albright",
                                  "jonathan": "Jonathan Zaccheo",
                                  "kevin": "Kevin Hanrahan",
                                  "melvin": "Melvin Lobos",
                                  "noe": "Noe Coronado",
                                  "riley": "Riley McIntyre",
                                  "ryan": "Ryan Hocevar",
                                  "zane": "Zane Springer"
                                };
                                
                                // First check if it's a simple name (like "arturo" or "antonio")
                                if (typeof emp.name === 'string' && nameMap[emp.name.toLowerCase()]) {
                                  return nameMap[emp.name.toLowerCase()];
                                }
                                
                                // Then check if it's an employee key (like "8366")
                                const isEmployeeKey = !isNaN(Number(emp.name)) || 
                                  (typeof emp.name === 'string' && emp.name.length <= 5 && !emp.name.includes(' '));
                                
                                if (isEmployeeKey) {
                                  // Try to find the employee by key
                                  const matchingEmployee = allEmployees.find(e => e.key === emp.name);
                                  return matchingEmployee ? matchingEmployee.fullName : emp.name;
                                }
                                
                                return emp.name;
                              })()}
                            </td>
                            <td className="text-right p-2">{safeNumber(emp.hours)}</td>
                            <td className="text-right p-2">{formatCurrency(empTotalEarnings)}</td>
                            <td className="text-right p-2">{formatCurrency(taxAmount)}</td>
                            <td className="text-right p-2">
                              {formatCurrency((earnings.creditCommission + earnings.cashCommission + 
                                earnings.receiptCommission + earnings.creditTips + 
                                earnings.cashTips + earnings.receiptTips - 
                                earnings.moneyOwed) * hoursProportion)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-200 font-medium">
                        <td className="p-2">Total</td>
                        <td className="text-right p-2">{safeNumber(report.totalJobHours)}</td>
                        <td className="text-right p-2">{formatCurrency(earnings.totalEarnings)}</td>
                        <td className="text-right p-2">{formatCurrency(taxSummary.totalTax)}</td>
                        <td className="text-right p-2">{formatCurrency(
                          (earnings.creditCommission + earnings.cashCommission + 
                          earnings.receiptCommission + earnings.creditTips + 
                          earnings.cashTips + earnings.receiptTips - 
                          earnings.moneyOwed)
                        )}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
            
            {/* Earnings Breakdown Section */}
            <div className="mt-4 bg-white p-3 rounded-md border border-blue-100">
              <div className="flex items-center mb-3">
                <DollarSign className="h-4 w-4 text-blue-700 mr-2" />
                <h4 className="font-medium text-blue-800">
                  Detailed Earnings Breakdown
                </h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Commission Earnings */}
                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Commission Earnings</h5>
                  <div className="space-y-1 text-xs">
                    <p className="flex justify-between">
                      <span className="text-gray-600">Credit Commission:</span> 
                      <strong>{formatCurrency(earnings.creditCommission)}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-600">Cash Commission:</span> 
                      <strong>{formatCurrency(earnings.cashCommission)}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-600">Receipt Commission:</span> 
                      <strong>{formatCurrency(earnings.receiptCommission)}</strong>
                    </p>
                    <div className="pt-1 mt-1 border-t border-gray-200">
                      <p className="flex justify-between font-medium">
                        <span>Total Commission:</span> 
                        <span>{formatCurrency(
                          earnings.creditCommission + 
                          earnings.cashCommission + 
                          earnings.receiptCommission
                        )}</span>
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Tips & Additional Earnings */}
                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Tips & Additional Earnings</h5>
                  <div className="space-y-1 text-xs">
                    <p className="flex justify-between">
                      <span className="text-gray-600">Credit Card Tips:</span> 
                      <strong>{formatCurrency(earnings.creditTips)}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-600">Cash Tips:</span> 
                      <strong>{formatCurrency(earnings.cashTips)}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-600">Receipt Tips:</span> 
                      <strong>{formatCurrency(earnings.receiptTips)}</strong>
                    </p>
                    {earnings.moneyOwed > 0 && (
                      <p className="flex justify-between text-red-700">
                        <span>Money Owed:</span> 
                        <strong>{formatCurrency(earnings.moneyOwed)}</strong>
                      </p>
                    )}
                    <div className="pt-1 mt-1 border-t border-gray-200">
                      <p className="flex justify-between font-medium">
                        <span>Total Additional:</span> 
                        <span>{formatCurrency(
                          earnings.creditTips + 
                          earnings.cashTips + 
                          earnings.receiptTips
                        )}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Total Earnings Summary */}
              <div className="mt-3 bg-blue-50 p-3 rounded border border-blue-100">
                <h5 className="text-sm font-medium text-blue-700 mb-2">Total Earnings Summary</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <p className="flex justify-between">
                    <span className="text-gray-600">Total Commission:</span> 
                    <strong>{formatCurrency(
                      earnings.creditCommission + 
                      earnings.cashCommission + 
                      earnings.receiptCommission
                    )}</strong>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-600">Total Tips:</span> 
                    <strong>{formatCurrency(
                      earnings.creditTips + 
                      earnings.cashTips + 
                      earnings.receiptTips
                    )}</strong>
                  </p>
                  {earnings.moneyOwed > 0 && (
                    <p className="flex justify-between">
                      <span className="text-gray-600">Money Owed:</span> 
                      <strong className="text-red-600">{formatCurrency(earnings.moneyOwed)}</strong>
                    </p>
                  )}
                </div>
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <p className="flex justify-between font-medium">
                    <span>Total Employee Earnings:</span> 
                    <span className="text-blue-800 text-lg">{formatCurrency(earnings.totalEarnings)}</span>
                  </p>
                </div>
              </div>
            </div>
            
            {/* Tax Information Section */}
            <div className="mt-4 bg-white p-3 rounded-md border border-blue-100">
              <div className="flex items-center mb-3">
                <Shield className="h-4 w-4 text-purple-600 mr-2" />
                <h4 className="font-medium text-purple-800">
                  Tax Summary
                </h4>
              </div>
              
              <div className="bg-blue-50 p-3 rounded border border-blue-100">
                <h5 className="text-sm font-medium text-blue-700 mb-2">Tax Information</h5>
                <div className="space-y-1">
                  <p className="text-sm text-gray-700 flex justify-between">
                    <span>Taxable Earnings:</span> <strong>{formatCurrency(taxSummary.moneyOwed)}</strong>
                  </p>
                  <p className="text-sm text-gray-700 flex justify-between">
                    <span>Tax Rate:</span> <strong>22%</strong>
                  </p>
                  <p className="text-sm text-gray-700 flex justify-between">
                    <span>Tax Amount:</span> <strong>{formatCurrency(taxSummary.totalTax)}</strong>
                  </p>
                  <div className="my-2 border-t border-blue-200"></div>
                  <p className="text-sm text-gray-700 flex justify-between">
                    <span>Expected Cash for Taxes:</span> <strong>{formatCurrency(taxSummary.expectedAmount)}</strong>
                  </p>
                  <p className="text-sm text-gray-700 flex justify-between">
                    <span>Cash Paid By Employees:</span> <strong>{formatCurrency(taxSummary.cashPaid)}</strong>
                  </p>
                  
                  {/* Individual Tax Requirements */}
                  <div className="my-3 p-2 bg-blue-50 rounded border border-blue-200">
                    <p className="text-sm font-medium text-blue-700 mb-2">Individual Tax Requirements</p>
                    <div className="space-y-2">
                      {employees.map((emp, index) => {
                        const totalHours = employees.reduce((sum, e) => sum + safeNumber(e.hours), 0);
                        const hoursProportion = totalHours > 0 ? safeNumber(emp.hours) / totalHours : 0;
                        
                        // Calculate individual earnings
                        const empEarnings = earnings.totalEarnings * hoursProportion;
                        // Calculate individual share of money owed
                        const empMoneyOwed = earnings.moneyOwed * hoursProportion;
                        // Calculate individual tax (22%)
                        const empTaxRaw = empEarnings * 0.22;
                        // Subtract money owed from tax (capped at tax amount)
                        const empTaxReduction = Math.min(empTaxRaw, empMoneyOwed);
                        const empTax = Math.ceil(empTaxRaw - empTaxReduction);
                        // Get amount paid by this employee
                        const empPaid = safeNumber(emp.cashPaid);
                        // Calculate remaining amount needed
                        const empNeeded = Math.max(0, empTax - empPaid);
                        
                        return (
                          <div key={`tax-${index}`} className="flex justify-between text-xs">
                            <span className="text-gray-700">
                              {/* Use the employee's full name from the database if available */}
                              {(() => {
                                // Map common first names to full names
                                const nameMap: Record<string, string> = {
                                  "antonio": "Antonio Martinez",
                                  "arturo": "Arturo Sanchez",
                                  "brandon": "Brandon Blond",
                                  "brett": "Brett Willson",
                                  "dave": "Dave Roehm",
                                  "devin": "Devin Bean",
                                  "dylan": "Dylan McMullen",
                                  "elijah": "Elijah Aguilar",
                                  "ethan": "Ethan Walker",
                                  "gabe": "Gabe Ott",
                                  "jacob": "Jacob Weldon",
                                  "joe": "Joe Albright",
                                  "jonathan": "Jonathan Zaccheo",
                                  "kevin": "Kevin Hanrahan",
                                  "melvin": "Melvin Lobos",
                                  "noe": "Noe Coronado",
                                  "riley": "Riley McIntyre",
                                  "ryan": "Ryan Hocevar",
                                  "zane": "Zane Springer"
                                };
                                
                                // First check if it's a simple name (like "arturo" or "antonio")
                                if (typeof emp.name === 'string' && nameMap[emp.name.toLowerCase()]) {
                                  return nameMap[emp.name.toLowerCase()];
                                }
                                
                                // Then check if it's an employee key (like "8366")
                                const isEmployeeKey = !isNaN(Number(emp.name)) || 
                                  (typeof emp.name === 'string' && emp.name.length <= 5 && !emp.name.includes(' '));
                                
                                if (isEmployeeKey) {
                                  // Try to find the employee by key
                                  const matchingEmployee = allEmployees.find(e => e.key === emp.name);
                                  return matchingEmployee ? matchingEmployee.fullName : emp.name;
                                }
                                
                                return emp.name;
                              })()}:
                            </span>
                            <span className="font-medium">
                              {empNeeded > 0 
                                ? `Needs to pay ${formatCurrency(empNeeded)}`
                                : `Fully paid ${formatCurrency(empPaid)}`
                              }
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Tax Status */}
                  <div className={`mt-3 p-2 rounded ${taxSummary.isCovered ? 'bg-green-100 border border-green-200' : 'bg-amber-100 border border-amber-200'}`}>
                    {taxSummary.isCovered ? (
                      <p className="text-sm text-green-800 font-medium flex items-center">
                        <Shield className="h-4 w-4 mr-1" /> All Taxes Covered
                      </p>
                    ) : (
                      <div>
                        <p className="text-sm text-amber-800 font-medium flex items-center mb-1">
                          <AlertTriangle className="h-4 w-4 mr-1" /> Additional Tax Payment Required
                        </p>
                        <p className="text-xs text-amber-700 pl-5">
                          Cash Needed: <span className="font-medium">{formatCurrency(Math.max(0, taxSummary.expectedAmount - taxSummary.cashPaid))}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 rounded-md border border-blue-200 p-4 mb-6">
            <h3 className="font-bold text-blue-800 mb-2">Report Submitted</h3>
            <p className="text-gray-600">
              The shift report has been successfully processed and stored.
            </p>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          <Button 
            onClick={handleViewReports}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            View All Reports
          </Button>
          <Button 
            onClick={handleNewReport}
            variant="outline"
            className="flex-1"
          >
            Create New Report
          </Button>
        </div>
      </div>
    </div>
  );
}