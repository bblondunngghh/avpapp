import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { LOCATIONS } from "@/lib/constants";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";

// Define minimal type for shift report data
interface ShiftReport {
  id: number;
  locationId: number;
  date: string;
  shift: string;
  totalCars: number;
  totalCreditSales: number;
  totalCashCollected: number;
  companyCashTurnIn: number;
  totalTurnIn: number;
  creditTransactions: number;
  totalReceipts: number;
  totalReceiptSales: number;
  employees: {
    name: string;
    hours: number;
  }[];
  totalJobHours: number;
  shiftLeader: string;
}

export default function SubmissionComplete() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute<{ reportId?: string }>("/submission-complete/:reportId?");

  // Fetch report data if ID is available
  const { data: report } = useQuery<ShiftReport>({
    queryKey: ['/api/shift-reports', params?.reportId],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    enabled: !!params?.reportId,
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

  // Find location name
  const locationName = report ? LOCATIONS.find(loc => loc.id === report.locationId)?.name || 'Unknown Location' : '';
  
  // Calculate key metrics
  const turnInRate = report?.locationId === 2 ? 6 : 11; // Bob's = $6, others = $11
  const totalTurnIn = report ? report.totalCars * turnInRate : 0;
  const commissionRate = report?.locationId === 2 ? 9 : 4; // Bob's = $9, others = $4

  const handleViewReports = () => {
    navigate("/");
  };

  const handleNewReport = () => {
    navigate("/report-form");
  };

  // Calculate employee payroll details
  const calculateEmployeePayroll = () => {
    if (!report) return [];
    
    return (report.employees || []).map(employee => {
      const totalHours = Number(report.totalJobHours || 0);
      const hoursPercent = totalHours > 0 ? employee.hours / totalHours : 0;
      
      // Cash cars calculation
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
      
      // Calculate individual amounts
      const employeeCommission = hoursPercent * totalCommission;
      const employeeTips = hoursPercent * totalTips;
      const employeeTotalEarnings = employeeCommission + employeeTips;
      
      // Calculate money owed
      const expectedCompanyCashTurnIn = totalTurnIn - report.totalCreditSales - report.totalReceiptSales;
      const employeeMoneyOwed = expectedCompanyCashTurnIn < 0 ? 
        hoursPercent * Math.abs(expectedCompanyCashTurnIn) : 0;
      
      // Calculate taxes (22% of total earnings)
      const taxes = employeeTotalEarnings * 0.22;
      
      // Calculate cash turn-in (taxes minus money owed, if positive)
      const cashTurnIn = Math.max(taxes - employeeMoneyOwed, 0);
      
      return {
        name: employee.name,
        hours: employee.hours,
        hoursPercent: (hoursPercent * 100).toFixed(1),
        commission: employeeCommission.toFixed(2),
        tips: employeeTips.toFixed(2),
        totalEarnings: employeeTotalEarnings.toFixed(2),
        moneyOwed: employeeMoneyOwed.toFixed(2),
        taxes: taxes.toFixed(2),
        cashTurnIn: cashTurnIn.toFixed(2)
      };
    });
  };
  
  const employeePayroll = calculateEmployeePayroll();
  
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
        
        {report && (
          <div className="space-y-6 mb-6">
            <div className="bg-blue-50 rounded-md border border-blue-200 p-4">
              <h3 className="font-bold text-blue-800 mb-2">Report Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">Location:</div>
                <div>{locationName}</div>
                
                <div className="font-medium">Date:</div>
                <div>{new Date(report.date).toLocaleDateString()}</div>
                
                <div className="font-medium">Shift:</div>
                <div>{report.shift}</div>
                
                <div className="font-medium">Shift Leader:</div>
                <div>{report.shiftLeader}</div>
                
                <div className="font-medium">Cars Parked:</div>
                <div>{report.totalCars}</div>
                
                <div className="font-medium">Total Turn-In Rate:</div>
                <div>${turnInRate.toFixed(2)} per car</div>
                
                <div className="font-medium">Expected Turn-In:</div>
                <div className="font-bold text-blue-800">${totalTurnIn.toFixed(2)}</div>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-md border border-blue-200 p-4">
              <h3 className="font-bold text-blue-800 mb-4">Employee Payroll</h3>
              
              {employeePayroll.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-blue-100">
                        <th className="p-2 text-left">Employee</th>
                        <th className="p-2 text-right">Hours</th>
                        <th className="p-2 text-right">Commission</th>
                        <th className="p-2 text-right">Tips</th>
                        <th className="p-2 text-right">Total</th>
                        <th className="p-2 text-right">Taxes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeePayroll.map((employee, index) => (
                        <tr key={index} className="border-t border-blue-200">
                          <td className="p-2">{employee.name || 'Unnamed'}</td>
                          <td className="p-2 text-right">{employee.hours} ({employee.hoursPercent}%)</td>
                          <td className="p-2 text-right">${employee.commission}</td>
                          <td className="p-2 text-right">${employee.tips}</td>
                          <td className="p-2 text-right font-medium text-blue-800">${employee.totalEarnings}</td>
                          <td className="p-2 text-right text-red-700">${employee.taxes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-600">No employee payroll data available for this report.</p>
              )}
            </div>
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