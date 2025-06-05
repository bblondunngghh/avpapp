import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { employeeWorkedInShift, findEmployeeInShift, parseLocalDate } from "@/lib/employee-utils";
import { formatDateForDisplay, parseReportDate } from "@/lib/timezone";

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
        title: "Incident Updated",
        description: "Changes saved successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating incident:", error);
      toast({
        title: "Error",
        description: "Failed to update incident",
        variant: "destructive"
      });
    }
  });

  const handleUpdate = () => {
    updateIncidentMutation.mutate({
      faultStatus,
      repairCost,
      repairStatus
    });
  };

  return (
    <div className="space-y-3 p-3 border rounded-lg">
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium">Fault Determination</label>
        <select
          value={faultStatus}
          onChange={(e) => setFaultStatus(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="">Select status</option>
          <option value="at-fault">At Fault</option>
          <option value="not-at-fault">Not At Fault</option>
          <option value="pending">Pending Investigation</option>
        </select>
      </div>
      
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium">Repair Cost</label>
        <input
          type="text"
          value={repairCost}
          onChange={(e) => setRepairCost(e.target.value)}
          placeholder="Enter cost"
          className="border rounded px-2 py-1 text-sm"
        />
      </div>
      
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium">Repair Status</label>
        <select
          value={repairStatus}
          onChange={(e) => setRepairStatus(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="">Select status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      
      <button
        onClick={handleUpdate}
        disabled={updateIncidentMutation.isPending}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
      >
        {updateIncidentMutation.isPending ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}

// Repair Status Dropdown Component
function RepairStatusDropdown({ report, updateMutation }: { report: any; updateMutation: any }) {
  const [localStatus, setLocalStatus] = useState(report.repairStatus || "pending");

  const handleStatusChange = (newStatus: string) => {
    setLocalStatus(newStatus);
    updateMutation.mutate({
      reportId: report.id,
      updates: { repairStatus: newStatus }
    });
  };

  return (
    <select
      value={localStatus}
      onChange={(e) => handleStatusChange(e.target.value)}
      className="border rounded px-2 py-1 text-sm bg-white"
      disabled={updateMutation.isPending}
    >
      <option value="pending">Pending</option>
      <option value="in-progress">In Progress</option>
      <option value="completed">Completed</option>
    </select>
  );
}

// Constants for hardcoded locations
const LOCATIONS = [
  { id: 1, name: "The Capital Grille", curbsideRate: 5, turnInRate: 35, employeeCommission: 0.50 },
  { id: 2, name: "Bob's Steak & Chop House", curbsideRate: 5, turnInRate: 30, employeeCommission: 0.50 },
  { id: 3, name: "Truluck's", curbsideRate: 7, turnInRate: 38, employeeCommission: 0.50 },
  { id: 4, name: "BOA Steakhouse", curbsideRate: 6, turnInRate: 36, employeeCommission: 0.50 }
];

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

export default function AdminPanel() {
  // ALL HOOKS DECLARED AT TOP IN CONSISTENT ORDER
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Core state
  const [isAddingEmployees, setIsAddingEmployees] = useState(false);
  const [monthlyData, setMonthlyData] = useState<Array<{name: string; sales: number}>>([]);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  // Location and distribution state
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
  const [ticketDistributions, setTicketDistributions] = useState<TicketDistribution[]>([]);
  const [isAddDistributionOpen, setIsAddDistributionOpen] = useState(false);
  const [editingDistribution, setEditingDistribution] = useState<TicketDistribution | null>(null);
  const [selectedLocationForDistribution, setSelectedLocationForDistribution] = useState<number | null>(null);
  const [newDistribution, setNewDistribution] = useState({
    allocatedTickets: '',
    usedTickets: '',
    batchNumber: '',
    notes: ''
  });
  
  // Employee management state
  const [selectedLocationEmployees, setSelectedLocationEmployees] = useState<EmployeeRecord[]>([]);
  const [newEmployee, setNewEmployee] = useState({
    key: '',
    fullName: '',
    isActive: true,
    isShiftLeader: false,
    phone: '',
    email: '',
    hireDate: '',
    notes: '',
    ssn: ''
  });
  const [isEditingEmployee, setIsEditingEmployee] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null);
  const [showAddEmployeeDialog, setShowAddEmployeeDialog] = useState(false);
  const [showEditEmployeeDialog, setShowEditEmployeeDialog] = useState(false);
  
  // Expenses and partner payment state
  const [savedExpenses, setSavedExpenses] = useState<{[key: string]: {totalExpenses: number; records: Array<{id: string; description: string; amount: number; date: string; category: string}>}}>({});
  const [currentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [partnerPaymentHistory, setPartnerPaymentHistory] = useState<Array<{
    date: string;
    amount: number;
    recipient: string;
    category: string;
    month: string;
  }>>([]);

  // All useQuery hooks
  const { data: reports = [], isLoading, refetch: refetchReports } = useQuery<ShiftReport[]>({
    queryKey: ["/api/shift-reports"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  const { data: distributionsData = [], isLoading: isLoadingDistributions } = useQuery<TicketDistribution[]>({
    queryKey: ["/api/ticket-distributions"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  const { data: employeeRecords = [], isLoading: isLoadingEmployees, refetch: refetchEmployees } = useQuery<EmployeeRecord[]>({
    queryKey: ["/api/employees"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: trainingAcknowledgments = [] } = useQuery({
    queryKey: ["/api/training-acknowledgments"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: taxPayments = [] } = useQuery({
    queryKey: ["/api/tax-payments"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: incidentReports = [] } = useQuery({
    queryKey: ["/api/incident-reports"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["/api/locations"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // All useEffect hooks
  useEffect(() => {
    import("@/lib/admin-auth").then(({ isAdminAuthenticated }) => {
      if (!isAdminAuthenticated()) {
        navigate("/admin-login");
      }
    });
    
    const authCheckInterval = setInterval(() => {
      import("@/lib/admin-auth").then(({ isAdminAuthenticated }) => {
        if (!isAdminAuthenticated()) {
          navigate("/admin-login");
          clearInterval(authCheckInterval);
        }
      });
    }, 15000);
    
    return () => {
      clearInterval(authCheckInterval);
    };
  }, [navigate]);

  useEffect(() => {
    try {
      const savedExpensesFromStorage = localStorage.getItem('savedMonthlyExpenses');
      if (savedExpensesFromStorage) {
        setSavedExpenses(JSON.parse(savedExpensesFromStorage));
      }
      setPartnerPaymentHistory([]);
    } catch (error) {
      console.error("Error loading saved expenses:", error);
    }
  }, []);

  // Return loading state while queries are loading
  if (isLoading || isLoadingDistributions || isLoadingEmployees) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Panel</h1>
      
      {/* Basic admin panel content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Shift Reports</h3>
          <p className="text-gray-600">Total Reports: {reports.length}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Employees</h3>
          <p className="text-gray-600">Total Employees: {employeeRecords.length}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Incidents</h3>
          <p className="text-gray-600">Total Incidents: {incidentReports.length}</p>
        </div>
      </div>
      
      {/* Incident Reports Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Recent Incident Reports</h3>
        <div className="space-y-4">
          {incidentReports.slice(0, 5).map((report: any) => (
            <div key={report.id} className="border-b pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{report.customerName}</p>
                  <p className="text-sm text-gray-600">{report.incidentDate}</p>
                  <ExpandableDescription
                    incident={report.incidentDescription}
                    damage={report.damageDescription}
                    witness={report.witnessName}
                    notes={report.additionalNotes}
                  />
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs ${
                    report.repairStatus === 'completed' ? 'bg-green-100 text-green-800' :
                    report.repairStatus === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {report.repairStatus || 'pending'}
                  </span>
                </div>
              </div>
              <FaultDeterminationSection report={report} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}