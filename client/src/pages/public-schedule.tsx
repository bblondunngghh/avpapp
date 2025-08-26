import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Settings, Plus, Edit, Trash2, CheckCircle, Calendar, ChevronLeft, ChevronRight, Lock, LogOut, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import houseIcon from "@assets/House-3--Streamline-Ultimate_1750259532490.png";
import { useLocation } from "wouter";

// Helper function to calculate hours between start and end time
function calculateHours(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startTotalMin = startHour * 60 + startMin;
  const endTotalMin = endHour * 60 + endMin;
  
  const diffMin = endTotalMin - startTotalMin;
  return diffMin / 60;
}

// Component for displaying time off request cards
function TimeOffRequestCard({ 
  request, 
  employee, 
  isPast, 
  onUpdate, 
  isUpdating 
}: { 
  request: any; 
  employee: any; 
  isPast: boolean; 
  onUpdate: (data: { status: string; adminNotes?: string }) => void; 
  isUpdating: boolean; 
}) {
  const [adminNotes, setAdminNotes] = useState(request.adminNotes || "");
  const [showNotes, setShowNotes] = useState(false);

  const handleApprove = () => {
    onUpdate({ status: "approved", adminNotes: adminNotes.trim() || undefined });
    setShowNotes(false);
  };

  const handleDeny = () => {
    onUpdate({ status: "denied", adminNotes: adminNotes.trim() || undefined });
    setShowNotes(false);
  };

  const requestDate = new Date(request.requestDate);
  
  return (
    <div className="bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 rounded-lg p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-semibold text-white">
            {employee?.fullName || 'Unknown Employee'}
          </h4>
          <p className="text-gray-300">
            {requestDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
            {isPast && <span className="ml-2 text-xs text-gray-400">(Past)</span>}
          </p>
          {request.reason && (
            <p className="text-gray-400 text-sm mt-1">
              <strong>Reason:</strong> {request.reason}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`text-xs ${
              request.status === 'approved'
                ? 'bg-green-900/30 text-green-300 border-green-500/50'
                : request.status === 'denied'
                ? 'bg-red-900/30 text-red-300 border-red-500/50'
                : 'bg-yellow-900/30 text-yellow-300 border-yellow-500/50'
            }`}
          >
            {request.status === 'pending' ? 'Pending' : 
             request.status === 'approved' ? 'Approved' : 'Denied'}
          </Badge>
        </div>
      </div>

      {request.status === 'pending' && (
        <div className="space-y-3">
          {showNotes && (
            <div>
              <Label className="text-gray-300 text-sm">Admin Notes (Optional)</Label>
              <Input
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about this request..."
                className="bg-slate-800/60 border-slate-600 text-white placeholder:text-gray-400"
                disabled={isUpdating}
              />
            </div>
          )}
          
          <div className="flex gap-2">
            {!showNotes ? (
              <>
                <Button
                  size="sm"
                  onClick={() => setShowNotes(true)}
                  className="bg-gray-600/60 hover:bg-gray-700/60 text-gray-200"
                  disabled={isUpdating}
                >
                  Add Notes & Review
                </Button>
                <Button
                  size="sm"
                  onClick={handleApprove}
                  className="bg-green-600/60 hover:bg-green-700/60 text-white"
                  disabled={isUpdating}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm" 
                  variant="destructive"
                  onClick={handleDeny}
                  className="bg-red-600/60 hover:bg-red-700/60 text-white"
                  disabled={isUpdating}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Deny
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowNotes(false);
                    setAdminNotes(request.adminNotes || "");
                  }}
                  className="bg-gray-800/60 border-gray-700 text-gray-300"
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleApprove}
                  className="bg-green-600/60 hover:bg-green-700/60 text-white"
                  disabled={isUpdating}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive" 
                  onClick={handleDeny}
                  className="bg-red-600/60 hover:bg-red-700/60 text-white"
                  disabled={isUpdating}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Deny
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {request.adminNotes && request.status !== 'pending' && (
        <div className="mt-3 p-2 bg-slate-800/50 rounded text-sm">
          <p className="text-gray-300">
            <strong className="text-white">Admin notes:</strong> {request.adminNotes}
          </p>
        </div>
      )}
      
      <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
        <span>Requested on {new Date(request.createdAt).toLocaleDateString()}</span>
        {request.reviewedAt && (
          <span>Reviewed on {new Date(request.reviewedAt).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
}

export default function PublicSchedule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Admin state management
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, 1 = next week
  const [isAddShiftModalOpen, setIsAddShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<any>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [position, setPosition] = useState<string>("valet");
  const [locationFilter, setLocationFilter] = useState<string>(""); // Filter for which location to show
  const [timePreset, setTimePreset] = useState<string>("dinner"); // dinner, lunch, or custom
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isCreatingPreset, setIsCreatingPreset] = useState(false);
  const [presetName, setPresetName] = useState("");

  // Admin password
  const ADMIN_PASSWORD = "cg2023";

  const handleHome = () => {
    navigate("/");
  };

  // Fetch custom shift presets
  const { data: customPresets = [] } = useQuery({
    queryKey: ['customShiftPresets'],
    queryFn: async () => {
      const response = await fetch('/api/custom-shift-presets');
      if (!response.ok) throw new Error('Failed to fetch custom shift presets');
      return response.json();
    },
  });

  // Create custom shift preset mutation
  const createCustomPresetMutation = useMutation({
    mutationFn: async (presetData: { name: string; startTime: string; endTime: string }) => {
      const response = await fetch('/api/custom-shift-presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(presetData),
      });
      if (!response.ok) throw new Error('Failed to create custom shift preset');
      return response.json();
    },
    onSuccess: (newPreset) => {
      queryClient.invalidateQueries({ queryKey: ['customShiftPresets'] });
      setPresetName("");
      setIsCreatingPreset(false);
      setTimePreset(newPreset.id.toString());
      toast({
        title: "Preset Saved",
        description: `"${newPreset.name}" has been saved as a custom time preset.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save custom preset. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete custom shift preset mutation
  const deleteCustomPresetMutation = useMutation({
    mutationFn: async (presetId: number) => {
      const response = await fetch(`/api/custom-shift-presets/${presetId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete custom shift preset');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customShiftPresets'] });
      toast({
        title: "Preset Deleted",
        description: "Custom time preset has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete custom preset. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Add new custom preset
  const handleSavePreset = () => {
    if (!presetName.trim() || !startTime || !endTime) {
      toast({
        title: "Missing Information",
        description: "Please provide preset name, start time, and end time.",
        variant: "destructive",
      });
      return;
    }

    createCustomPresetMutation.mutate({
      name: presetName.trim(),
      startTime,
      endTime,
    });
  };

  // Delete custom preset
  const handleDeletePreset = (presetId: number) => {
    if (timePreset === presetId.toString()) {
      setTimePreset("custom");
    }
    deleteCustomPresetMutation.mutate(presetId);
  };

  // Check if user is already authenticated (session storage)
  useEffect(() => {
    const adminAuth = sessionStorage.getItem('scheduleAdminAuthenticated');
    if (adminAuth === 'true') {
      setIsAdminMode(true);
    }
  }, []);

  // Fetch published shifts for public view
  const { data: publishedShifts = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/shifts/published"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    refetchOnWindowFocus: true,
    staleTime: 0, // Always refetch to ensure fresh data
  });

  // Fetch all shifts for admin mode
  const { data: allShifts = [] } = useQuery<any[]>({
    queryKey: ["/api/shifts"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isAdminMode,
  });


  // Fetch employees for display names
  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ["/api/employees"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  // Fetch locations for display names
  const { data: locations = [] } = useQuery<any[]>({
    queryKey: ["/api/locations"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  // Fetch time off requests for admin mode
  const { data: timeOffRequests = [], refetch: refetchTimeOffRequests } = useQuery({
    queryKey: ["/api/time-off-requests"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isAdminMode,
    staleTime: 0,
    refetchOnMount: true,
  });

  // Create/Update shift mutation - must be declared before any conditional returns
  const shiftMutation = useMutation({
    mutationFn: async (shiftData: any) => {
      const method = editingShift ? 'PUT' : 'POST';
      const url = editingShift ? `/api/shifts/${editingShift.id}` : '/api/shifts';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shiftData)
      });

      if (!response.ok) {
        throw new Error('Failed to save shift');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: editingShift ? "Shift Updated" : "Shift Created",
        description: editingShift ? "The shift has been updated successfully." : "New shift has been added to the schedule.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      setIsAddShiftModalOpen(false);
      resetShiftForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save shift. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete shift mutation - must be declared before any conditional returns
  const deleteShiftMutation = useMutation({
    mutationFn: async (shiftId: string) => {
      const response = await fetch(`/api/shifts/${shiftId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete shift');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Shift Deleted",
        description: "The shift has been removed from the schedule.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete shift. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Mutation to update time off request status
  const updateTimeOffRequestMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: number; status: string; adminNotes?: string }) => {
      const response = await apiRequest("PUT", `/api/time-off-requests/${id}`, {
        status,
        adminNotes: adminNotes || null
      });
      return response.json();
    },
    onSuccess: () => {
      refetchTimeOffRequests();
      toast({
        title: "Time off request updated",
        description: "The request status has been successfully updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-600/50 rounded-lg shadow-xl p-4">
          <div className="text-white text-center">
            <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-300">Loading schedule...</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate current week range (Wednesday to Tuesday) - same logic as admin panel
  const getCurrentWeekRange = () => {
    const today = new Date();
    const currentDay = today.getDay();
    // Calculate days from Wednesday (3 = Wednesday) 
    const daysFromWednesday = currentDay >= 3 ? currentDay - 3 : currentDay + 4;
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - daysFromWednesday);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return { startOfWeek, endOfWeek };
  };

  const { startOfWeek: currentWeekStart, endOfWeek: currentWeekEnd } = getCurrentWeekRange();

  // Admin authentication function
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAdminMode(true);
      sessionStorage.setItem('scheduleAdminAuthenticated', 'true');
      setIsLoginModalOpen(false);
      setAdminPassword("");
      toast({
        title: "Admin Access Granted",
        description: "You now have access to schedule management features.",
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Incorrect password. Please try again.",
        variant: "destructive",
      });
      setAdminPassword("");
    }
  };

  // Publish week schedule function
  const publishWeekSchedule = async () => {

    try {
      // Get current week's shifts based on weekOffset
      const today = new Date();
      const currentDay = today.getDay();
      const daysFromWednesday = currentDay >= 3 ? currentDay - 3 : currentDay + 4;
      
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - daysFromWednesday + (weekOffset * 7));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      // Filter shifts for the selected week using string comparison to avoid timezone issues
      const weekStartStr = weekStart.toISOString().split('T')[0]; // YYYY-MM-DD
      const weekEndStr = weekEnd.toISOString().split('T')[0]; // YYYY-MM-DD
      
      const weekShifts = allShifts.filter((shift: any) => {
        const shiftDateStr = shift.shiftDate; // Already in YYYY-MM-DD format
        return shiftDateStr >= weekStartStr && shiftDateStr <= weekEndStr;
      });

      console.log('PUBLISH DEBUG: Publishing shifts:', {
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        totalAllShifts: allShifts.length,
        weekShiftsFound: weekShifts.length,
        wednesdayShifts: weekShifts.filter(s => s.shiftDate === '2025-08-20'),
        wednesdayShiftsDetails: weekShifts.filter(s => s.shiftDate === '2025-08-20').map(s => ({id: s.id, empId: s.employeeId, published: s.isPublished})),
        weekShiftDates: weekShifts.map(s => s.shiftDate),
        allWednesdayInAdmin: allShifts.filter(s => s.shiftDate === '2025-08-20').map(s => ({id: s.id, empId: s.employeeId, published: s.isPublished}))
      });

      // Publish each shift with error handling
      let successCount = 0;
      let failCount = 0;
      
      for (const shift of weekShifts) {
        try {
          const response = await fetch('/api/shifts/' + shift.id + '/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to publish shift ${shift.id}:`, response.status, errorText);
            failCount++;
          } else {
            const result = await response.json();
            successCount++;
          }
        } catch (error) {
          console.error(`Error publishing shift ${shift.id}:`, error);
          failCount++;
        }
      }
      

      // Show appropriate success/error message
      if (failCount === 0) {
        toast({
          title: "Schedule Published",
          description: `Successfully published all ${successCount} shifts for the ${weekOffset === 0 ? 'current' : 'next'} week.`,
        });
      } else if (successCount > 0) {
        toast({
          title: "Partial Success",
          description: `Published ${successCount} shifts successfully, but ${failCount} failed. Check console for details.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Publish Failed",
          description: `Failed to publish any shifts. Check console for details.`,
          variant: "destructive",
        });
      }

      // Invalidate and refetch queries to update the public view immediately
      await queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/shifts/published"] });
      await queryClient.refetchQueries({ queryKey: ["/api/shifts/published"] });
      
      // Close the modal
      setIsPublishModalOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to publish schedule. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle shift form submission
  const handleShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployee || !selectedLocation || !selectedDate || !startTime || !endTime) {
      toast({
        title: "Incomplete Form",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const shiftData = {
      employeeId: parseInt(selectedEmployee),
      locationId: parseInt(selectedLocation),
      shiftDate: selectedDate,
      startTime,
      endTime,
      position
    };

    shiftMutation.mutate(shiftData);
  };

  // Handle time preset changes
  const handleTimePresetChange = (preset: string) => {
    setTimePreset(preset);
    if (preset === "dinner") {
      setStartTime("16:00"); // 4:00 PM
      setEndTime("23:00");   // 11:00 PM
    } else if (preset === "lunch") {
      setStartTime("11:00"); // 11:00 AM
      setEndTime("16:00");   // 4:00 PM
    } else if (preset !== "custom") {
      // Handle saved custom presets (database IDs are numbers converted to strings)
      const customPreset = customPresets.find((p: any) => p.id.toString() === preset);
      if (customPreset) {
        setStartTime(customPreset.startTime);
        setEndTime(customPreset.endTime);
      }
    }
    // For custom, don't change the times
  };

  // Reset shift form
  const resetShiftForm = () => {
    setEditingShift(null);
    setSelectedEmployee("");
    setSelectedLocation("");
    setSelectedDate("");
    setStartTime("");
    setEndTime("");
    setPosition("valet");
    setTimePreset("dinner");
  };

  // Handle shift edit
  const handleEditShift = (shift: any) => {
    setEditingShift(shift);
    setSelectedEmployee(shift.employeeId.toString());
    setSelectedLocation(shift.locationId.toString());
    setSelectedDate(shift.shiftDate);
    setStartTime(shift.startTime);
    setEndTime(shift.endTime);
    setPosition(shift.position || "valet");
    
    // Determine time preset based on existing times
    if (shift.startTime === "16:00" && shift.endTime === "23:00") {
      setTimePreset("dinner");
    } else if (shift.startTime === "11:00" && shift.endTime === "16:00") {
      setTimePreset("lunch");
    } else {
      setTimePreset("custom");
    }
    
    setIsAddShiftModalOpen(true);
  };

  // Handle shift delete
  const handleDeleteShift = (shift: any) => {
    if (confirm('Are you sure you want to delete this shift?')) {
      deleteShiftMutation.mutate(shift.id);
    }
  };

  // Get the appropriate shifts based on mode and week offset
  const getDisplayShifts = () => {
    if (!isAdminMode) {
      // For public mode, filter published shifts by current week and location
      const today = new Date();
      const currentDay = today.getDay();
      const daysFromWednesday = currentDay >= 3 ? currentDay - 3 : currentDay + 4;
      
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - daysFromWednesday);
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      // Use string comparison to avoid timezone issues
      const weekStartStr = weekStart.toISOString().split('T')[0]; // YYYY-MM-DD
      const weekEndStr = weekEnd.toISOString().split('T')[0]; // YYYY-MM-DD
      
      const filteredShifts = publishedShifts.filter((shift: any) => {
        const shiftDateStr = shift.shiftDate; // Already in YYYY-MM-DD format
        const dateMatch = shiftDateStr >= weekStartStr && shiftDateStr <= weekEndStr;
        const locationMatch = !locationFilter || shift.locationId.toString() === locationFilter;
        return dateMatch && locationMatch;
      });
      
      console.log('DEBUG: Filtering results:', {
        totalPublishedShifts: publishedShifts.length,
        filteredShifts: filteredShifts.length,
        wednesdayShifts: filteredShifts.filter(s => s.shiftDate === '2025-08-20'),
        weekRange: `${weekStart.toISOString().split('T')[0]} to ${weekEnd.toISOString().split('T')[0]}`,
        allFilteredDates: filteredShifts.map(s => s.shiftDate),
        expectedWeekEnd: '2025-08-26 (should end on Tuesday, not Wednesday)'
      });
      
      return filteredShifts;
    }
    
    // For admin mode, filter shifts by week offset
    const today = new Date();
    const currentDay = today.getDay();
    const daysFromWednesday = currentDay >= 3 ? currentDay - 3 : currentDay + 4;
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - daysFromWednesday + (weekOffset * 7));
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const filteredShifts = allShifts.filter((shift: any) => {
      // Use string comparison to avoid timezone issues
      const weekStartStr = weekStart.toISOString().split('T')[0]; // YYYY-MM-DD
      const weekEndStr = weekEnd.toISOString().split('T')[0]; // YYYY-MM-DD
      const shiftDateStr = shift.shiftDate; // Already in YYYY-MM-DD format
      
      const dateMatch = shiftDateStr >= weekStartStr && shiftDateStr <= weekEndStr;
      const locationMatch = !locationFilter || shift.locationId.toString() === locationFilter;
      
      return dateMatch && locationMatch;
    });
    
    return filteredShifts;
  };

  // Update the employees with shifts calculation
  const displayShifts = getDisplayShifts();
  
  // For backwards compatibility in public mode
  const employeesWithShifts = employees
    .map((employee: any) => {
      const employeeShifts = displayShifts.filter(
        (shift: any) => shift.employeeId === employee.id
      );
      
      return {
        ...employee,
        shifts: employeeShifts,
      };
    })
    .filter((employee: any) => employee.shifts.length > 0);
  
  // For the main table display
  const employeesWithShiftsForDisplay = employees
    .map((employee: any) => {
      const employeeShifts = displayShifts.filter(
        (shift: any) => shift.employeeId === employee.id
      );
      return {
        ...employee,
        shifts: employeeShifts,
      };
    })
    .filter((employee: any) => {
      // In admin mode, show all active employees (so you can add shifts to anyone)
      if (isAdminMode) {
        return employee.isActive;
      }
      // In public mode, only show employees who have published shifts
      return employee.shifts.length > 0;
    });

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Home Button */}
        <Button 
          variant="outline" 
          onClick={handleHome} 
          className="mb-4 p-2 h-10 w-10 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border-white/20"
        >
          <img src={houseIcon} alt="Home" className="w-5 h-5" />
        </Button>
        
        {/* Header */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-600/50 rounded-lg shadow-xl p-6 mb-6">
          {/* Centered header content */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {isAdminMode ? 'Employee Scheduler' : 'Published Work Schedule'}
            </h1>
            <p className="text-gray-300 text-lg">
              {isAdminMode 
                ? 'Manage employee shifts and publish schedules' 
                : "Current week's published shifts for all employees"}
            </p>
          </div>
          
          {/* Admin controls row */}
          <div className="flex justify-between items-start">
            {/* Left side - Admin access/exit and location filter */}
            <div className="flex flex-col items-start gap-2">
              {!isAdminMode ? (
                <Button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="bg-gray-800/60 hover:bg-gray-700/60 text-gray-300 hover:text-white border-gray-700 transition-all duration-300"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Admin Access
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => {
                      setIsAdminMode(false);
                      sessionStorage.removeItem('scheduleAdminAuthenticated');
                      setWeekOffset(0);
                    }}
                    variant="outline"
                    className="bg-red-800/60 hover:bg-red-700/60 text-red-300 hover:text-red-200 border-red-700"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Exit Admin
                  </Button>
                  
                  {/* Location dropdown - only visible in admin mode */}
                  <Select value={locationFilter || "all"} onValueChange={(value) => setLocationFilter(value === "all" ? "" : value)}>
                    <SelectTrigger className="w-48 bg-gray-800/60 border-gray-700 text-white">
                      <SelectValue placeholder="All Locations" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      <SelectItem value="all">All Locations</SelectItem>
                      {locations.map((loc: any) => (
                        <SelectItem key={loc.id} value={loc.id.toString()}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>

            {/* Right side - Publish button and week navigation (admin mode only) */}
            {isAdminMode && (
              <div className="flex flex-col items-end gap-2">
                <Button
                  onClick={() => setIsPublishModalOpen(true)}
                  className="bg-green-600/60 hover:bg-green-700/60 text-white border-green-500/50"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Publish Week
                </Button>
                
                {/* Week Navigation under Publish button */}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setWeekOffset(Math.max(weekOffset - 1, 0))}
                    disabled={weekOffset <= 0}
                    variant="outline"
                    size="sm"
                    className="bg-gray-800/60 border-gray-700 text-gray-300 hover:bg-gray-700/60 hover:text-white w-40 justify-center items-center"
                  >
                    <div className="flex items-center justify-center w-full">
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      <span>Previous Week</span>
                    </div>
                  </Button>
                  <span className="text-sm text-gray-300 min-w-[120px] text-center">
                    {weekOffset === 0 ? 'Current Week' : `${weekOffset} Week${weekOffset > 1 ? 's' : ''} Ahead`}
                  </span>
                  <Button
                    onClick={() => setWeekOffset(weekOffset + 1)}
                    variant="outline"
                    size="sm"
                    className="bg-gray-800/60 border-gray-700 text-gray-300 hover:bg-gray-700/60 hover:text-white w-40 justify-center items-center"
                  >
                    <div className="flex items-center justify-center w-full">
                      <span>Next Week</span>
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </div>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Schedule Content */}
        {(isAdminMode ? employeesWithShiftsForDisplay : employeesWithShifts).length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-600/50 rounded-lg shadow-xl p-4 max-w-md mx-auto">
              <h3 className="text-xl font-semibold text-white mb-2">
                No Published Schedule
              </h3>
              <p className="text-gray-300">
                The schedule for this week has not been published yet. Please check back later.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-600/50 rounded-lg overflow-hidden shadow-xl p-0">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="bg-slate-700/50 border-b border-slate-600">
                    <th className="sticky left-0 bg-slate-700/50 px-6 py-4 text-left font-medium text-white w-[200px] border-r border-slate-600 z-10">
                      Employee
                    </th>
                    {['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday'].map((day, index) => {
                      const today = new Date();
                      const currentDay = today.getDay();
                      // Calculate days from Wednesday (3 = Wednesday)
                      const daysFromWednesday = currentDay >= 3 ? currentDay - 3 : currentDay + 4;
                      
                      // Start of week (Wednesday) with offset
                      const startOfWeek = new Date(today);
                      startOfWeek.setDate(today.getDate() - daysFromWednesday + (weekOffset * 7));
                      
                      // Add days for each column
                      const dayDate = new Date(startOfWeek);
                      dayDate.setDate(startOfWeek.getDate() + index);
                      
                      const isToday = dayDate.toDateString() === today.toDateString();
                      
                      return (
                        <th key={day} className={`px-4 py-4 text-center font-medium text-sm w-[140px] max-w-[140px] border-r border-slate-600 ${isToday ? 'bg-blue-600/30 text-blue-200' : 'text-gray-300'}`}>
                          <div>{day.slice(0, 3)}</div>
                          <div className="text-xs font-normal">{dayDate.getMonth() + 1}/{dayDate.getDate()}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {(isAdminMode ? employeesWithShiftsForDisplay : employeesWithShifts).map((employee: any) => (
                    <tr key={employee.id} className="border-b border-slate-600 hover:bg-slate-700/30">
                      <td className="sticky left-0 bg-slate-800/50 px-6 py-4 border-r border-slate-600 w-[200px] z-10">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-600/30 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                            <span className="text-sm font-medium text-blue-200">
                              {(() => {
                                const names = employee.fullName?.split(' ') || [''];
                                return names.length > 1 ? names[0].charAt(0) + names[names.length - 1].charAt(0) : names[0].charAt(0);
                              })()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-white truncate">
                              {employee.fullName}
                            </div>
                            <div className="text-xs text-gray-400">
                              {employee.isShiftLeader ? 'Shift Leader' : 'Valet Attendant'}
                            </div>
                            <div className="text-xs text-blue-300 font-medium">
                              {(() => {
                                const totalHours = employee.shifts.reduce((total: number, shift: any) => {
                                  return total + calculateHours(shift.startTime, shift.endTime);
                                }, 0);
                                return `${totalHours.toFixed(1)}h total`;
                              })()}
                            </div>
                          </div>
                        </div>
                      </td>
                      {[...Array(7)].map((_, dayIndex) => {
                        const today = new Date();
                        const currentDay = today.getDay();
                        // Calculate days from Wednesday (3 = Wednesday)
                        const daysFromWednesday = currentDay >= 3 ? currentDay - 3 : currentDay + 4;
                        
                        // Start of week (Wednesday) with offset
                        const startOfWeek = new Date(today);
                        startOfWeek.setDate(today.getDate() - daysFromWednesday + (weekOffset * 7));
                        
                        // Add days for each column
                        const dayDate = new Date(startOfWeek);
                        dayDate.setDate(startOfWeek.getDate() + dayIndex);
                        
                        const isToday = dayDate.toDateString() === today.toDateString();
                        
                        const dayDateString = dayDate.toISOString().split('T')[0];
                        const shiftsForDay = employee.shifts.filter((shift: any) => 
                          shift.shiftDate === dayDateString
                        );
                        
                        
                        const elements = [];
                        
                        return (
                          <td key={dayIndex} className={`border-r border-slate-600 w-[140px] max-w-[140px] h-20 min-h-[80px] max-h-[80px] align-top p-0 ${isToday ? 'bg-blue-600/20' : ''}`}>
                            <div className="w-full h-full relative">
                              {shiftsForDay.length > 0 ? (
                                <div className="w-full h-full p-1 flex flex-col gap-1 overflow-hidden">
                                  {shiftsForDay.map((shift: any, shiftIndex: number) => {
                                    // Color coding based on location (dark theme version)
                                    const getLocationColors = (locationId: number, isShiftLeader: boolean) => {
                                      const baseColors = {
                                        1: { // The Capital Grille - Blue theme
                                          bg: isShiftLeader ? 'bg-blue-600/40 border border-blue-500/60' : 'bg-blue-600/30 border border-blue-500/50',
                                          text: isShiftLeader ? 'text-blue-100' : 'text-blue-200',
                                          time: isShiftLeader ? 'text-blue-200' : 'text-blue-300',
                                          location: isShiftLeader ? 'text-blue-300' : 'text-blue-400'
                                        },
                                        2: { // Bob's Steak & Chop House - Green theme
                                          bg: isShiftLeader ? 'bg-green-600/40 border border-green-500/60' : 'bg-green-600/30 border border-green-500/50',
                                          text: isShiftLeader ? 'text-green-100' : 'text-green-200',
                                          time: isShiftLeader ? 'text-green-200' : 'text-green-300',
                                          location: isShiftLeader ? 'text-green-300' : 'text-green-400'
                                        },
                                        3: { // Truluck's - Purple theme
                                          bg: isShiftLeader ? 'bg-purple-600/40 border border-purple-500/60' : 'bg-purple-600/30 border border-purple-500/50',
                                          text: isShiftLeader ? 'text-purple-100' : 'text-purple-200',
                                          time: isShiftLeader ? 'text-purple-200' : 'text-purple-300',
                                          location: isShiftLeader ? 'text-purple-300' : 'text-purple-400'
                                        },
                                        4: { // BOA Steakhouse - Orange theme
                                          bg: isShiftLeader ? 'bg-orange-600/40 border border-orange-500/60' : 'bg-orange-600/30 border border-orange-500/50',
                                          text: isShiftLeader ? 'text-orange-100' : 'text-orange-200',
                                          time: isShiftLeader ? 'text-orange-200' : 'text-orange-300',
                                          location: isShiftLeader ? 'text-orange-300' : 'text-orange-400'
                                        }
                                      };
                                      return baseColors[locationId] || baseColors[1]; // Default to Capital Grille colors
                                    };

                                    const colors = getLocationColors(shift.locationId, shift.position === 'shift-leader');
                                    const isMultipleShifts = shiftsForDay.length > 1;

                                    return (
                                      <div key={shiftIndex} className={`${colors.bg} rounded-sm p-1 relative group max-w-full overflow-hidden ${isMultipleShifts ? 'h-[30px]' : 'h-[72px]'}`}>
                                        <div className={`text-xs font-semibold ${colors.text} truncate`}>
                                          {shift.position === 'shift-leader' ? 'Leader' : 'Valet'}
                                        </div>
                                        <div className={`text-xs ${colors.time} truncate`}>
                                          {new Date('2000-01-01T' + shift.startTime).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})} - {new Date('2000-01-01T' + shift.endTime).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})}
                                        </div>
                                        <div className={`text-xs ${colors.location} ${isMultipleShifts ? '' : 'mt-1'} truncate max-w-full`} title={locations.find((loc: any) => loc.id === shift.locationId)?.name || 'Location TBD'}>
                                          {locations.find((loc: any) => loc.id === shift.locationId)?.name || 'Location TBD'}
                                        </div>
                                        
                                        {isAdminMode && (
                                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                            <button
                                              onClick={() => handleEditShift(shift)}
                                              className="p-1 bg-gray-800/80 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-all"
                                              title="Edit shift"
                                            >
                                              <Edit className="w-3 h-3" />
                                            </button>
                                            <button
                                              onClick={() => handleDeleteShift(shift)}
                                              className="p-1 bg-red-800/80 hover:bg-red-700 rounded text-red-300 hover:text-red-200 transition-all"
                                              title="Delete shift"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                  
                                  {/* Add button for additional shifts */}
                                  {isAdminMode && (
                                    <button
                                      onClick={() => {
                                        setEditingShift(null);
                                        setSelectedEmployee(employee.id.toString());
                                        setSelectedDate(dayDate.toISOString().split('T')[0]);
                                        setSelectedLocation(locationFilter || "");
                                        setStartTime("16:00");
                                        setEndTime("23:00");
                                        setPosition("valet");
                                        setTimePreset("dinner");
                                        setIsAddShiftModalOpen(true);
                                      }}
                                      className="w-full h-[12px] hover:bg-gray-800/40 transition-colors flex items-center justify-center border-2 border-dashed border-gray-600/50 hover:border-gray-500/50 rounded-sm flex-shrink-0"
                                      title="Add another shift"
                                    >
                                      <Plus className="h-3 w-3 text-gray-500 hover:text-gray-300" />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center group">
                                  {isAdminMode ? (
                                    <button
                                      onClick={() => {
                                        setEditingShift(null);
                                        setSelectedEmployee(employee.id.toString());
                                        setSelectedDate(dayDate.toISOString().split('T')[0]);
                                        setSelectedLocation(locationFilter || "");
                                        setStartTime("16:00"); // Default to dinner start time
                                        setEndTime("23:00");   // Default to dinner end time
                                        setPosition("valet");
                                        setTimePreset("dinner");
                                        setIsAddShiftModalOpen(true);
                                      }}
                                      className="w-full h-full hover:bg-gray-800/40 transition-colors flex items-center justify-center"
                                    >
                                      <Plus className="h-4 w-4 text-gray-500 group-hover:text-gray-300" />
                                    </button>
                                  ) : (
                                    <span className="text-gray-400 text-xs">Off</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  
                  {/* Daily totals footer row */}
                  <tr className="bg-slate-700/50 border-t border-slate-500">
                    <td className="sticky left-0 bg-slate-700/50 px-3 py-2 border-r border-slate-600 w-[200px] z-10 text-center">
                      <div className="text-white text-xs font-medium">
                        {(isAdminMode ? employeesWithShiftsForDisplay : employeesWithShifts).length} Employees
                      </div>
                    </td>
                    {[...Array(7)].map((_, dayIndex) => {
                      const today = new Date();
                      const currentDay = today.getDay();
                      const daysFromWednesday = currentDay >= 3 ? currentDay - 3 : currentDay + 4;
                      
                      const startOfWeek = new Date(today);
                      startOfWeek.setDate(today.getDate() - daysFromWednesday + (weekOffset * 7));
                      
                      const dayDate = new Date(startOfWeek);
                      dayDate.setDate(startOfWeek.getDate() + dayIndex);
                      
                      const dayDateString = dayDate.toISOString().split('T')[0];
                      const isToday = dayDate.toDateString() === today.toDateString();
                      
                      // Calculate total hours for this day across all employees
                      const dayTotalHours = (isAdminMode ? employeesWithShiftsForDisplay : employeesWithShifts)
                        .reduce((dayTotal: number, employee: any) => {
                          const dayShifts = employee.shifts.filter((shift: any) => 
                            shift.shiftDate === dayDateString
                          );
                          const employeeDayHours = dayShifts.reduce((empTotal: number, shift: any) => {
                            return empTotal + calculateHours(shift.startTime, shift.endTime);
                          }, 0);
                          return dayTotal + employeeDayHours;
                        }, 0);
                      
                      return (
                        <td key={dayIndex} className={`border-r border-slate-600 w-[140px] max-w-[140px] text-center py-2 px-1 ${isToday ? 'bg-blue-600/20' : ''}`}>
                          <div className="text-white font-medium text-sm">
                            {dayTotalHours.toFixed(1)}h
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Time Off Requests Section (Admin Mode Only) */}
        {isAdminMode && (
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-600/50 rounded-lg shadow-xl p-4 mt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Time Off Requests</h2>
                <p className="text-sm text-gray-300">Manage employee time off requests</p>
              </div>
            </div>
            
            {timeOffRequests.length === 0 ? (
              <div className="text-center py-6">
                <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-white mb-1">No Time Off Requests</h3>
                <p className="text-sm text-gray-400">No employees have submitted time off requests yet.</p>
              </div>
            ) : (
              <div className="grid gap-3 max-h-80 overflow-y-auto">
                {timeOffRequests
                  .sort((a: any, b: any) => {
                    // Sort by status (pending first), then by request date
                    if (a.status === 'pending' && b.status !== 'pending') return -1;
                    if (a.status !== 'pending' && b.status === 'pending') return 1;
                    return new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime();
                  })
                  .map((request: any) => {
                    const employee = employees.find((emp: any) => emp.id === request.employeeId);
                    const requestDate = new Date(request.requestDate);
                    const isPast = requestDate < new Date();
                    
                    return (
                      <TimeOffRequestCard
                        key={request.id}
                        request={request}
                        employee={employee}
                        isPast={isPast}
                        onUpdate={(data: any) => updateTimeOffRequestMutation.mutate({ id: request.id, ...data })}
                        isUpdating={updateTimeOffRequestMutation.isPending}
                      />
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-600/50 rounded-lg shadow-xl p-4 mt-6">
          <p className="text-gray-400 text-sm text-center">
            This schedule shows only published shifts. Contact your manager for any questions.
          </p>
        </div>
      </div>
      
      {/* Admin Login Modal */}
      <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
        <DialogContent className="bg-gray-900/95 backdrop-blur-xl border-gray-800/50 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Admin Access</DialogTitle>
            <DialogDescription className="text-gray-300">
              Enter the admin password to access schedule management features
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <Label htmlFor="password" className="text-gray-300">Password</Label>
              <Input
                id="password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password"
                className="bg-gray-800/60 border-gray-700 text-white placeholder-gray-400"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600/60 hover:bg-blue-700/60 text-white border-blue-500/50"
            >
              Login
            </Button>
          </form>
        </DialogContent>
      </Dialog>


      {/* Add/Edit Shift Modal */}
      <Dialog open={isAddShiftModalOpen} onOpenChange={setIsAddShiftModalOpen}>
        <DialogContent className="bg-gray-900/95 backdrop-blur-xl border-gray-800/50 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingShift ? 'Edit Shift' : 'Add New Shift'}
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {editingShift ? 'Update the shift details' : 'Create a new shift for an employee'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleShiftSubmit} className="space-y-4">
            {/* Only show employee selection if no employee is pre-selected */}
            {!selectedEmployee && (
              <div>
                <Label htmlFor="employee" className="text-gray-300">Employee</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee} required>
                  <SelectTrigger className="bg-gray-800/60 border-gray-700 text-white">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    {employees.map((emp: any) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Show selected employee name when pre-selected */}
            {selectedEmployee && (
              <div>
                <Label className="text-gray-300">Employee</Label>
                <div className="bg-gray-800/60 border border-gray-700 rounded-md px-3 py-2 text-white">
                  {employees.find((emp: any) => emp.id.toString() === selectedEmployee)?.fullName || 'Unknown Employee'}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="location" className="text-gray-300">Location</Label>
              {locationFilter ? (
                // Show read-only location when filter is active
                <div className="bg-gray-800/60 border border-gray-700 rounded-md px-3 py-2 text-white">
                  {locations.find((loc: any) => loc.id.toString() === locationFilter)?.name || 'Unknown Location'}
                </div>
              ) : (
                // Show dropdown when no filter is active
                <Select value={selectedLocation} onValueChange={setSelectedLocation} required>
                  <SelectTrigger className="bg-gray-800/60 border-gray-700 text-white">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    {locations.map((loc: any) => (
                      <SelectItem key={loc.id} value={loc.id.toString()}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <Label htmlFor="date" className="text-gray-300">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-gray-800/60 border-gray-700 text-white"
                required
              />
            </div>

            <div>
              <Label className="text-gray-300">Shift Time</Label>
              <Select value={timePreset} onValueChange={handleTimePresetChange}>
                <SelectTrigger className="bg-gray-800/60 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="dinner">Dinner (4:00 PM - 11:00 PM)</SelectItem>
                  <SelectItem value="lunch">Lunch (11:00 AM - 4:00 PM)</SelectItem>
                  {customPresets.map((preset: any) => (
                    <SelectItem key={preset.id} value={preset.id.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span>{preset.name} ({preset.startTime} - {preset.endTime})</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePreset(preset.id);
                          }}
                          className="ml-2 h-4 w-4 p-0 text-red-400 hover:text-red-300"
                        >
                          ×
                        </Button>
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom Times</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {timePreset === "custom" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime" className="text-gray-300">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="bg-gray-800/60 border-gray-700 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime" className="text-gray-300">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="bg-gray-800/60 border-gray-700 text-white"
                      required
                    />
                  </div>
                </div>
                
                {/* Save preset section */}
                <div className="border-t border-gray-700 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-gray-300">Save as Preset</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsCreatingPreset(!isCreatingPreset)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      {isCreatingPreset ? 'Cancel' : 'Save Preset'}
                    </Button>
                  </div>
                  
                  {isCreatingPreset && (
                    <div className="space-y-3">
                      <Input
                        placeholder="Enter preset name (e.g., 'Evening Shift')"
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        className="bg-gray-800/60 border-gray-700 text-white placeholder-gray-400"
                      />
                      <Button
                        type="button"
                        onClick={handleSavePreset}
                        disabled={!presetName.trim() || !startTime || !endTime}
                        className="w-full bg-green-600/60 hover:bg-green-700/60 text-white border-green-500/50 disabled:opacity-50"
                      >
                        Save Preset
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="position" className="text-gray-300">Position</Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger className="bg-gray-800/60 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="valet">Valet</SelectItem>
                  <SelectItem value="shift-leader">Shift Leader</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddShiftModalOpen(false);
                  resetShiftForm();
                }}
                className="flex-1 bg-gray-800/60 border-gray-700 text-gray-300 hover:bg-gray-700/60"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600/60 hover:bg-blue-700/60 text-white border-blue-500/50"
                disabled={shiftMutation.isPending}
              >
                {shiftMutation.isPending ? 'Saving...' : (editingShift ? 'Update' : 'Create')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Publish Week Confirmation Modal */}
      <Dialog open={isPublishModalOpen} onOpenChange={setIsPublishModalOpen}>
        <DialogContent className="bg-gray-900/95 backdrop-blur-xl border-gray-800/50 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Publish Schedule</DialogTitle>
            <DialogDescription className="text-gray-300">
              Are you sure you want to publish this week's schedule? Employees will be able to view it immediately.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPublishModalOpen(false)}
              className="flex-1 bg-gray-800/60 border-gray-700 text-gray-300 hover:bg-gray-700/60"
            >
              Cancel
            </Button>
            <Button
              onClick={publishWeekSchedule}
              className="flex-1 bg-green-600/60 hover:bg-green-700/60 text-white border-green-500/50"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Publish Week
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}