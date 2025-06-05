import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { parseReportDate } from "@/lib/timezone";

// Types
interface ShiftReport {
  id: number;
  locationId: number;
  date: string;
  startingCash: number;
  cashFromManager: number;
  totalCashCollected: number;
  endingCash: number;
  totalCars: number;
  employeePayroll: string;
  employeeCommission: string;
  employeeTips: string;
  employeeCashPaid: string;
  additionalNotes: string;
  createdAt: string;
  updatedAt: string | null;
}

interface Location {
  id: number;
  name: string;
  active: boolean;
}

export default function AdminPanelClean() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch data
  const { data: reports = [] } = useQuery<ShiftReport[]>({
    queryKey: ["/api/shift-reports"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Statistics state
  const [monthlyData, setMonthlyData] = useState<Array<{name: string; sales: number}>>([]);

  // Manual revenue data (memoized to prevent re-creation)
  const manualRevenue = useMemo(() => ({
    "2025-01": 17901,
    "2025-02": 27556,
    "2025-03": 25411,
    "2025-04": 20974,
    "2025-05": 19431
  }), []);

  // Calculate statistics - only depends on reports data
  useEffect(() => {
    if (!reports || reports.length === 0) return;

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    // Initialize with manual revenue data
    const initialData = monthNames.map(name => {
      const monthIndex = monthNames.indexOf(name) + 1;
      const monthKey = `2025-${String(monthIndex).padStart(2, '0')}`;
      return {
        name,
        sales: (manualRevenue as any)[monthKey] || 0
      };
    });

    // Calculate sales from shift reports for June onwards
    const monthlySales = new Map<string, number>();
    reports.forEach(report => {
      const reportDate = parseReportDate(report.date);
      const monthKey = `${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (reportDate.getFullYear() >= 2025 && reportDate.getMonth() >= 5) {
        const dailySales = (report.startingCash + report.cashFromManager + report.totalCashCollected) - report.endingCash;
        const currentSales = monthlySales.get(monthKey) || 0;
        monthlySales.set(monthKey, currentSales + dailySales);
      }
    });

    // Update data with calculated values
    const updatedData = initialData.map(monthData => {
      const monthIndex = monthNames.indexOf(monthData.name) + 1;
      const monthKey = `2025-${String(monthIndex).padStart(2, '0')}`;
      
      if (monthlySales.has(monthKey)) {
        return { ...monthData, sales: monthlySales.get(monthKey) || 0 };
      }
      return monthData;
    });

    setMonthlyData(updatedData);
  }, [reports, manualRevenue]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Access Valet Parking Management System</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Total Reports</h3>
            <p className="text-3xl font-bold text-blue-600">{reports.length}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Active Locations</h3>
            <p className="text-3xl font-bold text-green-600">{locations.filter(loc => loc.active).length}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">This Month</h3>
            <p className="text-3xl font-bold text-purple-600">
              ${monthlyData.find(m => m.name === "June")?.sales.toLocaleString() || "0"}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Total Cars</h3>
            <p className="text-3xl font-bold text-orange-600">
              {reports.reduce((sum, report) => sum + report.totalCars, 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Monthly Revenue</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {monthlyData.slice(0, 6).map((month) => (
              <div key={month.name} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-600">{month.name}</div>
                <div className="text-lg font-bold text-gray-900">${month.sales.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}