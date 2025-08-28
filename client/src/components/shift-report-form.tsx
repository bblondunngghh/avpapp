import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// Import types from schema
import { ShiftReport, EmployeeWithCashPaid } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, Plus } from "lucide-react";
import sendEmailIcon from "@assets/Send-Email-1--Streamline-Ultimate.png";
import calendarIcon from "@assets/Calendar-Date--Streamline-Ultimate_1750258792058.png";
import taskListCashIcon from "@assets/Task-List-Cash--Streamline-Ultimate_1750258880864.png";
import smartphonePayIcon from "@assets/Smartphone-Pay-Dollar--Streamline-Ultimate_1750259046528.png";
import cashUserIcon from "@assets/Cash-User--Streamline-Ultimate_1750259103346.png";
import notesTasksIcon from "@assets/Notes-Tasks--Streamline-Ultimate_1750259256665.png";
import accountingBillsIcon from "@assets/Accounting-Bills-1--Streamline-Ultimate_1750259340305.png";
import houseIcon from "@assets/House-3--Streamline-Ultimate_1750259532490.png";
import { InputMoney } from "@/components/ui/input-money";
import { InputNumber } from "@/components/ui/input-number";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { SHIFT_OPTIONS, LOCATION_ID_MAP } from "@/lib/constants";
import RestaurantIcon from "@/components/restaurant-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentDateCentral } from "@/lib/timezone";
import { OfflineStorage, NetworkMonitor } from "@/lib/offline-storage";
import { NetworkStatusBanner } from "@/components/network-status";
import { Wifi, WifiOff, Clock } from "lucide-react";

// Import hardcoded images for original locations
import capGrilleImage from "@assets/CAP GRILLE image.jpg";
import bobsImage from "@assets/bobs.jpg";
import boaImage from "@assets/BOA.jpg";
import trulucksImage from "@assets/TL LOGO-1190x440_1749130680525.jpg";

