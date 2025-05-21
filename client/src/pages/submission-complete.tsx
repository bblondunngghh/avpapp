import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle, Car, DollarSign, Users, AlertTriangle, Shield } from "lucide-react";
import { LOCATIONS } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { ShiftReport, Employee } from "@shared/schema";
import { Loader2 } from "lucide-react";
import RestaurantIcon from "@/components/restaurant-icon";

interface EmployeeWithCashPaid {
  name: string;
  hours: number;
  cashPaid?: number;
}

export default function SubmissionComplete() {
  const [, navigate] = useLocation();
  const [, params] = useRoute<{ reportId?: string }>("/submission-complete/:reportId?");
  const [taxSummary, setTaxSummary] = useState({
    totalTax: 0,
    moneyOwed: 0,
    cashPaid: 0,
    expectedAmount: 0,
    isCovered: false
  });

  // Fetch the submitted report
  const { data: report, isLoading, error } = useQuery<ShiftReport>({
    queryKey: ['/api/shift-reports', params?.reportId],
    queryFn: params?.reportId 
      ? getQueryFn({ on401: "returnNull" }) 
      : () => Promise.resolve(undefined),
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

  // Calculate tax summary when report data is available
  useEffect(() => {
    if (report) {
      try {
        let employees: EmployeeWithCashPaid[] = [];
        let totalCashPaid = 0;
        
        // Parse employee data from string or use array directly
        if (typeof report.employees === 'string') {
          try {
            employees = JSON.parse(report.employees);
          } catch (err) {
            console.error("Failed to parse employees", err);
            employees = [];
          }
        } else if (Array.isArray(report.employees)) {
          employees = report.employees;
        }
        
        // Calculate total cash paid
        employees.forEach(emp => {
          if (emp.cashPaid) {
            totalCashPaid += Number(emp.cashPaid);
          }
        });
        
        // Calculate commission based on location
        let commissionRate = 4; // Default
        if (report.locationId === 2) commissionRate = 9; // Bob's Steak
        else if (report.locationId === 3) commissionRate = 7; // Truluck's
        else if (report.locationId === 4) commissionRate = 6; // BOA
        
        // Calculate money owed to employees (total earnings)
        const cashCars = report.totalCars - report.creditTransactions - report.totalReceipts;
        const creditCommission = report.creditTransactions * commissionRate;
        const cashCommission = cashCars * commissionRate;
        const receiptCommission = report.totalReceipts * commissionRate;
        const totalCommission = creditCommission + cashCommission + receiptCommission;
        
        // Calculate tax (22% of total earnings)
        const totalTax = totalCommission * 0.22;
        const moneyOwed = totalCommission;
        
        // Calculate expected amount (rounded up to next dollar)
        const expectedAmount = Math.ceil(totalTax);
        
        // Update tax summary state
        setTaxSummary({
          totalTax,
          moneyOwed,
          cashPaid: totalCashPaid,
          expectedAmount,
          isCovered: totalCashPaid >= expectedAmount
        });
        
        // Log values for debugging
        console.log("Tax Summary - Total Tax:", totalTax);
        console.log("Tax Summary - Money Owed:", moneyOwed);
        console.log("Tax Summary - Cash Paid:", totalCashPaid);
        console.log("Tax Summary - Expected Amount:", expectedAmount);
      } catch (error) {
        console.error("Error calculating tax summary:", error);
      }
    }
  }, [report]);

  const handleViewReports = () => {
    navigate("/");
  };

  const handleNewReport = () => {
    navigate("/report-selection");
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
                    <span>Total Cars:</span> <strong>{report.totalCars}</strong>
                  </p>
                  <p className="text-sm text-gray-700 flex justify-between">
                    <span>Credit Transactions:</span> <strong>{report.creditTransactions}</strong>
                  </p>
                  <p className="text-sm text-gray-700 flex justify-between">
                    <span>Receipts:</span> <strong>{report.totalReceipts}</strong>
                  </p>
                  <p className="text-sm text-gray-700 flex justify-between">
                    <span>Cash Cars:</span> <strong>{report.totalCars - report.creditTransactions - report.totalReceipts}</strong>
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
            {(typeof report.employees === 'string' || Array.isArray(report.employees)) && (
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
                        <th className="text-right p-2">Cash Paid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        let employees: EmployeeWithCashPaid[] = [];
                        try {
                          if (typeof report.employees === 'string') {
                            employees = JSON.parse(report.employees);
                          } else if (Array.isArray(report.employees)) {
                            employees = report.employees;
                          }
                        } catch (err) {
                          console.warn("employees is not an array, converting to empty array:", JSON.stringify(employees));
                          employees = [];
                        }
                        
                        return employees.map((emp, index) => (
                          <tr key={index} className="border-t border-gray-100">
                            <td className="p-2">{emp.name}</td>
                            <td className="text-right p-2">{emp.hours}</td>
                            <td className="text-right p-2">
                              {emp.cashPaid ? formatCurrency(emp.cashPaid) : '-'}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-200 font-medium">
                        <td className="p-2">Total</td>
                        <td className="text-right p-2">{report.totalJobHours || '-'}</td>
                        <td className="text-right p-2">{formatCurrency(taxSummary.cashPaid)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
            
            {/* Tax Summary Section */}
            <div className="mt-4 bg-white p-3 rounded-md border border-blue-100">
              <div className="flex items-center mb-2">
                {taxSummary.isCovered ? (
                  <Shield className="h-4 w-4 text-green-600 mr-2" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
                )}
                <h4 className={`font-medium ${taxSummary.isCovered ? 'text-green-800' : 'text-amber-800'}`}>
                  Tax Summary
                </h4>
              </div>
              <div className="space-y-1 pl-6">
                <p className="text-sm text-gray-700 flex justify-between">
                  <span>Total Earnings:</span> <strong>{formatCurrency(taxSummary.moneyOwed)}</strong>
                </p>
                <p className="text-sm text-gray-700 flex justify-between">
                  <span>Tax (22%):</span> <strong>{formatCurrency(taxSummary.totalTax)}</strong>
                </p>
                <p className="text-sm text-gray-700 flex justify-between">
                  <span>Cash Paid In:</span> <strong>{formatCurrency(taxSummary.cashPaid)}</strong>
                </p>
                <p className="text-sm flex justify-between font-medium">
                  <span>Expected Amount:</span> <strong>{formatCurrency(taxSummary.expectedAmount)}</strong>
                </p>
                <div className={`mt-2 p-2 rounded ${taxSummary.isCovered ? 'bg-green-50' : 'bg-amber-50'}`}>
                  {taxSummary.isCovered ? (
                    <p className="text-sm text-green-800 font-medium flex items-center">
                      <Shield className="h-4 w-4 mr-1" /> All Taxes Covered
                    </p>
                  ) : (
                    <p className="text-sm text-amber-800 font-medium flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1" /> 
                      Cash for Taxes: <span className="ml-1">{formatCurrency(Math.max(0, taxSummary.expectedAmount - taxSummary.cashPaid))}</span> needed
                    </p>
                  )}
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