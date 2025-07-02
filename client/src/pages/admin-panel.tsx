import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { employeeWorkedInShift, findEmployeeInShift, parseLocalDate, parseEmployeesData } from "@/lib/employee-utils";
import { formatDateForDisplay, parseReportDate } from "@/lib/timezone";
import checkCompleteIcon from "@assets/Check-Circle-1--Streamline-Ultimate.png";
import deleteIncompleteIcon from "@assets/Delete-1--Streamline-Ultimate.png";
import deleteIcon from "@assets/Bin-1--Streamline-Ultimate.png";
import newBinIcon from "@assets/Bin-1--Streamline-Ultimate_1749748616601.png";
import addCircleIcon from "@assets/Add-Circle--Streamline-Ultimate.png";
import binIcon from "@assets/Bin-1--Streamline-Ultimate.png";
import contentPenIcon from "@assets/Content-Pen-3--Streamline-Ultimate.png";
import carRepairFireIcon from "@assets/Car-Repair-Fire-1--Streamline-Ultimate.png";
import viewSquareIcon from "@assets/View-Square--Streamline-Ultimate.png";

// Component for compact customer info
function CompactCustomerInfo({ name, email, phone }: { 
  name: string; 
  email: string; 
  phone: string; 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="text-sm">
      <div className="font-medium">{name}</div>
      {isExpanded ? (
        <div className="space-y-1">
          <div className="text-gray-500 break-all">{email}</div>
          <div className="text-gray-500">{phone}</div>
          <button 
            onClick={() => setIsExpanded(false)}
            className="text-blue-600 text-xs hover:underline"
          >
            View Less
          </button>
        </div>
      ) : (
        <button 
          onClick={() => setIsExpanded(true)}
          className="text-blue-600 text-xs hover:underline"
        >
          View More
        </button>
      )}
    </div>
  );
}

// Component for expandable description
function ExpandableDescription({ incident, damage, witness, notes }: { 
  incident: string; 
  damage: string; 
  witness?: string; 
  notes?: string; 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 50;
  
  const fullText = `${incident} | ${damage}${witness ? ` | Witness: ${witness}` : ''}${notes ? ` | Notes: ${notes}` : ''}`;
  const shouldTruncate = fullText.length > maxLength;
  const displayText = shouldTruncate && !isExpanded 
    ? `${fullText.substring(0, maxLength)}...` 
    : fullText;
  
  return (
    <div className="text-sm">
      <div className="break-words">{displayText}</div>
      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-800 text-xs mt-1 font-medium"
        >
          {isExpanded ? 'View Less' : 'View More'}
        </button>
      )}
    </div>
  );
}