// Create form schema
const formSchema = z.object({
  locationId: z.number(),
  date: z.string().nonempty("Date is required"),
  shift: z.string().nonempty("Shift is required"),
  manager: z.string().nonempty("Shift Leader name is required"),
  totalCars: z.coerce.number().min(0, "Cannot be negative"),
  complimentaryCars: z.coerce.number().min(0, "Cannot be negative"),
  creditTransactions: z.coerce.number().min(0, "Cannot be negative"),
  totalCreditSales: z.coerce.number().min(0, "Cannot be negative"),
  totalReceipts: z.coerce.number().min(0, "Cannot be negative"),
  totalReceiptSales: z.coerce.number().min(0, "Cannot be negative"),
  totalCashCollected: z.coerce.number().min(0, "Cannot be negative"),
  companyCashTurnIn: z.coerce.number().min(0, "Cannot be negative"),
  totalReceiptCompany: z.coerce.number().default(0),
  totalTurnIn: z.coerce.number(),
  overShort: z.coerce.number(),
  // Commission fields
  creditCardCommission: z.coerce.number().min(0, "Cannot be negative").default(0),
  cashCommission: z.coerce.number().min(0, "Cannot be negative").default(0),
  receiptCommission: z.coerce.number().min(0, "Cannot be negative").default(0),
  // Tips fields
  creditCardTips: z.coerce.number().min(0, "Cannot be negative").default(0),
  cashTips: z.coerce.number().min(0, "Cannot be negative").default(0),
  receiptTips: z.coerce.number().min(0, "Cannot be negative").default(0),
  moneyOwed: z.coerce.number().default(0),
  // Payroll fields
  totalJobHours: z.coerce.number().min(0, "Cannot be negative").default(0),
  employees: z.array(z.object({
    name: z.string().nonempty("Employee name is required"),
    hours: z.coerce.number().min(0, "Cannot be negative"),
    cashPaid: z.coerce.number().min(0, "Cannot be negative").optional(),
  })).default([]),
  notes: z.string().optional(),
  confirmationCheck: z.boolean().refine(val => val === true, {
    message: "You must confirm that the information is correct",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface ShiftReportFormProps {
  reportId?: number; // Used for editing existing reports
}

export default function ShiftReportForm({ reportId }: ShiftReportFormProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const locationIdParam = searchParams.get('locationId');
  
  // Fetch locations from API
  const { data: locations } = useQuery({
    queryKey: ["/api/locations"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Set the locationId from URL parameters or default to first location
  const initialLocationId = locationIdParam ? parseInt(locationIdParam) : (locations?.[0]?.id || 1);
  const [selectedLocationId, setSelectedLocationId] = useState(initialLocationId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(NetworkMonitor.getStatus());

  // Helper function to get location info by ID
  const getLocationInfo = (locationId: number) => {
    const location = locations?.find((loc: any) => loc.id === locationId);
    if (!location) return { name: 'Unknown', turnInRate: 11, perCarPrice: 15 };
    
    const name = location.name.toLowerCase();
    
    // Determine rates based on location name
    if (name.includes('capital grille')) {
      return { name: location.name, turnInRate: 11, perCarPrice: 15 };
    } else if (name.includes('bob')) {
      return { name: location.name, turnInRate: 6, perCarPrice: 15 };
    } else if (name.includes('truluck')) {
      return { name: location.name, turnInRate: 8, perCarPrice: 15 };
    } else if (name.includes('boa')) {
      return { name: location.name, turnInRate: 7, perCarPrice: 13 };
    } else {
      // Use dynamic rates from database for new locations
      return { 
        name: location.name, 
        turnInRate: location.turnInRate || 11, 
        perCarPrice: location.perCarPrice || 15 
      };
    }
  };

  // Initialize network monitoring
  useEffect(() => {
    NetworkMonitor.init();
    const unsubscribe = NetworkMonitor.addCallback((online) => {
      setIsOnline(online);
    });
    return () => unsubscribe();
  }, []);
  
  // Find location name
  const locationName = locations?.find((loc: any) => loc.id === selectedLocationId)?.name || '';
  
  // Setup form with zod validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      locationId: selectedLocationId,
      date: getCurrentDateCentral(),
      shift: selectedLocationId === 1 ? "" : "Dinner", // Default to Dinner for Bob's, Truluck's, and BOA
      manager: selectedLocationId === 3 ? "devin" : 
               selectedLocationId === 2 ? "brett" : "", // Default to Devin Bean for Truluck's, Brett Willson for Bob's
      totalCars: 0,
      complimentaryCars: 0,
      creditTransactions: 0,
      totalCreditSales: 0,
      totalReceipts: 0,
      totalReceiptSales: 0,
      totalReceiptCompany: 0,
      totalCashCollected: 0,
      companyCashTurnIn: 0,
      totalTurnIn: 0,
      overShort: 0,
      // Commission fields
      creditCardCommission: 0,
      cashCommission: 0,
      receiptCommission: 0,
      // Tips fields
      creditCardTips: 0,
      cashTips: 0,
      receiptTips: 0,
      moneyOwed: 0,
      // Payroll fields
      totalJobHours: 0,
      employees: [],
      notes: "",
      confirmationCheck: false,
    }
  });
  
  // Update locationId in form when it changes
  useEffect(() => {
    form.setValue("locationId", selectedLocationId);
  }, [selectedLocationId, form]);
  
  // Fetch report data if editing
  const { data: reportData, isLoading: isLoadingReport } = useQuery({
    queryKey: reportId ? [`/api/shift-reports/${reportId}`] : [''],
    enabled: !!reportId,
  });
  
  // Populate form with report data when editing
  useEffect(() => {
    if (reportData && reportId) {
      // Set the location ID from the report data
      const data = reportData as any;
      if (data.locationId) {
        setSelectedLocationId(data.locationId);
      }
      
      // Set all other form values
      Object.entries(data).forEach(([key, value]) => {
        // @ts-ignore
        if (key in form.getValues()) {
          // Special handling for employees field to ensure it's always an array
          if (key === 'employees') {
            let employeesArray = [];
            if (typeof value === 'string') {
              try {
                employeesArray = JSON.parse(value);
              } catch (e) {
                employeesArray = [];
              }
            } else if (Array.isArray(value)) {
              employeesArray = value;
            }
            // @ts-ignore
            form.setValue(key, employeesArray);
          } else {
            // @ts-ignore
            form.setValue(key, value);
          }
        }
      });
    }
  }, [reportData, form, reportId]);
  
  // Fetch ticket distributions for updating usage
  const { data: ticketDistributions = [] } = useQuery<any[]>({
    queryKey: ["/api/ticket-distributions"],
    queryFn: async () => {
      const response = await fetch('/api/ticket-distributions');
      if (!response.ok) {
        if (response.status === 401) return null;
        throw new Error('Failed to fetch ticket distributions');
      }
      return response.json();
    },
  });

  // Fetch employees for the dropdown
  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const response = await fetch('/api/employees');
      if (!response.ok) {
        if (response.status === 401) return null;
        throw new Error('Failed to fetch employees');
      }
      return response.json();
    },
  });

  // Create mutation for submitting new reports with offline support
  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      try {
        // Temporarily revert to old endpoint while fixing schema
        const response = await apiRequest('POST', '/api/shift-reports', data);
        const reportData = await response.json();
        
        // Update ticket usage using FIFO (First-In-First-Out) approach
        if (data.totalCars > 0) {
          try {
            await apiRequest('POST', '/api/ticket-distributions/consume', {
              locationId: data.locationId,
              ticketsToConsume: data.totalCars
            });
            
            // Invalidate ticket distributions query to refresh data
            queryClient.invalidateQueries({ queryKey: ['/api/ticket-distributions'] });
          } catch (error) {
            console.error('Error consuming tickets:', error);
            // Continue with report creation even if ticket consumption fails
          }
        }
        
        return reportData;
      } catch (error) {
        // If network fails, save to offline storage
        if (!isOnline || (error instanceof Error && (
          error.message.includes('fetch') || 
          error.message.includes('network') || 
          error.message.includes('timeout')
        ))) {
          const offlineId = OfflineStorage.savePendingReport(data, 'shift-report');
          console.log('Report saved offline with ID:', offlineId);
          
          toast({
            title: "Saved Offline",
            description: "Poor network detected. Your report has been saved and will be submitted when connection improves.",
            variant: "default",
          });
          
          // Navigate to success page even for offline submissions
          navigate('/submission-complete/offline');
          return { id: 'offline', offline: true };
        }
        
        throw error;
      }
    },
    onSuccess: (data) => {
      if (!data.offline) {
        queryClient.invalidateQueries({ queryKey: ['/api/shift-reports'] });
        toast({
          title: "Success!",
          description: "Report has been submitted successfully and ticket usage has been updated.",
        });
        // Redirect to submission complete page with the report ID
        navigate(`/submission-complete/${data.id}`);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to submit report: ${error.message}`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });
  
  // Update mutation for editing reports
  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest('PUT', `/api/shift-reports/${reportId}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/shift-reports'] });
      toast({
        title: "Success!",
        description: "Report has been updated successfully.",
      });
      // Redirect to submission complete page with the report ID
      navigate(`/submission-complete/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update report: ${error.message}`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });
  
  // Handle form submission
  const onSubmit = (values: FormValues) => {
    // Prepare employee data for submission
    const employees = (values.employees || []).map(employee => ({
      name: employee.name || '',
      hours: employee.hours || 0,
      cashPaid: employee.cashPaid || 0
    }));
    
    setIsSubmitting(true);
    
    // Ensure all required fields are included and preserve date format
    const formData = {
      ...values,
      // Ensure date stays as string to prevent timezone conversion
      date: values.date,
      // Include employees data
      employees,
      // Add these fields if they're not already included
      complimentaryCars: values.complimentaryCars || 0,
      creditTransactions: values.creditTransactions || 0,
      totalCreditSales: values.totalCreditSales || 0,
      totalReceipts: values.totalReceipts || 0,
      totalReceiptSales: values.totalReceiptSales || 0,
      totalCashCollected: values.totalCashCollected || 0,
      companyCashTurnIn: values.companyCashTurnIn || 0,
      // Add calculated commission and tips values to form data
      cashCommission: cashCommission || 0,
      creditCardCommission: creditCardCommission || 0,
      receiptCommission: receiptCommission || 0,
      cashTips: cashTips || 0,
      creditCardTips: creditCardTips || 0,
      receiptTips: receiptTips || 0,
      moneyOwed: moneyOwed || 0,
      totalTurnIn: values.totalTurnIn || (values.totalCars * getLocationInfo(values.locationId).turnInRate),
      overShort: values.overShort || 0
    };
    
    console.log('Form data being sent:', formData);
    console.log('Money owed value:', formData.moneyOwed);
    
    if (reportId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };
  
  // Go back to previous screen
  const handleBack = () => {
    navigate('/');
  };
  
  if (isLoadingReport && reportId) {
    return (
      <div className="form-section">
        <div className="form-title">
          <Button 
            variant="outline" 
            onClick={handleBack} 
            className="mb-4 p-2 h-10 w-10 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border-white/20"
          >
            <img src={houseIcon} alt="Home" className="w-5 h-5" />
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Calculate derived values
  const totalCars = Number(form.watch("totalCars") || 0);
  const totalCreditSales = Number(form.watch("totalCreditSales") || 0);
  const totalCashCollected = Number(form.watch("totalCashCollected") || 0);
  const companyCashTurnIn = Number(form.watch("companyCashTurnIn") || 0);
  
  // Use hybrid rate system: hardcoded for original locations, dynamic for new ones
  const currentLocation = Number(form.watch("locationId"));
  let turnInRate = (() => {
    // Use hardcoded rates for original locations (IDs 1-4)
    if (currentLocation === 1) return 11; // Capital Grille
    if (currentLocation === 2) return 6;  // Bob's Steak
    if (currentLocation === 3) return 8;  // Truluck's
    if (currentLocation === 4) return 7;  // BOA Steakhouse
    
    // Use dynamic rates for new locations (ID 5+)
    return locations?.find((loc: any) => loc.id === currentLocation)?.turnInRate || 11;
  })();
  const totalTurnIn = totalCars * turnInRate;
  
  // Get total receipt sales
  const totalReceiptSales = Number(form.watch("totalReceiptSales") || 0);
  
  // Company Cash Turn-In calculation
  // This includes total turn-in minus both credit card sales and receipt sales
  // If combined sales exceed total turn-in, company cash turn-in would be negative (which means money owed)
  const expectedCompanyCashTurnIn = totalTurnIn - totalCreditSales - totalReceiptSales;
  
  // Check if company cash turn-in matches the expected value (within a small tolerance)
  const isMatched = Math.abs(expectedCompanyCashTurnIn - companyCashTurnIn) < 0.01;
  
  // Over/Short is the difference between expected company cash turn-in and actual company cash turn-in
  // It should be 0 when they match, otherwise it shows the expected value
  const overShort = isMatched ? 0 : expectedCompanyCashTurnIn;
  
  // Commission calculations based on actual business formulas
  const creditTransactions = Number(form.watch("creditTransactions") || 0);
  const totalReceipts = Number(form.watch("totalReceipts") || 0);
  
  // Calculate cash cars (total cars - credit card transactions - receipt transactions)
  const cashCars = totalCars - creditTransactions - totalReceipts;
  
  // Commission calculations - different rates per location
  let commissionRate = 4; // Default for Capital Grille
  const currentLocationId = form.watch("locationId");
  if (currentLocationId === 2) { // Bob's
    commissionRate = 9;
  } else if (currentLocationId === 3) { // Truluck's
    commissionRate = 7;
  } else if (currentLocationId === 4) { // BOA Steakhouse
    commissionRate = 6;
  } else if (currentLocationId >= 5) {
    // Only use dynamic rates for new locations (ID 5+)
    commissionRate = locations?.find((loc: any) => loc.id === currentLocationId)?.employeeCommission || 4;
  }
  const creditCardCommission = creditTransactions * commissionRate; 
  const cashCommission = cashCars * commissionRate;
  const receiptCommission = totalReceipts * commissionRate;
  
  // Tips calculations based on specific formulas explained
  // For credit card tips: credit transactions * $15/$13 = theoretical revenue
  // If theoretical revenue > actual sales, the difference is tips (excess)
  // If actual sales > theoretical revenue, the difference is also tips (shortfall)
  const perCarPrice = getLocationInfo(form.watch("locationId") || 1).perCarPrice;
  
  // For new locations (ID 5+), use dynamic curbside rate
  const finalPerCarPrice = currentLocationId >= 5 ? 
    (locations?.find((loc: any) => loc.id === currentLocationId)?.curbsideRate || 15) : 
    perCarPrice;
  const creditCardTransactionsTotal = creditTransactions * finalPerCarPrice;
  const creditCardTips = Math.abs(totalCreditSales - creditCardTransactionsTotal);
                      
  // For cash tips: cash cars * per-car rate = theoretical cash revenue
  // If theoretical cash > actual cash collected, the difference is tips (excess)
  // If actual cash > theoretical cash, the difference is also tips (shortfall)
  const cashCarsTotal = cashCars * finalPerCarPrice;
  const cashTips = Math.abs(totalCashCollected - cashCarsTotal);
  const receiptTips = totalReceipts * 3; // $3 tip per receipt
  
  // Totals
  const totalCommission = creditCardCommission + cashCommission + receiptCommission;
  const totalTips = creditCardTips + cashTips + receiptTips;
  const totalCommissionAndTips = totalCommission + totalTips;
  // Money owed should be based on the expected company cash turn-in value
  const moneyOwed = expectedCompanyCashTurnIn < 0 ? Math.abs(expectedCompanyCashTurnIn) : 0;
  
  return (
    <>
      <div className="app-gradient-fixed"></div>
      <div className="max-w-4xl mx-auto p-6 min-h-screen text-white relative">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="form-content-container">
          <Button 
            variant="outline" 
            onClick={handleBack} 
            className="mb-4 p-2 h-10 w-10 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border-white/20"
          >
            <img src={houseIcon} alt="Home" className="w-5 h-5" />
          </Button>
          
          <div className="form-header-container">
            <h1 className="report-title">Access Valet Parking Shift Report</h1>
            
            {(() => {
              const currentLocation = locations?.find((loc: any) => loc.id === form.watch('locationId'));
              if (!currentLocation) {
                return (
                  <div className="form-header-content">
                    <div className="restaurant-image relative">
                      <div className="w-32 h-16 bg-white/10 backdrop-blur-sm border border-white/20 rounded flex items-center justify-center">
                        <span className="text-gray-300 text-sm">No Logo</span>
                      </div>
                    </div>
                    
                    <div className="address">
                      Loading location...
                    </div>
                  </div>
                );
              }
              
              // Get hardcoded image and address for original locations
              const getLocationImage = (locationId: number) => {
                switch (locationId) {
                  case 1: // Capital Grille
                    return capGrilleImage;
                  case 2: // Bob's Steak and Chop House
                    return trulucksImage;
                  case 3: // Truluck's
                    return bobsImage;
                  case 4: // BOA Steakhouse
                    return boaImage;
                  default:
                    return currentLocation.logoUrl || null;
                }
              };

              const getLocationAddress = (locationId: number) => {
                switch (locationId) {
                  case 1: // Capital Grille
                    return currentLocation.address || 'Address not available';
                  case 2: // Bob's Steak and Chop House
                    return currentLocation.address || 'Address not available';
                  case 3: // Truluck's
                    return currentLocation.address || 'Address not available';
                  case 4: // BOA Steakhouse
                    return currentLocation.address || 'Address not available';
                  default:
                    return currentLocation.address || 'Address not available';
                }
              };

              const locationImage = getLocationImage(currentLocation.id);
              const locationAddress = getLocationAddress(currentLocation.id);

              return (
                <div className="form-header-content">
                  <div className="restaurant-image relative">
                    {locationImage ? (
                      <img 
                        src={locationImage} 
                        alt={currentLocation.name}
                        className="w-full h-40 object-cover object-center rounded-lg shadow-lg border border-white/20"
                      />
                    ) : (
                      <div className="w-32 h-16 bg-white/10 backdrop-blur-sm border border-white/20 rounded flex items-center justify-center">
                        <span className="text-gray-300 text-sm">No Logo</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="address">
                    {currentLocation.name}<br />
                    {locationAddress.split('\n').map((line, index) => (
                      <span key={index}>
                        {line}
                        {index < locationAddress.split('\n').length - 1 && <br />}
                      </span>
                    ))}<br />
                    <span className="text-sm text-gray-300 mt-1">
                      Curbside Rate: ${(() => {
                        // Use hardcoded rates for original locations (IDs 1-4)
                        if (currentLocation.id === 1) return "15.00"; // Capital Grille
                        if (currentLocation.id === 2) return "15.00"; // Bob's Steak
                        if (currentLocation.id === 3) return "15.00"; // Truluck's
                        if (currentLocation.id === 4) return "13.00"; // BOA Steakhouse
                        
                        // Use dynamic rates for new locations (ID 5+)
                        return currentLocation.curbsideRate?.toFixed(2) || "15.00";
                      })()} per car
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
          <NetworkStatusBanner />
          <div className="form-card-shift-info">
            <h3 className="section-title uppercase font-bold flex items-center gap-2">
              <img src={calendarIcon} alt="Calendar" className="w-4 h-4" />
              SHIFT INFORMATION
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white font-medium text-sm">Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        className="paperform-input w-full min-w-[100%] flex items-center justify-center text-center" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="shift"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white font-medium text-sm">Shift</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="paperform-input h-[46px]">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-800/90 backdrop-blur-xl border-slate-600/50">
                        {SHIFT_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value} className="text-white hover:bg-white/10 focus:bg-white/10 data-[highlighted]:bg-white/10 data-[highlighted]:text-white">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="manager"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white font-medium text-sm">Shift Leader</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        
                        // Auto-populate shift leader as first employee if not already present
                        const currentEmployees = form.watch('employees') || [];
                        const isShiftLeaderAlreadyAdded = currentEmployees.some((emp: any) => emp.name === value);
                        
                        if (!isShiftLeaderAlreadyAdded && value) {
                          const updatedEmployees = [
                            { name: value, hours: 0 },
                            ...currentEmployees
                          ];
                          form.setValue('employees', updatedEmployees);
                        }
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="paperform-input h-[46px]">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-800/90 backdrop-blur-xl border-slate-600/50">
                        {employees
                          .filter((emp: any) => emp.isActive && emp.isShiftLeader)
                          .sort((a: any, b: any) => a.fullName.localeCompare(b.fullName))
                          .map((emp: any) => (
                            <SelectItem key={emp.id} value={emp.key} className="text-white hover:bg-white/10 focus:bg-white/10 data-[highlighted]:bg-white/10 data-[highlighted]:text-white">
                              {emp.fullName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="totalCars"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white font-medium text-sm">Cars Parked</FormLabel>
                    <FormControl>
                      <InputNumber 
                        inputMode="numeric"
                        className="paperform-input" 
                        {...field}
                        value={field.value === 0 ? '' : field.value}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : Number(e.target.value);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <div className="flex flex-col text-xs text-gray-300 mt-1 text-right">
                      <span>
                        {(() => {
                          const locationId = form.watch("locationId");
                          if (!locationId) return "Select a location";
                          
                          const locationInfo = getLocationInfo(locationId);
                          return `${locationInfo.name} Rate: $${locationInfo.turnInRate.toFixed(2)} per car`;
                        })()}
                      </span>
                      <span>Expected Turn-In: <span className="text-green-400">${(totalCars * getLocationInfo(form.watch("locationId") || 1).turnInRate).toFixed(2)}</span></span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          <div className="form-card">
            <h3 className="section-title uppercase font-bold flex items-center gap-2">
              <img src={taskListCashIcon} alt="Task List Cash" className="w-4 h-4" />
              SHIFT DETAILS
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <FormField
                control={form.control}
                name="creditTransactions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white font-medium text-sm">Credit Card Transactions</FormLabel>
                    <FormControl>
                      <InputNumber 
                        inputMode="numeric"
                        className="paperform-input" 
                        {...field}
                        value={field.value === 0 ? '' : field.value}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : Number(e.target.value);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="totalCreditSales"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white font-medium text-sm">Total Credit Card Sales</FormLabel>
                    <FormControl>
                      <InputMoney 
                        inputMode="decimal"
                        className="paperform-input" 
                        {...field}
                        value={field.value === 0 ? '' : field.value}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : Number(e.target.value);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <div className="flex justify-end text-xs text-gray-300 mt-1">
                      <span>Expected: <span className="text-green-400">${(creditTransactions * finalPerCarPrice).toFixed(2)}</span></span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="totalReceipts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white font-medium text-sm">Total Receipts</FormLabel>
                    <FormControl>
                      <InputNumber 
                        inputMode="numeric"
                        className="paperform-input" 
                        {...field}
                        value={field.value === 0 ? '' : field.value}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : Number(e.target.value);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="totalReceiptSales"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white font-medium text-sm">Total Receipt Sales</FormLabel>
                    <FormControl>
                      <InputMoney 
                        inputMode="decimal"
                        className="paperform-input" 
                        {...field}
                        value={field.value === 0 ? '' : field.value}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : Number(e.target.value);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <div className="flex justify-end text-xs text-gray-300 mt-1">
                      <div className="text-right">
                        <div>Calculated at $18.00 per receipt</div>
                        <div>Expected: <span className="text-green-400">${(totalReceipts * 18).toFixed(2)}</span></div>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="totalCashCollected"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white font-medium text-sm">Total Cash Collected</FormLabel>
                    <FormControl>
                      <InputMoney 
                        inputMode="decimal"
                        className="paperform-input" 
                        {...field} 
                        value={field.value === 0 ? '' : field.value}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : Number(e.target.value);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <div className="flex justify-end text-xs text-gray-300 mt-1">
                      <span>Expected: <span className="text-green-400">${(cashCars * finalPerCarPrice).toFixed(2)}</span></span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {expectedCompanyCashTurnIn > 0 ? (
                <FormField
                  control={form.control}
                  name="companyCashTurnIn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white font-medium text-sm">Company Cash Turn-In</FormLabel>
                      <FormControl>
                        <InputMoney 
                          className="paperform-input" 
                          {...field}
                          value={field.value === 0 ? '' : field.value}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : Number(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <div className="flex justify-end text-xs text-gray-300 mt-1">
                        <span>Expected: <span className="text-green-400">${expectedCompanyCashTurnIn.toFixed(2)}</span></span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <div className="money-owed-display p-3 border border-white/20 rounded-md bg-white/10 backdrop-blur-sm pt-[12px] pb-[12px] pl-[18px] pr-[18px] mt-[12px] mb-[12px] text-right">
                  <h3 className="text-white font-medium text-sm mb-1">Company Cash Turn-In</h3>
                  <div className="space-y-1 text-sm">
                    <div className="text-gray-300">No cash turn-in required</div>
                    <div className="text-red-500 font-medium">Money Owed: ${Math.abs(expectedCompanyCashTurnIn).toFixed(2)}</div>
                  </div>
                  {/* Hidden input to ensure form submission has the value */}
                  <input 
                    type="hidden" 
                    {...form.register("companyCashTurnIn")}
                    onChange={() => {}}
                    value="0"
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="form-card">
            <h3 className="section-title uppercase font-bold flex items-center gap-2">
              <img src={accountingBillsIcon} alt="Accounting Bills" className="w-4 h-4" />
              FINANCIAL SUMMARY
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-md border border-white/20">
                  <div className="text-sm font-medium mb-2">Commission Breakdown</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Cash Commission:</span>
                      <span>${cashCommission.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Credit Card Commission:</span>
                      <span>${creditCardCommission.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Receipt Commission:</span>
                      <span>${receiptCommission.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold pt-1 border-t border-white/30">
                      <span>Total Commission:</span>
                      <span>${totalCommission.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-300 mt-2">
                    {(() => {
                      const locationId = form.watch("locationId");
                      const locationInfo = getLocationInfo(locationId);
                      const location = locations?.find((loc: any) => loc.id === locationId);
                      
                      // Determine employee commission rate based on location name
                      let rate = 4; // Default rate
                      const name = locationInfo.name.toLowerCase();
                      if (name.includes('capital grille')) {
                        rate = 4;
                      } else if (name.includes('bob')) {
                        rate = 9;
                      } else if (name.includes('truluck')) {
                        rate = 7;
                      } else if (name.includes('boa')) {
                        rate = 6;
                      } else {
                        rate = location?.employeeCommission || 4;
                      }
                      
                      const locationName = ` (${locationInfo.name} rate)`;
                      
                      return (
                        <>
                          <div>• Cash: ${rate} per cash car{locationName}</div>
                          <div>• Credit: ${rate} per card transaction</div>
                          <div>• Receipt: ${rate} per receipt</div>
                        </>
                      );
                    })()}
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-md border border-white/20">
                  <div className="text-sm font-medium mb-2">Tips Breakdown</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Cash Tips:</span>
                      <span>${cashTips.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Credit Card Tips:</span>
                      <span>${creditCardTips.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Receipt Tips:</span>
                      <span>${receiptTips.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold pt-1 border-t border-white/30">
                      <span>Total Tips:</span>
                      <span>${totalTips.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-300 mt-2">
                    {(() => {
                      const locationId = form.watch("locationId");
                      const locationInfo = getLocationInfo(locationId);
                      const location = locations?.find((loc: any) => loc.id === locationId);
                      
                      // Check if this is BOA Steakhouse
                      if (locationInfo.name.toLowerCase().includes('boa')) {
                        return (
                          <>
                            <div>• Cash: $13 per cash car - cash collected (BOA rate)</div>
                            <div>• Credit: $13 per transaction - credit sales</div>
                            <div>• Receipt: $3 per receipt</div>
                          </>
                        );
                      } else {
                        const rate = location?.curbsideRate || locationInfo.perCarPrice;
                        return (
                          <>
                            <div>• Cash: ${rate} per cash car - cash collected</div>
                            <div>• Credit: ${rate} per transaction - credit sales</div>
                            <div>• Receipt: $3 per receipt</div>
                          </>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between bg-white/10 backdrop-blur-sm p-4 rounded-md border border-white/20 mt-[9px] mb-[9px] pt-[8px] pb-[8px]">
                <div className="text-white text-[13px] font-semibold">Total Commission and Tips</div>
                <div className="font-bold text-white text-[14px]">${totalCommissionAndTips.toFixed(2)}</div>
              </div>
              
              <div className="flex justify-between bg-white/10 backdrop-blur-sm p-4 rounded-md border border-white/20 mt-[7px] mb-[7px] pt-[8px] pb-[8px]">
                <div className="text-[14px] font-semibold">
                  {moneyOwed === 0 ? "Company Cash Turn-In" : "Money Owed"}
                </div>
                <div className="font-bold text-green-400 text-[14px]">
                  ${moneyOwed === 0 ? companyCashTurnIn.toFixed(2) : moneyOwed.toFixed(2)}
                </div>
              </div>
              {moneyOwed !== 0 && (
                <div className="text-sm text-red-600 italic">
                  * Money Owed represents the negative cash turn-in amount that needs to be made up
                </div>
              )}

              {/* Total Bank Calculation (Cars x Turn-in Rate) */}
              <div className="flex justify-between bg-white/10 backdrop-blur-sm p-4 rounded-md border border-white/20 mt-3 pt-[8px] pb-[8px]">
                <div className="text-white text-[14px] font-semibold">
                  Total Bank (Cars × Turn-in Rate)
                </div>
                <div className="font-bold text-white text-[14px]">
                  ${(() => {
                    const selectedLocationId = form.watch('locationId');
                    // Get the turn-in rate based on location using hybrid system
                    let turnInRate = 11; // Default to Capital Grille rate
                    if (selectedLocationId === 2) { // Bob's Steak and Chop House
                      turnInRate = 6;
                    } else if (selectedLocationId === 3) { // Truluck's
                      turnInRate = 8;
                    } else if (selectedLocationId === 4) { // BOA Steakhouse
                      turnInRate = 7;
                    } else if (selectedLocationId >= 5) {
                      // Use dynamic turn-in rates for new locations (ID 5+)
                      const location = locations?.find((loc: any) => loc.id === selectedLocationId);
                      turnInRate = location?.turnInRate || 11;
                    }
                    return (totalCars * turnInRate).toFixed(2);
                  })()}
                </div>
              </div>
            </div>
          </div>
          
          <div className="form-card">
            <h3 className="section-title uppercase font-bold flex items-center gap-2">
              <img src={cashUserIcon} alt="Cash User" className="w-4 h-4" />
              EMPLOYEE PAYROLL
            </h3>
            
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="totalJobHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white font-medium text-sm">Total Job Hours</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        inputMode="decimal"
                        pattern="[0-9]*\.?[0-9]*"
                        min="0" 
                        step="0.01" 
                        className="paperform-input" 
                        {...field} 
                        value={field.value === 0 ? '' : field.value}
                        onWheel={(e) => e.currentTarget.blur()}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          field.onChange(value);
                          // No auto-update of employee hours when total changes
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-md border border-white/20">
                <h4 className="font-medium mb-4">Employee Hours Distribution</h4>
                
                {form.watch("totalJobHours") > 0 ? (
                  <div className="space-y-5">
                    {/* Employee input section */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center mb-3">
                        <div className="text-sm font-medium">Employee Details</div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const currentEmployees = form.watch('employees') || [];
                            form.setValue('employees', [...currentEmployees, { name: '', hours: 0 }]);
                          }}
                          className="text-xs h-8 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border-white/20"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" /> Add Employee
                        </Button>
                      </div>
                      
                      <div className="space-y-3 mb-6">
                        {(Array.isArray(form.watch('employees')) ? form.watch('employees') : []).map((employee, index) => {
                          const totalHours = Number(form.watch("totalJobHours") || 0);
                          const hoursPercent = totalHours > 0 ? employee.hours / totalHours : 0;
                          const hourPercentage = (hoursPercent * 100).toFixed(1);
                          
                          return (
                            <div key={index} className="flex items-center gap-2 p-2">
                              <div className="flex-1">
                                <Select 
                                  value={employee.name || ''}
                                  onValueChange={(value) => {
                                    const newEmployees = [...(form.watch('employees') || [])];
                                    newEmployees[index] = { 
                                      ...newEmployees[index], 
                                      name: value 
                                    };
                                    form.setValue('employees', newEmployees);
                                  }}
                                >
                                  <SelectTrigger className="h-9 w-full text-sm bg-white/10 backdrop-blur-sm border-white/20 text-white data-[placeholder]:text-gray-300">
                                    <SelectValue placeholder="Select employee..." />
                                  </SelectTrigger>
                                  <SelectContent className="text-xs max-h-48 overflow-y-auto bg-slate-800/90 backdrop-blur-xl border-slate-600/50" position="popper" side="bottom" align="start">
                                    {employees
                                      .filter((emp: any) => emp.isActive)
                                      .sort((a: any, b: any) => a.fullName.localeCompare(b.fullName))
                                      .map((emp: any) => (
                                        <SelectItem key={emp.id} value={emp.key} className="text-xs py-1 text-white hover:bg-white/10 focus:bg-white/10 data-[highlighted]:bg-white/10 data-[highlighted]:text-white">
                                          {emp.fullName}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="w-20">
                                <Input 
                                  type="number" 
                                  inputMode="decimal"
                                  pattern="[0-9]*\.?[0-9]*"
                                  min="0" 
                                  step="0.01" 
                                  className="h-9 text-center text-sm bg-white/10 backdrop-blur-sm border-white/20 text-white"
                                  value={employee.hours === 0 ? '' : employee.hours}
                                  onWheel={(e) => e.currentTarget.blur()}
                                  onChange={(e) => {
                                    const newEmployees = [...(form.watch('employees') || [])];
                                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                    const totalJobHours = Number(form.watch("totalJobHours") || 0);
                                    
                                    // Calculate current total hours for other employees (excluding this one)
                                    const otherEmployeesHours = newEmployees.reduce(
                                      (sum, emp, empIndex) => {
                                        if (empIndex !== index) {
                                          return sum + (parseFloat(String(emp.hours)) || 0);
                                        }
                                        return sum;
                                      }, 
                                      0
                                    );
                                    
                                    // Check if the new value would exceed total job hours
                                    const maxAllowedHours = Math.max(0, totalJobHours - otherEmployeesHours);
                                    const finalValue = Math.min(value, maxAllowedHours);
                                    
                                    newEmployees[index] = { 
                                      ...newEmployees[index], 
                                      hours: finalValue
                                    };
                                    form.setValue('employees', newEmployees);
                                  }}
                                />
                              </div>
                              <div className="w-12 text-xs text-gray-300 text-center">
                                {hourPercentage}%
                              </div>
                              <Button 
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-300 hover:text-red-400 bg-white/10 hover:bg-red-500/20 border border-white/20 rounded"
                                onClick={() => {
                                  const newEmployees = [...(form.watch('employees') || [])];
                                  newEmployees.splice(index, 1);
                                  form.setValue('employees', newEmployees);
                                  
                                  // We don't update the total job hours when an employee is removed
                                  // This allows the total hours to remain unchanged
                                }}
                              >
                                <span className="sr-only">Remove</span>
                                &times;
                              </Button>
                            </div>
                          );
                        })}
                        
                        {(form.watch('employees') || []).length === 0 && (
                          <div className="text-center text-sm text-gray-300 py-3 bg-white/5 backdrop-blur-sm rounded-md border border-white/10">
                            Add employees to distribute hours
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Summary and Formula Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 border-t border-white/20">
                      <div className="space-y-2">
                        <div className="text-sm font-medium mb-3">Total Payroll Summary</div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Total Commission:</span>
                            <span>${(cashCommission + creditCardCommission + receiptCommission).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Total Tips:</span>
                            <span>${(cashTips + creditCardTips + receiptTips).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm border-t border-white/20 pt-2 mt-2 font-medium">
                            <span>Total Earnings:</span>
                            <span>${(cashCommission + creditCardCommission + receiptCommission + cashTips + creditCardTips + receiptTips).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Job Hours:</span>
                            <span>{form.watch("totalJobHours") || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Money Owed to Employees:</span>
                            <span>${expectedCompanyCashTurnIn < 0 ? Math.abs(expectedCompanyCashTurnIn).toFixed(2) : '0.00'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium mb-3">Distribution Formula</div>
                        <div className="space-y-1 text-xs text-gray-300">
                          <div>• Commission is distributed based on percentage of total hours worked</div>
                          <div>• Tips are distributed based on percentage of total hours worked</div>
                          <div>• Money owed is distributed based on percentage of total hours worked</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Employee individual breakdowns */}
                    {(form.watch('employees') || []).length > 0 && (
                      <div className="py-4 border-t border-white/20">
                        <div className="text-sm font-medium mb-3">Employee Earnings Breakdown</div>
                        
                        <div className="space-y-4">
                          {(form.watch('employees') || []).map((employee, index) => {
                            if (!employee.name) return null;
                            
                            const totalHours = Number(form.watch("totalJobHours") || 0);
                            const hoursPercent = totalHours > 0 ? employee.hours / totalHours : 0;
                            
                            // Calculate individual amounts based on hourly percentage
                            const totalCommission = cashCommission + creditCardCommission + receiptCommission;
                            const totalTips = cashTips + creditCardTips + receiptTips;
                            const employeeCommission = hoursPercent * totalCommission;
                            const employeeTips = hoursPercent * totalTips;
                            
                            // Calculate money owed (if negative cashTurnIn) 
                            const employeeMoneyOwed = expectedCompanyCashTurnIn < 0 ? 
                              hoursPercent * Math.abs(expectedCompanyCashTurnIn) : 0;
                              
                            // Calculate total earnings
                            const totalEarnings = employeeCommission + employeeTips;
                            
                            let employeeName = "Employee";
                            if (employee.name) {
                              // First try to find the employee by key in the employees data
                              const foundEmployee = employees?.find((emp: any) => 
                                emp.key?.toLowerCase() === employee.name.toLowerCase()
                              );
                              
                              if (foundEmployee) {
                                employeeName = foundEmployee.fullName || foundEmployee.key;
                              } else {
                                // Fallback to hardcoded mapping for legacy employees
                                const nameMap: Record<string, string> = {
                                  "antonio": "Antonio Martinez",
                                  "arturo": "Arturo Sanchez",
                                  "brandon": "Brandon Blond",
                                  "brett": "Brett Willson",
                                  "dave": "Dave Roehm",
                                  "devin": "Devin Bean",
                                  "dylan": "Dylan McMullen",
                                  "elijah": "Elijah Aguilar",
                                  "ethan": "Ethan Walker",
                                  "gabe": "Gabe Ott",
                                  "jacob": "Jacob Weldon",
                                  "joe": "Joe Albright",
                                  "jonathan": "Jonathan Zaccheo",
                                  "kevin": "Kevin Hanrahan",
                                  "melvin": "Melvin Lobos",
                                  "noe": "Noe Coronado",
                                  "riley": "Riley McIntyre",
                                  "ryan": "Ryan Hocevar",
                                  "zane": "Zane Springer"
                                };
                                employeeName = nameMap[employee.name] || employee.name || `Employee ${index+1}`;
                              }
                            }
                            
                            return (
                              <div key={index} className="border border-white/10 rounded-md p-3 bg-white/5 backdrop-blur-sm">
                                <div className="flex justify-between mb-2 pb-1 border-b border-white/10">
                                  <div className="font-medium text-sm text-white">{employeeName}</div>
                                  <div className="text-xs text-gray-300">{employee.hours} hours ({(hoursPercent * 100).toFixed(1)}%)</div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-300">Commission:</span>
                                    <span className="text-white">${employeeCommission.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-300">Tips:</span>
                                    <span className="text-white">${employeeTips.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-300">Money Owed:</span>
                                    <span className="text-white">${employeeMoneyOwed.toFixed(2)}</span>
                                  </div>
                                  <div className="col-span-2 flex justify-between text-xs font-medium border-t border-white/10 pt-1 mt-1">
                                    <span className="text-white">Total Earnings:</span>
                                    <span className="text-white">${totalEarnings.toFixed(2)}</span>
                                  </div>


                                  
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Tax Policy Update Notice - Auto-remove after 30 days from July 2, 2025 */}
                        {(() => {
                          const noticeStartDate = new Date('2025-07-02'); // July 2, 2025
                          const currentDate = new Date();
                          const daysDifference = Math.floor((currentDate.getTime() - noticeStartDate.getTime()) / (1000 * 60 * 60 * 24));
                          
                          // Show notice only if less than 30 days have passed
                          if (daysDifference < 30) {
                            return (
                              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-start gap-3">
                                  <div className="bg-red-100 p-2 rounded-full flex-shrink-0">
                                    <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                                  </div>
                                  <div className="space-y-2">
                                    <h4 className="font-semibold text-white">Tax Policy Update Notice</h4>
                                    <div className="text-xs text-gray-300">
                                      <p>
                                        After reviewing payroll data for the past few months, we have determined that the 22% tax payment is not expected to be required moving forward. However, please note that this could change if employees move into a higher tax bracket, potentially requiring us to reimplement the paid-in tax obligation. Any money owed will be contributed to your taxes and should cover your tax obligations, with any remaining balances redistributed back to you via direct deposit or check.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null; // Don't show notice after 30 days
                        })()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-300 py-4 text-center bg-white/10 backdrop-blur-sm rounded-md border border-white/20">
                    Enter Total Job Hours above to begin distributing commission and tips to employees.
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="form-card">
            <h3 className="section-title uppercase font-bold flex items-center gap-2">
              <img src={notesTasksIcon} alt="Notes Tasks" className="w-4 h-4" />
              SHIFT NOTES
            </h3>
            
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white font-medium text-sm">Shift Notes</FormLabel>
                    <FormControl>
                      <Textarea className="paperform-input h-32" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="mt-6 border-t border-gray-200 pt-4">
                <FormField
                  control={form.control}
                  name="confirmationCheck"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 bg-white/10 backdrop-blur-sm border border-white/20">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium">
                          By checking this box, I confirm the numbers above to be correct to the best of my knowledge.
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
          
          <div className="py-8 flex justify-center">
            <Button type="submit" disabled={isSubmitting} className="w-full max-w-md py-6 text-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
              {isSubmitting ? (
                <>
                  <span className="mr-2">Submitting...</span>
                  <span className="animate-spin">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10" />
                    </svg>
                  </span>
                </>
              ) : (
                <>
                  <span>{reportId ? "Update Report" : "Submit Report"}</span>
                  <img src={sendEmailIcon} alt="Send Email" className="ml-3 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
      </div>
    </>
  );
}