import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { employeeWorkedInShift, findEmployeeInShift, parseLocalDate } from "@/lib/employee-utils";
import { formatDateForDisplay, parseReportDate } from "@/lib/timezone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Car, Edit, Trash2, PlusCircle, Eye, EyeOff } from "lucide-react";

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
  // ALL HOOKS DECLARED AT TOP IN CONSISTENT ORDER TO PREVENT REACT CRASH
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Core state variables
  const [isAddingEmployees, setIsAddingEmployees] = useState(false);
  const [monthlyData, setMonthlyData] = useState<Array<{name: string; sales: number}>>([]);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  // Statistics and analytics state
  const [dailyCarVolume, setDailyCarVolume] = useState<Array<{name: string; cars: number}>>([]);
  const [carDistributionByLocation, setCarDistributionByLocation] = useState<Array<{name: string; value: number; color: string}>>([]);
  const [salesTrendData, setSalesTrendData] = useState<Array<{date: string; sales: number; cars: number}>>([]);
  const [reportsByDay, setReportsByDay] = useState<Array<{name: string; reports: number}>>([]);
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
    locationId: 1,
    allocatedTickets: 0,
    usedTickets: 0,
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
    hireDate: new Date().toISOString().split('T')[0],
    notes: '',
    ssn: ''
  });
  const [isEditingEmployee, setIsEditingEmployee] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null);
  const [showAddEmployeeDialog, setShowAddEmployeeDialog] = useState(false);
  const [showEditEmployeeDialog, setShowEditEmployeeDialog] = useState(false);
  
  // Partner pay and expenses state
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState<number>(0);
  const [currentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [savedExpenses, setSavedExpenses] = useState<{[key: string]: {totalExpenses: number; records: Array<{id: string; description: string; amount: number; date: string; category: string}>}}>({});
  const [isEditingExpenses, setIsEditingExpenses] = useState<boolean>(false);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [expensesPassword, setExpensesPassword] = useState<string>("");
  const [partnerPaymentHistory, setPartnerPaymentHistory] = useState<Array<{
    month: string;
    brandon: number;
    ryan: number;
    dave: number;
    total: number;
  }>>([]);
  const [selectedAccountingMonth, setSelectedAccountingMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const EXPENSES_EDIT_PASSWORD = "bbonly";
  
  // Manual revenue data for specific months
  const manualRevenue = useMemo(() => ({
    "2025-01": 17901,
    "2025-02": 27556,
    "2025-03": 25411,
    "2025-04": 20974,
    "2025-05": 19431
  } as Record<string, number>), []);

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

  // Device detection for mobile/desktop UI adaptation
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <button 
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </button>
        </div>

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>
            <TabsTrigger value="incident-reports" className="text-xs sm:text-sm flex items-center gap-1">
              <Car className="h-4 w-4" />
              Incidents
              {(() => {
                const incompleteCount = incidentReports.filter((report: any) => 
                  report.repairStatus !== 'completed'
                ).length;
                
                return incompleteCount > 0 ? (
                  <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-1 min-w-[20px] h-5 flex items-center justify-center">
                    {incompleteCount}
                  </span>
                ) : null;
              })()}
            </TabsTrigger>
            <TabsTrigger value="shift-reports" className="text-xs sm:text-sm">Reports</TabsTrigger>
            <TabsTrigger value="employee-management" className="text-xs sm:text-sm">Employees</TabsTrigger>
            <TabsTrigger value="location-management" className="text-xs sm:text-sm">Locations</TabsTrigger>
            <TabsTrigger value="ticket-distributions" className="text-xs sm:text-sm">Tickets</TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Analytics & Performance</CardTitle>
                <CardDescription>
                  Track company revenue, expenses, and location performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Key Performance Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-blue-800">Total Reports</h3>
                      <p className="text-2xl font-bold text-blue-900">{reports.length}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-green-800">Total Cars Parked</h3>
                      <p className="text-2xl font-bold text-green-900">
                        {reports.reduce((sum, report) => sum + report.totalCars, 0)}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-purple-800">Active Locations</h3>
                      <p className="text-2xl font-bold text-purple-900">{locations.filter((loc: any) => loc.active).length}</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-orange-800">Total Employees</h3>
                      <p className="text-2xl font-bold text-orange-900">{employeeRecords.length}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Incident Reports Tab */}
          <TabsContent value="incident-reports">
            <Card>
              <CardHeader>
                <CardTitle>Incident Reports Management</CardTitle>
                <CardDescription>
                  Review and manage customer incident reports with fault determination
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {incidentReports.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No incident reports found
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Fault Status</TableHead>
                            <TableHead>Repair Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {incidentReports.map((report: any) => (
                            <TableRow key={report.id}>
                              <TableCell className="font-medium">
                                {report.customerName}
                              </TableCell>
                              <TableCell>
                                {new Date(report.incidentDate).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                {locations.find((loc: any) => loc.id === report.locationId)?.name || 'Unknown'}
                              </TableCell>
                              <TableCell>
                                <ExpandableDescription
                                  incident={report.incidentDescription}
                                  damage={report.damageDescription}
                                  witness={report.witnessName}
                                  notes={report.additionalNotes}
                                />
                              </TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  report.faultStatus === 'at-fault' ? 'bg-red-100 text-red-800' :
                                  report.faultStatus === 'not-at-fault' ? 'bg-green-100 text-green-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {report.faultStatus || 'pending'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  report.repairStatus === 'completed' ? 'bg-green-100 text-green-800' :
                                  report.repairStatus === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {report.repairStatus || 'pending'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <FaultDeterminationSection report={report} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs would continue here with shift reports, employees, locations, tickets */}
          <TabsContent value="shift-reports">
            <Card>
              <CardHeader>
                <CardTitle>Shift Reports</CardTitle>
                <CardDescription>View and manage daily shift reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  Shift reports management - {reports.length} total reports
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employee-management">
            <Card>
              <CardHeader>
                <CardTitle>Employee Management</CardTitle>
                <CardDescription>Manage employee records and information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  Employee management - {employeeRecords.length} total employees
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="location-management">
            <Card>
              <CardHeader>
                <CardTitle>Location Management</CardTitle>
                <CardDescription>Configure location rates and settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  Location management - {locations.length} total locations
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ticket-distributions">
            <Card>
              <CardHeader>
                <CardTitle>Ticket Distributions</CardTitle>
                <CardDescription>Track ticket allocation and usage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  Ticket distributions - {ticketDistributions.length} total distributions
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}