import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle, Car, DollarSign, Users } from "lucide-react";
import carIcon from "@assets/Car-4--Streamline-Ultimate.png";
import financialIcon from "@assets/Accounting-Bill-Stack-Dollar--Streamline-Ultimate.png";
import employeeIcon from "@assets/Delivery-Man--Streamline-Ultimate.png";
import earningsIcon from "@assets/Cash-User--Streamline-Ultimate.png";
import checkIcon from "@assets/Check-Circle-1--Streamline-Ultimate.png";
import certifiedIcon from "@assets/Certified-Ribbon--Streamline-Ultimate.png";
import { LOCATIONS } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
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
    queryFn: async () => {
      if (!params?.reportId) return null;
      const res = await fetch(`/api/shift-reports/${params.reportId}`);
      if (!res.ok) throw new Error('Failed to fetch report');
      return res.json();
    },
    enabled: !!params?.reportId
  });

  // Helper function to safely convert to number
  const safeNumber = (value: any): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  // Location helper
  const getLocationName = (locationId: number): string => {
    const location = LOCATIONS.find(loc => loc.id === locationId);
    return location ? location.name : 'Unknown Location';
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

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
    
    // Tips calculations based on collection vs turn-in difference
    // Get turn-in rate for this location
    let turnInRate = 11; // Default (Capital Grille)
    if (report.locationId === 2) turnInRate = 6; // Bob's Steak
    else if (report.locationId === 3) turnInRate = 8; // Truluck's
    else if (report.locationId === 4) turnInRate = 7; // BOA
    
    // Get the correct price per car based on location
    let pricePerCar = 15; // Default for most locations
    if (report.locationId === 4) pricePerCar = 13; // BOA uses $13
    
    // Credit tips = absolute difference between what should be collected and what was collected
    const creditExpected = creditTransactions * pricePerCar;
    const creditActual = Number(report.totalCreditSales || 0);
    const creditTips = Math.abs(creditExpected - creditActual);
    
    // Cash tips = absolute difference between what should be collected and what was collected  
    const cashExpected = calculatedCashCars * pricePerCar;
    const cashActual = Number(report.totalCashCollected || 0);
    const cashTips = Math.abs(cashExpected - cashActual);
    // Receipt tips = receipts × $3 (standard)
    const receiptTips = totalReceipts * 3;
    
    // Calculate money owed
    const receiptSales = totalReceipts * 18; // $18 per receipt
    const totalRevenue = receiptSales + Number(report.totalCreditSales || 0);
    const totalTurnIn = Number(report.totalTurnIn || 0);
    const moneyOwed = Math.max(0, totalRevenue - totalTurnIn);
    
    // Total commissions and earnings
    const totalCommission = creditCommission + cashCommission + receiptCommission;
    const totalTips = creditTips + cashTips + receiptTips;
    const totalEarnings = totalCommission + totalTips;
    
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
    
  }, [report]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading shift report...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Unable to Load Report</h2>
          <p className="text-gray-600 mb-4">The requested shift report could not be found.</p>
          <Button onClick={() => navigate("/")}>Return Home</Button>
        </div>
      </div>
    );
  }

  const handleViewReports = () => navigate("/admin-panel");
  const handleNewReport = () => navigate("/");

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="bg-green-50 rounded-md border border-green-200 p-6 mb-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h1 className="text-xl font-bold text-green-800">Report Submitted Successfully!</h1>
              <p className="text-green-700 mt-1">Your report #{report.id} has been saved to the database.</p>
            </div>
          </div>
        </div>

        {/* Report Summary */}
        {report ? (
          <div className="bg-white rounded-md border border-gray-200 p-6 mb-6">
            <div className="flex items-center mb-4">
              <img src={certifiedIcon} alt="Certified" className="h-5 w-5 mr-2" />
              <h2 className="text-lg font-semibold text-gray-800">Shift Report Summary</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-blue-50 p-3 rounded border border-blue-100">
                <div className="flex items-center mb-2">
                  <RestaurantIcon locationId={report.locationId} className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium text-blue-700">Location & Shift</span>
                </div>
                <p className="text-lg font-semibold text-blue-800">{getLocationName(report.locationId)}</p>
                <p className="text-sm text-blue-600">{report.shift} • {new Date(report.date).toLocaleDateString()}</p>
              </div>
              
              <div className="bg-green-50 p-3 rounded border border-green-100">
                <div className="flex items-center mb-2">
                  <img src={carIcon} alt="Cars" className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium text-green-700">Total Cars Parked</span>
                </div>
                <p className="text-lg font-semibold text-green-800">{report.totalCars}</p>
                <div className="text-xs text-green-600">
                  Credit: {report.creditTransactions} • Cash: {cashCars} • Receipt: {report.totalReceipts}
                </div>
              </div>
              
              <div className="bg-purple-50 p-3 rounded border border-purple-100">
                <div className="flex items-center mb-2">
                  <img src={financialIcon} alt="Financial" className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium text-purple-700">Total Turn-In</span>
                </div>
                <p className="text-lg font-semibold text-purple-800">{formatCurrency(Number(report.totalTurnIn || 0))}</p>
              </div>
              
              <div className="bg-orange-50 p-3 rounded border border-orange-100">
                <div className="flex items-center mb-2">
                  <img src={employeeIcon} alt="Employees" className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium text-orange-700">Total Earnings</span>
                </div>
                <p className="text-lg font-semibold text-orange-800">{formatCurrency(earnings.totalEarnings)}</p>
              </div>
            </div>

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
                  </div>
                </div>

                {/* Tips Earnings */}
                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Tips Earnings</h5>
                  <div className="space-y-1 text-xs">
                    <p className="flex justify-between">
                      <span className="text-gray-600">Credit Tips:</span> 
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
            Create New Report
          </Button>
        </div>
      </div>
    </div>
  );
}