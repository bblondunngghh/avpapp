import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle, Car, DollarSign, Users, AlertTriangle, Shield } from "lucide-react";
import { LOCATIONS } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { ShiftReport } from "@shared/schema";
import { Loader2 } from "lucide-react";
import RestaurantIcon from "@/components/restaurant-icon";

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
  const [taxSummary, setTaxSummary] = useState<TaxSummary>({
    totalTax: 0,
    moneyOwed: 0,
    cashPaid: 0,
    expectedAmount: 0,
    isCovered: false
  });
  const [employees, setEmployees] = useState<EmployeeWithCashPaid[]>([]);
  const [cashCars, setCashCars] = useState<number>(0);

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
    
    // Calculate money owed to employees (total earnings)
    const creditCommission = creditTransactions * commissionRate;
    const cashCommission = calculatedCashCars * commissionRate;
    const receiptCommission = totalReceipts * commissionRate;
    const totalCommission = creditCommission + cashCommission + receiptCommission;
    
    // Calculate tax (22% of total earnings)
    const totalTax = totalCommission * 0.22;
    const expectedAmount = Math.ceil(totalTax);
    
    // Update tax summary state
    setTaxSummary({
      totalTax,
      moneyOwed: totalCommission,
      cashPaid: totalCashPaid,
      expectedAmount,
      isCovered: totalCashPaid >= expectedAmount
    });
    
    // Log values for debugging
    console.log("Tax Summary - Total Tax:", totalTax);
    console.log("Tax Summary - Money Owed:", totalCommission);
    console.log("Tax Summary - Cash Paid:", totalCashPaid);
    console.log("Tax Summary - Expected Amount:", expectedAmount);
    
  }, [report]);

  const handleViewReports = () => {
    navigate("/");
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
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
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
                        <th className="text-right p-2">Earnings</th>
                        <th className="text-right p-2">Tax (22%)</th>
                        <th className="text-right p-2">Cash Paid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const totalHours = employees.reduce((sum, emp) => sum + safeNumber(emp.hours), 0);
                        const totalCars = safeNumber(report.totalCars);
                        
                        // Calculate commission rate based on location
                        let commissionRate = 4; // Default (Capital Grille)
                        if (report.locationId === 2) commissionRate = 9; // Bob's Steak
                        else if (report.locationId === 3) commissionRate = 7; // Truluck's
                        else if (report.locationId === 4) commissionRate = 6; // BOA
                        
                        // Total earnings from all cars
                        const totalEarnings = totalCars * commissionRate;
                        
                        return employees.map((emp, index) => {
                          // Calculate earnings proportional to hours worked
                          const hoursProportion = totalHours > 0 ? safeNumber(emp.hours) / totalHours : 0;
                          const earnings = totalEarnings * hoursProportion;
                          const taxAmount = earnings * 0.22;
                          
                          return (
                            <tr key={index} className="border-t border-gray-100">
                              <td className="p-2">{emp.name}</td>
                              <td className="text-right p-2">{safeNumber(emp.hours)}</td>
                              <td className="text-right p-2">{formatCurrency(earnings)}</td>
                              <td className="text-right p-2">{formatCurrency(taxAmount)}</td>
                              <td className="text-right p-2">
                                {emp.cashPaid ? formatCurrency(emp.cashPaid) : '-'}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-200 font-medium">
                        <td className="p-2">Total</td>
                        <td className="text-right p-2">{safeNumber(report.totalJobHours)}</td>
                        <td className="text-right p-2">{formatCurrency(taxSummary.moneyOwed)}</td>
                        <td className="text-right p-2">{formatCurrency(taxSummary.totalTax)}</td>
                        <td className="text-right p-2">{formatCurrency(taxSummary.cashPaid)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
            
            {/* Employee Earnings & Tax Summary Section */}
            <div className="mt-4 bg-white p-3 rounded-md border border-blue-100">
              <div className="flex items-center mb-3">
                <Shield className="h-4 w-4 text-purple-600 mr-2" />
                <h4 className="font-medium text-purple-800">
                  Employee Earnings & Tax Summary
                </h4>
              </div>
              
              {/* Employee Totals Summary */}
              <div className="bg-gray-50 p-3 mb-3 rounded border border-gray-100">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Shift Employee Totals</h5>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <p className="text-sm text-gray-700 flex justify-between">
                    <span>Total Hours:</span> <strong>{safeNumber(report.totalJobHours)}</strong>
                  </p>
                  <p className="text-sm text-gray-700 flex justify-between">
                    <span>Total Cars:</span> <strong>{safeNumber(report.totalCars)}</strong>
                  </p>
                  
                  {/* Location-specific commission rates */}
                  {(() => {
                    let commissionRate = 4; // Default (Capital Grille)
                    if (report.locationId === 2) commissionRate = 9; // Bob's Steak
                    else if (report.locationId === 3) commissionRate = 7; // Truluck's
                    else if (report.locationId === 4) commissionRate = 6; // BOA
                    
                    return (
                      <p className="text-sm text-gray-700 flex justify-between">
                        <span>Commission Rate:</span> <strong>${commissionRate} per car</strong>
                      </p>
                    );
                  })()}
                  
                  <p className="text-sm text-gray-700 flex justify-between">
                    <span>Total Earnings:</span> <strong>{formatCurrency(taxSummary.moneyOwed)}</strong>
                  </p>
                </div>
              </div>
              
              {/* Tax Breakdown */}
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