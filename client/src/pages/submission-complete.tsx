import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle, Car, DollarSign, Users, AlertTriangle, Shield } from "lucide-react";
import carIcon from "@assets/Car-4--Streamline-Ultimate.png";
import financialIcon from "@assets/Accounting-Bill-Stack-Dollar--Streamline-Ultimate.png";
import employeeIcon from "@assets/Delivery-Man--Streamline-Ultimate.png";
import earningsIcon from "@assets/Cash-User--Streamline-Ultimate.png";

import checkIcon from "@assets/Check-Circle-1--Streamline-Ultimate.png";
import alertIcon from "@assets/Alert-Triangle--Streamline-Ultimate.png";
import certifiedIcon from "@assets/Certified-Ribbon--Streamline-Ultimate.png";
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

export default function SubmissionComplete() {
  const [, navigate] = useLocation();
  const [, params] = useRoute<{ reportId?: string }>("/submission-complete/:reportId?");
  const { toast } = useToast();

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

  // Fetch the submitted report
  const { data: report, isLoading, error } = useQuery<ShiftReport>({
    queryKey: ['/api/shift-reports', params?.reportId],
    enabled: !!params?.reportId,
    queryFn: async () => {
      const response = await fetch(`/api/shift-reports/${params?.reportId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch report');
      }
      return response.json();
    }
  });

  // Parse employees from the report data
  useEffect(() => {
    if (!report) return;

    try {
      let parsedEmployees: EmployeeWithCashPaid[] = [];
      
      if (typeof report.employees === 'string') {
        // Handle string format
        parsedEmployees = JSON.parse(report.employees);
      } else if (Array.isArray(report.employees)) {
        // Handle array format
        parsedEmployees = report.employees;
      } else if (report.employees && typeof report.employees === 'object') {
        // Handle object format - convert to array
        parsedEmployees = Object.values(report.employees);
      }
      
      console.log("Parsed employees:", parsedEmployees);
      setEmployees(parsedEmployees || []);
      
      // Calculate cash cars
      const totalCars = report.totalCars || 0;
      const creditCards = report.creditTransactions || 0;
      const receipts = report.totalReceipts || 0;
      const calculatedCashCars = Math.max(0, totalCars - creditCards - receipts);
      setCashCars(calculatedCashCars);
      
      // Calculate earnings based on commissions and tips
      const creditCommission = (report.totalCreditSales || 0) * 0.20;
      const creditTipPercent = report.creditTipPercent || 15;
      const creditTips = (report.totalCreditSales || 0) * (creditTipPercent / 100);
      
      const cashRate = report.cashRate || 15;
      const cashCommission = calculatedCashCars * cashRate;
      const cashTips = report.totalCashCollected ? Math.max(0, report.totalCashCollected - cashCommission) : 0;
      
      const receiptCommission = (report.totalReceipts || 0) * 5;
      const receiptTips = report.receiptTips || 0;
      
      const moneyOwed = report.additionalTaxPayments || 0;
      const totalEarnings = creditCommission + creditTips + cashCommission + cashTips + receiptCommission + receiptTips;
      
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
      
    } catch (err) {
      console.error("Failed to parse employees", err);
      setEmployees([]);
    }
  }, [report]);
  
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

  // Get location name helper
  const getLocationName = (locationId: number) => {
    return LOCATIONS.find(l => l.id === locationId)?.name || 'Unknown Location';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-center mb-4">
          <img src={certifiedIcon} alt="Certified" className="h-16 w-16" />
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
                  <img src={carIcon} alt="Car" className="h-4 w-4 mr-2" />
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
                  <img src={financialIcon} alt="Financial" className="h-4 w-4 mr-2" />
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
                  <img src={employeeIcon} alt="Employee" className="h-4 w-4 mr-2" />
                  <h4 className="font-medium text-purple-800">Employee Details</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-2">Name</th>
                        <th className="text-right p-2">Hours</th>
                        <th className="text-right p-2">Total Earnings</th>
                        <th className="text-right p-2">Advance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((emp, index) => {
                        const totalHours = employees.reduce((sum, e) => sum + safeNumber(e.hours), 0);
                        const hoursProportion = totalHours > 0 ? safeNumber(emp.hours) / totalHours : 0;
                        
                        // Calculate this employee's actual earnings based on their hours
                        const totalCommission = earnings.creditCommission + earnings.cashCommission + earnings.receiptCommission;
                        const totalTips = earnings.creditTips + earnings.cashTips + earnings.receiptTips;
                        const empCommission = totalCommission * hoursProportion;
                        const empTips = totalTips * hoursProportion;
                        const empTotalEarnings = empCommission + empTips;
                        
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
                                  const matchingEmployee = employeeList.find(e => e.key === emp.name);
                                  return matchingEmployee ? matchingEmployee.fullName : emp.name;
                                }
                                
                                return emp.name;
                              })()}
                            </td>
                            <td className="text-right p-2">{safeNumber(emp.hours)}</td>
                            <td className="text-right p-2">{formatCurrency(empTotalEarnings)}</td>
                            <td className="text-right p-2">
                              {formatCurrency(empCommission + empTips - (earnings.moneyOwed * hoursProportion))}
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
                <img src={earningsIcon} alt="Earnings" className="h-4 w-4 mr-2" />
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
                    <div className="pt-1 mt-1 border-t border-gray-200">
                      <p className="flex justify-between font-medium">
                        <span>Total Tips:</span> 
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
            Submit New Report
          </Button>
        </div>
      </div>
    </div>
  );
}