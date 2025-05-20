import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { LogOut, FileSpreadsheet, Users, Home, Download, FileDown, MapPin, BarChart, Ticket, PlusCircle, ArrowUpDown, Calendar, LineChart, PieChart, TrendingUp, Activity } from "lucide-react";
import { 
  BarChart as RechartsBarChart, 
  LineChart as RechartsLineChart, 
  PieChart as RechartsPieChart,
  Line,
  Pie,
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell,
  Area,
  AreaChart,
  ComposedChart
} from 'recharts';
import { LOCATIONS, EMPLOYEE_NAMES } from "@/lib/constants";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Define types for our data
interface Employee {
  name: string;
  hours: number;
}

interface EmployeeRecord {
  id: number;
  key: string;
  fullName: string;
  isActive: boolean;
  isShiftLeader: boolean;
  phone: string | null;
  email: string | null;
  hireDate: string;
  terminationDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

interface TicketDistribution {
  id: number;
  locationId: number;
  allocatedTickets: number;
  usedTickets: number;
  batchNumber: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
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

interface TicketDistribution {
  id: number;
  locationId: number;
  allocatedTickets: number;
  usedTickets: number;
  batchNumber: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export default function AdminPanel() {
  const [, navigate] = useLocation();
  const [isAddingEmployees, setIsAddingEmployees] = useState(false);
  const [monthlyData, setMonthlyData] = useState<Array<{name: string; sales: number}>>([]);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  
  // Set up activity tracking to refresh admin session on user interaction
  useEffect(() => {
    // Import admin auth utility
    let refreshAdminSession: () => void;
    
    const setupActivityTracking = async () => {
      const adminAuth = await import("@/lib/admin-auth");
      refreshAdminSession = adminAuth.refreshAdminSession;
      
      // Add event listeners for user activity
      const activityEvents = ["mousedown", "keydown", "touchstart", "scroll"];
      
      const handleUserActivity = () => {
        refreshAdminSession();
      };
      
      // Add event listeners
      activityEvents.forEach(event => {
        window.addEventListener(event, handleUserActivity);
      });
      
      // Return cleanup function
      return () => {
        activityEvents.forEach(event => {
          window.removeEventListener(event, handleUserActivity);
        });
      };
    };
    
    const cleanup = setupActivityTracking();
    return () => {
      cleanup.then(cleanupFn => cleanupFn && cleanupFn());
    };
  }, []);
  
  // Statistics state
  const [dailyCarVolume, setDailyCarVolume] = useState<Array<{name: string; cars: number}>>([]);
  const [carDistributionByLocation, setCarDistributionByLocation] = useState<Array<{name: string; value: number; color: string}>>([]);
  const [salesTrendData, setSalesTrendData] = useState<Array<{date: string; sales: number; cars: number}>>([]);
  const [reportsByDay, setReportsByDay] = useState<Array<{name: string; reports: number}>>([]);
  const { toast } = useToast();
  const [employeeStats, setEmployeeStats] = useState<{
    name: string;
    totalHours: number;
    totalEarnings: number;
    totalCommission: number;
    totalTips: number;
    totalMoneyOwed: number;
    reports: number;
    locationId: number;
  }[]>([]);
  
  // Date filter state
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  // Employee management state is defined below
  
  // Location performance state
  const [locationStats, setLocationStats] = useState<{
    id: number;
    name: string;
    totalCars: number;
    cashSales: number;
    creditSales: number;
    receiptSales: number;
    totalIncome: number;
    reports: number;
  }[]>([]);
  
  // Ticket distribution state
  const [ticketDistributions, setTicketDistributions] = useState<TicketDistribution[]>([]);
  const [isAddDistributionOpen, setIsAddDistributionOpen] = useState(false);
  const [newDistribution, setNewDistribution] = useState({
    locationId: 1,
    allocatedTickets: 0,
    batchNumber: '',
    notes: ''
  });
  
  // Employee management state
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isEditEmployeeOpen, setIsEditEmployeeOpen] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null);
  const [newEmployee, setNewEmployee] = useState({
    key: '',
    fullName: '',
    isActive: true,
    isShiftLeader: false,
    phone: '',
    email: '',
    hireDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Check if admin is authenticated
  useEffect(() => {
    // Import admin auth utility
    import("@/lib/admin-auth").then(({ isAdminAuthenticated }) => {
      // If not authenticated or session expired, redirect to login
      if (!isAdminAuthenticated()) {
        navigate("/admin-login");
      }
    });
    
    // Check authentication status every 15 seconds
    const authCheckInterval = setInterval(() => {
      import("@/lib/admin-auth").then(({ isAdminAuthenticated }) => {
        if (!isAdminAuthenticated()) {
          navigate("/admin-login");
          clearInterval(authCheckInterval);
        }
      });
    }, 15000); // Check every 15 seconds
    
    return () => {
      clearInterval(authCheckInterval);
    };
  }, [navigate]);

  // Fetch all shift reports
  const { data: reports = [], isLoading } = useQuery<ShiftReport[]>({
    queryKey: ["/api/shift-reports"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Fetch ticket distributions
  const { data: distributionsData = [], isLoading: isLoadingDistributions } = useQuery<TicketDistribution[]>({
    queryKey: ["/api/ticket-distributions"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Fetch employees data
  const { data: employeeRecords = [], isLoading: isLoadingEmployees, refetch: refetchEmployees } = useQuery<EmployeeRecord[]>({
    queryKey: ["/api/employees"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Update local state whenever API data changes
  useEffect(() => {
    if (distributionsData && distributionsData.length > 0) {
      setTicketDistributions(distributionsData);
    }
  }, [distributionsData]);
  
  // Calculate statistics and analytics data
  useEffect(() => {
    if (!reports) return;
    
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    // Initialize data structures
    const initialMonthlyData = monthNames.map(name => ({ name, sales: 0 }));
    const initialDailyData = dayNames.map(name => ({ name, cars: 0 }));
    const dayReportCounts = dayNames.map(name => ({ name, reports: 0 }));
    
    // Initialize location distribution data with consistent colors
    const locationColors = {
      1: "#4f46e5", // Capital Grille - blue
      2: "#10b981", // Bob's Steak - green
      3: "#ef4444", // Truluck's - red
      4: "#0ea5e9"  // BOA Steakhouse - sky blue
    };
    
    const locationDistribution: {name: string; value: number; color: string}[] = [];
    LOCATIONS.forEach(location => {
      locationDistribution.push({
        name: location.name,
        value: 0,
        color: locationColors[location.id as keyof typeof locationColors]
      });
    });
    
    // Initialize sales trend data (last 14 days)
    const salesTrend: {date: string; sales: number; cars: number}[] = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      salesTrend.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: 0,
        cars: 0
      });
    }
    
    if (reports.length > 0) {
      // Filter reports by selected location if applicable
      const filteredReports = selectedLocation 
        ? reports.filter(report => report.locationId === selectedLocation)
        : reports;
      
      // Process each report
      filteredReports.forEach(report => {
        const reportDate = new Date(report.date);
        const month = reportDate.getMonth(); // 0-11
        const dayOfWeek = reportDate.getDay(); // 0-6
        
        // Skip if outside filter date range
        if ((startDate && reportDate < startDate) || (endDate && reportDate > endDate)) {
          return;
        }
        
        // Calculate total sales for this report
        const cashCars = report.totalCars - report.creditTransactions - report.totalReceipts;
        // Apply location-specific pricing
        let carPrice = 15; // Default
        if (report.locationId === 4) { // BOA Steakhouse
          carPrice = 13;
        }
        const cashSales = cashCars * carPrice;
        const creditSales = report.totalCreditSales;
        const receiptSales = report.totalReceipts * 18; // $18 per receipt
        const totalSales = cashSales + creditSales + receiptSales;
        
        // Add to monthly sales total
        initialMonthlyData[month].sales += totalSales;
        
        // Add to daily car volume
        initialDailyData[dayOfWeek].cars += report.totalCars;
        
        // Add to reports by day of week
        dayReportCounts[dayOfWeek].reports += 1;
        
        // Add to location distribution
        const locationIndex = locationDistribution.findIndex(loc => 
          loc.name === LOCATIONS.find(l => l.id === report.locationId)?.name
        );
        if (locationIndex !== -1) {
          locationDistribution[locationIndex].value += report.totalCars;
        }
        
        // Add to sales trend (last 14 days)
        const daysAgo = Math.floor((today.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysAgo >= 0 && daysAgo < 14) {
          salesTrend[13 - daysAgo].sales += totalSales;
          salesTrend[13 - daysAgo].cars += report.totalCars;
        }
      });
    }
    
    // Update all state variables with calculated data
    setMonthlyData(initialMonthlyData);
    setDailyCarVolume(initialDailyData);
    setCarDistributionByLocation(locationDistribution);
    setSalesTrendData(salesTrend);
    setReportsByDay(dayReportCounts);
    
  }, [reports, startDate, endDate, selectedLocation]);
  
  // Set initial employees data
  useEffect(() => {
    if (employeeRecords && employeeRecords.length > 0) {
      setEmployees(employeeRecords);
    }
  }, [employeeRecords]);

  // Calculate statistics whenever reports or date filters change
  useEffect(() => {
    if (reports && reports.length > 0) {
      // Employee statistics
      const employeeMap = new Map<string, {
        name: string;
        totalHours: number;
        totalEarnings: number;
        totalCommission: number;
        totalTips: number;
        totalMoneyOwed: number;
        reports: number;
        locationId: number;
      }>();
      
      // Location statistics
      const locationMap = new Map<number, {
        id: number;
        name: string;
        totalCars: number;
        cashSales: number;
        creditSales: number;
        receiptSales: number;
        totalIncome: number;
        reports: number;
      }>();
      
      // Initialize location stats
      LOCATIONS.forEach(location => {
        locationMap.set(location.id, {
          id: location.id,
          name: location.name,
          totalCars: 0,
          cashSales: 0,
          creditSales: 0,
          receiptSales: 0,
          totalIncome: 0,
          reports: 0
        });
      });
      
      // Filter reports by date range if filters are set
      const filteredReports = reports.filter(report => {
        const reportDate = new Date(report.date);
        
        // Apply start date filter if set
        if (startDate && reportDate < startDate) {
          return false;
        }
        
        // Apply end date filter if set
        if (endDate) {
          // Set to end of day for the end date to include the entire day
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          if (reportDate > endOfDay) {
            return false;
          }
        }
        
        return true;
      });

      filteredReports.forEach(report => {
        const commissionRate = report.locationId === 2 ? 9 : 4; // Bob's = $9, others = $4
        const cashCars = report.totalCars - report.creditTransactions - report.totalReceipts;
        
        // Update location statistics
        const locationId = report.locationId;
        const existingLocationStats = locationMap.get(locationId);
        
        if (existingLocationStats) {
          // Calculate sales values
          const cashSales = report.totalCashCollected;
          const creditSales = report.totalCreditSales;
          const receiptSales = report.totalReceipts * 18; // $18 per receipt
          
          // Get turn-in rate based on location
          let turnInRate = 11; // Default Capital Grille ($11)
          if (locationId === 2) turnInRate = 6;      // Bob's ($6)
          else if (locationId === 3) turnInRate = 8; // Truluck's ($8) 
          else if (locationId === 4) turnInRate = 7; // BOA ($7)
          
          // Calculate company's commission (turn-in rate * number of cars)
          const companyCommission = report.totalCars * turnInRate;
          const totalIncome = companyCommission; // Only count what the company makes
          
          // Update location stats
          locationMap.set(locationId, {
            ...existingLocationStats,
            totalCars: existingLocationStats.totalCars + report.totalCars,
            cashSales: existingLocationStats.cashSales + cashSales,
            creditSales: existingLocationStats.creditSales + creditSales,
            receiptSales: existingLocationStats.receiptSales + receiptSales,
            totalIncome: existingLocationStats.totalIncome + totalIncome,
            reports: existingLocationStats.reports + 1
          });
        }
        
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

        // Safety check to ensure employees is an array before using forEach
        if (!Array.isArray(employees)) {
          console.warn("employees is not an array, converting to empty array:", employees);
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
            reports: 0,
            locationId: report.locationId
          };
          
          // Update stats
          employeeMap.set(employee.name, {
            ...existingStats,
            totalHours: existingStats.totalHours + employee.hours,
            totalEarnings: existingStats.totalEarnings + employeeTotalEarnings,
            totalCommission: existingStats.totalCommission + employeeCommission,
            totalTips: existingStats.totalTips + employeeTips,
            totalMoneyOwed: existingStats.totalMoneyOwed + employeeMoneyOwed,
            reports: existingStats.reports + 1,
            locationId: report.locationId // Keep using the most recent location
          });
        });
      });

      // Convert maps to arrays and sort
      const employeeStatsArray = Array.from(employeeMap.values())
        .sort((a, b) => b.totalEarnings - a.totalEarnings);
      
      const locationStatsArray = Array.from(locationMap.values())
        .sort((a, b) => b.totalCars - a.totalCars);
      
      setEmployeeStats(employeeStatsArray);
      setLocationStats(locationStatsArray);
    }
  }, [reports, startDate, endDate]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("admin_authenticated");
    localStorage.removeItem("admin_auth_time");
    navigate("/admin-login");
  };
  
  // Function to export shift reports to CSV
  const exportReportsToCSV = () => {
    if (!reports.length) return;
    
    // CSV header
    let csvContent = "ID,Date,Location,Shift,Leader,Cars,Turn-In,Employees,Submitted\n";
    
    // Add each row of data
    reports.forEach(report => {
      const date = new Date(report.date).toLocaleDateString();
      const submittedDate = new Date(report.createdAt).toLocaleDateString();
      const locationName = getLocationName(report.locationId);
      const turnInRate = report.locationId === 2 ? 6 : 11;
      const expectedTurnIn = report.totalCars * turnInRate;
      const leaderName = EMPLOYEE_NAMES[report.manager] || report.manager;
      const employeeCount = typeof report.employees === 'string' 
        ? JSON.parse(report.employees).length 
        : Array.isArray(report.employees) 
          ? report.employees.length 
          : 0;
      
      // Format the CSV row
      csvContent += `${report.id},"${date}","${locationName}","${report.shift}","${leaderName}",${report.totalCars},${expectedTurnIn.toFixed(2)},${employeeCount},"${submittedDate}"\n`;
    });
    
    // Create a download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'shift-reports.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Function to export employee data to CSV
  const exportEmployeesToCSV = () => {
    if (!employeeStats.length) return;
    
    // CSV header
    let csvContent = "Employee,Total Hours,Location,Credit Card Commission,Credit Card Tips,Cash Commission,Cash Tips,Receipt Commission,Receipt Tips,Total Commission,Total Tips,Money Owed,Total Earnings,Est. Taxes (22%)\n";
    
    // Calculate commission and tips breakdown for each employee
    const employeeDetailsMap = new Map();
    
    // Process all filtered reports to get detailed breakdown
    const filteredReports = reports.filter(report => {
      const reportDate = new Date(report.date);
      
      // Apply start date filter if set
      if (startDate && reportDate < startDate) {
        return false;
      }
      
      // Apply end date filter if set
      if (endDate) {
        // Set to end of day for the end date to include the entire day
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (reportDate > endOfDay) {
          return false;
        }
      }
      
      return true;
    });
    
    // Calculate detailed breakdown for each employee
    filteredReports.forEach(report => {
      const commissionRate = report.locationId === 2 ? 9 : 4; // Bob's = $9, others = $4
      const cashCars = report.totalCars - report.creditTransactions - report.totalReceipts;
      
      // Commission calculations
      const creditCardCommission = report.creditTransactions * commissionRate;
      const cashCommission = cashCars * commissionRate;
      const receiptCommission = report.totalReceipts * commissionRate;
      
      // Tips calculations
      const creditCardTips = Math.abs(report.creditTransactions * 15 - report.totalCreditSales);
      const cashTips = Math.abs(cashCars * 15 - (report.totalCashCollected - report.companyCashTurnIn));
      const receiptTips = report.totalReceipts * 3; // $3 tip per receipt
      
      // Process each employee in the report
      const employees = typeof report.employees === 'string' 
        ? JSON.parse(report.employees) 
        : Array.isArray(report.employees) 
          ? report.employees 
          : [];
      
      if (employees.length > 0) {
        const totalJobHours = employees.reduce((sum, emp) => sum + emp.hours, 0);
        
        employees.forEach(employee => {
          const hoursPercent = totalJobHours > 0 ? employee.hours / totalJobHours : 0;
          
          // Calculate employee's share of each type of commission and tips
          const empCreditCardCommission = hoursPercent * creditCardCommission;
          const empCreditCardTips = hoursPercent * creditCardTips;
          const empCashCommission = hoursPercent * cashCommission;
          const empCashTips = hoursPercent * cashTips;
          const empReceiptCommission = hoursPercent * receiptCommission;
          const empReceiptTips = hoursPercent * receiptTips;
          
          // Get or create employee details
          const details = employeeDetailsMap.get(employee.name) || {
            creditCardCommission: 0,
            creditCardTips: 0,
            cashCommission: 0,
            cashTips: 0,
            receiptCommission: 0,
            receiptTips: 0
          };
          
          // Update employee details
          employeeDetailsMap.set(employee.name, {
            creditCardCommission: details.creditCardCommission + empCreditCardCommission,
            creditCardTips: details.creditCardTips + empCreditCardTips,
            cashCommission: details.cashCommission + empCashCommission,
            cashTips: details.cashTips + empCashTips,
            receiptCommission: details.receiptCommission + empReceiptCommission,
            receiptTips: details.receiptTips + empReceiptTips
          });
        });
      }
    });
    
    // Add each row of data
    employeeStats.forEach(employee => {
      const employeeName = EMPLOYEE_NAMES[employee.name] || employee.name;
      const locationName = LOCATIONS.find(loc => loc.id === employee.locationId)?.name || '-';
      const taxes = (employee.totalEarnings * 0.22).toFixed(2);
      
      // Get detailed breakdown for this employee
      const details = employeeDetailsMap.get(employee.name) || {
        creditCardCommission: 0,
        creditCardTips: 0,
        cashCommission: 0,
        cashTips: 0,
        receiptCommission: 0,
        receiptTips: 0
      };
      
      // Format the CSV row with detailed breakdown
      csvContent += `"${employeeName}",${employee.totalHours.toFixed(1)},"${locationName}",${details.creditCardCommission.toFixed(2)},${details.creditCardTips.toFixed(2)},${details.cashCommission.toFixed(2)},${details.cashTips.toFixed(2)},${details.receiptCommission.toFixed(2)},${details.receiptTips.toFixed(2)},${employee.totalCommission.toFixed(2)},${employee.totalTips.toFixed(2)},${employee.totalMoneyOwed.toFixed(2)},${employee.totalEarnings.toFixed(2)},${taxes}\n`;
    });
    
    // Create a download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'employee-payroll.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Function to export shift reports to PDF
  const exportReportsToPDF = () => {
    if (!reports.length) return;
    
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text("Access Valet Parking - Shift Reports", 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Prepare table data
    const tableColumn = ["ID", "Date", "Location", "Shift", "Leader", "Cars", "Turn-In", "Employees"];
    const tableRows = reports.map(report => {
      const date = new Date(report.date).toLocaleDateString();
      const locationName = getLocationName(report.locationId);
      const turnInRate = report.locationId === 2 ? 6 : 11;
      const expectedTurnIn = report.totalCars * turnInRate;
      const leaderName = EMPLOYEE_NAMES[report.manager] || report.manager;
      const employeeCount = typeof report.employees === 'string' 
        ? JSON.parse(report.employees).length 
        : Array.isArray(report.employees) 
          ? report.employees.length 
          : 0;
      
      return [
        report.id,
        date,
        locationName,
        report.shift,
        leaderName,
        report.totalCars,
        `$${expectedTurnIn.toFixed(2)}`,
        employeeCount
      ];
    });
    
    // Generate table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0, 101, 189] }
    });
    
    // Save PDF
    doc.save("shift-reports.pdf");
  };
  
  // Function to export employee data to PDF
  const exportEmployeesToPDF = () => {
    if (!employeeStats.length) return;
    
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text("Access Valet Parking - Employee Payroll", 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Calculate commission and tips breakdown for each employee
    const employeeDetailsMap = new Map();
    
    // Process all filtered reports to get detailed breakdown
    const filteredReports = reports.filter(report => {
      const reportDate = new Date(report.date);
      
      // Apply start date filter if set
      if (startDate && reportDate < startDate) {
        return false;
      }
      
      // Apply end date filter if set
      if (endDate) {
        // Set to end of day for the end date to include the entire day
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (reportDate > endOfDay) {
          return false;
        }
      }
      
      return true;
    });
    
    // Calculate detailed breakdown for each employee
    filteredReports.forEach(report => {
      const commissionRate = report.locationId === 2 ? 9 : 4; // Bob's = $9, others = $4
      const cashCars = report.totalCars - report.creditTransactions - report.totalReceipts;
      
      // Commission calculations
      const creditCardCommission = report.creditTransactions * commissionRate;
      const cashCommission = cashCars * commissionRate;
      const receiptCommission = report.totalReceipts * commissionRate;
      
      // Tips calculations
      const creditCardTips = Math.abs(report.creditTransactions * 15 - report.totalCreditSales);
      const cashTips = Math.abs(cashCars * 15 - (report.totalCashCollected - report.companyCashTurnIn));
      const receiptTips = report.totalReceipts * 3; // $3 tip per receipt
      
      // Process each employee in the report
      const employees = typeof report.employees === 'string' 
        ? JSON.parse(report.employees) 
        : Array.isArray(report.employees) 
          ? report.employees 
          : [];
      
      if (employees.length > 0) {
        const totalJobHours = employees.reduce((sum, emp) => sum + emp.hours, 0);
        
        employees.forEach(employee => {
          const hoursPercent = totalJobHours > 0 ? employee.hours / totalJobHours : 0;
          
          // Calculate employee's share of each type of commission and tips
          const empCreditCardCommission = hoursPercent * creditCardCommission;
          const empCreditCardTips = hoursPercent * creditCardTips;
          const empCashCommission = hoursPercent * cashCommission;
          const empCashTips = hoursPercent * cashTips;
          const empReceiptCommission = hoursPercent * receiptCommission;
          const empReceiptTips = hoursPercent * receiptTips;
          
          // Get or create employee details
          const details = employeeDetailsMap.get(employee.name) || {
            creditCardCommission: 0,
            creditCardTips: 0,
            cashCommission: 0,
            cashTips: 0,
            receiptCommission: 0,
            receiptTips: 0
          };
          
          // Update employee details
          employeeDetailsMap.set(employee.name, {
            creditCardCommission: details.creditCardCommission + empCreditCardCommission,
            creditCardTips: details.creditCardTips + empCreditCardTips,
            cashCommission: details.cashCommission + empCashCommission,
            cashTips: details.cashTips + empCashTips,
            receiptCommission: details.receiptCommission + empReceiptCommission,
            receiptTips: details.receiptTips + empReceiptTips
          });
        });
      }
    });
    
    // Prepare table data - detailed breakdown
    const detailedColumns = [
      "Employee", 
      "Hours", 
      "Location", 
      "CC Commission", 
      "CC Tips", 
      "Cash Commission", 
      "Cash Tips", 
      "Receipt Commission", 
      "Receipt Tips",
      "Total Commission", 
      "Total Tips", 
      "Money Owed", 
      "Total Earnings", 
      "Est. Taxes (22%)"
    ];
    
    const detailedRows = employeeStats.map(employee => {
      const employeeName = EMPLOYEE_NAMES[employee.name] || employee.name;
      const locationName = LOCATIONS.find(loc => loc.id === employee.locationId)?.name || '-';
      const taxes = (employee.totalEarnings * 0.22).toFixed(2);
      
      // Get detailed breakdown for this employee
      const details = employeeDetailsMap.get(employee.name) || {
        creditCardCommission: 0,
        creditCardTips: 0,
        cashCommission: 0,
        cashTips: 0,
        receiptCommission: 0,
        receiptTips: 0
      };
      
      return [
        employeeName,
        employee.totalHours.toFixed(1),
        locationName,
        `$${details.creditCardCommission.toFixed(2)}`,
        `$${details.creditCardTips.toFixed(2)}`,
        `$${details.cashCommission.toFixed(2)}`,
        `$${details.cashTips.toFixed(2)}`,
        `$${details.receiptCommission.toFixed(2)}`,
        `$${details.receiptTips.toFixed(2)}`,
        `$${employee.totalCommission.toFixed(2)}`,
        `$${employee.totalTips.toFixed(2)}`,
        `$${employee.totalMoneyOwed.toFixed(2)}`,
        `$${employee.totalEarnings.toFixed(2)}`,
        `$${taxes}`
      ];
    });
    
    // Create detailed table for PDF
    autoTable(doc, {
      head: [detailedColumns],
      body: detailedRows,
      startY: 40,
      styles: { fontSize: 6 }, // Smaller font size to fit more columns
      headStyles: { fillColor: [0, 101, 189] },
      columnStyles: {
        0: { cellWidth: 25 }, // Employee name column wider
        2: { cellWidth: 25 }, // Location column wider
      },
      margin: { left: 10, right: 10 } // Smaller margins to fit all columns
    });
    
    // Date filter information - add filter details to the PDF
    if (startDate || endDate) {
      const filterText = [];
      if (startDate) filterText.push(`Start Date: ${startDate.toLocaleDateString()}`);
      if (endDate) filterText.push(`End Date: ${endDate.toLocaleDateString()}`);
      
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Filter: ${filterText.join(', ')}`, 14, doc.autoTable.previous.finalY + 10);
    }
    
    // Save PDF
    doc.save("employee-payroll.pdf");
  };

  // Get location name by ID
  const getLocationName = (locationId: number) => {
    return LOCATIONS.find(loc => loc.id === locationId)?.name || "Unknown";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl text-indigo-700">Admin Panel</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate("/admin/csv-upload")}
            className="flex items-center gap-1 bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
          >
            <FileSpreadsheet className="h-4 w-4" />
            CSV Upload
          </Button>
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
        <TabsList className="mb-6 flex flex-wrap overflow-x-auto no-scrollbar pb-1">
          <TabsTrigger value="reports" className="flex-shrink-0 flex items-center">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex-shrink-0 flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            Stats
          </TabsTrigger>
          <TabsTrigger value="payroll" className="flex-shrink-0 flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Payroll
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex-shrink-0 flex items-center">
            <MapPin className="h-4 w-4 mr-2" />
            Locations
          </TabsTrigger>
          <TabsTrigger value="tickets" className="flex-shrink-0 flex items-center">
            <Ticket className="h-4 w-4 mr-2" />
            Tickets
          </TabsTrigger>
          <TabsTrigger value="manage-employees" className="flex-shrink-0 flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Employees
          </TabsTrigger>
        </TabsList>
        

        
        <TabsContent value="statistics">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Business Statistics & Analytics</CardTitle>
                <CardDescription>
                  Comprehensive visualizations of your business performance metrics
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stats-start-date">Start Date</Label>
                  <div className="relative">
                    <input
                      id="stats-start-date"
                      type="date"
                      className="px-3 py-2 rounded-md border border-input bg-background text-sm shadow-sm"
                      value={startDate ? startDate.toISOString().substring(0, 10) : ""}
                      onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : undefined)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stats-end-date">End Date</Label>
                  <div className="relative">
                    <input
                      id="stats-end-date"
                      type="date"
                      className="px-3 py-2 rounded-md border border-input bg-background text-sm shadow-sm"
                      value={endDate ? endDate.toISOString().substring(0, 10) : ""}
                      onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : undefined)}
                    />
                  </div>
                </div>
                
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => {
                    setStartDate(undefined);
                    setEndDate(undefined);
                    setSelectedLocation(null);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading statistics data...</div>
              ) : reports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No data found. Create shift reports to see statistics.
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Sales Trend Chart (Last 14 days) */}
                  <div>
                    <h3 className="text-lg font-medium mb-2">Sales & Car Volume Trends (Last 14 Days)</h3>
                    <p className="text-sm text-muted-foreground mb-4">Daily trends showing sales revenue and car volume</p>
                    <div className="w-full h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={salesTrendData}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 20,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis 
                            yAxisId="left" 
                            orientation="left" 
                            stroke="#4f46e5"
                            label={{ value: 'Sales ($)', angle: -90, position: 'insideLeft' }}
                            tickFormatter={(value) => `$${value}`}
                          />
                          <YAxis 
                            yAxisId="right" 
                            orientation="right" 
                            stroke="#10b981"
                            label={{ value: 'Cars', angle: -90, position: 'insideRight' }}
                          />
                          <Tooltip formatter={(value, name) => {
                            if (name === 'sales') return [`$${Number(value).toFixed(2)}`, 'Sales'];
                            return [value, 'Cars'];
                          }} />
                          <Legend />
                          <Bar 
                            yAxisId="right" 
                            dataKey="cars" 
                            fill="#10b981" 
                            name="Cars" 
                            barSize={20}
                          />
                          <Line 
                            yAxisId="left" 
                            type="monotone" 
                            dataKey="sales" 
                            stroke="#4f46e5" 
                            strokeWidth={2}
                            activeDot={{ r: 6 }}
                            name="Sales ($)"
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Dual Chart Row: Location Distribution and Day of Week Analysis */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Location Distribution Pie Chart */}
                    <div className="border rounded-lg p-4">
                      <h3 className="text-lg font-medium mb-2">Car Distribution by Location</h3>
                      <p className="text-sm text-muted-foreground mb-4">Breakdown of car volume by restaurant</p>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={carDistributionByLocation}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={90}
                              label={(entry) => `${entry.name}: ${entry.value} cars`}
                              labelLine={true}
                            >
                              {carDistributionByLocation.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} cars`, 'Volume']} />
                            <Legend />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    {/* Daily Car Volume Bar Chart */}
                    <div className="border rounded-lg p-4">
                      <h3 className="text-lg font-medium mb-2">Car Volume by Day of Week</h3>
                      <p className="text-sm text-muted-foreground mb-4">Average car volume by day of the week</p>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart
                            data={dailyCarVolume}
                            margin={{
                              top: 20,
                              right: 30,
                              left: 20,
                              bottom: 20,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis
                              label={{ value: 'Cars', angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip formatter={(value) => [`${value} cars`, 'Volume']} />
                            <Legend />
                            <Bar 
                              dataKey="cars" 
                              name="Car Volume" 
                              fill="#4f46e5" 
                              radius={[4, 4, 0, 0]}
                              barSize={30}
                            />
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                  
                  {/* Monthly Sales Area Chart */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2">Monthly Sales Performance</h3>
                    <p className="text-sm text-muted-foreground mb-4">Sales performance trends across the year</p>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={monthlyData}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 20,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis tickFormatter={(value) => `$${value}`} />
                          <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Sales']} />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey="sales" 
                            name="Total Sales ($)" 
                            stroke="#4f46e5" 
                            fill="#4f46e580"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Report Summary Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 border p-4 rounded-lg">
                      <h3 className="text-blue-700 dark:text-blue-400 font-medium text-sm mb-1">Total Reports</h3>
                      <p className="text-2xl font-bold">{reports.length}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900 border p-4 rounded-lg">
                      <h3 className="text-green-700 dark:text-green-400 font-medium text-sm mb-1">Total Cars</h3>
                      <p className="text-2xl font-bold">
                        {reports.reduce((sum, report) => sum + report.totalCars, 0)}
                      </p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900 border p-4 rounded-lg">
                      <h3 className="text-purple-700 dark:text-purple-400 font-medium text-sm mb-1">Total Sales</h3>
                      <p className="text-2xl font-bold">
                        ${monthlyData.reduce((sum, month) => sum + month.sales, 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 border p-4 rounded-lg">
                      <h3 className="text-amber-700 dark:text-amber-400 font-medium text-sm mb-1">Busiest Day</h3>
                      <p className="text-2xl font-bold">
                        {dailyCarVolume.reduce((max, day) => max.cars > day.cars ? max : day, { name: '', cars: 0 }).name}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Shift Reports</CardTitle>
                <CardDescription>
                  View all shift reports across all locations
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={exportReportsToCSV}
                  className="flex items-center gap-1"
                >
                  <FileDown className="h-4 w-4" />
                  Export CSV
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={exportReportsToPDF}
                  className="flex items-center gap-1"
                >
                  <Download className="h-4 w-4" />
                  Export PDF
                </Button>
              </div>
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
                            <TableCell>{report.id}</TableCell>
                            <TableCell>{date.toLocaleDateString()}</TableCell>
                            <TableCell>{getLocationName(report.locationId)}</TableCell>
                            <TableCell>{report.shift}</TableCell>
                            <TableCell>{EMPLOYEE_NAMES[report.manager] || report.manager}</TableCell>
                            <TableCell className="text-right">{report.totalCars}</TableCell>
                            <TableCell className="text-right">${expectedTurnIn.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              {typeof report.employees === 'string' 
                                ? JSON.parse(report.employees).length 
                                : Array.isArray(report.employees) 
                                  ? report.employees.length 
                                  : 0}
                            </TableCell>
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

        <TabsContent value="payroll">
          <Card>
            <CardHeader className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Employee Payroll Summary</CardTitle>
                  <CardDescription>
                    View financial summary for all employees
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={exportEmployeesToCSV}
                    className="flex items-center gap-1"
                  >
                    <FileDown className="h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={exportEmployeesToPDF}
                    className="flex items-center gap-1"
                  >
                    <Download className="h-4 w-4" />
                    Export PDF
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-wrap items-end gap-4 border p-4 rounded-md bg-gray-50 dark:bg-gray-900">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <div className="relative">
                    <input
                      id="start-date"
                      type="date"
                      className="px-3 py-2 rounded-md border border-input bg-background text-sm shadow-sm"
                      value={startDate ? startDate.toISOString().substring(0, 10) : ""}
                      onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : undefined)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <div className="relative">
                    <input
                      id="end-date"
                      type="date"
                      className="px-3 py-2 rounded-md border border-input bg-background text-sm shadow-sm"
                      value={endDate ? endDate.toISOString().substring(0, 10) : ""}
                      onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : undefined)}
                    />
                  </div>
                </div>
                
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => {
                    setStartDate(undefined);
                    setEndDate(undefined);
                  }}
                >
                  Clear Filter
                </Button>
              </div>
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
                        <TableHead className="text-right">Location</TableHead>
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
                          <TableCell className="text-right">
                            {LOCATIONS.find(loc => loc.id === employee.locationId)?.name || '-'}
                          </TableCell>
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
        
        <TabsContent value="locations">
          <Card>
            <CardHeader className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Location Performance</CardTitle>
                  <CardDescription>
                    View performance metrics for all locations
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      // CSV Export for location stats
                      if (!locationStats.length) return;
                      
                      let csvContent = "Location,Total Cars,Cash Sales ($),Credit Sales ($),Receipt Sales ($),Total Income ($),Reports\n";
                      
                      locationStats.forEach(location => {
                        csvContent += `"${location.name}",${location.totalCars},${location.cashSales.toFixed(2)},${location.creditSales.toFixed(2)},${location.receiptSales.toFixed(2)},${location.totalIncome.toFixed(2)},${location.reports}\n`;
                      });
                      
                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.setAttribute('href', url);
                      link.setAttribute('download', 'location-performance.csv');
                      link.style.visibility = 'hidden';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="flex items-center gap-1"
                  >
                    <FileDown className="h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      // PDF Export for location stats
                      if (!locationStats.length) return;
                      
                      const doc = new jsPDF();
                      
                      // Add title
                      doc.setFontSize(18);
                      doc.text("Access Valet Parking - Location Performance", 14, 22);
                      doc.setFontSize(11);
                      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);
                      
                      // Prepare table data
                      const tableColumn = ["Location", "Total Cars", "Cash Sales ($)", "Credit Sales ($)", "Receipt Sales ($)", "Total Income ($)", "Reports"];
                      const tableRows = locationStats.map(location => [
                        location.name,
                        location.totalCars,
                        `$${location.cashSales.toFixed(2)}`,
                        `$${location.creditSales.toFixed(2)}`,
                        `$${location.receiptSales.toFixed(2)}`,
                        `$${location.totalIncome.toFixed(2)}`,
                        location.reports
                      ]);
                      
                      // Generate table
                      autoTable(doc, {
                        head: [tableColumn],
                        body: tableRows,
                        startY: 40,
                        styles: { fontSize: 9 },
                        headStyles: { fillColor: [0, 101, 189] }
                      });
                      
                      // Date filter information
                      if (startDate || endDate) {
                        const filterText = [];
                        if (startDate) filterText.push(`Start Date: ${startDate.toLocaleDateString()}`);
                        if (endDate) filterText.push(`End Date: ${endDate.toLocaleDateString()}`);
                        
                        doc.setFontSize(9);
                        doc.setTextColor(100, 100, 100);
                        doc.text(`Filter: ${filterText.join(', ')}`, 14, doc.autoTable.previous.finalY + 10);
                      }
                      
                      // Save PDF
                      doc.save("location-performance.pdf");
                    }}
                    className="flex items-center gap-1"
                  >
                    <Download className="h-4 w-4" />
                    Export PDF
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-wrap items-end gap-4 border p-4 rounded-md bg-gray-50 dark:bg-gray-900">
                <div className="space-y-2">
                  <Label htmlFor="loc-start-date">Start Date</Label>
                  <div className="relative">
                    <input
                      id="loc-start-date"
                      type="date"
                      className="px-3 py-2 rounded-md border border-input bg-background text-sm shadow-sm"
                      value={startDate ? startDate.toISOString().substring(0, 10) : ""}
                      onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : undefined)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="loc-end-date">End Date</Label>
                  <div className="relative">
                    <input
                      id="loc-end-date"
                      type="date"
                      className="px-3 py-2 rounded-md border border-input bg-background text-sm shadow-sm"
                      value={endDate ? endDate.toISOString().substring(0, 10) : ""}
                      onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : undefined)}
                    />
                  </div>
                </div>
                
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => {
                    setStartDate(undefined);
                    setEndDate(undefined);
                  }}
                >
                  Clear Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading location data...</div>
              ) : locationStats.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No location data found. Create shift reports to see location performance.
                </div>
              ) : (
                <>
                  {/* Performance Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {locationStats.map(location => {
                      // Define color schemes for each location
                      let colorScheme = {
                        border: "border-blue-400",
                        header: "text-blue-700",
                        background: "bg-blue-50 dark:bg-blue-950/30"
                      };
                      
                      // Different color for each location based on ID
                      switch(location.id) {
                        case 1: // Capital Grille
                          colorScheme = {
                            border: "border-blue-500",
                            header: "text-blue-700",
                            background: "bg-blue-50 dark:bg-blue-950/30"
                          };
                          break;
                        case 2: // Bob's Steak
                          colorScheme = {
                            border: "border-green-500",
                            header: "text-green-700",
                            background: "bg-green-50 dark:bg-green-950/30"
                          };
                          break;
                        case 3: // Truluck's
                          colorScheme = {
                            border: "border-red-500",
                            header: "text-red-700",
                            background: "bg-red-50 dark:bg-red-950/30"
                          };
                          break;
                        case 4: // BOA Steakhouse
                          colorScheme = {
                            border: "border-sky-500",
                            header: "text-sky-700",
                            background: "bg-sky-50 dark:bg-sky-950/30"
                          };
                          break;
                      }
                      
                      return (
                        <div 
                          key={location.id} 
                          className={`p-4 rounded-lg shadow border-2 ${colorScheme.border} ${colorScheme.background}`}
                        >
                          <h3 className={`text-lg mb-2 ${colorScheme.header}`}>{location.name}</h3>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-sm text-gray-500">Total Cars</p>
                              <p className="text-xl">{location.totalCars}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Total Income</p>
                              <p className="text-xl">${location.totalIncome.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Reports</p>
                              <p className="text-xl">{location.reports}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Avg $ Per Car</p>
                              <p className="text-xl">
                                ${location.totalCars > 0 
                                  ? (location.totalIncome / location.totalCars).toFixed(2) 
                                  : '0.00'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Detailed Performance Table */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableCaption>Detailed location performance breakdown</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Location</TableHead>
                          <TableHead className="text-right">Total Cars</TableHead>
                          <TableHead className="text-right">Cash Sales</TableHead>
                          <TableHead className="text-right">Credit Sales</TableHead>
                          <TableHead className="text-right">Receipt Sales</TableHead>
                          <TableHead className="text-right">Total Income</TableHead>
                          <TableHead className="text-right">Reports</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {locationStats.map(location => {
                          // Define color for text based on location ID
                          let textColor = "text-blue-700";
                          
                          // Different color for each location based on ID
                          switch(location.id) {
                            case 1: // Capital Grille
                              textColor = "text-blue-700";
                              break;
                            case 2: // Bob's Steak
                              textColor = "text-green-700";
                              break;
                            case 3: // Truluck's
                              textColor = "text-red-700";
                              break;
                            case 4: // BOA Steakhouse
                              textColor = "text-sky-700";
                              break;
                          }
                          
                          return (
                            <TableRow key={location.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                              <TableCell className={`font-medium ${textColor}`}>{location.name}</TableCell>
                              <TableCell className="text-right">{location.totalCars}</TableCell>
                              <TableCell className="text-right">${location.cashSales.toFixed(2)}</TableCell>
                              <TableCell className="text-right">${location.creditSales.toFixed(2)}</TableCell>
                              <TableCell className="text-right">${location.receiptSales.toFixed(2)}</TableCell>
                              <TableCell className={`text-right font-semibold ${textColor}`}>${location.totalIncome.toFixed(2)}</TableCell>
                              <TableCell className="text-right">{location.reports}</TableCell>
                            </TableRow>
                          );
                        })}
                        {/* Total Row */}
                        <TableRow className="bg-gray-50 dark:bg-gray-800 font-semibold">
                          <TableCell>TOTAL</TableCell>
                          <TableCell className="text-right">
                            {locationStats.reduce((sum, loc) => sum + loc.totalCars, 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            ${locationStats.reduce((sum, loc) => sum + loc.cashSales, 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            ${locationStats.reduce((sum, loc) => sum + loc.creditSales, 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            ${locationStats.reduce((sum, loc) => sum + loc.receiptSales, 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            ${locationStats.reduce((sum, loc) => sum + loc.totalIncome, 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {locationStats.reduce((sum, loc) => sum + loc.reports, 0)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Monthly Sales Analysis Section */}
                  <div className="mt-10">
                    <h3 className="text-xl font-medium mb-4">Monthly Sales Analysis</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      View sales performance broken down by month (January - December)
                    </p>
                    
                    <div className="flex flex-wrap items-end gap-4 border p-4 rounded-md bg-gray-50 dark:bg-gray-900 mb-6">
                      <div className="space-y-2">
                        <Label htmlFor="location-filter">Filter by Location</Label>
                        <Select
                          value={selectedLocation?.toString() || "0"}
                          onValueChange={(value) => setSelectedLocation(value === "0" ? null : parseInt(value))}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="All Locations" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">All Locations</SelectItem>
                            {LOCATIONS.map((location) => (
                              <SelectItem key={location.id} value={location.id.toString()}>
                                {location.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="chart-start-date">Start Date</Label>
                        <div className="relative">
                          <input
                            id="chart-start-date"
                            type="date"
                            className="px-3 py-2 rounded-md border border-input bg-background text-sm shadow-sm"
                            value={startDate ? startDate.toISOString().substring(0, 10) : ""}
                            onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : undefined)}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="chart-end-date">End Date</Label>
                        <div className="relative">
                          <input
                            id="chart-end-date"
                            type="date"
                            className="px-3 py-2 rounded-md border border-input bg-background text-sm shadow-sm"
                            value={endDate ? endDate.toISOString().substring(0, 10) : ""}
                            onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : undefined)}
                          />
                        </div>
                      </div>
                      
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => {
                          setStartDate(undefined);
                          setEndDate(undefined);
                          setSelectedLocation(null);
                        }}
                      >
                        Clear Filters
                      </Button>
                    </div>
                    
                    <div className="w-full h-[400px] mb-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart
                          data={monthlyData}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 30,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis
                            label={{ value: 'Sales ($)', angle: -90, position: 'insideLeft' }}
                            tickFormatter={(value) => `$${value}`}
                          />
                          <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Sales']} />
                          <Legend />
                          <Bar 
                            dataKey="sales" 
                            name="Total Sales ($)" 
                            fill="#4f46e5" 
                            radius={[4, 4, 0, 0]}
                            barSize={30}
                          />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <Table>
                        <TableCaption>Monthly Sales Breakdown</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Month</TableHead>
                            <TableHead className="text-right">Total Sales ($)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {monthlyData.map((month) => (
                            <TableRow key={month.name}>
                              <TableCell className="font-medium">{month.name}</TableCell>
                              <TableCell className="text-right font-medium">${month.sales.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/50">
                            <TableCell className="font-bold">Total</TableCell>
                            <TableCell className="text-right font-bold">
                              ${monthlyData.reduce((sum, month) => sum + month.sales, 0).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tickets">
          <Card>
            <CardHeader className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Ticket Distribution Tracking</CardTitle>
                  <CardDescription>
                    Manage and track ticket allocations across locations
                  </CardDescription>
                </div>
                <Dialog open={isAddDistributionOpen} onOpenChange={setIsAddDistributionOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Allocate Tickets
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Allocate New Tickets</DialogTitle>
                      <DialogDescription>
                        Distribute tickets to a specific location and track their usage.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="location">Location</Label>
                        <select 
                          id="location"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={newDistribution.locationId}
                          onChange={(e) => setNewDistribution({
                            ...newDistribution,
                            locationId: parseInt(e.target.value)
                          })}
                        >
                          {LOCATIONS.map(location => (
                            <option key={location.id} value={location.id}>
                              {location.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="allocatedTickets">Number of Tickets</Label>
                        <input 
                          id="allocatedTickets"
                          type="number"
                          min="1"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={newDistribution.allocatedTickets || ''}
                          onChange={(e) => setNewDistribution({
                            ...newDistribution,
                            allocatedTickets: parseInt(e.target.value) || 0
                          })}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="batchNumber">Batch Number/ID</Label>
                        <input 
                          id="batchNumber"
                          type="text"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={newDistribution.batchNumber}
                          onChange={(e) => setNewDistribution({
                            ...newDistribution,
                            batchNumber: e.target.value
                          })}
                          placeholder="e.g., CG-2025-05-001"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <textarea 
                          id="notes"
                          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
                          value={newDistribution.notes}
                          onChange={(e) => setNewDistribution({
                            ...newDistribution,
                            notes: e.target.value
                          })}
                          placeholder="Any additional information about this batch"
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="secondary"
                        onClick={() => setIsAddDistributionOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="button"
                        onClick={async () => {
                          if (!newDistribution.batchNumber || newDistribution.allocatedTickets <= 0) {
                            alert("Please fill in all required fields");
                            return;
                          }
                          
                          try {
                            const response = await fetch('/api/ticket-distributions', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify(newDistribution),
                            });
                            
                            if (response.ok) {
                              // Reset form and close dialog
                              setNewDistribution({
                                locationId: 1,
                                allocatedTickets: 0,
                                batchNumber: '',
                                notes: ''
                              });
                              setIsAddDistributionOpen(false);
                              
                              // Refresh the data
                              const newData = await response.json();
                              setTicketDistributions([...ticketDistributions, newData]);
                            } else {
                              alert("Error creating ticket distribution");
                            }
                          } catch (error) {
                            console.error("Error:", error);
                            alert("Failed to create ticket distribution");
                          }
                        }}
                      >
                        Save
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            
            <CardContent>
              {isLoadingDistributions ? (
                <div className="text-center py-8">Loading ticket data...</div>
              ) : ticketDistributions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No ticket distributions found. Allocate tickets using the button above.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableCaption>Ticket distribution and usage tracking across all locations.</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Batch Number</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-right">Allocated</TableHead>
                        <TableHead className="text-right">Used</TableHead>
                        <TableHead className="text-right">Remaining</TableHead>
                        <TableHead className="text-right">Usage %</TableHead>
                        <TableHead className="text-right">Date Created</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ticketDistributions.map((distribution) => {
                        const location = LOCATIONS.find(loc => loc.id === distribution.locationId);
                        const remaining = distribution.allocatedTickets - distribution.usedTickets;
                        const usagePercent = distribution.allocatedTickets > 0 
                          ? (distribution.usedTickets / distribution.allocatedTickets * 100).toFixed(1) 
                          : '0.0';
                        
                        // Calculate color based on usage percentage
                        let usageColor = "text-green-600";
                        if (parseFloat(usagePercent) >= 90) {
                          usageColor = "text-red-600 font-semibold";
                        } else if (parseFloat(usagePercent) >= 75) {
                          usageColor = "text-orange-500";
                        } else if (parseFloat(usagePercent) >= 50) {
                          usageColor = "text-yellow-600";
                        }
                        
                        return (
                          <TableRow key={distribution.id}>
                            <TableCell className="font-medium">{distribution.batchNumber}</TableCell>
                            <TableCell>{location?.name || 'Unknown'}</TableCell>
                            <TableCell className="text-right">{distribution.allocatedTickets}</TableCell>
                            <TableCell className="text-right">{distribution.usedTickets}</TableCell>
                            <TableCell className="text-right font-medium">{remaining}</TableCell>
                            <TableCell className={`text-right ${usageColor}`}>
                              {usagePercent}%
                            </TableCell>
                            <TableCell className="text-right">
                              {new Date(distribution.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {distribution.notes || '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="px-2 h-8"
                                  onClick={async () => {
                                    // Prompt for the number of used tickets to update
                                    const usedTicketsStr = prompt(
                                      `Update used tickets for ${location?.name} (Batch: ${distribution.batchNumber}).\nCurrent used: ${distribution.usedTickets}\nEnter new total:`, 
                                      distribution.usedTickets.toString()
                                    );
                                    
                                    if (usedTicketsStr === null) return; // Cancel pressed
                                    
                                    const usedTickets = parseInt(usedTicketsStr);
                                    if (isNaN(usedTickets) || usedTickets < 0) {
                                      alert("Please enter a valid number of tickets.");
                                      return;
                                    }
                                    
                                    if (usedTickets > distribution.allocatedTickets) {
                                      alert(`Used tickets cannot exceed the allocated amount (${distribution.allocatedTickets}).`);
                                      return;
                                    }
                                    
                                    try {
                                      // Only send the necessary fields for the update
                                      const updateData = {
                                        locationId: distribution.locationId,
                                        allocatedTickets: distribution.allocatedTickets,
                                        usedTickets: usedTickets,
                                        batchNumber: distribution.batchNumber,
                                        notes: distribution.notes
                                      };
                                      
                                      const response = await fetch(`/api/ticket-distributions/${distribution.id}`, {
                                        method: 'PUT',
                                        headers: {
                                          'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify(updateData),
                                      });
                                      
                                      if (response.ok) {
                                        // Update local state
                                        const updatedDistribution = await response.json();
                                        console.log("Updated distribution:", updatedDistribution);
                                        
                                        // Update the state with the new data
                                        setTicketDistributions(
                                          ticketDistributions.map(d => 
                                            d.id === updatedDistribution.id ? updatedDistribution : d
                                          )
                                        );
                                        
                                        // Show success message
                                        alert(`Successfully updated used tickets to ${usedTickets}`);
                                      } else {
                                        const errorData = await response.json();
                                        console.error("Error updating tickets:", errorData);
                                        alert("Error updating used tickets: " + (errorData.message || "Unknown error"));
                                      }
                                    } catch (error) {
                                      console.error("Error:", error);
                                      alert("Failed to update used tickets");
                                    }
                                  }}
                                >
                                  <ArrowUpDown className="h-4 w-4" />
                                  <span className="sr-only">Update</span>
                                </Button>
                                
                                {/* Delete button */}
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="px-2 h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={async () => {
                                    if (confirm(`Are you sure you want to delete this ticket batch "${distribution.batchNumber}" for ${location?.name}?`)) {
                                      try {
                                        const response = await fetch(`/api/ticket-distributions/${distribution.id}`, {
                                          method: 'DELETE',
                                        });
                                        
                                        if (response.ok) {
                                          // Remove from local state
                                          setTicketDistributions(
                                            ticketDistributions.filter(d => d.id !== distribution.id)
                                          );
                                          
                                          // Show success message
                                          toast({
                                            title: "Success!",
                                            description: `Ticket batch "${distribution.batchNumber}" has been deleted.`,
                                          });
                                        } else {
                                          alert("Error deleting ticket batch");
                                        }
                                      } catch (error) {
                                        console.error("Error:", error);
                                        alert("Failed to delete ticket batch");
                                      }
                                    }
                                  }}
                                >
                                  <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    width="16" 
                                    height="16" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                  >
                                    <path d="M3 6h18"></path>
                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                  </svg>
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </div>
                            </TableCell>
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
        
        {/* Employee Management Tab */}
        <TabsContent value="manage-employees">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Employee Management</CardTitle>
                <CardDescription>
                  Add, edit and manage employees for shift leader selection and payroll calculations
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline"
                  onClick={() => {
                    // Start adding all employees from EMPLOYEE_NAMES
                    const confirmImport = confirm(
                      "This will add all missing employees from the system that are listed in the EMPLOYEE_NAMES constant. Continue?"
                    );
                    
                    if (confirmImport) {
                      // Get existing employees
                      fetch('/api/employees')
                        .then(res => res.json())
                        .then(existingEmployees => {
                          const existingKeys = existingEmployees.map(emp => emp.key);
                          
                          // Get today's date in YYYY-MM-DD format
                          const today = new Date().toISOString().split('T')[0];
                          
                          // Create array of employees from EMPLOYEE_NAMES that don't exist yet
                          const employeesToAdd = Object.entries(EMPLOYEE_NAMES)
                            .filter(([key]) => !existingKeys.includes(key))
                            .map(([key, fullName]) => ({
                              key,
                              fullName,
                              isActive: true,
                              isShiftLeader: false,
                              hireDate: today
                            }));
                            
                          if (employeesToAdd.length === 0) {
                            alert("All employees already exist in the database.");
                            return;
                          }
                          
                          setIsAddingEmployees(true);
                          
                          // Add each employee one by one
                          const addPromises = employeesToAdd.map(employee => 
                            fetch('/api/employees', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify(employee),
                            })
                          );
                          
                          Promise.allSettled(addPromises)
                            .then(results => {
                              const successful = results.filter(r => r.status === 'fulfilled').length;
                              const failed = results.filter(r => r.status === 'rejected').length;
                              
                              // Refresh employee list
                              refetchEmployees();
                              
                              // Show results message
                              alert(`Import complete: Added ${successful} employees. ${failed > 0 ? `Failed to add ${failed} employees.` : ''}`);
                              setIsAddingEmployees(false);
                            })
                            .catch(error => {
                              console.error("Error importing employees:", error);
                              alert(`Error importing employees: ${error.message}`);
                              setIsAddingEmployees(false);
                            });
                        })
                        .catch(error => {
                          console.error("Error fetching existing employees:", error);
                          alert(`Error fetching existing employees: ${error.message}`);
                          setIsAddingEmployees(false);
                        });
                    }
                  }}
                  disabled={isAddingEmployees}
                  className="flex items-center gap-1"
                >
                  {isAddingEmployees ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Importing...
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4" />
                      Import All Employees
                    </>
                  )}
                </Button>
                <Button 
                  onClick={() => {
                    // Reset new employee form
                    setNewEmployee({
                      key: '',
                      fullName: '',
                      isActive: true,
                      isShiftLeader: false,
                      phone: '',
                      email: '',
                      hireDate: new Date().toISOString().split('T')[0],
                      notes: ''
                    });
                    // Open dialog
                    setIsAddEmployeeOpen(true);
                  }}
                  className="flex items-center gap-1"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Employee
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingEmployees ? (
                <div className="text-center py-8">Loading employees...</div>
              ) : employees.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No employees found. Add an employee to get started.
                </div>
              ) : (
                <Table>
                  <TableCaption>List of all employees</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Key</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Shift Leader</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Hire Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map(employee => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">{employee.fullName}</TableCell>
                        <TableCell>{employee.key}</TableCell>
                        <TableCell>
                          {employee.isActive ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                              Inactive
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {employee.isShiftLeader ? (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                              Yes
                            </span>
                          ) : (
                            <span>No</span>
                          )}
                        </TableCell>
                        <TableCell>{employee.phone || '-'}</TableCell>
                        <TableCell>{employee.email || '-'}</TableCell>
                        <TableCell>{new Date(employee.hireDate).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="px-2 h-7 text-xs"
                              onClick={() => {
                                // Set current employee data to form
                                setNewEmployee({
                                  key: employee.key,
                                  fullName: employee.fullName,
                                  isActive: employee.isActive,
                                  isShiftLeader: employee.isShiftLeader,
                                  phone: employee.phone || '',
                                  email: employee.email || '',
                                  hireDate: employee.hireDate.split('T')[0],
                                  notes: employee.notes || ''
                                });
                                // Set editing ID
                                setEditingEmployeeId(employee.id);
                                // Open edit dialog
                                setIsEditEmployeeOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="px-2 h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={async () => {
                                if (confirm(`Are you sure you want to delete ${employee.fullName}?`)) {
                                  try {
                                    const response = await fetch(`/api/employees/${employee.id}`, {
                                      method: 'DELETE',
                                    });
                                    
                                    if (response.ok) {
                                      // Remove from local state
                                      setEmployees(
                                        employees.filter(e => e.id !== employee.id)
                                      );
                                      
                                      // Show success message
                                      alert(`Employee "${employee.fullName}" has been deleted.`);
                                    } else {
                                      alert("Error deleting employee");
                                    }
                                  } catch (error) {
                                    console.error("Error:", error);
                                    alert("Failed to delete employee");
                                  }
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {/* Total employees row */}
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={2} className="font-medium">
                        Total Employees: {employees.length}
                      </TableCell>
                      <TableCell colSpan={1}>
                        Active: {employees.filter(e => e.isActive).length}
                      </TableCell>
                      <TableCell colSpan={1}>
                        Shift Leaders: {employees.filter(e => e.isShiftLeader).length}
                      </TableCell>
                      <TableCell colSpan={4}></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
              
              {/* Add Employee Dialog */}
              <Dialog open={isAddEmployeeOpen} onOpenChange={setIsAddEmployeeOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Employee</DialogTitle>
                    <DialogDescription>
                      Add a new employee to the system. They will appear in shift leader selection and payroll calculations.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="key">Employee Key (lowercase)</Label>
                        <input 
                          id="key"
                          type="text"
                          placeholder="e.g., john"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={newEmployee.key}
                          onChange={(e) => setNewEmployee({...newEmployee, key: e.target.value.toLowerCase()})}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <input 
                          id="fullName"
                          type="text"
                          placeholder="e.g., John Smith"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={newEmployee.fullName}
                          onChange={(e) => setNewEmployee({...newEmployee, fullName: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Status</Label>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox"
                            id="isActive"
                            checked={newEmployee.isActive}
                            onChange={(e) => setNewEmployee({...newEmployee, isActive: e.target.checked})}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <Label htmlFor="isActive" className="text-sm font-normal">Active</Label>
                        </div>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label>Role</Label>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox"
                            id="isShiftLeader"
                            checked={newEmployee.isShiftLeader}
                            onChange={(e) => setNewEmployee({...newEmployee, isShiftLeader: e.target.checked})}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <Label htmlFor="isShiftLeader" className="text-sm font-normal">Shift Leader</Label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="phone">Phone (optional)</Label>
                        <input 
                          id="phone"
                          type="text"
                          placeholder="e.g., 555-123-4567"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={newEmployee.phone}
                          onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email (optional)</Label>
                        <input 
                          id="email"
                          type="email"
                          placeholder="e.g., john@example.com"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={newEmployee.email}
                          onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="hireDate">Hire Date</Label>
                      <input 
                        id="hireDate"
                        type="date"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={newEmployee.hireDate}
                        onChange={(e) => setNewEmployee({...newEmployee, hireDate: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="notes">Notes (optional)</Label>
                      <textarea 
                        id="notes"
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Any additional information about this employee"
                        value={newEmployee.notes}
                        onChange={(e) => setNewEmployee({...newEmployee, notes: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      onClick={async () => {
                        try {
                          // Validate required fields
                          if (!newEmployee.key || !newEmployee.fullName) {
                            alert("Employee key and full name are required.");
                            return;
                          }
                          
                          console.log("Submitting employee data:", newEmployee);
                          
                          const response = await fetch('/api/employees', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(newEmployee),
                          });
                          
                          console.log("Response status:", response.status);
                          
                          if (response.ok) {
                            const data = await response.json();
                            console.log("Response data:", data);
                            
                            // Refresh employee data from server
                            refetchEmployees();
                            
                            // Close dialog
                            setIsAddEmployeeOpen(false);
                            
                            // Reset form
                            setNewEmployee({
                              key: '',
                              fullName: '',
                              isActive: true,
                              isShiftLeader: false,
                              phone: '',
                              email: '',
                              hireDate: new Date().toISOString().split('T')[0],
                              notes: ''
                            });
                            
                            // Show success message
                            alert(`Employee "${data.fullName}" has been added successfully.`);
                          } else {
                            const errorText = await response.text();
                            console.log("Error response:", errorText);
                            
                            try {
                              const errorJson = JSON.parse(errorText);
                              alert(`Error adding employee: ${errorJson.message || "Unknown error"}`);
                            } catch {
                              alert(`Error adding employee. Please try again.`);
                            }
                          }
                        } catch (error) {
                          console.error("Error:", error);
                          alert("Failed to add employee. Please check the console for details.");
                        }
                      }}
                    >
                      Add Employee
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              {/* Edit Employee Dialog */}
              <Dialog open={isEditEmployeeOpen} onOpenChange={setIsEditEmployeeOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Employee</DialogTitle>
                    <DialogDescription>
                      Update employee information.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-key">Employee Key (lowercase)</Label>
                        <input 
                          id="edit-key"
                          type="text"
                          placeholder="e.g., john"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={newEmployee.key}
                          onChange={(e) => setNewEmployee({...newEmployee, key: e.target.value.toLowerCase()})}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="edit-fullName">Full Name</Label>
                        <input 
                          id="edit-fullName"
                          type="text"
                          placeholder="e.g., John Smith"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={newEmployee.fullName}
                          onChange={(e) => setNewEmployee({...newEmployee, fullName: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Status</Label>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox"
                            id="edit-isActive"
                            checked={newEmployee.isActive}
                            onChange={(e) => setNewEmployee({...newEmployee, isActive: e.target.checked})}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <Label htmlFor="edit-isActive" className="text-sm font-normal">Active</Label>
                        </div>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label>Role</Label>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox"
                            id="edit-isShiftLeader"
                            checked={newEmployee.isShiftLeader}
                            onChange={(e) => setNewEmployee({...newEmployee, isShiftLeader: e.target.checked})}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <Label htmlFor="edit-isShiftLeader" className="text-sm font-normal">Shift Leader</Label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-phone">Phone (optional)</Label>
                        <input 
                          id="edit-phone"
                          type="text"
                          placeholder="e.g., 555-123-4567"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={newEmployee.phone}
                          onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="edit-email">Email (optional)</Label>
                        <input 
                          id="edit-email"
                          type="email"
                          placeholder="e.g., john@example.com"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={newEmployee.email}
                          onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="edit-hireDate">Hire Date</Label>
                      <input 
                        id="edit-hireDate"
                        type="date"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={newEmployee.hireDate}
                        onChange={(e) => setNewEmployee({...newEmployee, hireDate: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="edit-notes">Notes (optional)</Label>
                      <textarea 
                        id="edit-notes"
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Any additional information about this employee"
                        value={newEmployee.notes}
                        onChange={(e) => setNewEmployee({...newEmployee, notes: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      onClick={async () => {
                        try {
                          // Validate required fields
                          if (!newEmployee.key || !newEmployee.fullName) {
                            alert("Employee key and full name are required.");
                            return;
                          }
                          
                          const response = await fetch(`/api/employees/${editingEmployeeId}`, {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(newEmployee),
                          });
                          
                          if (response.ok) {
                            const data = await response.json();
                            
                            // Update local state
                            setEmployees(employees.map(emp => emp.id === data.id ? data : emp));
                            
                            // Close dialog
                            setIsEditEmployeeOpen(false);
                            
                            // Reset editing ID
                            setEditingEmployeeId(null);
                            
                            // Show success message
                            alert(`Employee "${data.fullName}" has been updated successfully.`);
                          } else {
                            const error = await response.json();
                            alert(`Error updating employee: ${error.message}`);
                          }
                        } catch (error) {
                          console.error("Error:", error);
                          alert("Failed to update employee");
                        }
                      }}
                    >
                      Update Employee
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}