// Fault Determination Component
function FaultDeterminationSection({ report }: { report: any }) {
  const [faultStatus, setFaultStatus] = useState(report.faultStatus || '');
  const [repairCost, setRepairCost] = useState(report.repairCost || '');
  const [repairStatus, setRepairStatus] = useState(report.repairStatus || '');
  const { toast } = useToast();
  
  const updateIncidentMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await apiRequest("PUT", `/api/incident-reports/${report.id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incident-reports"] });
      toast({
        title: "Updated",
        description: "Incident report updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update incident report",
        variant: "destructive",
      });
    },
  });
  
  return (
    <div className="border-t pt-4 mt-4">
      <Label className="font-medium text-lg">Fault Determination & Resolution</Label>
      <div className="grid grid-cols-1 gap-4 mt-3">
        <div>
          <Label className="text-sm font-medium">Fault Status</Label>
          <Select
            value={faultStatus || undefined}
            onValueChange={(value) => {
              setFaultStatus(value);
              updateIncidentMutation.mutate({ faultStatus: value || null });
            }}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="at-fault">At Fault</SelectItem>
              <SelectItem value="not-at-fault">Not at Fault</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {faultStatus === 'at-fault' && (
          <div>
            <Label className="text-sm font-medium">Cost of Repair</Label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={repairCost}
              onChange={(e) => {
                const newValue = e.target.value;
                setRepairCost(newValue);
                updateIncidentMutation.mutate({ repairCost: newValue || null });
              }}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}
        
        {faultStatus === 'at-fault' && (
          <div>
            <Label className="text-sm font-medium">Repair Status</Label>
            <Select
              value={repairStatus || undefined}
              onValueChange={(value) => {
                setRepairStatus(value);
                updateIncidentMutation.mutate({ repairStatus: value || null });
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}

function RepairStatusDropdown({ report, updateMutation, deleteMutation }: { report: any; updateMutation: any; deleteMutation: any }) {
  const [selectedStatus, setSelectedStatus] = useState(report.repairStatus || '');
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Select
          value={selectedStatus}
          onValueChange={(value) => {
            setSelectedStatus(value);
            setShowSaveButton(value !== (report.repairStatus || ''));
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="not_set">Not Set</SelectItem>
          </SelectContent>
        </Select>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPasswordPrompt(true)}
          disabled={deleteMutation.isPending}
          className="px-3 border-gray-300 hover:bg-gray-50"
        >
          <img src={binIcon} alt="Delete" className="h-4 w-4" />
        </Button>
      </div>
      
      {showSaveButton && (
        <Button
          size="sm"
          onClick={() => {
            const updates = { repairStatus: selectedStatus === 'not_set' ? null : selectedStatus };
            updateMutation.mutate({ reportId: report.id, updates });
            setShowSaveButton(false);
          }}
          disabled={updateMutation.isPending}
          className="w-full"
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Status'}
        </Button>
      )}
      
      {showPasswordPrompt && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-sm text-gray-800 mb-3">Enter password to delete incident report:</p>
          <input
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            placeholder="Password"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm mb-3"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (deletePassword === 'bbonly') {
                  setShowPasswordPrompt(false);
                  setShowDeleteConfirm(true);
                  setDeletePassword('');
                } else {
                  toast({
                    title: "Access Denied",
                    description: "Incorrect password",
                    variant: "destructive",
                  });
                }
              }
            }}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                if (deletePassword === 'bbonly') {
                  setShowPasswordPrompt(false);
                  setShowDeleteConfirm(true);
                  setDeletePassword('');
                } else {
                  toast({
                    title: "Access Denied",
                    description: "Incorrect password",
                    variant: "destructive",
                  });
                }
              }}
              className="flex-1"
            >
              Verify
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowPasswordPrompt(false);
                setDeletePassword('');
              }}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      
      {showDeleteConfirm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-sm text-gray-800 mb-3">Delete this incident report?</p>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                deleteMutation.mutate(report.id);
                setShowDeleteConfirm(false);
              }}
              disabled={deleteMutation.isPending}
              className="flex-1"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

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
import { LogOut, FileSpreadsheet, Users, Home, Download, FileDown, Upload, MapPin, BarChart as BarChartIcon, Ticket, PlusCircle, ArrowUpDown, Calendar, LineChart as LineChartIcon, PieChart as PieChartIcon, TrendingUp, Activity, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, Car, ChevronLeft, ChevronRight, User, Plus } from "lucide-react";
import monitorHeartNotesIcon from "@assets/Monitor-Heart-Notes--Streamline-Ultimate.png";
import analyticsBoardBarsIcon from "@assets/Analytics-Board-Bars--Streamline-Ultimate.png";
import tagsAddIcon from "@assets/Tags-Add--Streamline-Ultimate.png";
import deliveryManIcon from "@assets/Delivery-Man--Streamline-Ultimate.png";
import cashUserIcon from "@assets/Cash-User--Streamline-Ultimate.png";
import timeClockNineIcon from "@assets/Time-Clock-Nine--Streamline-Ultimate.png";
import monitorUploadIcon from "@assets/Monitor-Upload--Streamline-Ultimate_1750862615348.png";
import networkUploadIcon from "@assets/Network-Upload--Streamline-Ultimate_1750863051629.png";
import databaseUploadIcon from "@assets/Database-Upload--Streamline-Ultimate_1750862961001.png";
import pinLocationIcon from "@assets/Pin-Location-1--Streamline-Ultimate.png";
import accountingBillStackIcon from "@assets/Accounting-Bill-Stack-Dollar--Streamline-Ultimate.png";
import folderUploadIcon from "@assets/Folder-Upload--Streamline-Ultimate.png";
import paperWriteIcon from "@assets/Paper-Write--Streamline-Ultimate.png";
import logoutIcon from "@assets/Logout-2--Streamline-Ultimate.png";
import contractIcon from "@assets/Business-Contract-Approve--Streamline-Ultimate_1750781519931.png";
import houseIcon from "@assets/House-3--Streamline-Ultimate.png";
import { 
  BarChart, 
  LineChart, 
  PieChart,
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
  ssn?: string | null;
  driversLicenseNumber?: string | null;
  dateOfBirth?: string | null;
  motorVehicleRecordsPath?: string | null;
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
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0); // 0 = current week, 1 = last week, etc.
  
  // Initial setup - check authentication and adapt UI for mobile
  useEffect(() => {
    let cleanupFunction: (() => void) | null = null;
    
    const initializeAdmin = async () => {
      try {
        // Check if we need to adapt UI for mobile
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          // Apply mobile-specific styles if needed
          document.body.classList.add('mobile-admin');
        }
        
        // Import admin auth utility
        const adminAuth = await import("@/lib/admin-auth");
        
        // Double check authentication status
        if (!adminAuth.isAdminAuthenticated()) {
          // If not authenticated, redirect to login
          navigate("/admin-login");
          return;
        }
        
        // Set up session refresh
        const refreshAdminSession = adminAuth.refreshAdminSession;
        
        // Add event listeners for user activity
        const activityEvents = ["mousedown", "keydown", "touchstart", "scroll"];
        
        const handleUserActivity = () => {
          refreshAdminSession();
        };
        
        // Add event listeners
        activityEvents.forEach(event => {
          window.addEventListener(event, handleUserActivity);
        });
        
        // Set cleanup function
        cleanupFunction = () => {
          activityEvents.forEach(event => {
            window.removeEventListener(event, handleUserActivity);
          });
          document.body.classList.remove('mobile-admin');
        };
      } catch (error) {
        console.error("Error in admin panel initialization:", error);
        // If there's an error, redirect to login as a fallback
        navigate("/admin-login");
      }
    };
    
    initializeAdmin();
    
    return () => {
      if (cleanupFunction) {
        cleanupFunction();
      }
    };
  }, [navigate]);
  
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
    totalCashPaid: number;
    reports: number;
    locationId: number;
  }[]>([]);
  
  // Partner pay state
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState<number>(0);
  const [currentMonth, setCurrentMonth] = useState<string>("");
  const [savedExpenses, setSavedExpenses] = useState<Record<string, number>>({});
  const [isEditingExpenses, setIsEditingExpenses] = useState<boolean>(false);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [expensesPassword, setExpensesPassword] = useState<string>("");
  const manualRevenue = useMemo(() => ({
    // Pre-set monthly revenue values
    "2025-01": 17901,
    "2025-02": 27556,
    "2025-03": 25411,
    "2025-04": 20974,
    "2025-05": 19431
  } as Record<string, number>), []);
  
  // Partner pay history data for table display
  const [partnerPaymentHistory, setPartnerPaymentHistory] = useState<Array<{
    month: string;
    brandon: number;
    ryan: number;
    dave: number;
    total: number;
  }>>([]);

  // Employee accounting month filter - default to current month
  const [selectedAccountingMonth, setSelectedAccountingMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Employee shift breakdown modal state
  const [selectedEmployeeShifts, setSelectedEmployeeShifts] = useState<any>(null);
  const [showEmployeeShiftsModal, setShowEmployeeShiftsModal] = useState(false);

  // Function to generate employee shift breakdown data
  const generateEmployeeShiftBreakdown = (employee: any) => {
    const employeeReports = reports.filter((report: any) => {
      const reportDate = parseLocalDate(report.date);
      const reportMonth = `${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (selectedAccountingMonth && selectedAccountingMonth !== "all" && reportMonth !== selectedAccountingMonth) {
        return false;
      }

      return employeeWorkedInShift(report, employee);
    });

    return employeeReports.map((report: any) => {
      const employees = parseEmployeesData(report.employees);
      const employeeData = findEmployeeInShift(employees, employee);

      if (!employeeData) return null;

      const totalJobHours = report.totalJobHours || employees.reduce((sum: any, emp: any) => sum + (emp.hours || 0), 0);
      const hoursPercent = totalJobHours > 0 ? employeeData.hours / totalJobHours : 0;

      // Commission calculation
      const locationId = report.locationId;
      let commissionRate = 4;
      if (locationId === 1) commissionRate = 4;
      else if (locationId === 2) commissionRate = 9;
      else if (locationId === 3) commissionRate = 7;
      else if (locationId === 4) commissionRate = 6;
      else if (locationId === 7) commissionRate = 2;

      const cashCars = report.totalCars - report.creditTransactions - report.totalReceipts;
      const totalCommission = (report.creditTransactions * commissionRate) + 
                             (cashCars * commissionRate) + 
                             (report.totalReceipts * commissionRate);
      
      // Tips calculations
      let perCarPrice = 15;
      if (locationId === 4) perCarPrice = 13;
      else if (locationId === 7) perCarPrice = 6;
      else if (locationId >= 5) {
        const currentLocation = locations?.find((loc: any) => loc.id === locationId);
        perCarPrice = currentLocation?.curbsideRate || 15;
      }
      
      const creditCardTips = Math.abs(report.creditTransactions * perCarPrice - report.totalCreditSales);
      const cashTips = Math.abs(cashCars * perCarPrice - (report.totalCashCollected - report.companyCashTurnIn));
      const receiptTips = report.totalReceipts * 3;
      const totalTips = creditCardTips + cashTips + receiptTips;
      
      const empCommission = totalCommission * hoursPercent;
      const empTips = totalTips * hoursPercent;
      const empEarnings = empCommission + empTips;

      // Money owed calculation using correct turn-in rates
      const receiptSales = report.totalReceipts * 18;
      const totalCollections = report.totalCreditSales + receiptSales;
      
      // Calculate total turn-in using same logic as shift report form
      let turnInRate = 11; // Default rate
      if (locationId === 1) turnInRate = 11; // Capital Grille
      else if (locationId === 2) turnInRate = 6;  // Bob's Steak
      else if (locationId === 3) turnInRate = 8;  // Truluck's
      else if (locationId === 4) turnInRate = 7;  // BOA Steakhouse
      else if (locationId >= 5) {
        const currentLocation = locations?.find((loc: any) => loc.id === locationId);
        turnInRate = currentLocation?.turnInRate || 11;
      }
      
      const calculatedTotalTurnIn = report.totalCars * turnInRate;
      const totalMoneyOwedOnShift = Math.max(0, totalCollections - calculatedTotalTurnIn);
      const moneyOwed = totalMoneyOwedOnShift * hoursPercent;

      // No tax calculations needed
      const shiftReportCashPaid = Number(employeeData.cashPaid || 0);
      
      const employeeRecord = employeeRecords.find(emp => emp.key.toLowerCase() === employee.key.toLowerCase());
      const employeeTaxPayments = taxPayments.filter((payment: any) => 
        payment.employeeId === employeeRecord?.id && payment.reportId === report.id
      );
      const taxRecordCashPaid = employeeTaxPayments.reduce((sum: number, payment: any) => 
        sum + Number(payment.paidAmount || 0), 0
      );
      
      const cashPaid = Math.max(shiftReportCashPaid, taxRecordCashPaid);

      return {
        reportId: report.id,
        date: report.date,
        location: getLocationName(report.locationId),
        shift: report.shift,
        hours: employeeData.hours,
        hoursPercent: (hoursPercent * 100).toFixed(1) + '%',
        commission: empCommission.toFixed(2),
        tips: empTips.toFixed(2),
        earnings: empEarnings.toFixed(2),
        moneyOwed: moneyOwed.toFixed(2),
        tax: "0.00", // Tax calculations removed
        cashPaid: cashPaid.toFixed(2)
      };
    }).filter(shift => shift !== null);
  };
  
  // Shift reports pagination - default to current month
  const [currentReportsMonth, setCurrentReportsMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  // Location filter for shift reports - default to "all"
  const [selectedReportsLocation, setSelectedReportsLocation] = useState<string>("all");

  // Navigation functions for shift reports pagination
  const goToPreviousMonth = () => {
    const [year, month] = currentReportsMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2); // month - 2 because months are 0-indexed
    const newMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    setCurrentReportsMonth(newMonth);
  };

  const goToNextMonth = () => {
    const [year, month] = currentReportsMonth.split('-').map(Number);
    const nextDate = new Date(year, month); // month is already correct for next month
    const newMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setCurrentReportsMonth(newMonth);
  };

  const getCurrentMonthName = () => {
    const [year, month] = currentReportsMonth.split('-').map(Number);
    const date = new Date(year, month - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };
  
  // Employee accounting data state
  const [employeeAccountingData, setEmployeeAccountingData] = useState<Array<{
    name: string;
    key: string;
    totalHours: string;
    totalCommission: string;
    totalTips: string;
    totalEarnings: string;
    totalTax: string;
    totalMoneyOwed: string;
    totalAdditionalTaxPayments: string;
    moneyOwedAfterTax: string;
    advance: string;
    shiftsWorked: number;
  }>>([]);
  const EXPENSES_EDIT_PASSWORD = "bbonly";
  
  // Load saved expenses from localStorage on initial render
  useEffect(() => {
    try {
      const savedExpensesFromStorage = localStorage.getItem('savedMonthlyExpenses');
      if (savedExpensesFromStorage) {
        setSavedExpenses(JSON.parse(savedExpensesFromStorage));
      }
      
      // Initialize empty partner payment history to prevent errors
      setPartnerPaymentHistory([]);
    } catch (error) {
      console.error("Error loading saved expenses:", error);
    }
  }, []);


  
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
  
  // Add tickets modal state
  const [isAddTicketsOpen, setIsAddTicketsOpen] = useState(false);
  const [selectedDistributionForAdd, setSelectedDistributionForAdd] = useState<TicketDistribution | null>(null);
  const [additionalTickets, setAdditionalTickets] = useState(0);
  
  // Employee management state - using employeeRecords from API instead
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
    notes: '',
    ssn: '',
    fullSsn: '',
    driversLicenseNumber: '',
    dateOfBirth: '',
    motorVehicleRecordsPath: ''
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
  }, []);

  // Fetch all shift reports
  const { data: reports = [], isLoading, refetch: refetchReports } = useQuery<ShiftReport[]>({
    queryKey: ["/api/shift-reports"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Fetch ticket distributions
  const { data: distributionsData = [], isLoading: isLoadingDistributions } = useQuery<TicketDistribution[]>({
    queryKey: ["/api/ticket-distributions"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Fetch employees data (active only for main management)
  const { data: employeeRecords = [], isLoading: isLoadingEmployees, refetch: refetchEmployees } = useQuery<EmployeeRecord[]>({
    queryKey: ["/api/employees"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 0, // Force fresh data
    refetchOnMount: true, // Always refetch when component mounts
  });

  // Fetch all employees (including inactive) for accounting overview
  const { data: allEmployeeRecords = [] } = useQuery<EmployeeRecord[]>({
    queryKey: ["/api/employees/all"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 0, // Force fresh data
    refetchOnMount: true, // Always refetch when component mounts
  });



  // Fetch training acknowledgments
  const { data: trainingAcknowledgments = [] } = useQuery({
    queryKey: ["/api/training-acknowledgments"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Fetch tax payments
  const { data: taxPayments = [], refetch: refetchTaxPayments } = useQuery({
    queryKey: ["/api/tax-payments"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Helper function to check if employee has completed training
  const hasCompletedTraining = (employeeName: string) => {
    return trainingAcknowledgments.some((ack: any) => 
      ack.employeeName.toLowerCase() === employeeName.toLowerCase()
    );
  };

  // Calculate employee accounting data when dependencies change
  useEffect(() => {
    if (!allEmployeeRecords.length || !reports.length) {
      setEmployeeAccountingData([]);
      return;
    }

    const calculatedData = allEmployeeRecords.map(employee => {
      const employeeReports = reports.filter((report: any) => {
        const reportDate = parseLocalDate(report.date);
        const reportMonth = `${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (selectedAccountingMonth && selectedAccountingMonth !== "all" && reportMonth !== selectedAccountingMonth) {
          return false;
        }

        return employeeWorkedInShift(report, employee);
      });

      let totalEarnings = 0;
      let totalTax = 0;
      let totalMoneyOwed = 0;
      let totalAdditionalTaxPayments = 0;
      let totalHours = 0;
      let totalCommissionOnly = 0;
      let totalTipsOnly = 0;
      let totalCreditTips = 0;
      let totalCashTips = 0;

      employeeReports.forEach((report: any) => {
        const employees = parseEmployeesData(report.employees);
        const employeeData = findEmployeeInShift(employees, employee);

        if (employeeData) {
          const totalJobHours = report.totalJobHours || employees.reduce((sum: any, emp: any) => sum + (emp.hours || 0), 0);
          const hoursPercent = totalJobHours > 0 ? employeeData.hours / totalJobHours : 0;

          // Commission calculation
          const locationId = report.locationId;
          let commissionRate = 4;
          if (locationId === 1) commissionRate = 4;
          else if (locationId === 2) commissionRate = 9;
          else if (locationId === 3) commissionRate = 7;
          else if (locationId === 4) commissionRate = 6;
          else if (locationId === 7) commissionRate = 2;

          const cashCars = report.totalCars - report.creditTransactions - report.totalReceipts;
          const totalCommission = (report.creditTransactions * commissionRate) + 
                                 (cashCars * commissionRate) + 
                                 (report.totalReceipts * commissionRate);
          
          // Tips calculations
          let perCarPrice = 15;
          if (locationId === 4) perCarPrice = 13;
          else if (locationId === 7) perCarPrice = 6;

          const creditCardTips = Math.abs(report.creditTransactions * perCarPrice - report.totalCreditSales);
          const cashTips = Math.abs(cashCars * perCarPrice - (report.totalCashCollected - report.companyCashTurnIn));
          const receiptTips = report.totalReceipts * 3;
          const totalTips = creditCardTips + cashTips + receiptTips;

          const empCommission = hoursPercent * totalCommission;
          const empTips = hoursPercent * totalTips;
          const empEarnings = empCommission + empTips;

          // Money owed calculation
          const turnIn = report.totalTurnIn || 0;
          const collections = (report.totalCreditSales || 0) + (report.totalReceiptSales || 0);
          const moneyOwed = Math.max(0, collections - turnIn) * hoursPercent;

          // Tax calculations
          const tax = empEarnings * 0.22;
          const shiftReportCashPaid = Number(employeeData.cashPaid || 0);
          
          const employeeRecord = employeeRecords.find(emp => emp.key.toLowerCase() === employee.key.toLowerCase());
          const employeeTaxPayments = (taxPayments as any[])?.filter((payment: any) => 
            payment.employeeId === employeeRecord?.id && payment.reportId === report.id
          ) || [];
          const taxRecordCashPaid = employeeTaxPayments.reduce((sum: number, payment: any) => 
            sum + Number(payment.paidAmount || 0), 0
          );
          
          const cashPaid = Math.max(shiftReportCashPaid, taxRecordCashPaid);
          const additionalTaxPayments = 0; // Tax calculations removed
          

          


          totalEarnings += empEarnings;
          totalTax += 0; // Tax calculations removed
          totalMoneyOwed += moneyOwed;
          totalAdditionalTaxPayments += additionalTaxPayments;
          totalHours += employeeData.hours;
          totalCommissionOnly += empCommission;
          totalTipsOnly += empTips;
          totalCreditTips += hoursPercent * creditCardTips;
          totalCashTips += hoursPercent * (cashTips + receiptTips);
        }
      });

      const advance = totalCommissionOnly + totalTipsOnly - totalMoneyOwed;
      const moneyOwedAfterTax = Math.max(0, totalTax - totalMoneyOwed - totalAdditionalTaxPayments);



      return {
        name: employee.fullName,
        key: employee.key,
        totalHours: parseFloat(totalHours.toFixed(1)),
        totalCommission: parseFloat(totalCommissionOnly.toFixed(2)),
        totalTips: parseFloat(totalTipsOnly.toFixed(2)),
        totalCreditTips: parseFloat(totalCreditTips.toFixed(2)),
        totalCashTips: parseFloat(totalCashTips.toFixed(2)),
        totalEarnings: parseFloat(totalEarnings.toFixed(2)),
        totalTax: parseFloat(totalTax.toFixed(2)),
        totalMoneyOwed: parseFloat(totalMoneyOwed.toFixed(2)),
        totalAdditionalTaxPayments: parseFloat(totalAdditionalTaxPayments.toFixed(2)),
        moneyOwedAfterTax: parseFloat(moneyOwedAfterTax.toFixed(2)),
        advance: parseFloat(advance.toFixed(2)),
        shiftsWorked: employeeReports.length
      };
    });


    setEmployeeAccountingData(calculatedData as any);
  }, [allEmployeeRecords, reports, selectedAccountingMonth, taxPayments]);

  // Helper function to get training completion date
  const getTrainingCompletionDate = (employeeName: string) => {
    const acknowledgment = trainingAcknowledgments.find((ack: any) => 
      ack.employeeName.toLowerCase() === employeeName.toLowerCase()
    );
    return acknowledgment ? new Date(acknowledgment.createdAt).toLocaleDateString() : null;
  };
  
  // Update local state whenever API data changes
  useEffect(() => {
    if (distributionsData && distributionsData.length > 0) {
      setTicketDistributions(distributionsData);
    }
  }, [distributionsData]);
  
  // Calculate statistics and analytics data
  useEffect(() => {
    if (!reports || !locations) return;
    
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    // Initialize data structures with manual values for Jan and Feb
    const initialMonthlyData = monthNames.map(name => {
      if (name === "January") return { name, sales: 17901 };
      if (name === "February") return { name, sales: 27556 };
      if (name === "March") return { name, sales: 25411 };
      if (name === "April") return { name, sales: 20974 };
      if (name === "May") return { name, sales: 19431 };
      return { name, sales: 0 };
    });
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
        // Parse date correctly to avoid timezone issues
        const reportDate = parseReportDate(report.date);
        
        const month = reportDate.getMonth(); // 0-11
        const dayOfWeek = reportDate.getDay(); // 0-6
        
        // Skip if outside filter date range
        if ((startDate && reportDate < startDate) || (endDate && reportDate > endDate)) {
          return;
        }
        
        // Calculate company turn-in rate based on location
        let turnInRate = 11; // Default for Capital Grille (id: 1)
        
        if (report.locationId === 2) { // Bob's Steak
          turnInRate = 6;
        } else if (report.locationId === 3) { // Truluck's
          turnInRate = 8;
        } else if (report.locationId === 4) { // BOA Steakhouse
          turnInRate = 7;
        }
        
        // Calculate company earnings (total cars * turn-in rate)
        const companySales = report.totalCars * turnInRate;
        
        // Add to monthly sales total (company earnings only) - but skip if we have manual values
        const monthName = monthNames[month];
        if (!["January", "February", "March", "April", "May"].includes(monthName)) {
          initialMonthlyData[month].sales += companySales;
        }
        
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
          salesTrend[13 - daysAgo].sales += companySales;
          salesTrend[13 - daysAgo].cars += report.totalCars;
        }
      });
    }
    
    // Example calculation for March based on actual numbers provided:
    // Capital Grille: 1302 cars × $11 = $14,322
    // Truluck's: 670 cars × $8 = $5,360
    // BOA: 474 cars × $7 = $3,318
    // Bob's: 377 cars × $6 = $2,262
    // Total: $25,262
    //
    // The calculation is now done dynamically based on actual car counts and 
    // turn-in rates for each location in the code above
    
    // Calculate combined total cars per day of week across all 4 locations
    // Group by unique date and combine all locations for that date
    const dailyTotals = new Map<string, {dayOfWeek: number, totalCars: number}>();
    
    reports.forEach(report => {
      // Parse date correctly
      let reportDate;
      try {
        if (report.date.includes('-')) {
          const parts = report.date.split('-');
          if (parts[0].length === 4) {
            const [year, month, day] = parts;
            reportDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          } else {
            const [month, day, year] = parts;
            reportDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          }
        } else if (report.date.includes('/')) {
          const parts = report.date.split('/');
          reportDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
        } else {
          reportDate = parseLocalDate(report.date);
        }
      } catch {
        reportDate = parseLocalDate(report.date);
      }
      
      const dayOfWeek = reportDate.getDay();
      // Use normalized date as key to group same dates with different formats
      const dateKey = `${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, '0')}-${String(reportDate.getDate()).padStart(2, '0')}`;
      
      if (!dailyTotals.has(dateKey)) {
        dailyTotals.set(dateKey, {dayOfWeek, totalCars: 0});
      }
      
      const existing = dailyTotals.get(dateKey)!;
      existing.totalCars += report.totalCars;
    });
    
    // Calculate average total cars per day of week (combining all 4 locations)
    const dayOfWeekTotals = new Array(7).fill(0);
    const dayOfWeekCounts = new Array(7).fill(0);
    
    dailyTotals.forEach(({dayOfWeek, totalCars}) => {
      dayOfWeekTotals[dayOfWeek] += totalCars;
      dayOfWeekCounts[dayOfWeek] += 1;
    });
    
    const avgDailyData = initialDailyData.map((day, index) => ({
      name: day.name,
      cars: dayOfWeekCounts[index] > 0 ? Math.round(dayOfWeekTotals[index] / dayOfWeekCounts[index]) : 0
    }));
    
    // Update all state variables with calculated data
    setMonthlyData(initialMonthlyData);
    setDailyCarVolume(avgDailyData);
    setCarDistributionByLocation(locationDistribution);
    setSalesTrendData(salesTrend);
    setReportsByDay(dayReportCounts);
    
  }, [reports, selectedMonth, selectedLocation]);
  
  // Employee data is now handled directly through employeeRecords

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
        totalCashPaid: number;
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
      
      // Filter reports by month if filter is set
      const filteredReports = reports.filter(report => {
        // Apply month filter if set
        if (selectedMonth) {
          // Parse date correctly to avoid timezone issues
          let reportDate;
          try {
            if (report.date.includes('-')) {
              const parts = report.date.split('-');
              // Check if it's MM-DD-YYYY or YYYY-MM-DD format
              if (parts[0].length === 4) {
                // YYYY-MM-DD format
                const [year, month, day] = parts;
                reportDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
              } else {
                // MM-DD-YYYY format
                const [month, day, year] = parts;
                reportDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
              }
            } else if (report.date.includes('/')) {
              const parts = report.date.split('/');
              // MM/DD/YYYY format
              reportDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
            } else {
              reportDate = parseLocalDate(report.date);
            }
          } catch {
            reportDate = parseLocalDate(report.date);
          }
          
          const reportYear = reportDate.getFullYear();
          const reportMonth = reportDate.getMonth() + 1; // JavaScript months are 0-based
          const filterYear = parseInt(selectedMonth.split('-')[0]);
          const filterMonth = parseInt(selectedMonth.split('-')[1]);
          
          if (reportYear !== filterYear || reportMonth !== filterMonth) {
            return false;
          }
        }
        
        return true;
      });

      filteredReports.forEach(report => {
        // Set commission rates per location
        let commissionRate = 4; // Default for original locations
        if (report.locationId === 2) commissionRate = 9;      // Bob's = $9
        else if (report.locationId === 7) commissionRate = 2; // PPS = $2
        // For new locations (ID 5+), use dynamic rates from database
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
        
        // Tips calculations - set tip rates per location
        let tipRate = 15; // Default for original locations
        if (report.locationId === 7) tipRate = 6; // PPS = $6
        // For new locations (ID 5+), use dynamic rates from database
        
        const creditCardTransactionsTotal = report.creditTransactions * tipRate;
        const creditCardTips = Math.abs(report.totalCreditSales - creditCardTransactionsTotal);
        const cashCarsTotal = cashCars * tipRate;
        const cashTips = Math.abs(report.totalCashCollected - cashCarsTotal);
        const receiptTips = report.totalReceipts * 3;
        const totalTips = creditCardTips + cashTips + receiptTips;

        // Parse employee data from JSON string with robust error handling
        let reportEmployees = [];
        try {
          if (report.employees && typeof report.employees === 'string') {
            const parsed = JSON.parse(report.employees);
            reportEmployees = Array.isArray(parsed) ? parsed : [];
          } else if (Array.isArray(report.employees)) {
            reportEmployees = report.employees;
          } else if (report.employees) {
            // Handle unexpected data types by converting to empty array
            reportEmployees = [];
          }
        } catch (err) {
          // Silently handle parsing errors to reduce console noise
          reportEmployees = [];
        }

        // Additional safety check - ensure we have a valid array with elements
        if (Array.isArray(reportEmployees) && reportEmployees.length > 0) {
          // Process each employee
          reportEmployees.forEach(employee => {
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
            
            // Get cash paid amount for this employee
            const employeeCashPaid = Number(employee.cashPaid || 0);
            
            // Get or create employee stats
            const existingStats = employeeMap.get(employee.name) || {
              name: employee.name,
              totalHours: 0,
              totalEarnings: 0,
              totalCommission: 0,
              totalTips: 0,
              totalMoneyOwed: 0,
              totalCashPaid: 0,
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
              totalCashPaid: existingStats.totalCashPaid + employeeCashPaid,
              reports: existingStats.reports + 1,
              locationId: report.locationId // Keep using the most recent location
            });
          });
        }

      });

      // Convert maps to arrays and sort
      const employeeStatsArray = Array.from(employeeMap.values())
        .sort((a, b) => b.totalEarnings - a.totalEarnings);
      
      const locationStatsArray = Array.from(locationMap.values())
        .sort((a, b) => b.totalCars - a.totalCars);
      
      setEmployeeStats(employeeStatsArray);
      setLocationStats(locationStatsArray);
    }
  }, [reports, selectedMonth]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("admin_authenticated");
    localStorage.removeItem("admin_auth_time");
    navigate("/admin-login");
  };
  
  // Function to export shift reports to CSV with detailed payroll data
  const exportReportsToCSV = () => {
    if (!reports.length) return;
    
    // CSV header with all fields including detailed payroll calculations
    let csvContent = "Report ID,Date,Location,Shift,Shift Leader,Total Cars,Total Credit Sales,Total Cash Collected,Company Cash Turn In,Total Turn In,Credit Transactions,Total Receipts,Total Receipt Sales,Total Job Hours,Employee Name,Employee Hours,Employee Commission,Employee Tips,Employee Earnings,Employee Money Owed,Employee Tax (22%),Notes,Incidents,Submitted Date\n";
    
    // Add each row of data with detailed employee breakdown
    reports.forEach(report => {
      const date = report.date;
      const submittedDate = new Date(report.createdAt).toLocaleDateString();
      const locationName = getLocationName(report.locationId);
      
      // Parse employees data for detailed payroll calculations
      let employeesData = [];
      try {
        employeesData = typeof report.employees === 'string' 
          ? JSON.parse(report.employees) 
          : Array.isArray(report.employees) 
            ? report.employees 
            : [];
      } catch (e) {
        employeesData = [];
      }
      
      // Escape quotes in text fields
      const escapeCSV = (text) => {
        if (!text) return "";
        return `"${String(text).replace(/"/g, '""')}"`;
      };
      
      // Calculate payroll data for each employee
      const commissionRate = report.locationId === 2 ? 9 : 4; // Bob's = $9, others = $4
      const totalJobHours = Array.isArray(employeesData) ? employeesData.reduce((sum, emp) => sum + (emp.hours || 0), 0) : 0;
      
      if (Array.isArray(employeesData) && employeesData.length > 0) {
        // Create a row for each employee with their individual calculations
        employeesData.forEach(emp => {
          const employeeName = emp.name || "Unknown";
          const employeeHours = emp.hours || 0;
          const hoursPercent = totalJobHours > 0 ? employeeHours / totalJobHours : 0;
          
          // Calculate commission based on cars and commission rate
          const totalCars = report.totalCars || 0;
          const empCommission = (totalCars * commissionRate) * hoursPercent;
          
          // Calculate tips based on credit sales, cash collections, and receipts
          const totalCreditSales = report.totalCreditSales || 0;
          const totalCashCollected = report.totalCashCollected || 0;
          const totalReceipts = report.totalReceipts || 0;
          const creditTransactions = report.creditTransactions || 0;
          
          const expectedCreditSales = creditTransactions * 15;
          const creditCardTips = Math.abs(expectedCreditSales - totalCreditSales);
          
          const cashCars = totalCars - creditTransactions;
          const expectedCashSales = cashCars * 15;
          const cashTips = Math.abs(expectedCashSales - totalCashCollected);
          
          const receiptTips = totalReceipts * 3;
          const totalTips = (creditCardTips + cashTips + receiptTips) * hoursPercent;
          
          const empEarnings = empCommission + totalTips;
          
          // Calculate money owed (when credit + receipt sales exceed turn in)
          const receiptSales = totalReceipts * 18;
          const totalCollections = totalCreditSales + receiptSales;
          const totalMoneyOwedOnShift = Math.max(0, totalCollections - (report.totalTurnIn || 0));
          const moneyOwed = totalMoneyOwedOnShift * hoursPercent;
          
          // Calculate tax obligation
          const tax = empEarnings * 0.22;
          
          // Format the CSV row with all data including detailed payroll
          csvContent += `${report.id},${escapeCSV(date)},${escapeCSV(locationName)},${escapeCSV(report.shift)},${escapeCSV(report.shiftLeader)},${report.totalCars || 0},${report.totalCreditSales || 0},${report.totalCashCollected || 0},${report.companyCashTurnIn || 0},${report.totalTurnIn || 0},${report.creditTransactions || 0},${report.totalReceipts || 0},${report.totalReceiptSales || 0},${report.totalJobHours || 0},${escapeCSV(employeeName)},${employeeHours.toFixed(1)},${empCommission.toFixed(2)},${totalTips.toFixed(2)},${empEarnings.toFixed(2)},${moneyOwed.toFixed(2)},${tax.toFixed(2)},${escapeCSV(report.notes || "")},${escapeCSV(report.incidents || "")},${escapeCSV(submittedDate)}\n`;
        });
      } else {
        // If no employees, still include the report data with empty employee fields
        csvContent += `${report.id},${escapeCSV(date)},${escapeCSV(locationName)},${escapeCSV(report.shift)},${escapeCSV(report.shiftLeader)},${report.totalCars || 0},${report.totalCreditSales || 0},${report.totalCashCollected || 0},${report.companyCashTurnIn || 0},${report.totalTurnIn || 0},${report.creditTransactions || 0},${report.totalReceipts || 0},${report.totalReceiptSales || 0},${report.totalJobHours || 0},"No Employees",0,0,0,0,0,0,${escapeCSV(report.notes || "")},${escapeCSV(report.incidents || "")},${escapeCSV(submittedDate)}\n`;
      }
    });
    
    // Create a download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'shift-reports-complete-with-payroll.csv');
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
      const reportDate = parseLocalDate(report.date);
      
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
      // Get correct per-car rate for this location
      let perCarPrice = 15; // Default rate
      if (report.locationId === 4) { // BOA uses $13
        perCarPrice = 13;
      } else if (report.locationId >= 5) { // New locations use dynamic rates
        const currentLocation = locations?.find((loc: any) => loc.id === report.locationId);
        perCarPrice = currentLocation?.curbsideRate || 15;
      }
      
      const creditCardTips = Math.abs(report.creditTransactions * perCarPrice - report.totalCreditSales);
      const cashTips = Math.abs(cashCars * perCarPrice - (report.totalCashCollected - report.companyCashTurnIn));
      const receiptTips = report.totalReceipts * 3; // $3 tip per receipt
      
      // Process each employee in the report
      const csvEmployeesFirst = typeof report.employees === 'string' 
        ? JSON.parse(report.employees) 
        : Array.isArray(report.employees) 
          ? report.employees 
          : [];
      
      if (csvEmployeesFirst.length > 0) {
        const totalJobHours = csvEmployeesFirst.reduce((sum, emp) => sum + emp.hours, 0);
        
        csvEmployeesFirst.forEach(employee => {
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
      const date = report.date;
      const locationName = getLocationName(report.locationId);
      // Set correct turn-in rates for each location
      let turnInRate = 11; // Default for Capital Grille
      switch(report.locationId) {
        case 1: // Capital Grille: $11 per car
          turnInRate = 11;
          break;
        case 2: // Bob's Steak and Chop House: $6 per car
          turnInRate = 6;
          break;
        case 3: // Truluck's: $8 per car
          turnInRate = 8;
          break;
        case 4: // BOA Steakhouse: $7 per car
          turnInRate = 7;
          break;
        default:
          turnInRate = 11;
      }
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
      const reportDate = parseLocalDate(report.date);
      
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
      
      // Tips calculations - using correct per-car rates for each location
      let perCarPrice = 15; // Default rate
      if (report.locationId === 4) { // BOA uses $13
        perCarPrice = 13;
      } else if (report.locationId >= 5) { // New locations use dynamic rates
        const currentLocation = locations?.find((loc: any) => loc.id === report.locationId);
        perCarPrice = currentLocation?.curbsideRate || 15;
      }
      
      const creditCardTips = Math.abs(report.creditTransactions * perCarPrice - report.totalCreditSales);
      const cashTips = Math.abs(cashCars * perCarPrice - (report.totalCashCollected - report.companyCashTurnIn));
      const receiptTips = report.totalReceipts * 3; // $3 tip per receipt
      
      // Process each employee in the report
      const csvEmployeesSecond = typeof report.employees === 'string' 
        ? JSON.parse(report.employees) 
        : Array.isArray(report.employees) 
          ? report.employees 
          : [];
      
      if (csvEmployeesSecond.length > 0) {
        const totalJobHours = csvEmployeesSecond.reduce((sum, emp) => sum + emp.hours, 0);
        
        csvEmployeesSecond.forEach(employee => {
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

  // Function to export Capital Grille receipt sales to PDF
  const exportCapitalGrilleReceiptsToPDF = () => {
    // Filter reports for Capital Grille only (locationId = 1) and current month
    const capitalGrilleReports = reports.filter(report => {
      if (report.locationId !== 1) return false;
      
      // Apply strict month filtering to avoid edge cases
      try {
        let reportDate;
        if (report.date.includes('-')) {
          const parts = report.date.split('-');
          if (parts[0].length === 4) {
            // YYYY-MM-DD format
            const [year, month, day] = parts;
            reportDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          } else {
            // MM-DD-YYYY format
            const [month, day, year] = parts;
            reportDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          }
        } else if (report.date.includes('/')) {
          const parts = report.date.split('/');
          // MM/DD/YYYY format
          reportDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
        } else {
          reportDate = parseLocalDate(report.date);
        }
        
        const reportYear = reportDate.getFullYear();
        const reportMonth = reportDate.getMonth() + 1; // JavaScript months are 0-based
        const filterYear = parseInt(currentReportsMonth.split('-')[0]);
        const filterMonth = parseInt(currentReportsMonth.split('-')[1]);
        
        return reportYear === filterYear && reportMonth === filterMonth;
      } catch (error) {
        console.log('Date parsing error for report:', report.date, error);
        return false;
      }
    });
    
    if (!capitalGrilleReports.length) {
      toast({
        title: "No Data",
        description: "No Capital Grille reports found to export.",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF();
    
    // Add title with month information
    const monthText = currentReportsMonth ? ` - ${getCurrentMonthName()}` : '';
    doc.setFontSize(14);
    doc.text(`Driftwood Member Parking${monthText}`, 14, 20);
    doc.setFontSize(8);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 28);
    
    // Simple text-based table to guarantee single page
    let yPosition = 40;
    const lineHeight = 4;
    let totalReceiptSales = 0;
    
    // Headers
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Date", 20, yPosition);
    doc.text("Shift", 70, yPosition);
    doc.text("Receipt Sales", 120, yPosition);
    
    yPosition += lineHeight + 2;
    
    // Header line
    doc.line(20, yPosition, 170, yPosition);
    yPosition += 3;
    
    // Data rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    
    capitalGrilleReports.forEach(report => {
      const date = report.date;
      const receiptSales = (report.totalReceipts || 0) * 18; // $18 per receipt
      totalReceiptSales += receiptSales;
      
      doc.text(date, 20, yPosition);
      doc.text(report.shift || 'N/A', 70, yPosition);
      doc.text(`$${receiptSales.toFixed(2)}`, 120, yPosition);
      yPosition += lineHeight;
    });
    
    // Total line
    yPosition += 3;
    doc.line(20, yPosition, 170, yPosition);
    yPosition += 5;
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL:", 20, yPosition);
    doc.text(`$${totalReceiptSales.toFixed(2)}`, 120, yPosition);
    
    // Save PDF
    doc.save("capital-grille-receipt-sales.pdf");
    
    const monthInfo = currentReportsMonth ? ` for ${getCurrentMonthName()}` : '';
    toast({
      title: "Export Complete",
      description: `Capital Grille receipt sales report${monthInfo} exported with ${capitalGrilleReports.length} records and total of $${totalReceiptSales.toFixed(2)}.`,
    });
  };

  // Fetch locations at component level
  const { data: locations } = useQuery({
    queryKey: ["/api/locations"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Get location name by ID using dynamic locations data
  const getLocationName = (locationId: number) => {
    return locations?.find((loc: any) => loc.id === locationId)?.name || "Unknown";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl text-blue-600">Admin Panel</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate("/")}
              className="flex items-center gap-1"
            >
              <img src={houseIcon} alt="House" className="h-4 w-4" />
              Home
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <img src={logoutIcon} alt="Logout" className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">

          <Button 
            variant="outline" 
            onClick={() => {
              const password = prompt("Please enter the password to access CSV Upload:");
              if (password === "bbonly") {
                navigate("/admin/csv-upload");
              } else if (password !== null) {
                // Only show error if user didn't cancel
                alert("Incorrect password. Access denied.");
              }
            }}
            className="bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          >
            <img src={folderUploadIcon} alt="Folder Upload" className="h-4 w-4" />
            CSV Upload
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate("/reports")}
            className="bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          >
            <img src={paperWriteIcon} alt="Paper Write" className="h-4 w-4" />
            Edit Reports
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate("/contracts")}
            className="bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          >
            <img src={contractIcon} alt="Contract" className="h-4 w-4" />
            Document Generator
          </Button>
        </div>
      </div>
      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="mb-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:flex lg:flex-wrap gap-1 h-auto">
          <TabsTrigger value="reports" className="flex-shrink-0 flex items-center">
            <img src={monitorHeartNotesIcon} alt="Monitor Heart Notes" className="h-4 w-4 mr-2" />
            Reports
          </TabsTrigger>

          <TabsTrigger value="locations" className="flex-shrink-0 flex items-center">
            <img src={analyticsBoardBarsIcon} alt="Analytics Board Bars" className="h-4 w-4 mr-2" />
            Partner Distribution
          </TabsTrigger>
          <TabsTrigger value="tickets" className="flex-shrink-0 flex items-center">
            <img src={tagsAddIcon} alt="Tags Add" className="h-4 w-4 mr-2" />
            Tickets
          </TabsTrigger>
          <TabsTrigger value="manage-employees" className="flex-shrink-0 flex items-center">
            <img src={deliveryManIcon} alt="Delivery Man" className="h-4 w-4 mr-2" />
            Employees
          </TabsTrigger>
          <TabsTrigger value="employee-accounting" className="flex-shrink-0 flex items-center">
            <img src={cashUserIcon} alt="Cash User" className="h-4 w-4 mr-2" />
            Employee Accounting
          </TabsTrigger>
          <TabsTrigger value="hours-tracker" className="flex-shrink-0 flex items-center relative">
            <img src={timeClockNineIcon} alt="Time Clock Nine" className="h-4 w-4 mr-2" />
            Hours Tracker
            {(() => {
              // Calculate badge count for critical/warning employees
              const weeklyHours: Record<string, { totalHours: number }> = {};
              const today = new Date();
              const weekStart = new Date(today);
              weekStart.setDate(today.getDate() - today.getDay() - (selectedWeekOffset * 7));
              weekStart.setHours(0, 0, 0, 0);
              const weekEnd = new Date(weekStart);
              weekEnd.setDate(weekStart.getDate() + 6);
              weekEnd.setHours(23, 59, 59, 999);

              // Only process if we have reports data
              if (Array.isArray(reports) && reports.length > 0) {
                reports.forEach((report: any) => {
                  const reportDate = parseReportDate(report.date);
                  if (reportDate >= weekStart && reportDate <= weekEnd) {
                    let weeklyEmployees = [];
                    try {
                      if (typeof report.employees === 'string') {
                        // Handle double-escaped JSON from database
                        let employeeData = report.employees;
                        
                        // If it starts with a curly brace but is wrapped in quotes, it's double-escaped
                        if (employeeData.startsWith('"{') && employeeData.endsWith('}"')) {
                          // Remove outer quotes and unescape inner quotes
                          employeeData = employeeData.slice(1, -1).replace(/\\"/g, '"');
                        }
                        
                        weeklyEmployees = JSON.parse(employeeData);
                      } else if (Array.isArray(report.employees)) {
                        weeklyEmployees = report.employees;
                      }
                    } catch (e) {
                      // If JSON parsing fails, try alternative parsing for malformed data
                      try {
                        if (typeof report.employees === 'string') {
                          // Handle the database format: {"{"name":"elijah","hours":8,"cashPaid":0}","{"name":"antonio","hours":7,"cashPaid":0}"}
                          let rawData = report.employees;
                          
                          // Remove outer wrapper: {" ... "}
                          if (rawData.startsWith('{"') && rawData.endsWith('"}')) {
                            rawData = rawData.slice(2, -2);
                          }
                          
                          // Fix escaped quotes
                          rawData = rawData.replace(/\\"/g, '"');
                          
                          // Now we should have: {"name":"elijah","hours":8,"cashPaid":0}","{"name":"antonio","hours":7,"cashPaid":0}
                          // Split by "},"{" and rebuild as proper JSON array
                          if (rawData.includes('},{')) {
                            // Split on },{ boundary
                            const parts = rawData.split('},{');
                            const employees = [];
                            
                            for (let i = 0; i < parts.length; i++) {
                              let part = parts[i];
                              
                              // Add missing braces for each part
                              if (i === 0 && !part.startsWith('{')) part = '{' + part;
                              if (i === parts.length - 1 && !part.endsWith('}')) part = part + '}';
                              if (i > 0 && !part.startsWith('{')) part = '{' + part;
                              if (i < parts.length - 1 && !part.endsWith('}')) part = part + '}';
                              
                              try {
                                const emp = JSON.parse(part);
                                employees.push(emp);
                              } catch (e) {
                                console.log('Failed to parse employee part:', part);
                              }
                            }
                            
                            weeklyEmployees = employees;
                          } else if (!rawData.startsWith('[')) {
                            // Single employee case
                            try {
                              weeklyEmployees = [JSON.parse(rawData)];
                            } catch (e) {
                              weeklyEmployees = [];
                            }
                          }
                        }
                      } catch (e2) {
                        weeklyEmployees = [];
                      }
                    }

                    // Safety check to ensure weeklyEmployees is an array
                    if (!Array.isArray(weeklyEmployees)) {
                      weeklyEmployees = [];
                    }

                    weeklyEmployees.forEach((emp: any) => {
                      if (emp && emp.name && typeof emp.hours === 'number') {
                        if (!weeklyHours[emp.name]) {
                          weeklyHours[emp.name] = { totalHours: 0 };
                        }
                        weeklyHours[emp.name].totalHours += emp.hours;
                      }
                    });
                  }
                });
              }

              const alertCount = Object.values(weeklyHours).filter(emp => emp.totalHours >= 30).length;
              

              return alertCount > 0 ? (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  !
                </span>
              ) : null;
            })()}
          </TabsTrigger>
          <TabsTrigger value="incident-reports" className="flex-shrink-0 flex items-center relative">
            <img src={carRepairFireIcon} alt="Car Repair Fire" className="h-4 w-4 mr-2" />
            Incident Reports
            {(() => {
              const { data: incidentReports } = useQuery({
                queryKey: ["/api/incident-reports"],
                queryFn: getQueryFn({ on401: "returnNull" }),
              });
              
              // Check for incidents that are not completed
              const incompleteIncidents = incidentReports?.filter((report: any) => {
                return report.repairStatus !== 'completed';
              }) || [];
              
              return incompleteIncidents.length > 0 ? (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {incompleteIncidents.length}
                </span>
              ) : null;
            })()}
          </TabsTrigger>
          <TabsTrigger value="location-management" className="flex-shrink-0 flex items-center">
            <img src={pinLocationIcon} alt="Pin Location" className="h-4 w-4 mr-2" />
            Location Management
          </TabsTrigger>
        </TabsList>
        

        
        <TabsContent value="reports">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Shift Reports</CardTitle>
                <CardDescription>
                  View all shift reports across all locations
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
                            if (name === 'Sales ($)') return [`$${Number(value).toFixed(2)}`, 'Sales'];
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
                          <YAxis 
                            tickFormatter={(value) => `$${value}`}
                            domain={[0, 35000]} 
                          />
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
            <CardHeader className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Shift Reports - {getCurrentMonthName()}</CardTitle>
                  <CardDescription>
                    View shift reports for the selected month
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={exportReportsToCSV}
                    className="flex items-center gap-1"
                  >
                    <img 
                      src={databaseUploadIcon} 
                      className="h-4 w-4" 
                      alt="Export CSV"
                    />
                    Export CSV
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={exportReportsToPDF}
                    className="flex items-center gap-1"
                  >
                    <img 
                      src={networkUploadIcon} 
                      className="h-4 w-4" 
                      alt="Export PDF"
                    />
                    Export PDF
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={exportCapitalGrilleReceiptsToPDF}
                    className="flex items-center gap-1"
                  >
                    <img 
                      src={monitorUploadIcon} 
                      className="h-4 w-4" 
                      alt="Export DW PDF"
                    />
                    Export DW PDF
                  </Button>
                </div>
              </div>
              
              {/* Month Navigation and Location Filter Controls */}
              <div className="space-y-3 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                {/* Month Navigation */}
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousMonth}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous Month
                  </Button>
                  
                  <div className="text-sm font-medium text-center min-w-[150px]">
                    {getCurrentMonthName()}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextMonth}
                    className="flex items-center gap-2"
                  >
                    Next Month
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Location Filter */}
                <div className="flex items-center justify-center gap-2">
                  <Label htmlFor="location-filter" className="text-sm font-medium">Filter by Location:</Label>
                  <Select value={selectedReportsLocation} onValueChange={setSelectedReportsLocation}>
                    <SelectTrigger className="w-[200px]" id="location-filter">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {locations && locations.map((location: any) => (
                        <SelectItem key={location.id} value={location.id.toString()}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading reports...</div>
              ) : (() => {
                const filteredReports = reports.filter((report) => {
                  // Filter by month
                  const reportDate = parseLocalDate(report.date);
                  const reportMonth = `${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, '0')}`;
                  const monthMatch = reportMonth === currentReportsMonth;
                  
                  // Filter by location
                  const locationMatch = selectedReportsLocation === "all" || 
                                      report.locationId === parseInt(selectedReportsLocation);
                  
                  return monthMatch && locationMatch;
                });
                
                if (filteredReports.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      No reports found for {getCurrentMonthName()}. {reports.length === 0 ? 'Create a report to get started.' : 'Navigate to a different month to view other reports.'}
                    </div>
                  );
                }
                
                return (
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
                        <TableHead className="text-center">Cars</TableHead>
                        <TableHead className="text-center">Cash</TableHead>
                        <TableHead className="text-center">Credit Card Sales</TableHead>
                        <TableHead className="text-center">Receipt Sales</TableHead>
                        <TableHead className="text-center">Money Owed</TableHead>
                        <TableHead className="text-center">Turn-In</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports
                        .filter((report) => {
                          // Filter reports by selected month
                          const reportDate = parseLocalDate(report.date);
                          const reportMonth = `${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, '0')}`;
                          const monthMatch = reportMonth === currentReportsMonth;
                          
                          // Filter by location
                          const locationMatch = selectedReportsLocation === "all" || 
                                              report.locationId === parseInt(selectedReportsLocation);
                          
                          return monthMatch && locationMatch;
                        })
                        .map((report) => {
                        // Parse date safely to avoid timezone issues
                        let date;
                        try {
                          if (report.date.includes('-')) {
                            const parts = report.date.split('-');
                            // Check if it's MM-DD-YYYY or YYYY-MM-DD format
                            if (parts[0].length === 4) {
                              // YYYY-MM-DD format
                              const [year, month, day] = parts;
                              date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                            } else {
                              // MM-DD-YYYY format
                              const [month, day, year] = parts;
                              date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                            }
                          } else if (report.date.includes('/')) {
                            const parts = report.date.split('/');
                            // MM/DD/YYYY format
                            date = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
                          } else {
                            date = parseLocalDate(report.date);
                          }
                          
                          // Validate the parsed date
                          if (isNaN(date.getTime()) || date.getFullYear() < 2020 || date.getFullYear() > 2030) {
                            date = new Date();
                          }
                        } catch {
                          date = new Date();
                        }
                        
                        // For submitted date, use current date for all CSV imported reports
                        // CSV imports don't have reliable createdAt timestamps
                        const submittedDate = new Date();
                        // Set correct turn-in rates for each location
                        let turnInRate = 11; // Default for Capital Grille
                        switch(report.locationId) {
                          case 1: // Capital Grille: $11 per car
                            turnInRate = 11;
                            break;
                          case 2: // Bob's Steak and Chop House: $6 per car
                            turnInRate = 6;
                            break;
                          case 3: // Truluck's: $8 per car
                            turnInRate = 8;
                            break;
                          case 4: // BOA Steakhouse: $7 per car
                            turnInRate = 7;
                            break;
                          default:
                            turnInRate = 11;
                        }
                        const expectedTurnIn = report.totalCars * turnInRate;
                        const totalSales = (report.totalCreditSales || 0) + (report.totalReceiptSales || 0);
                        const moneyOwed = Math.max(0, totalSales - expectedTurnIn);
                        
                        return (
                          <TableRow key={report.id}>
                            <TableCell>{report.id}</TableCell>
                            <TableCell>{date.toLocaleDateString()}</TableCell>
                            <TableCell>{getLocationName(report.locationId)}</TableCell>
                            <TableCell>{report.shift}</TableCell>
                            <TableCell>{EMPLOYEE_NAMES[report.manager] || report.manager}</TableCell>
                            <TableCell className="text-center">{report.totalCars}</TableCell>
                            <TableCell className="text-center">
                              ${(report.companyCashTurnIn || 0).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center">${(report.totalCreditSales || 0).toFixed(2)}</TableCell>
                            <TableCell className="text-center">${(report.totalReceiptSales || 0).toFixed(2)}</TableCell>
                            <TableCell className="text-center">
                              ${moneyOwed.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center">${expectedTurnIn.toFixed(2)}</TableCell>
                          </TableRow>
                        );
                      })}
                      
                      {/* Totals Row */}
                      {(() => {
                        const filteredReports = reports.filter((report) => {
                          // Filter by month
                          const reportDate = parseLocalDate(report.date);
                          const reportMonth = `${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, '0')}`;
                          const monthMatch = reportMonth === currentReportsMonth;
                          
                          // Filter by location
                          const locationMatch = selectedReportsLocation === "all" || 
                                              report.locationId === parseInt(selectedReportsLocation);
                          
                          return monthMatch && locationMatch;
                        });
                        
                        const totalCars = filteredReports.reduce((sum, report) => sum + (report.totalCars || 0), 0);
                        const totalCash = filteredReports.reduce((sum, report) => sum + (report.companyCashTurnIn || 0), 0);
                        const totalCreditSales = filteredReports.reduce((sum, report) => sum + (report.totalCreditSales || 0), 0);
                        const totalReceiptSales = filteredReports.reduce((sum, report) => sum + (report.totalReceiptSales || 0), 0);
                        const totalTurnIn = filteredReports.reduce((sum, report) => {
                          // Calculate expected turn-in for each report
                          let expectedTurnIn = report.totalCars * 11; // Default rate
                          if (report.locationId === 2) expectedTurnIn = report.totalCars * 6; // Bob's
                          else if (report.locationId === 3) expectedTurnIn = report.totalCars * 8; // Truluck's
                          else if (report.locationId === 4) expectedTurnIn = report.totalCars * 7; // BOA
                          return sum + expectedTurnIn;
                        }, 0);
                        const totalMoneyOwed = filteredReports.reduce((sum, report) => {
                          // Calculate expected turn-in for each report
                          let expectedTurnIn = report.totalCars * 11; // Default rate
                          if (report.locationId === 2) expectedTurnIn = report.totalCars * 6; // Bob's
                          else if (report.locationId === 3) expectedTurnIn = report.totalCars * 8; // Truluck's
                          else if (report.locationId === 4) expectedTurnIn = report.totalCars * 7; // BOA
                          const totalSales = (report.totalCreditSales || 0) + (report.totalReceiptSales || 0);
                          const moneyOwed = Math.max(0, totalSales - expectedTurnIn);
                          return sum + moneyOwed;
                        }, 0);
                        
                        if (filteredReports.length > 0) {
                          return (
                            <TableRow className="bg-gray-50 font-semibold border-t-2">
                              <TableCell className="font-bold">TOTAL</TableCell>
                              <TableCell></TableCell>
                              <TableCell></TableCell>
                              <TableCell></TableCell>
                              <TableCell></TableCell>
                              <TableCell className="text-center font-bold">{totalCars}</TableCell>
                              <TableCell className="text-center font-bold">${totalCash.toFixed(2)}</TableCell>
                              <TableCell className="text-center font-bold">${totalCreditSales.toFixed(2)}</TableCell>
                              <TableCell className="text-center font-bold">${totalReceiptSales.toFixed(2)}</TableCell>
                              <TableCell className="text-center font-bold">${totalMoneyOwed.toFixed(2)}</TableCell>
                              <TableCell className="text-center font-bold">${totalTurnIn.toFixed(2)}</TableCell>
                            </TableRow>
                          );
                        }
                        return null;
                      })()}
                    </TableBody>
                  </Table>
                    </div>
                  );
                })()}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Summary Report</CardTitle>
              <CardDescription>Monthly totals and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Summary Totals Table */}
              {!isLoading && reports.length > 0 && (() => {
                // Filter reports based on date range
                const filteredReports = reports.filter(report => {
                  let reportDate;
                  try {
                    if (report.date.includes('-')) {
                      const parts = report.date.split('-');
                      if (parts[0].length === 4) {
                        // YYYY-MM-DD format
                        const [year, month, day] = parts;
                        reportDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                      } else {
                        // MM-DD-YYYY format
                        const [month, day, year] = parts;
                        reportDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                      }
                    } else if (report.date.includes('/')) {
                      const parts = report.date.split('/');
                      reportDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
                    } else {
                      reportDate = parseLocalDate(report.date);
                    }
                  } catch {
                    reportDate = parseLocalDate(report.date);
                  }

                  if (startDate && reportDate < startDate) return false;
                  if (endDate && reportDate > endDate) return false;
                  return true;
                });

                // Calculate totals
                const totals = filteredReports.reduce((acc, report) => {
                  acc.totalCars += report.totalCars || 0;
                  acc.totalCash += report.companyCashTurnIn || 0;
                  acc.totalCredit += report.totalCreditSales || 0;
                  acc.totalTurnIn += report.totalTurnIn || 0;
                  return acc;
                }, {
                  totalCars: 0,
                  totalCash: 0,
                  totalCredit: 0,
                  totalTurnIn: 0
                });

                return filteredReports.length > 0 ? (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold mb-4 text-blue-800">
                      Summary Totals {(startDate || endDate) && (
                        <span className="text-sm font-normal text-blue-600">
                          ({startDate ? startDate.toLocaleDateString() : 'Start'} - {endDate ? endDate.toLocaleDateString() : 'End'})
                        </span>
                      )}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white p-3 rounded-md border border-blue-100">
                        <div className="text-sm font-medium text-gray-600">Total Cars Parked</div>
                        <div className="text-2xl font-bold text-blue-600">{totals.totalCars.toLocaleString()}</div>
                      </div>
                      <div className="bg-white p-3 rounded-md border border-blue-100">
                        <div className="text-sm font-medium text-gray-600">Total Cash Sales</div>
                        <div className="text-2xl font-bold text-green-600">${totals.totalCash.toLocaleString()}</div>
                      </div>
                      <div className="bg-white p-3 rounded-md border border-blue-100">
                        <div className="text-sm font-medium text-gray-600">Total Credit Sales</div>
                        <div className="text-2xl font-bold text-purple-600">${totals.totalCredit.toLocaleString()}</div>
                      </div>
                      <div className="bg-white p-3 rounded-md border border-blue-100">
                        <div className="text-sm font-medium text-gray-600">Total Turn-In</div>
                        <div className="text-2xl font-bold text-orange-600">${totals.totalTurnIn.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-blue-600">
                      Showing totals for {filteredReports.length} report(s) in the selected date range
                    </div>
                  </div>
                ) : null;
              })()}
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
                  <Label htmlFor="employee-month-filter">Filter by Month</Label>
                  <Select
                    value={selectedMonth || "all"}
                    onValueChange={(value) => setSelectedMonth(value === "all" ? null : value)}
                  >
                    <SelectTrigger className="w-[200px]">
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
                
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => {
                    setSelectedMonth(null);
                  }}
                >
                  Clear Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading employee data...</div>
              ) : employeeAccountingData.length === 0 ? (
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
                        <TableHead className="text-right">Cash Paid</TableHead>
                        <TableHead className="text-right">Tax Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeeAccountingData.map((employee) => {
                        const estimatedTax = parseFloat(employee.totalEarnings) * 0.22;
                        const cashPaid = parseFloat(employee.totalAdditionalTaxPayments) || 0;
                        const taxBalance = Math.max(0, estimatedTax - parseFloat(employee.totalMoneyOwed) - cashPaid);
                        
                        return (
                          <TableRow key={employee.key}>
                            <TableCell className="font-medium">
                              {employee.name}
                            </TableCell>
                            <TableCell className="text-right">{employee.totalHours}</TableCell>
                            <TableCell className="text-right">
                              -
                            </TableCell>
                            <TableCell className="text-right">${employee.totalCommission}</TableCell>
                            <TableCell className="text-right">${employee.totalTips}</TableCell>
                            <TableCell className="text-right text-blue-700">
                              ${employee.totalMoneyOwed}
                            </TableCell>
                            <TableCell className="text-right font-medium text-blue-800">
                              ${employee.totalEarnings}
                            </TableCell>
                            <TableCell className="text-right text-red-700">
                              ${estimatedTax.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right text-green-700 font-medium">
                              ${cashPaid.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={taxBalance > 0 ? "text-red-600 font-medium" : "text-green-600"}>
                                ${taxBalance.toFixed(2)}
                              </span>
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
                  <Label htmlFor="month-filter">Filter by Month</Label>
                  <Select
                    value={selectedMonth || "all"}
                    onValueChange={(value) => setSelectedMonth(value === "all" ? null : value)}
                  >
                    <SelectTrigger className="w-[200px]">
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
                
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => {
                    setSelectedMonth(null);
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
                              <p className="text-sm text-gray-500">Daily Revenue Average</p>
                              <p className="text-xl">
                                ${location.reports > 0 
                                  ? (location.totalIncome / location.reports).toFixed(2) 
                                  : '0.00'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Partner Pay Calculator */}
                  <div className="mb-8 border p-4 rounded-lg bg-white shadow">
                    <h3 className="text-lg font-medium mb-4">Partner Pay Distribution Calculator</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-md font-medium mb-3 text-gray-700">Monthly Revenue</h4>
                        
                        <div className="space-y-4">
                          {/* Month Selector */}
                          <div className="grid grid-cols-1 gap-2">
                            <Label htmlFor="month-selector">Select Month</Label>
                            <select 
                              id="month-selector"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              onChange={(e) => {
                                const selectedMonth = e.target.value;
                                if (!selectedMonth) return;
                                
                                setCurrentMonth(selectedMonth);
                                
                                // Get monthly data for the selected month
                                const [year, month] = selectedMonth.split('-');
                                
                                // Calculate total sales for the selected month across all locations
                                let totalMonthlyIncome = 0;
                                
                                // Filter reports by selected month
                                const monthlyReports = reports.filter(report => {
                                  const reportDate = parseLocalDate(report.date);
                                  return reportDate.getFullYear().toString() === year && 
                                         (reportDate.getMonth() + 1).toString().padStart(2, '0') === month;
                                });
                                
                                // Check if this is June 2025 or later - use calculated revenue from cars parked
                                const selectedDate = new Date(selectedMonth + '-01');
                                const juneThreshold = new Date('2025-06-01');
                                
                                if (selectedDate >= juneThreshold) {
                                  // For June 2025 onwards: calculate revenue from actual cars parked data
                                  // Calculate total income based on cars parked * turn-in rate for each location
                                  monthlyReports.forEach(report => {
                                    // Get the appropriate turn-in rate based on location
                                    let turnInRate = 0;
                                    
                                    // Set turn-in rates for each location
                                    switch(report.locationId) {
                                      case 1: // Capital Grille: $11 per car
                                        turnInRate = 11;
                                        break;
                                      case 2: // Bob's Steak and Chop House: $6 per car
                                        turnInRate = 6;
                                        break;
                                      case 3: // Truluck's: $8 per car
                                        turnInRate = 8;
                                        break;
                                      case 4: // BOA Steakhouse: $7 per car
                                        turnInRate = 7;
                                        break;
                                      default:
                                        turnInRate = 0;
                                    }
                                    
                                    // Calculate revenue: number of cars × location-specific turn-in rate
                                    totalMonthlyIncome += report.totalCars * turnInRate;
                                  });
                                  
                                  // Update state with the calculated monthly revenue
                                  setMonthlyRevenue(totalMonthlyIncome);
                                } else if (manualRevenue[selectedMonth]) {
                                  // For January through May 2025: use manually set revenue values
                                  setMonthlyRevenue(manualRevenue[selectedMonth]);
                                } else {
                                  // Default case: calculate from reports if no manual value exists
                                  // Calculate total income based on cars parked * turn-in rate for each location
                                  monthlyReports.forEach(report => {
                                    // Get the appropriate turn-in rate based on location
                                    let turnInRate = 0;
                                    
                                    // Set turn-in rates for each location
                                    switch(report.locationId) {
                                      case 1: // Capital Grille: $11 per car
                                        turnInRate = 11;
                                        break;
                                      case 2: // Bob's Steak and Chop House: $6 per car
                                        turnInRate = 6;
                                        break;
                                      case 3: // Truluck's: $8 per car
                                        turnInRate = 8;
                                        break;
                                      case 4: // BOA Steakhouse: $7 per car
                                        turnInRate = 7;
                                        break;
                                      default:
                                        turnInRate = 0;
                                    }
                                    
                                    // Calculate revenue: number of cars × location-specific turn-in rate
                                    totalMonthlyIncome += report.totalCars * turnInRate;
                                  });
                                  
                                  // Update state with the calculated monthly revenue
                                  setMonthlyRevenue(totalMonthlyIncome);
                                }
                                
                                // Set saved expenses for this month if they exist
                                if (savedExpenses[selectedMonth]) {
                                  setMonthlyExpenses(savedExpenses[selectedMonth]);
                                } else {
                                  setMonthlyExpenses(0);
                                }
                              }}
                            >
                              <option value="">Select a month</option>
                              {Array.from({ length: 12 }).map((_, i) => {
                                const currentYear = new Date().getFullYear();
                                const month = i + 1;
                                const monthStr = month.toString().padStart(2, '0');
                                
                                // Only show 2025
                                const years = [2025];
                                
                                return years.map(year => (
                                  <option key={`${year}-${monthStr}`} value={`${year}-${monthStr}`}>
                                    {new Date(year, i).toLocaleString('default', { month: 'long' })} {year}
                                  </option>
                                ));
                              }).flat()}
                            </select>
                          </div>
                          
                          {/* Monthly Revenue and Expenses */}
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <Label htmlFor="monthly-revenue">Total Monthly Revenue</Label>
                              <div className="flex h-10 w-full items-center rounded-md border border-input bg-blue-50 px-3 font-medium">
                                ${monthlyRevenue.toFixed(2)}
                              </div>
                            </div>
                            
                            <div>
                              <Label htmlFor="monthly-expenses">Monthly Expenses</Label>
                              <div className="flex h-10 w-full rounded-md border border-input">
                                <span className="flex items-center px-3 text-gray-500 border-r">$</span>
                                <input
                                  id="monthly-expenses"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className="w-full h-full px-3 py-2 rounded-r-md focus:outline-none"
                                  value={monthlyExpenses}
                                  onChange={(e) => {
                                    if (savedExpenses[currentMonth] !== undefined && !isEditingExpenses) {
                                      // Show password modal if trying to edit locked expenses
                                      setShowPasswordModal(true);
                                      return;
                                    }
                                    setMonthlyExpenses(parseFloat(e.target.value) || 0);
                                  }}
                                  disabled={savedExpenses[currentMonth] !== undefined && !isEditingExpenses}
                                />
                              </div>
                              
                              {/* Save/Edit expenses buttons */}
                              {currentMonth && (
                                <div className="mt-2 flex gap-2">
                                  {savedExpenses[currentMonth] === undefined ? (
                                    // Save button - only shown for new expenses
                                    (<Button 
                                      size="sm" 
                                      className="bg-green-600 hover:bg-green-700"
                                      onClick={() => {
                                        if (!currentMonth) return;
                                        
                                        // Save the expenses for this month in state
                                        setSavedExpenses(prev => ({
                                          ...prev,
                                          [currentMonth]: monthlyExpenses
                                        }));
                                        
                                        // Also persist to localStorage for persistence across sessions
                                        try {
                                          // Get existing saved expenses
                                          const existingSavedExpenses = localStorage.getItem('savedMonthlyExpenses');
                                          const parsedExpenses = existingSavedExpenses ? 
                                            JSON.parse(existingSavedExpenses) : {};
                                          
                                          // Update with new value
                                          parsedExpenses[currentMonth] = monthlyExpenses;
                                          
                                          // Save back to localStorage
                                          localStorage.setItem('savedMonthlyExpenses', 
                                            JSON.stringify(parsedExpenses));
                                            
                                          toast({
                                            title: "Expenses saved",
                                            description: `Monthly expenses for ${new Date(parseInt(currentMonth.split('-')[0]), 
                                              parseInt(currentMonth.split('-')[1])-1).toLocaleString('default', 
                                              { month: 'long', year: 'numeric' })} saved successfully.`,
                                          });
                                          
                                          // Expenses are now locked
                                          setIsEditingExpenses(false);
                                        } catch (error) {
                                          console.error("Error saving expenses:", error);
                                          toast({
                                            title: "Error saving expenses",
                                            description: "There was a problem saving your expenses data.",
                                            variant: "destructive",
                                          });
                                        }
                                      }}
                                    >Save Expenses
                                                                          </Button>)
                                  ) : isEditingExpenses ? (
                                    // Update button - shown when editing existing expenses
                                    (<>
                                      <Button 
                                        size="sm" 
                                        className="bg-amber-600 hover:bg-amber-700"
                                        onClick={() => {
                                          if (!currentMonth) return;
                                          
                                          // Update the expenses for this month in state
                                          setSavedExpenses(prev => ({
                                            ...prev,
                                            [currentMonth]: monthlyExpenses
                                          }));
                                          
                                          // Also persist to localStorage for persistence across sessions
                                          try {
                                            // Get existing saved expenses
                                            const existingSavedExpenses = localStorage.getItem('savedMonthlyExpenses');
                                            const parsedExpenses = existingSavedExpenses ? 
                                              JSON.parse(existingSavedExpenses) : {};
                                            
                                            // Update with new value
                                            parsedExpenses[currentMonth] = monthlyExpenses;
                                            
                                            // Save back to localStorage
                                            localStorage.setItem('savedMonthlyExpenses', 
                                              JSON.stringify(parsedExpenses));
                                              
                                            toast({
                                              title: "Expenses updated",
                                              description: `Monthly expenses for ${new Date(parseInt(currentMonth.split('-')[0]), 
                                                parseInt(currentMonth.split('-')[1])-1).toLocaleString('default', 
                                                { month: 'long', year: 'numeric' })} updated successfully.`,
                                            });
                                            
                                            // Exit edit mode
                                            setIsEditingExpenses(false);
                                          } catch (error) {
                                            console.error("Error updating expenses:", error);
                                            toast({
                                              title: "Error updating expenses",
                                              description: "There was a problem updating your expenses data.",
                                              variant: "destructive",
                                            });
                                          }
                                        }}
                                      >
                                        Update Expenses
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => {
                                          // Cancel edit - revert to saved value
                                          setMonthlyExpenses(savedExpenses[currentMonth]);
                                          setIsEditingExpenses(false);
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                    </>)
                                  ) : (
                                    // Edit button - shown for saved expenses
                                    (<Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => {
                                        // Show password modal
                                        setShowPasswordModal(true);
                                      }}
                                    >Edit Expenses
                                                                          </Button>)
                                  )}
                                  
                                  {savedExpenses[currentMonth] !== undefined && !isEditingExpenses && (
                                    <div className="text-sm self-center text-green-600 ml-2">
                                      ✓ Expenses saved and locked
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Password Modal */}
                              {showPasswordModal && (
                                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                  <div className="bg-white rounded-lg p-6 max-w-md w-full">
                                    <h3 className="text-lg font-medium mb-4">Enter Password</h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                      Enter the password to edit saved expenses.
                                    </p>
                                    
                                    <div className="mb-4">
                                      <input 
                                        type="password"
                                        className="w-full p-2 border rounded"
                                        placeholder="Password"
                                        value={expensesPassword}
                                        onChange={(e) => setExpensesPassword(e.target.value)}
                                      />
                                    </div>
                                    
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setShowPasswordModal(false);
                                          setExpensesPassword("");
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                      
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          if (expensesPassword === EXPENSES_EDIT_PASSWORD) {
                                            // Correct password
                                            setIsEditingExpenses(true);
                                            setShowPasswordModal(false);
                                            setExpensesPassword("");
                                            
                                            toast({
                                              title: "Expenses unlocked",
                                              description: "You can now edit the saved expenses.",
                                            });
                                          } else {
                                            // Incorrect password
                                            toast({
                                              title: "Incorrect password",
                                              description: "The password you entered is incorrect.",
                                              variant: "destructive",
                                            });
                                          }
                                        }}
                                      >
                                        Submit
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div>
                              <Label htmlFor="distributable-income">Distributable Income</Label>
                              <div className="flex h-10 w-full items-center rounded-md border border-input bg-green-50 px-3 font-medium text-green-800">
                                ${(monthlyRevenue - monthlyExpenses).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-md font-medium mb-3 text-gray-700">Partner Distribution</h4>
                        
                        <div className="space-y-4">
                          {/* Fixed Partner Shares */}
                          <div className="border border-blue-100 rounded-md p-3 bg-blue-50">
                            <p className="mb-2 text-sm">Fixed Partner Shares:</p>
                            <ul className="space-y-1">
                              <li className="flex justify-between items-center">
                                <span>Brandon:</span> 
                                <span className="font-medium">50%</span>
                              </li>
                              <li className="flex justify-between items-center">
                                <span>Ryan:</span> 
                                <span className="font-medium">40%</span>
                              </li>
                              <li className="flex justify-between items-center">
                                <span>Dave:</span> 
                                <span className="font-medium">10%</span>
                              </li>
                            </ul>
                          </div>
                          
                          {/* Calculated Distributions */}
                          <div className="space-y-3">
                            <div>
                              <Label className="text-blue-800">Brandon (50%)</Label>
                              <div className="flex h-10 w-full items-center rounded-md border border-blue-300 bg-blue-50 px-3 font-medium">
                                ${((monthlyRevenue - monthlyExpenses) * 0.5).toFixed(2)}
                              </div>
                            </div>
                            
                            <div>
                              <Label className="text-indigo-800">Ryan (40%)</Label>
                              <div className="flex h-10 w-full items-center rounded-md border border-indigo-300 bg-indigo-50 px-3 font-medium">
                                ${((monthlyRevenue - monthlyExpenses) * 0.4).toFixed(2)}
                              </div>
                            </div>
                            
                            <div>
                              <Label className="text-teal-800">Dave (10%)</Label>
                              <div className="flex h-10 w-full items-center rounded-md border border-teal-300 bg-teal-50 px-3 font-medium">
                                ${((monthlyRevenue - monthlyExpenses) * 0.1).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Partner Payment Distribution History Table */}
                    <div className="mt-8 border border-gray-200 rounded-lg p-4 bg-white">
                      <h3 className="text-lg font-semibold mb-4">Partner Payment Distribution History</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Month</TableHead>
                            <TableHead className="text-blue-800 text-center">Brandon (50%)</TableHead>
                            <TableHead className="text-indigo-800 text-center">Ryan (40%)</TableHead>
                            <TableHead className="text-teal-800 text-center">Dave (10%)</TableHead>
                            <TableHead className="text-right">Total After Expenses</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {partnerPaymentHistory.map((entry, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{entry.month}</TableCell>
                              <TableCell className="text-blue-800 font-medium text-center">${entry.brandon.toFixed(2)}</TableCell>
                              <TableCell className="text-indigo-800 font-medium text-center">${entry.ryan.toFixed(2)}</TableCell>
                              <TableCell className="text-teal-800 font-medium text-center">${entry.dave.toFixed(2)}</TableCell>
                              <TableCell className="text-right font-semibold">${entry.total.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                          {partnerPaymentHistory.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-gray-500">
                                No partner payment history available. Select a month and add expenses to generate history.
                              </TableCell>
                            </TableRow>
                          )}
                          {partnerPaymentHistory.length > 0 && (
                            <TableRow className="bg-muted/50 font-semibold border-t-2">
                              <TableCell className="font-bold">TOTALS</TableCell>
                              <TableCell className="text-blue-800 font-bold text-center">
                                ${partnerPaymentHistory.reduce((sum, entry) => sum + entry.brandon, 0).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-indigo-800 font-bold text-center">
                                ${partnerPaymentHistory.reduce((sum, entry) => sum + entry.ryan, 0).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-teal-800 font-bold text-center">
                                ${partnerPaymentHistory.reduce((sum, entry) => sum + entry.dave, 0).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right font-bold">
                                ${partnerPaymentHistory.reduce((sum, entry) => sum + entry.total, 0).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
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
                        <BarChart
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
                        </BarChart>
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
                      <img 
                        src={addCircleIcon} 
                        alt="Add" 
                        className="w-4 h-4"
                      />
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
            
            {/* Add Tickets Modal */}
            <Dialog open={isAddTicketsOpen} onOpenChange={setIsAddTicketsOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Tickets</DialogTitle>
                  <DialogDescription>
                    Add additional tickets to {selectedDistributionForAdd ? `batch "${selectedDistributionForAdd.batchNumber}"` : 'the selected batch'}.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  {selectedDistributionForAdd && (
                    <div className="grid gap-2">
                      <Label className="text-sm text-gray-600">Current Information</Label>
                      <div className="bg-gray-50 p-3 rounded-md text-sm">
                        <div><strong>Batch:</strong> {selectedDistributionForAdd.batchNumber}</div>
                        <div><strong>Location:</strong> {LOCATIONS.find(loc => loc.id === selectedDistributionForAdd.locationId)?.name}</div>
                        <div><strong>Current Allocated:</strong> {selectedDistributionForAdd.allocatedTickets}</div>
                        <div><strong>Used:</strong> {selectedDistributionForAdd.usedTickets}</div>
                        <div><strong>Remaining:</strong> {selectedDistributionForAdd.allocatedTickets - selectedDistributionForAdd.usedTickets}</div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid gap-2">
                    <Label htmlFor="additionalTickets">Number of Tickets to Add</Label>
                    <input 
                      id="additionalTickets"
                      type="number"
                      min="1"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Enter number of tickets"
                      value={additionalTickets}
                      onChange={(e) => setAdditionalTickets(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  
                  {additionalTickets > 0 && selectedDistributionForAdd && (
                    <div className="bg-blue-50 p-3 rounded-md text-sm">
                      <div><strong>New Total:</strong> {selectedDistributionForAdd.allocatedTickets + additionalTickets}</div>
                    </div>
                  )}
                </div>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="secondary"
                    onClick={() => {
                      setIsAddTicketsOpen(false);
                      setSelectedDistributionForAdd(null);
                      setAdditionalTickets(0);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button"
                    onClick={async () => {
                      if (!selectedDistributionForAdd || additionalTickets <= 0) {
                        alert("Please enter a valid number of tickets to add.");
                        return;
                      }
                      
                      const newAllocatedTickets = selectedDistributionForAdd.allocatedTickets + additionalTickets;
                      
                      try {
                        const updateData = {
                          locationId: selectedDistributionForAdd.locationId,
                          allocatedTickets: newAllocatedTickets,
                          usedTickets: selectedDistributionForAdd.usedTickets,
                          batchNumber: selectedDistributionForAdd.batchNumber,
                          notes: selectedDistributionForAdd.notes
                        };
                        
                        const response = await fetch(`/api/ticket-distributions/${selectedDistributionForAdd.id}`, {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify(updateData),
                        });
                        
                        if (response.ok) {
                          const updatedDistribution = await response.json();
                          
                          // Update the state with the new data
                          setTicketDistributions(
                            ticketDistributions.map(d => 
                              d.id === updatedDistribution.id ? updatedDistribution : d
                            )
                          );
                          
                          // Close modal and reset
                          setIsAddTicketsOpen(false);
                          setSelectedDistributionForAdd(null);
                          setAdditionalTickets(0);
                          
                          // Show success message
                          alert(`Successfully added ${additionalTickets} tickets. New total: ${newAllocatedTickets}`);
                        } else {
                          const errorData = await response.json();
                          console.error("Error adding tickets:", errorData);
                          alert("Error adding tickets: " + (errorData.message || "Unknown error"));
                        }
                      } catch (error) {
                        console.error("Error:", error);
                        alert("Failed to add tickets");
                      }
                    }}
                  >
                    Add Tickets
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
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
                                
                                {/* Add Tickets button */}
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="px-2 h-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => {
                                    setSelectedDistributionForAdd(distribution);
                                    setAdditionalTickets(0);
                                    setIsAddTicketsOpen(true);
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                  <span className="sr-only">Add Tickets</span>
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
                                  <img 
                                    src={newBinIcon} 
                                    alt="Delete" 
                                    className="w-4 h-4"
                                  />
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
                      notes: '',
                      ssn: '',
                      fullSsn: '',
                      driversLicenseNumber: '',
                      dateOfBirth: '',
                      motorVehicleRecordsPath: ''
                    });
                    // Open dialog
                    setIsAddEmployeeOpen(true);
                  }}
                  className="flex items-center gap-1"
                >
                  <img 
                    src={addCircleIcon} 
                    alt="Add" 
                    className="w-4 h-4"
                  />
                  Add Employee
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingEmployees ? (
                <div className="text-center py-8">Loading employees...</div>
              ) : employeeRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No employees found. Add an employee to get started.
                </div>
              ) : (
                <Table>
                  <TableCaption>List of all employees</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>SSN</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Training Complete</TableHead>
                      <TableHead>Shift Leader</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Hire Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeRecords.map(employee => {
                      // Check if employee has completed training
                      const hasCompletedTraining = trainingAcknowledgments?.some((ack: any) => 
                        ack.employeeName.toLowerCase().includes(employee.fullName.toLowerCase()) ||
                        employee.fullName.toLowerCase().includes(ack.employeeName.toLowerCase())
                      );

                      return (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">{employee.fullName}</TableCell>
                          <TableCell>
                            {employee.ssn ? (
                              <span className="font-mono text-sm">****{employee.ssn.slice(-4)}</span>
                            ) : (
                              <span className="text-gray-400 text-sm">Not set</span>
                            )}
                          </TableCell>
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
                            {hasCompletedTraining ? (
                              <div className="flex justify-center">
                                <img 
                                  src={checkCompleteIcon} 
                                  alt="Training Complete" 
                                  className="w-6 h-6"
                                  title="Training Complete"
                                />
                              </div>
                            ) : (
                              <div className="flex justify-center">
                                <img 
                                  src={deleteIncompleteIcon} 
                                  alt="Training Incomplete" 
                                  className="w-6 h-6"
                                  title="Training Incomplete"
                                />
                              </div>
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
                                console.log('Opening edit dialog for employee:', employee);
                                // Set current employee data to form
                                const employeeData = {
                                  key: employee.key,
                                  fullName: employee.fullName,
                                  isActive: Boolean(employee.isActive),
                                  isShiftLeader: Boolean(employee.isShiftLeader),
                                  phone: employee.phone || '',
                                  email: employee.email || '',
                                  hireDate: employee.hireDate.split('T')[0],
                                  notes: employee.notes || '',
                                  ssn: employee.ssn || '',
                                  fullSsn: '',
                          driversLicenseNumber: employee.driversLicenseNumber || '',
                          dateOfBirth: employee.dateOfBirth ? new Date(employee.dateOfBirth).toISOString().split('T')[0] : '',
                          motorVehicleRecordsPath: employee.motorVehicleRecordsPath || ''
                                };
                                console.log('Setting form data:', employeeData);
                                setNewEmployee(employeeData);
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
                                      // Refetch employee data
                                      refetchEmployees();
                                      
                                      // Show success message
                                      alert(`Employee "${employee.fullName}" has been deactivated.`);
                                    } else {
                                      alert("Error deactivating employee");
                                    }
                                  } catch (error) {
                                    console.error("Error:", error);
                                    alert("Failed to deactivate employee");
                                  }
                                }
                              }}
                            >
                              Deactivate
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      );
                    })}
                    
                    {/* Total employees row */}
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={2} className="font-medium">
                        Total Employees: {employeeRecords.length}
                      </TableCell>
                      <TableCell colSpan={1}>
                        Active: {employeeRecords.filter(e => e.isActive).length}
                      </TableCell>
                      <TableCell colSpan={1}>
                        Shift Leaders: {employeeRecords.filter(e => e.isShiftLeader).length}
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
                            onChange={(e) => {
                              console.log('Active checkbox clicked:', e.target.checked);
                              setNewEmployee({...newEmployee, isActive: e.target.checked});
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            style={{ accentColor: '#2563eb' }}
                          />
                          <Label htmlFor="isActive" className="text-sm font-normal cursor-pointer">Active</Label>
                        </div>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label>Role</Label>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox"
                            id="isShiftLeader"
                            checked={newEmployee.isShiftLeader}
                            onChange={(e) => {
                              console.log('Shift Leader checkbox clicked:', e.target.checked);
                              setNewEmployee({...newEmployee, isShiftLeader: e.target.checked});
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            style={{ accentColor: '#2563eb' }}
                          />
                          <Label htmlFor="isShiftLeader" className="text-sm font-normal cursor-pointer">Shift Leader</Label>
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
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="driversLicense">Driver's License Number</Label>
                        <input 
                          id="driversLicense"
                          type="text"
                          placeholder="e.g., D1234567890"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={newEmployee.driversLicenseNumber}
                          onChange={(e) => setNewEmployee({...newEmployee, driversLicenseNumber: e.target.value})}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <input 
                          id="dateOfBirth"
                          type="text"
                          placeholder="MM/DD/YYYY"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={newEmployee.dateOfBirth}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, ''); // Only allow digits
                            if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2);
                            if (value.length >= 5) value = value.slice(0, 5) + '/' + value.slice(5);
                            if (value.length <= 10) {
                              setNewEmployee({...newEmployee, dateOfBirth: value});
                            }
                          }}
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
                              notes: '',
                              ssn: '',
                              fullSsn: '',
                              driversLicenseNumber: '',
                              dateOfBirth: '',
                              motorVehicleRecordsPath: ''
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
              <Dialog open={isEditEmployeeOpen} onOpenChange={(open) => {
                setIsEditEmployeeOpen(open);
                if (!open) {
                  // Reset form when dialog closes
                  console.log('Resetting edit form');
                  setNewEmployee({
                    key: '',
                    fullName: '',
                    isActive: true,
                    isShiftLeader: false,
                    phone: '',
                    email: '',
                    hireDate: new Date().toISOString().split('T')[0],
                    notes: '',
                    ssn: '',
                    fullSsn: '',
                    driversLicenseNumber: '',
                    dateOfBirth: '',
                    motorVehicleRecordsPath: ''
                  });
                  setEditingEmployeeId(null);
                }
              }}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                            onChange={(e) => {
                              console.log('Edit Active checkbox clicked:', e.target.checked);
                              setNewEmployee({...newEmployee, isActive: e.target.checked});
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            style={{ accentColor: '#2563eb' }}
                          />
                          <Label htmlFor="edit-isActive" className="text-sm font-normal cursor-pointer">Active</Label>
                        </div>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label>Role</Label>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="relative inline-flex items-center cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Custom checkbox clicked - current state:', newEmployee.isShiftLeader);
                              const newValue = !newEmployee.isShiftLeader;
                              console.log('Setting isShiftLeader to:', newValue);
                              setNewEmployee(prev => ({
                                ...prev,
                                isShiftLeader: newValue
                              }));
                            }}
                          >
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                              newEmployee.isShiftLeader 
                                ? 'bg-blue-600 border-blue-600' 
                                : 'bg-white border-gray-300 hover:border-gray-400'
                            }`}>
                              {newEmployee.isShiftLeader && (
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <Label 
                            className="text-sm font-normal cursor-pointer select-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Label clicked - current state:', newEmployee.isShiftLeader);
                              const newValue = !newEmployee.isShiftLeader;
                              console.log('Setting isShiftLeader to:', newValue);
                              setNewEmployee(prev => ({
                                ...prev,
                                isShiftLeader: newValue
                              }));
                            }}
                          >
                            Shift Leader
                          </Label>
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
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-ssn">Last 4 digits of SSN</Label>
                        <input 
                          id="edit-ssn"
                          type="text"
                          placeholder="e.g., 1234"
                          maxLength={4}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={newEmployee.ssn || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                            if (value.length <= 4) {
                              setNewEmployee({...newEmployee, ssn: value});
                            }
                          }}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="edit-fullSsn">Full SSN (optional)</Label>
                        <input 
                          id="edit-fullSsn"
                          type="text"
                          placeholder="e.g., 123-45-6789"
                          maxLength={11}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={newEmployee.fullSsn || ''}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, ''); // Only allow digits
                            if (value.length >= 3) value = value.slice(0, 3) + '-' + value.slice(3);
                            if (value.length >= 6) value = value.slice(0, 6) + '-' + value.slice(6);
                            if (value.length <= 11) {
                              setNewEmployee({...newEmployee, fullSsn: value});
                            }
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-driversLicense">Driver's License Number</Label>
                        <input 
                          id="edit-driversLicense"
                          type="text"
                          placeholder="e.g., D1234567890"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={newEmployee.driversLicenseNumber || ''}
                          onChange={(e) => setNewEmployee({...newEmployee, driversLicenseNumber: e.target.value})}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="edit-dateOfBirth">Date of Birth</Label>
                        <input 
                          id="edit-dateOfBirth"
                          type="text"
                          placeholder="MM/DD/YYYY"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={newEmployee.dateOfBirth || ''}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, ''); // Only allow digits
                            if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2);
                            if (value.length >= 5) value = value.slice(0, 5) + '/' + value.slice(5);
                            if (value.length <= 10) {
                              setNewEmployee({...newEmployee, dateOfBirth: value});
                            }
                          }}
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
                    
                    {/* Motor Vehicle Records Upload */}
                    <div className="grid gap-2">
                      <Label htmlFor="edit-motorVehicleRecords">Motor Vehicle Records (optional)</Label>
                      <div className="space-y-2">
                        {newEmployee.motorVehicleRecordsPath ? (
                          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                            <span className="text-sm text-green-700">✓ Document uploaded</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (newEmployee.motorVehicleRecordsPath) {
                                  window.open(`/api/document/${newEmployee.motorVehicleRecordsPath}`, '_blank');
                                }
                              }}
                            >
                              View
                            </Button>
                          </div>
                        ) : null}
                        <input
                          id="edit-motorVehicleRecords"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file && editingEmployeeId) {
                              const formData = new FormData();
                              formData.append('file', file);
                              formData.append('employeeId', editingEmployeeId.toString());
                              
                              try {
                                const response = await fetch('/api/upload-motor-vehicle-records', {
                                  method: 'POST',
                                  body: formData,
                                });
                                
                                if (response.ok) {
                                  const result = await response.json();
                                  setNewEmployee({...newEmployee, motorVehicleRecordsPath: result.filename});
                                } else {
                                  console.error('Upload failed');
                                }
                              } catch (error) {
                                console.error('Upload error:', error);
                              }
                            }
                          }}
                        />
                        <p className="text-xs text-gray-500">
                          Upload PDF, JPEG, or PNG files up to 10MB
                        </p>
                      </div>
                    </div>
                    
                    {/* Training Status Display */}
                    <div className="grid gap-2">
                      <Label>Safety Training Status</Label>
                      <div className="flex items-center space-x-2 p-3 rounded-lg border">
                        {hasCompletedTraining(newEmployee.fullName) ? (
                          <>
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-green-700">Training Completed</div>
                              <div className="text-xs text-gray-500">
                                Completed on {getTrainingCompletionDate(newEmployee.fullName)}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-5 w-5 text-amber-600" />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-amber-700">Training Required</div>
                              <div className="text-xs text-gray-500">
                                Employee must complete safety training before accessing dashboard
                              </div>
                            </div>
                          </>
                        )}
                      </div>
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
                            
                            // Refetch employee data
                            refetchEmployees();
                            
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

        <TabsContent value="employee-accounting">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Employee Accounting Overview
              </CardTitle>
              <CardDescription>
                Comprehensive financial breakdown for all employees including earnings, taxes, and money owed calculations. Includes both active and inactive employees for audit compliance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-end gap-4 border p-4 rounded-md bg-gray-50 mb-6">
                <div className="space-y-2">
                  <label htmlFor="accounting-month-select" className="text-sm font-medium">Filter by Month</label>
                  <Select value={selectedAccountingMonth} onValueChange={setSelectedAccountingMonth}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select a month" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
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
                
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => {
                    const now = new Date();
                    setSelectedAccountingMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
                  }}
                >
                  Current Month
                </Button>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Calculate employee accounting data with month filtering
                    const employeeAccountingData = allEmployeeRecords.map(employee => {
                      const employeeReports = reports.filter((report: any) => {
                        const reportDate = parseLocalDate(report.date);
                        const reportMonth = `${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, '0')}`;
                        
                        if (selectedAccountingMonth && selectedAccountingMonth !== "all" && reportMonth !== selectedAccountingMonth) {
                          return false;
                        }

                        return employeeWorkedInShift(report, employee);
                      });

                      let totalEarnings = 0;
                      let totalMoneyOwed = 0;
                      let totalHours = 0;
                      let totalCommissionOnly = 0;
                      let totalTipsOnly = 0;

                      employeeReports.forEach((report: any) => {
                        const employees = parseEmployeesData(report.employees);
                        const employeeData = findEmployeeInShift(employees, employee);

                        if (employeeData) {
                          const totalJobHours = report.totalJobHours || employees.reduce((sum: any, emp: any) => sum + (emp.hours || 0), 0);
                          const hoursPercent = totalJobHours > 0 ? employeeData.hours / totalJobHours : 0;

                          // Commission calculation
                          const locationId = report.locationId;
                          let commissionRate = 4;
                          if (locationId === 1) commissionRate = 4;
                          else if (locationId === 2) commissionRate = 9;
                          else if (locationId === 3) commissionRate = 7;
                          else if (locationId === 4) commissionRate = 6;
                          else if (locationId === 7) commissionRate = 2;

                          const cashCars = report.totalCars - report.creditTransactions - report.totalReceipts;
                          const totalCommission = (report.creditTransactions * commissionRate) + 
                                                 (cashCars * commissionRate) + 
                                                 (report.totalReceipts * commissionRate);
                          
                          // Tips calculations
                          let perCarPrice = 15;
                          if (locationId === 4) perCarPrice = 13;
                          else if (locationId === 7) perCarPrice = 6;
                          else if (locationId >= 5) {
                            const currentLocation = locations?.find((loc: any) => loc.id === locationId);
                            perCarPrice = currentLocation?.curbsideRate || 15;
                          }
                          
                          const creditCardTips = Math.abs(report.creditTransactions * perCarPrice - report.totalCreditSales);
                          const cashTips = Math.abs(cashCars * perCarPrice - (report.totalCashCollected - report.companyCashTurnIn));
                          const receiptTips = report.totalReceipts * 3;
                          const totalTips = creditCardTips + cashTips + receiptTips;
                          
                          const empCommission = totalCommission * hoursPercent;
                          const empTips = totalTips * hoursPercent;
                          const empEarnings = empCommission + empTips;

                          // Money owed calculation
                          const receiptSales = report.totalReceipts * 18;
                          const totalCollections = report.totalCreditSales + receiptSales;
                          const totalMoneyOwedOnShift = Math.max(0, totalCollections - report.totalTurnIn);
                          const moneyOwed = totalMoneyOwedOnShift * hoursPercent;

                          totalEarnings += empEarnings;
                          totalMoneyOwed += moneyOwed;
                          totalHours += employeeData.hours;
                          totalCommissionOnly += empCommission;
                          totalTipsOnly += empTips;
                        }
                      });

                      const advance = totalCommissionOnly + totalTipsOnly - totalMoneyOwed;

                      return {
                        name: employee.fullName,
                        key: employee.key,
                        totalHours: totalHours.toFixed(1),
                        totalCommission: totalCommissionOnly.toFixed(2),
                        totalTips: totalTipsOnly.toFixed(2),
                        totalEarnings: totalEarnings.toFixed(2),
                        totalMoneyOwed: totalMoneyOwed.toFixed(2),
                        advance: advance.toFixed(2),
                        shiftsWorked: employeeReports.length
                      };
                    });

                    // Create CSV content
                    const headers = [
                      'Employee',
                      'Hours',
                      'Shifts',
                      'Commission',
                      'Tips', 
                      'Total Earnings',
                      'Money Owed',
                      'Advance'
                    ];

                    // Sort employees by last name for CSV export too
                    const sortedDataForCSV = employeeAccountingData.sort((a, b) => {
                      const getLastName = (fullName) => {
                        const nameParts = fullName.trim().split(' ');
                        return nameParts[nameParts.length - 1].toLowerCase();
                      };
                      
                      const lastNameA = getLastName(a.name);
                      const lastNameB = getLastName(b.name);
                      
                      return lastNameA.localeCompare(lastNameB);
                    });

                    const csvContent = [
                      headers.join(','),
                      ...sortedDataForCSV.map(emp => [
                        `"${emp.name}"`,
                        emp.totalHours,
                        emp.shiftsWorked,
                        emp.totalCommission,
                        emp.totalTips,
                        emp.totalEarnings,
                        emp.totalMoneyOwed,
                        emp.advance
                      ].join(','))
                    ].join('\n');

                    // Download CSV
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    const monthLabel = selectedAccountingMonth ? 
                      ` - ${selectedAccountingMonth}` : ' - All Months';
                    a.download = `employee-accounting${monthLabel}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                  }}
                >
                  Export CSV
                </Button>
              </div>

              {(() => {
                // Calculate employee accounting data with month filtering
                const employeeAccountingData = allEmployeeRecords.map(employee => {
                  const employeeReports = reports.filter((report: any) => {
                    // Apply month filter first - use timezone-safe date parsing
                    const reportDate = parseLocalDate(report.date);
                    const reportMonth = `${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, '0')}`;
                    
                    if (selectedAccountingMonth && reportMonth !== selectedAccountingMonth) {
                      return false;
                    }

                    // Then filter by employee participation using proper utility function
                    return employeeWorkedInShift(report, employee);
                  });

                  // Calculate totals for this employee
                  let totalEarnings = 0;
                  let totalTax = 0;
                  let totalMoneyOwed = 0;
                  let totalAdditionalTaxPayments = 0;
                  let totalHours = 0;

                  employeeReports.forEach((report: any) => {
                    const employees = parseEmployeesData(report.employees);
                    const employeeData = findEmployeeInShift(employees, employee);

                    if (employeeData) {
                      const totalJobHours = report.totalJobHours || employees.reduce((sum: any, emp: any) => sum + (emp.hours || 0), 0);
                      const hoursPercent = totalJobHours > 0 ? employeeData.hours / totalJobHours : 0;

                      // Commission calculation - correct rates for each location
                      const locationId = report.locationId;
                      let commissionRate = 4; // Default
                      if (locationId === 1) { // Capital Grille
                        commissionRate = 4;
                      } else if (locationId === 2) { // Bob's
                        commissionRate = 9;
                      } else if (locationId === 3) { // Truluck's
                        commissionRate = 7;
                      } else if (locationId === 4) { // BOA
                        commissionRate = 6;
                      } else if (locationId === 7) { // PPS
                        commissionRate = 2;
                      }
                      const cashCars = report.totalCars - report.creditTransactions - report.totalReceipts;
                      
                      const totalCommission = (report.creditTransactions * commissionRate) + 
                                             (cashCars * commissionRate) + 
                                             (report.totalReceipts * commissionRate);
                      
                      // Tips calculations - using correct per-car rates for each location
                      let perCarPrice = 15; // Default rate
                      if (locationId === 4) { // BOA uses $13
                        perCarPrice = 13;
                      } else if (locationId === 7) { // PPS uses $6
                        perCarPrice = 6;
                      } else if (locationId >= 5) { // New locations use dynamic rates
                        const currentLocation = locations?.find((loc: any) => loc.id === locationId);
                        perCarPrice = currentLocation?.curbsideRate || 15;
                      }
                      
                      const creditCardTips = Math.abs(report.creditTransactions * perCarPrice - report.totalCreditSales);
                      const cashTips = Math.abs(cashCars * perCarPrice - (report.totalCashCollected - report.companyCashTurnIn));
                      const receiptTips = report.totalReceipts * 3; // $3 tip per receipt
                      const totalTips = creditCardTips + cashTips + receiptTips;
                      const empCommission = totalCommission * hoursPercent;
                      const empTips = totalTips * hoursPercent;
                      const empEarnings = empCommission + empTips;

                      // Money owed calculation - using exact same logic as employee dashboard
                      const receiptSales = report.totalReceipts * 18;
                      const totalCollections = report.totalCreditSales + receiptSales;
                      const totalMoneyOwedOnShift = Math.max(0, totalCollections - report.totalTurnIn);
                      const moneyOwed = totalMoneyOwedOnShift * hoursPercent;

                      // Tax calculations
                      const tax = empEarnings * 0.22;
                      
                      // Additional tax payments = remaining tax owed after subtracting money owed and cash already paid
                      const shiftReportCashPaid = Number(employeeData.cashPaid || 0);
                      
                      const employeeRecord = employeeRecords.find(emp => emp.key.toLowerCase() === employee.key.toLowerCase());
                      const employeeTaxPayments = (taxPayments as any[])?.filter((payment: any) => 
                        payment.employeeId === employeeRecord?.id && payment.reportId === report.id
                      ) || [];
                      const taxRecordCashPaid = employeeTaxPayments.reduce((sum: number, payment: any) => 
                        sum + Number(payment.paidAmount || 0), 0
                      );
                      
                      const cashPaid = Math.max(shiftReportCashPaid, taxRecordCashPaid);
                      const additionalTaxPayments = 0; // Tax calculations removed
                      


                      totalEarnings += empEarnings;
                      totalTax += 0; // Tax calculations removed
                      totalMoneyOwed += moneyOwed;
                      totalAdditionalTaxPayments += additionalTaxPayments;
                      totalHours += employeeData.hours;
                      

                    }
                  });

                  const moneyOwedAfterTax = Math.max(0, totalTax - totalMoneyOwed - totalAdditionalTaxPayments);
                  
                  // Calculate totals for commission and tips separately
                  let totalCommissionOnly = 0;
                  let totalTipsOnly = 0;
                  
                  employeeReports.forEach((report: any) => {
                    const employees = parseEmployeesData(report.employees);
                    const employeeData = findEmployeeInShift(employees, employee);

                    if (employeeData) {
                      const totalJobHours = report.totalJobHours || employees.reduce((sum: any, emp: any) => sum + (emp.hours || 0), 0);
                      const hoursPercent = totalJobHours > 0 ? employeeData.hours / totalJobHours : 0;

                      // Commission calculation
                      const locationId = report.locationId;
                      let commissionRate = 4;
                      if (locationId === 1) commissionRate = 4;
                      else if (locationId === 2) commissionRate = 9;
                      else if (locationId === 3) commissionRate = 7;
                      else if (locationId === 4) commissionRate = 6;
                      else if (locationId === 7) commissionRate = 2;

                      const cashCars = report.totalCars - report.creditTransactions - report.totalReceipts;
                      const totalCommission = (report.creditTransactions * commissionRate) + 
                                             (cashCars * commissionRate) + 
                                             (report.totalReceipts * commissionRate);
                      
                      // Tips calculations - using correct per-car rates for each location
                      let perCarPrice = 15; // Default rate
                      if (report.locationId === 4) { // BOA uses $13
                        perCarPrice = 13;
                      } else if (locationId === 7) { // PPS uses $6
                        perCarPrice = 6;
                      } else if (report.locationId >= 5) { // New locations use dynamic rates
                        const currentLocation = locations?.find((loc: any) => loc.id === report.locationId);
                        perCarPrice = currentLocation?.curbsideRate || 15;
                      }
                      
                      const creditCardTips = Math.abs(report.creditTransactions * perCarPrice - report.totalCreditSales);
                      const cashTips = Math.abs(cashCars * perCarPrice - (report.totalCashCollected - report.companyCashTurnIn));
                      const receiptTips = report.totalReceipts * 3;
                      const totalTips = creditCardTips + cashTips + receiptTips;

                      totalCommissionOnly += totalCommission * hoursPercent;
                      totalTipsOnly += totalTips * hoursPercent;
                    }
                  });

                  const advance = totalCommissionOnly + totalTipsOnly - totalMoneyOwed;

                  return {
                    name: employee.fullName,
                    key: employee.key,
                    totalHours,
                    totalCommission: totalCommissionOnly,
                    totalTips: totalTipsOnly,
                    totalEarnings,
                    totalTax,
                    totalMoneyOwed,
                    totalAdditionalTaxPayments,
                    moneyOwedAfterTax,
                    advance,
                    shiftsWorked: employeeReports.length
                  };
                });

                // Sort employees by last name (extract last name from full name)
                const sortedEmployeeAccountingData = employeeAccountingData.sort((a, b) => {
                  const getLastName = (fullName) => {
                    const nameParts = fullName.trim().split(' ');
                    return nameParts[nameParts.length - 1].toLowerCase();
                  };
                  
                  const lastNameA = getLastName(a.name);
                  const lastNameB = getLastName(b.name);
                  
                  return lastNameA.localeCompare(lastNameB);
                });

                return (
                  <div className="space-y-6">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableCaption>Employee Financial Summary - All Periods (Sorted by Last Name)</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead className="text-center">Hours</TableHead>
                            <TableHead className="text-center">Shifts</TableHead>
                            <TableHead className="text-center">Commission</TableHead>
                            <TableHead className="text-center">Credit Tips</TableHead>
                            <TableHead className="text-center">Cash Tips</TableHead>
                            <TableHead className="text-center">Total Earnings</TableHead>
                            <TableHead className="text-center">Money Owed</TableHead>
                            <TableHead className="text-center">Advance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedEmployeeAccountingData.map((employee) => (
                            <TableRow key={employee.key}>
                              <TableCell className="font-medium">
                                <Button
                                  variant="link"
                                  className="p-0 h-auto font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                  onClick={() => {
                                    const employeeRecord = allEmployeeRecords.find(emp => emp.fullName === employee.name);
                                    if (employeeRecord) {
                                      const shiftBreakdowns = generateEmployeeShiftBreakdown(employeeRecord);
                                      setSelectedEmployeeShifts({
                                        employee: employeeRecord,
                                        shifts: shiftBreakdowns
                                      });
                                      setShowEmployeeShiftsModal(true);
                                    }
                                  }}
                                >
                                  {employee.name}
                                </Button>
                              </TableCell>
                              <TableCell className="text-center">{employee.totalHours.toFixed(1)}</TableCell>
                              <TableCell className="text-center">{employee.shiftsWorked}</TableCell>
                              <TableCell className="text-center text-blue-600 font-medium">
                                ${employee.totalCommission.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-center text-green-600 font-medium">
                                ${((employee as any).totalCreditTips || 0).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-center text-green-600 font-medium">
                                ${((employee as any).totalCashTips || 0).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-center">${employee.totalEarnings.toFixed(2)}</TableCell>
                              <TableCell className="text-center text-green-600 font-medium">
                                ${employee.totalMoneyOwed.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-center text-orange-600 font-bold">
                                ${employee.advance.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/50 font-bold">
                            <TableCell>TOTALS</TableCell>
                            <TableCell className="text-center">
                              {employeeAccountingData.reduce((sum, emp) => sum + emp.totalHours, 0).toFixed(1)}
                            </TableCell>
                            <TableCell className="text-center">
                              {employeeAccountingData.reduce((sum, emp) => sum + emp.shiftsWorked, 0)}
                            </TableCell>
                            <TableCell className="text-center text-blue-600">
                              ${employeeAccountingData.reduce((sum, emp) => sum + emp.totalCommission, 0).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center text-green-600">
                              ${employeeAccountingData.reduce((sum, emp) => sum + ((emp as any).totalCreditTips || 0), 0).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center text-green-600">
                              ${employeeAccountingData.reduce((sum, emp) => sum + ((emp as any).totalCashTips || 0), 0).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center">
                              ${employeeAccountingData.reduce((sum, emp) => sum + emp.totalEarnings, 0).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center text-green-600">
                              ${employeeAccountingData.reduce((sum, emp) => sum + emp.totalMoneyOwed, 0).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center text-orange-600">
                              ${employeeAccountingData.reduce((sum, emp) => sum + emp.advance, 0).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <div className="bg-green-100 p-3 rounded-full">
                              <DollarSign className="h-6 w-6 text-green-700" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Total Money Owed to Employees</p>
                              <h3 className="text-2xl font-bold text-green-700">
                                ${employeeAccountingData.reduce((sum, emp) => sum + emp.totalMoneyOwed, 0).toFixed(2)}
                              </h3>
                            </div>
                          </div>
                        </CardContent>
                      </Card>


                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="hours-tracker">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Weekly Hours Tracker
                  </CardTitle>
                  <CardDescription>
                    Monitor employee weekly hours and receive alerts when approaching 40-hour limit
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedWeekOffset(Math.min(selectedWeekOffset + 1, 5))}
                    disabled={selectedWeekOffset >= 5}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Previous Week
                  </button>
                  <span className="text-sm text-gray-600">
                    {selectedWeekOffset === 0 ? 'Current Week' : `${selectedWeekOffset} week${selectedWeekOffset > 1 ? 's' : ''} ago`}
                  </span>
                  <button
                    onClick={() => setSelectedWeekOffset(Math.max(selectedWeekOffset - 1, 0))}
                    disabled={selectedWeekOffset <= 0}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next Week →
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                // Calculate weekly hours for each employee
                const weeklyHours: Record<string, { 
                  employee: any, 
                  totalHours: number, 
                  weeklyBreakdown: Record<string, number>,
                  status: 'safe' | 'warning' | 'critical'
                }> = {};

                // Initialize all employees with 0 hours
                (employeeRecords || []).forEach((emp: any) => {
                  weeklyHours[emp.key] = {
                    employee: emp,
                    totalHours: 0,
                    weeklyBreakdown: {},
                    status: 'safe'
                  };
                });


                // Get selected week start (Sunday)
                const today = new Date();
                const selectedWeekStart = new Date(today);
                selectedWeekStart.setDate(today.getDate() - today.getDay() - (selectedWeekOffset * 7));
                selectedWeekStart.setHours(0, 0, 0, 0);

                const selectedWeekEnd = new Date(selectedWeekStart);
                selectedWeekEnd.setDate(selectedWeekStart.getDate() + 6);
                selectedWeekEnd.setHours(23, 59, 59, 999);

                // Process reports for selected week
                reports.forEach((report: any) => {
                  // Parse date correctly to avoid timezone issues
                  const reportDate = parseReportDate(report.date);
                  
                  if (reportDate >= selectedWeekStart && reportDate <= selectedWeekEnd) {
                    // Use the improved parseEmployeesData utility function
                    const reportEmployees = parseEmployeesData(report.employees);
                    
                    // Skip empty employee arrays
                    if (!Array.isArray(reportEmployees) || reportEmployees.length === 0) {
                      return;
                    }

                    // Process each employee for this report
                    reportEmployees.forEach((emp: any) => {
                      // Employee data is stored with 'name' field containing the employee key
                      // Check if we have this employee in our weeklyHours tracking
                      if (emp.name && weeklyHours[emp.name] && typeof emp.hours === 'number') {
                        const dayName = reportDate.toLocaleDateString('en-US', { weekday: 'short' });
                        weeklyHours[emp.name].weeklyBreakdown[dayName] = (weeklyHours[emp.name].weeklyBreakdown[dayName] || 0) + emp.hours;
                        weeklyHours[emp.name].totalHours += emp.hours;
                        
                        // Determine status
                        if (weeklyHours[emp.name].totalHours >= 38) {
                          weeklyHours[emp.name].status = 'critical';
                        } else if (weeklyHours[emp.name].totalHours >= 30) {
                          weeklyHours[emp.name].status = 'warning';
                        }
                      }
                    });
                  }
                });

                const weeklyData = Object.values(weeklyHours).sort((a, b) => a.employee.fullName.localeCompare(b.employee.fullName));
                const criticalEmployees = weeklyData.filter(emp => emp.status === 'critical');
                const warningEmployees = weeklyData.filter(emp => emp.status === 'warning');

                return (
                  <div className="space-y-6">
                    {/* Alert Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="border-red-200 bg-red-50">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-red-100 p-2 rounded-full">
                              <Clock className="h-4 w-4 text-red-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-red-800">Critical (38+ hours)</p>
                              <p className="text-2xl font-bold text-red-900">{criticalEmployees.length}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-yellow-200 bg-yellow-50">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-yellow-100 p-2 rounded-full">
                              <Clock className="h-4 w-4 text-yellow-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-yellow-800">Warning (30+ hours)</p>
                              <p className="text-2xl font-bold text-yellow-900">{warningEmployees.length}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-green-200 bg-green-50">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-green-100 p-2 rounded-full">
                              <Clock className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-green-800">Total Employees</p>
                              <p className="text-2xl font-bold text-green-900">{weeklyData.length}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Weekly Hours Table */}
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead className="text-center">Sun</TableHead>
                            <TableHead className="text-center">Mon</TableHead>
                            <TableHead className="text-center">Tue</TableHead>
                            <TableHead className="text-center">Wed</TableHead>
                            <TableHead className="text-center">Thu</TableHead>
                            <TableHead className="text-center">Fri</TableHead>
                            <TableHead className="text-center">Sat</TableHead>
                            <TableHead className="text-right">Total Hours</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {weeklyData.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                                No employee hours recorded for this week yet
                              </TableCell>
                            </TableRow>
                          ) : (
                            weeklyData.map((empData) => (
                              <TableRow key={empData.employee.key} className={
                                empData.status === 'critical' ? 'bg-red-50' :
                                empData.status === 'warning' ? 'bg-yellow-50' : ''
                              }>
                                <TableCell className="font-medium">{empData.employee.fullName}</TableCell>
                                <TableCell className="text-center">{empData.weeklyBreakdown['Sun'] || '-'}</TableCell>
                                <TableCell className="text-center">{empData.weeklyBreakdown['Mon'] || '-'}</TableCell>
                                <TableCell className="text-center">{empData.weeklyBreakdown['Tue'] || '-'}</TableCell>
                                <TableCell className="text-center">{empData.weeklyBreakdown['Wed'] || '-'}</TableCell>
                                <TableCell className="text-center">{empData.weeklyBreakdown['Thu'] || '-'}</TableCell>
                                <TableCell className="text-center">{empData.weeklyBreakdown['Fri'] || '-'}</TableCell>
                                <TableCell className="text-center">{empData.weeklyBreakdown['Sat'] || '-'}</TableCell>
                                <TableCell className="text-right font-bold">
                                  {empData.totalHours.toFixed(1)}
                                </TableCell>
                                <TableCell className="text-center">
                                  {empData.status === 'critical' && (
                                    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                      Critical
                                    </span>
                                  )}
                                  {empData.status === 'warning' && (
                                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                                      Warning
                                    </span>
                                  )}
                                  {empData.status === 'safe' && (
                                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                      Safe
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Weekly Period Info */}
                    <div className="text-sm text-gray-600 text-center">
                      Week of {selectedWeekStart.toLocaleDateString()} - {selectedWeekEnd.toLocaleDateString()}
                      {selectedWeekOffset === 0 && <span className="ml-2 text-blue-600 font-medium">(Current Week)</span>}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incident-reports">
          <Card>
            <CardHeader>
              <CardTitle>Incident Reports</CardTitle>
              <CardDescription>
                View all submitted incident reports from your locations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const { data: incidentReports, isLoading: incidentReportsLoading } = useQuery({
                  queryKey: ["/api/incident-reports"],
                  queryFn: getQueryFn({ on401: "returnNull" }),
                });

                const { data: employees } = useQuery({
                  queryKey: ["/api/employees"],
                  queryFn: getQueryFn({ on401: "returnNull" }),
                });

                const deleteIncidentMutation = useMutation({
                  mutationFn: async (id: number) => {
                    const response = await apiRequest("DELETE", `/api/incident-reports/${id}`);
                    return response;
                  },
                  onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ["/api/incident-reports"] });
                    toast({
                      title: "Success",
                      description: "Incident report deleted successfully",
                    });
                  },
                  onError: () => {
                    toast({
                      title: "Error",
                      description: "Failed to delete incident report",
                      variant: "destructive",
                    });
                  },
                });

                const updateIncidentMutation = useMutation({
                  mutationFn: async ({ reportId, updates }: { reportId: number, updates: any }) => {
                    const response = await apiRequest("PUT", `/api/incident-reports/${reportId}`, updates);
                    return response.json();
                  },
                  onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ["/api/incident-reports"] });
                    toast({
                      title: "Updated",
                      description: "Incident report updated successfully",
                    });
                  },
                  onError: () => {
                    toast({
                      title: "Error",
                      description: "Failed to update incident report",
                      variant: "destructive",
                    });
                  },
                });

                if (incidentReportsLoading) {
                  return <div className="text-center py-8">Loading incident reports...</div>;
                }

                if (!incidentReports || incidentReports.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No incident reports</h3>
                      <p className="text-gray-500">No incident reports have been submitted yet.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={carRepairFireIcon} 
                          alt="Car Repair Fire" 
                          className="h-5 w-5"
                        />
                        <div>
                          <h4 className="font-medium text-blue-900">Total Reports: {incidentReports.length}</h4>
                          <p className="text-sm text-blue-700">All incident reports are stored here for your review</p>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date/Time</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Employee</TableHead>
                            <TableHead>Vehicle</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="w-[100px] text-center">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {incidentReports.map((report: any) => {
                            const employee = employees?.find((emp: any) => emp.id === report.employeeId);
                            
                            return (
                              <TableRow key={report.id}>
                                <TableCell>
                                  <div className="text-sm">
                                    <div className="font-medium">{report.incidentDate}</div>
                                    <div className="text-gray-500">{report.incidentTime}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <CompactCustomerInfo 
                                    name={report.customerName}
                                    email={report.customerEmail}
                                    phone={report.customerPhone}
                                  />
                                </TableCell>
                                <TableCell className="font-medium">{report.incidentLocation}</TableCell>
                                <TableCell>{employee?.fullName || 'Unknown'}</TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <div className="font-medium">{report.vehicleYear} {report.vehicleMake} {report.vehicleModel}</div>
                                    <div className="text-gray-500">{report.vehicleColor}</div>
                                    <div className="text-gray-500">{report.vehicleLicensePlate}</div>
                                  </div>
                                </TableCell>
                                <TableCell className="max-w-[300px]">
                                  <ExpandableDescription 
                                    incident={report.incidentDescription}
                                    damage={report.damageDescription}
                                    witness={report.witnessName ? `${report.witnessName} (${report.witnessPhone})` : undefined}
                                    notes={report.additionalNotes}
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex gap-2 justify-center">
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button variant="outline" size="sm">
                                          View
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="w-[95vw] max-w-4xl h-[90vh] max-h-[90vh] flex flex-col p-4 sm:p-6">
                                        <DialogHeader className="flex-shrink-0 pb-2 sm:pb-4">
                                          <DialogTitle className="text-lg sm:text-xl">Incident Report Details</DialogTitle>
                                          <DialogDescription className="text-sm">
                                            Submitted on {new Date(report.submittedAt).toLocaleString()}
                                          </DialogDescription>
                                        </DialogHeader>
                                        <div className="flex-1 overflow-y-auto px-1 pb-4" style={{ WebkitOverflowScrolling: 'touch' }}>
                                          <div className="space-y-4 sm:space-y-6">
                                            {/* Customer & Incident Info */}
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                              <div className="space-y-3">
                                                <div>
                                                  <Label className="text-base font-semibold text-gray-900">Customer Information</Label>
                                                  <div className="mt-2 bg-gray-50 p-3 rounded-lg space-y-1">
                                                    <div className="text-sm"><span className="font-medium">Name:</span> {report.customerName}</div>
                                                    <div className="text-sm"><span className="font-medium">Email:</span> {report.customerEmail}</div>
                                                    <div className="text-sm"><span className="font-medium">Phone:</span> {report.customerPhone}</div>
                                                  </div>
                                                </div>
                                              </div>
                                              
                                              <div className="space-y-3">
                                                <div>
                                                  <Label className="text-base font-semibold text-gray-900">Incident Details</Label>
                                                  <div className="mt-2 bg-gray-50 p-3 rounded-lg space-y-1">
                                                    <div className="text-sm"><span className="font-medium">Date:</span> {report.incidentDate}</div>
                                                    <div className="text-sm"><span className="font-medium">Time:</span> {report.incidentTime}</div>
                                                    <div className="text-sm"><span className="font-medium">Location:</span> {report.incidentLocation}</div>
                                                    <div className="text-sm"><span className="font-medium">Employee:</span> {employee?.fullName || 'Unknown'}</div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                            
                                            {/* Vehicle Information */}
                                            <div>
                                              <Label className="text-base font-semibold text-gray-900">Vehicle Information</Label>
                                              <div className="mt-2 bg-gray-50 p-3 rounded-lg">
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                  <div className="text-sm"><span className="font-medium">Vehicle:</span> {report.vehicleYear} {report.vehicleMake} {report.vehicleModel}</div>
                                                  <div className="text-sm"><span className="font-medium">Color:</span> {report.vehicleColor}</div>
                                                  <div className="text-sm"><span className="font-medium">License:</span> {report.vehicleLicensePlate}</div>
                                                </div>
                                              </div>
                                            </div>
                                            
                                            {/* Descriptions */}
                                            <div className="grid grid-cols-1 gap-4">
                                              <div>
                                                <Label className="text-base font-semibold text-gray-900">Incident Description</Label>
                                                <div className="mt-2 bg-gray-50 p-3 rounded-lg">
                                                  <p className="text-sm leading-relaxed">{report.incidentDescription}</p>
                                                </div>
                                              </div>
                                              
                                              <div>
                                                <Label className="text-base font-semibold text-gray-900">Damage Description</Label>
                                                <div className="mt-2 bg-gray-50 p-3 rounded-lg">
                                                  <p className="text-sm leading-relaxed">{report.damageDescription}</p>
                                                </div>
                                              </div>
                                            </div>
                                            
                                            {/* Witness Information */}
                                            {(report.witnessName || report.witnessPhone) && (
                                              <div>
                                                <Label className="text-base font-semibold text-gray-900">Witness Information</Label>
                                                <div className="mt-2 bg-gray-50 p-3 rounded-lg space-y-1">
                                                  {report.witnessName && <div className="text-sm"><span className="font-medium">Name:</span> {report.witnessName}</div>}
                                                  {report.witnessPhone && <div className="text-sm"><span className="font-medium">Phone:</span> {report.witnessPhone}</div>}
                                                </div>
                                              </div>
                                            )}
                                            
                                            {/* Additional Notes */}
                                            {report.additionalNotes && (
                                              <div>
                                                <Label className="text-base font-semibold text-gray-900">Additional Notes</Label>
                                                <div className="mt-2 bg-gray-50 p-3 rounded-lg">
                                                  <p className="text-sm leading-relaxed">{report.additionalNotes}</p>
                                                </div>
                                              </div>
                                            )}
                                            
                                            {/* Photos */}
                                            <div>
                                              <Label className="text-base font-semibold text-gray-900">Photos ({Math.max(report.photoUrls?.length || 0, report.photoData?.length || 0)})</Label>
                                              {((report.photoUrls && report.photoUrls.length > 0) || (report.photoData && report.photoData.length > 0)) ? (
                                                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                                                  {(report.photoUrls || []).map((url: string, index: number) => {
                                                    // Use base64 data if URL is broken or doesn't exist
                                                    const base64Data = report.photoData?.[index];
                                                    const imageSrc = base64Data ? `data:image/jpeg;base64,${base64Data}` : url;
                                                    
                                                    return (
                                                      <div key={index} className="relative group">
                                                        <img 
                                                          src={imageSrc} 
                                                          alt={`Incident photo ${index + 1}`}
                                                          className="w-full h-16 sm:h-24 object-cover rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                                          onClick={() => window.open(imageSrc, '_blank')}
                                                          onError={(e) => {
                                                            // Show placeholder if image fails to load
                                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk0YTNiOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk1pc3NpbmcgSW1hZ2U8L3RleHQ+PC9zdmc+';
                                                          }}
                                                        />
                                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all"></div>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              ) : (
                                                <div className="mt-2 text-gray-500 italic">No photos attached to this incident report</div>
                                              )}
                                              
                                              {/* Add Photo Button for existing reports */}
                                              <div className="mt-3">
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                                  onClick={() => {
                                                    // Create file input and trigger it
                                                    const input = document.createElement('input');
                                                    input.type = 'file';
                                                    input.accept = 'image/*';
                                                    input.multiple = true;
                                                    input.onchange = async (e) => {
                                                      const files = (e.target as HTMLInputElement).files;
                                                      if (!files || files.length === 0) return;
                                                      
                                                      // Convert files to base64 and add to report
                                                      const newPhotoData: string[] = [];
                                                      const newPhotoUrls: string[] = [];
                                                      
                                                      for (const file of Array.from(files)) {
                                                        const reader = new FileReader();
                                                        reader.onload = async (e) => {
                                                          if (e.target?.result) {
                                                            const base64 = (e.target.result as string).split(',')[1];
                                                            newPhotoData.push(base64);
                                                            newPhotoUrls.push(`data:${file.type};base64,${base64}`);
                                                            
                                                            // When all files are processed, update the report
                                                            if (newPhotoData.length === files.length) {
                                                              const updatedPhotoUrls = [...(report.photoUrls || []), ...newPhotoUrls];
                                                              const updatedPhotoData = [...(report.photoData || []), ...newPhotoData];
                                                              
                                                              updateIncidentMutation.mutate({
                                                                reportId: report.id,
                                                                updates: {
                                                                  photoUrls: updatedPhotoUrls,
                                                                  photoData: updatedPhotoData
                                                                }
                                                              });
                                                            }
                                                          }
                                                        };
                                                        reader.readAsDataURL(file);
                                                      }
                                                    };
                                                    input.click();
                                                  }}
                                                >
                                                  Add Photos
                                                </Button>
                                              </div>
                                            </div>
                                          
                                            {/* Fault Determination Section */}
                                            <div className="mb-8">
                                              <Label className="text-base font-semibold text-gray-900">Fault Determination & Status</Label>
                                              <div className="mt-2 bg-blue-50 p-4 rounded-lg border border-blue-200">
                                                <FaultDeterminationSection report={report} />
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {/* Footer with Save Button */}
                                        <div className="flex-shrink-0 border-t pt-3 sm:pt-4 mt-4 bg-white">
                                          <div className="flex justify-between items-center gap-3">
                                            <div className="text-xs sm:text-sm text-gray-500">
                                              Changes are saved automatically
                                            </div>
                                            <Button 
                                              onClick={() => {
                                                // All changes are already handled by individual components
                                                toast({
                                                  title: "Changes Saved",
                                                  description: "All incident report updates have been saved successfully.",
                                                });
                                              }}
                                              className="w-24 sm:w-32 text-sm"
                                              size="sm"
                                            >
                                              Done
                                            </Button>
                                          </div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                    
                                    <RepairStatusDropdown 
                                      report={report} 
                                      updateMutation={updateIncidentMutation} 
                                      deleteMutation={deleteIncidentMutation}
                                    />
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Location Management Tab */}
        <TabsContent value="location-management">
          <Card>
            <CardHeader>
              <CardTitle>Location Management</CardTitle>
              <CardDescription>
                Configure location rates and settings for each restaurant
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const { data: locations, isLoading: locationsLoading, refetch: refetchLocations } = useQuery({
                  queryKey: ["/api/locations"],
                  queryFn: getQueryFn({ on401: "returnNull" }),
                });

                const [editingLocation, setEditingLocation] = useState<any>(null);
                const [isDialogOpen, setIsDialogOpen] = useState(false);
                const [selectedFile, setSelectedFile] = useState<File | null>(null);
                const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
                const [isUploading, setIsUploading] = useState(false);

                const createLocationMutation = useMutation({
                  mutationFn: async (locationData: any) => {
                    const res = await apiRequest("POST", "/api/locations", locationData);
                    return await res.json();
                  },
                  onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
                    setIsDialogOpen(false);
                    setEditingLocation(null);
                    resetFileUpload();
                    toast({
                      title: "Success",
                      description: "Location created successfully",
                    });
                  },
                  onError: (error: any) => {
                    toast({
                      title: "Error",
                      description: "Failed to create location",
                      variant: "destructive",
                    });
                  },
                });

                const updateLocationMutation = useMutation({
                  mutationFn: async ({ id, ...locationData }: any) => {
                    const res = await apiRequest("PUT", `/api/locations/${id}`, locationData);
                    return await res.json();
                  },
                  onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
                    setIsDialogOpen(false);
                    setEditingLocation(null);
                    resetFileUpload();
                    toast({
                      title: "Success",
                      description: "Location updated successfully",
                    });
                  },
                  onError: (error: any) => {
                    toast({
                      title: "Error", 
                      description: "Failed to update location",
                      variant: "destructive",
                    });
                  },
                });

                const deleteLocationMutation = useMutation({
                  mutationFn: async (id: number) => {
                    await apiRequest("DELETE", `/api/locations/${id}`);
                  },
                  onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
                    toast({
                      title: "Success",
                      description: "Location deleted successfully",
                    });
                  },
                  onError: (error: any) => {
                    toast({
                      title: "Error",
                      description: "Failed to delete location",
                      variant: "destructive",
                    });
                  },
                });

                const uploadImage = async (file: File): Promise<string | null> => {
                  const formData = new FormData();
                  formData.append('image', file);
                  
                  try {
                    setIsUploading(true);
                    const response = await fetch('/api/locations/upload-image', {
                      method: 'POST',
                      body: formData,
                    });
                    
                    if (!response.ok) {
                      throw new Error('Upload failed');
                    }
                    
                    const result = await response.json();
                    return result.imageUrl;
                  } catch (error) {
                    toast({
                      title: "Upload Error",
                      description: "Failed to upload image",
                      variant: "destructive",
                    });
                    return null;
                  } finally {
                    setIsUploading(false);
                  }
                };

                const handleSubmit = async (formData: any) => {
                  let logoUrl = formData.logoUrl;
                  
                  // If a new file is selected, upload it first
                  if (selectedFile) {
                    logoUrl = await uploadImage(selectedFile);
                    if (!logoUrl) return; // Upload failed, don't proceed
                  }
                  
                  const locationData = { ...formData, logoUrl };
                  
                  if (editingLocation) {
                    updateLocationMutation.mutate({ id: editingLocation.id, ...locationData });
                  } else {
                    createLocationMutation.mutate(locationData);
                  }
                };

                const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.type.startsWith('image/')) {
                      setSelectedFile(file);
                      const previewUrl = URL.createObjectURL(file);
                      setUploadedImageUrl(previewUrl);
                    } else {
                      toast({
                        title: "Invalid File",
                        description: "Please select an image file",
                        variant: "destructive",
                      });
                    }
                  }
                };

                const resetFileUpload = () => {
                  setSelectedFile(null);
                  setUploadedImageUrl(null);
                };

                if (locationsLoading) {
                  return <div className="text-center py-8">Loading locations...</div>;
                }

                return (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex-1 mr-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={pinLocationIcon} 
                            alt="Location" 
                            className="w-5 h-5"
                          />
                          <div>
                            <h4 className="font-medium text-blue-900">Total Locations: {locations?.length || 0}</h4>
                            <p className="text-sm text-blue-700">Manage rates and settings for each restaurant location</p>
                          </div>
                        </div>
                      </div>
                      <Button 
                        onClick={() => {
                          setEditingLocation(null);
                          resetFileUpload();
                          setIsDialogOpen(true);
                        }}
                        className="flex items-center gap-2"
                      >
                        <img 
                          src={addCircleIcon} 
                          alt="Add" 
                          className="w-4 h-4"
                        />
                        Add Location
                      </Button>
                    </div>

                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Location Name</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-center">Curbside Rate</TableHead>
                            <TableHead className="text-center">Turn-in Rate</TableHead>
                            <TableHead className="text-center">Employee Commission</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {locations?.map((location: any) => (
                            <TableRow key={location.id}>
                              <TableCell className="font-medium">{location.name}</TableCell>
                              <TableCell className="text-center">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  location.active 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {location.active ? 'Active' : 'Inactive'}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">${location.curbsideRate}</TableCell>
                              <TableCell className="text-center">${location.turnInRate}</TableCell>
                              <TableCell className="text-center">${location.employeeCommission}</TableCell>
                              <TableCell className="text-center">
                                <div className="flex gap-2 justify-center">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingLocation(location);
                                      resetFileUpload();
                                      setIsDialogOpen(true);
                                    }}
                                    className="p-2"
                                  >
                                    <img 
                                      src={contentPenIcon} 
                                      alt="Edit" 
                                      className="w-4 h-4"
                                    />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const password = prompt("Enter password to delete location:");
                                      if (password !== "bbonly") {
                                        alert("Incorrect password. Location deletion cancelled.");
                                        return;
                                      }
                                      if (confirm(`Are you sure you want to delete ${location.name}? This action cannot be undone.`)) {
                                        deleteLocationMutation.mutate(location.id);
                                      }
                                    }}
                                    className="p-2"
                                  >
                                    <img 
                                      src={binIcon} 
                                      alt="Delete" 
                                      className="w-4 h-4"
                                    />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Location Form Dialog */}
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            {editingLocation ? 'Edit Location' : 'Add New Location'}
                          </DialogTitle>
                          <DialogDescription>
                            Configure the rates and settings for this location
                          </DialogDescription>
                        </DialogHeader>
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target as HTMLFormElement);
                            const locationData = {
                              name: formData.get('name'),
                              active: formData.get('active') === 'true',
                              curbsideRate: parseFloat(formData.get('curbsideRate') as string),
                              turnInRate: parseFloat(formData.get('turnInRate') as string),
                              employeeCommission: parseFloat(formData.get('employeeCommission') as string),
                              logoUrl: formData.get('logoUrl') || null,
                              address: formData.get('address') || null,
                              phone: formData.get('phone') || null,
                              website: formData.get('website') || null,
                            };
                            await handleSubmit(locationData);
                            if (!selectedFile || uploadedImageUrl) {
                              setIsDialogOpen(false);
                              resetFileUpload();
                            }
                          }}
                          className="space-y-4"
                        >
                          <div>
                            <Label htmlFor="name">Location Name</Label>
                            <input
                              id="name"
                              name="name"
                              type="text"
                              defaultValue={editingLocation?.name || ''}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="active">Status</Label>
                            <Select name="active" defaultValue={editingLocation?.active ? 'true' : 'true'}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">Active</SelectItem>
                                <SelectItem value="false">Inactive</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="curbsideRate">Curbside Rate ($)</Label>
                            <input
                              id="curbsideRate"
                              name="curbsideRate"
                              type="number"
                              step="0.01"
                              defaultValue={editingLocation?.curbsideRate || 15}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <Label htmlFor="turnInRate">Turn-in Rate ($)</Label>
                            <input
                              id="turnInRate"
                              name="turnInRate"
                              type="number"
                              step="0.01"
                              defaultValue={editingLocation?.turnInRate || 11}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <Label htmlFor="employeeCommission">Employee Commission ($)</Label>
                            <input
                              id="employeeCommission"
                              name="employeeCommission"
                              type="number"
                              step="0.01"
                              defaultValue={editingLocation?.employeeCommission || 4}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <Label htmlFor="logoFile">Logo Image</Label>
                            <div className="space-y-2">
                              <input
                                id="logoFile"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              {(uploadedImageUrl || editingLocation?.logoUrl) && (
                                <div className="mt-2">
                                  <img 
                                    src={uploadedImageUrl || editingLocation?.logoUrl} 
                                    alt="Logo preview" 
                                    className="max-w-32 max-h-16 object-contain border rounded"
                                  />
                                </div>
                              )}
                              {isUploading && (
                                <p className="text-sm text-blue-600">Uploading image...</p>
                              )}
                            </div>
                            <input
                              type="hidden"
                              name="logoUrl"
                              value={uploadedImageUrl || editingLocation?.logoUrl || ''}
                            />
                          </div>

                          <div>
                            <Label htmlFor="address">Address</Label>
                            <textarea
                              id="address"
                              name="address"
                              defaultValue={editingLocation?.address || ''}
                              placeholder="Full address including street, city, state, and zip"
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <Label htmlFor="phone">Phone Number</Label>
                            <input
                              id="phone"
                              name="phone"
                              type="tel"
                              defaultValue={editingLocation?.phone || ''}
                              placeholder="(555) 123-4567"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <Label htmlFor="website">Website</Label>
                            <input
                              id="website"
                              name="website"
                              type="url"
                              defaultValue={editingLocation?.website || ''}
                              placeholder="https://restaurant-website.com"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsDialogOpen(false);
                                resetFileUpload();
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={createLocationMutation.isPending || updateLocationMutation.isPending}
                            >
                              {editingLocation ? 'Update' : 'Create'} Location
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Employee Shift Breakdown Modal */}
      <Dialog open={showEmployeeShiftsModal} onOpenChange={setShowEmployeeShiftsModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {selectedEmployeeShifts?.employee?.fullName} - Shift Breakdown
            </DialogTitle>
            <DialogDescription>
              Individual shift details showing breakdown of hours, commission, tips, and earnings
            </DialogDescription>
          </DialogHeader>
          
          {selectedEmployeeShifts && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Showing {selectedEmployeeShifts.shifts.length} shifts for {selectedAccountingMonth === 'all' ? 'all time' : `${selectedAccountingMonth}`}
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Shift</TableHead>
                      <TableHead className="text-center">Hours</TableHead>
                      <TableHead className="text-center">Hours %</TableHead>
                      <TableHead className="text-center">Commission</TableHead>
                      <TableHead className="text-center">Tips</TableHead>
                      <TableHead className="text-center">Earnings</TableHead>
                      <TableHead className="text-center">Money Owed</TableHead>
                      <TableHead className="text-center">Tax (22%)</TableHead>
                      <TableHead className="text-center">Cash Paid</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedEmployeeShifts.shifts.map((shift: any, index: number) => (
                      <TableRow key={shift.reportId || index}>
                        <TableCell>{shift.date}</TableCell>
                        <TableCell>{shift.location}</TableCell>
                        <TableCell>{shift.shift}</TableCell>
                        <TableCell className="text-center">{shift.hours}</TableCell>
                        <TableCell className="text-center">{shift.hoursPercent}</TableCell>
                        <TableCell className="text-center text-blue-600">${shift.commission}</TableCell>
                        <TableCell className="text-center text-green-600">${shift.tips}</TableCell>
                        <TableCell className="text-center font-medium">${shift.earnings}</TableCell>
                        <TableCell className="text-center text-green-600">${shift.moneyOwed}</TableCell>
                        <TableCell className="text-center">${shift.tax}</TableCell>
                        <TableCell className="text-center text-blue-600">${shift.cashPaid}</TableCell>
                      </TableRow>
                    ))}
                    
                    {/* Totals Row */}
                    {selectedEmployeeShifts.shifts.length > 0 && (
                      <TableRow className="bg-gray-50 font-bold border-t-2">
                        <TableCell>TOTALS</TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-center">
                          {selectedEmployeeShifts.shifts.reduce((sum: number, shift: any) => sum + Number(shift.hours), 0).toFixed(1)}
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-center text-blue-600">
                          ${selectedEmployeeShifts.shifts.reduce((sum: number, shift: any) => sum + Number(shift.commission), 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center text-green-600">
                          ${selectedEmployeeShifts.shifts.reduce((sum: number, shift: any) => sum + Number(shift.tips), 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          ${selectedEmployeeShifts.shifts.reduce((sum: number, shift: any) => sum + Number(shift.earnings), 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center text-green-600">
                          ${selectedEmployeeShifts.shifts.reduce((sum: number, shift: any) => sum + Number(shift.moneyOwed), 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          ${selectedEmployeeShifts.shifts.reduce((sum: number, shift: any) => sum + Number(shift.tax), 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center text-blue-600">
                          ${selectedEmployeeShifts.shifts.reduce((sum: number, shift: any) => sum + Number(shift.cashPaid), 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {selectedEmployeeShifts.shifts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No shifts found for this employee in the selected time period.
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}