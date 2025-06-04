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
import { InputMoney } from "@/components/ui/input-money";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { SHIFT_OPTIONS, LOCATION_ID_MAP } from "@/lib/constants";
import RestaurantIcon from "@/components/restaurant-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentDateCentral } from "@/lib/timezone";

// Import hardcoded images for original locations
import capGrilleImage from "@assets/CAP GRILLE image.jpg";
import bobsImage from "@assets/bobs.jpg";
import boaImage from "@assets/BOA.jpg";

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

  // Create mutation for submitting new reports
  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // First create the shift report
      const response = await apiRequest('POST', '/api/shift-reports', data);
      const reportData = await response.json();
      
      // Update ticket usage based on totalCars in the report
      const locationTickets = ticketDistributions
        .filter(dist => dist.locationId === data.locationId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // If there are ticket distributions for this location
      if (locationTickets.length > 0) {
        const latestDistribution = locationTickets[0];
        // Calculate new used tickets count
        const newUsedTickets = Math.min(
          latestDistribution.allocatedTickets,
          latestDistribution.usedTickets + data.totalCars
        );
        
        // Update the ticket distribution
        await apiRequest('PUT', `/api/ticket-distributions/${latestDistribution.id}`, {
          locationId: latestDistribution.locationId,
          allocatedTickets: latestDistribution.allocatedTickets,
          usedTickets: newUsedTickets,
          batchNumber: latestDistribution.batchNumber,
          notes: latestDistribution.notes
        });
        
        // Invalidate ticket distributions query to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/ticket-distributions'] });
      }
      
      return reportData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/shift-reports'] });
      toast({
        title: "Success!",
        description: "Report has been submitted successfully and ticket usage has been updated.",
      });
      // Redirect to submission complete page with the report ID
      navigate(`/submission-complete/${data.id}`);
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
    setIsSubmitting(true);
    
    // Make sure employees array is properly included
    const employees = (values.employees || []).map(employee => ({
      name: employee.name || '',
      hours: employee.hours || 0
    }));
    
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
      totalTurnIn: values.totalTurnIn || (values.totalCars * (() => {
        // Use hardcoded rates for original locations (IDs 1-4)
        if (values.locationId === 1) return 11; // Capital Grille
        if (values.locationId === 2) return 6;  // Bob's Steak
        if (values.locationId === 3) return 8;  // Truluck's
        if (values.locationId === 4) return 7;  // BOA Steakhouse
        
        // Use dynamic rates for new locations (ID 5+)
        return locations?.find((loc: any) => loc.id === values.locationId)?.turnInRate || 11;
      })()),
      overShort: values.overShort || 0
    };
    
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
          <Button variant="ghost" onClick={handleBack} className="mr-2 p-0 h-8 w-8">
            <ChevronLeft className="h-5 w-5" />
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
  const perCarPrice = form.watch("locationId") === 4 ? 13 : 15; // BOA uses $13/car, others use $15/car
  
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
    <div className="form-section">
      <div className="form-outer-container">
        <Button variant="ghost" onClick={handleBack} className="p-0 h-8 w-8 self-start absolute left-4 top-4">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <div className="form-header-container">
          <h1 className="report-title">Access Valet Parking Shift Report</h1>
          
          {(() => {
            const currentLocation = locations?.find((loc: any) => loc.id === form.watch('locationId'));
            if (!currentLocation) {
              return (
                <div className="form-header-content">
                  <div className="restaurant-image relative">
                    <div className="w-32 h-16 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-gray-500 text-sm">No Logo</span>
                    </div>
                  </div>
                  
                  <div className="address">
                    Loading location...
                  </div>
                </div>
              );
            }
            
            // Get hardcoded image for original locations
            const getLocationImage = (locationId: number) => {
              switch (locationId) {
                case 1: // Capital Grille
                  return capGrilleImage;
                case 2: // Bob's Steak and Chop House
                  return bobsImage;
                case 3: // Truluck's
                  return null; // No hardcoded image for Truluck's
                case 4: // BOA Steakhouse
                  return boaImage;
                default:
                  return currentLocation.logoUrl || null;
              }
            };

            const locationImage = getLocationImage(currentLocation.id);

            return (
              <div className="form-header-content">
                <div className="restaurant-image relative">
                  {locationImage ? (
                    <img 
                      src={locationImage} 
                      alt={currentLocation.name}
                      className="w-full h-40 object-cover object-center rounded-lg shadow-lg border border-gray-100"
                    />
                  ) : (
                    <div className="w-32 h-16 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-gray-500 text-sm">No Logo</span>
                    </div>
                  )}
                </div>
                
                <div className="address">
                  {currentLocation.name}<br />
                  {currentLocation.address || 'Address not available'}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="form-card">
            <h3 className="section-title uppercase font-bold">SHIFT INFORMATION</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium text-sm">Date</FormLabel>
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
                    <FormLabel className="text-gray-700 font-medium text-sm">Shift</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="paperform-input h-[46px]">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SHIFT_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
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
                    <FormLabel className="text-gray-700 font-medium text-sm">Shift Leader</FormLabel>
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
                      <SelectContent>
                        {employees
                          .filter((emp: any) => emp.isActive && emp.isShiftLeader)
                          .sort((a: any, b: any) => a.fullName.localeCompare(b.fullName))
                          .map((emp: any) => (
                            <SelectItem key={emp.id} value={emp.key}>
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
                    <FormLabel className="text-gray-700 font-medium text-sm">Cars Parked</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        inputMode="numeric"
                        min="0" 
                        className="paperform-input" 
                        {...field}
                        value={field.value === 0 ? '' : field.value}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : Number(e.target.value);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>
                        {(() => {
                          const locationId = form.watch("locationId");
                          const currentLocation = locations?.find((loc: any) => loc.id === locationId);
                          
                          // Use hardcoded rates for original locations
                          if (locationId === 1) return "Capital Grille Rate: $11.00 per car";
                          if (locationId === 2) return "Bob's Steak & Chop House Rate: $6.00 per car";
                          if (locationId === 3) return "Truluck's Rate: $8.00 per car";
                          if (locationId === 4) return "BOA Steakhouse Rate: $7.00 per car";
                          
                          // Use dynamic rates for new locations
                          if (currentLocation) {
                            return `${currentLocation.name} Rate: $${currentLocation.turnInRate?.toFixed(2) || '0.00'} per car`;
                          }
                          
                          return "Rate: $0.00 per car";
                        })()}
                      </span>
                      <span>Expected Turn-In: ${(totalCars * (() => {
                        const locationId = form.watch("locationId");
                        
                        // Use hardcoded rates for original locations (IDs 1-4)
                        if (locationId === 1) return 11; // Capital Grille
                        if (locationId === 2) return 6;  // Bob's Steak
                        if (locationId === 3) return 8;  // Truluck's
                        if (locationId === 4) return 7;  // BOA Steakhouse
                        
                        // Use dynamic rates for new locations (ID 5+)
                        return locations?.find((loc: any) => loc.id === locationId)?.turnInRate || 11;
                      })()).toFixed(2)}</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          <div className="form-card">
            <h3 className="section-title uppercase font-bold">SHIFT DETAILS</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <FormField
                control={form.control}
                name="creditTransactions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium text-sm">Credit Card Transactions</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        inputMode="numeric"
                        min="0" 
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
                    <FormLabel className="text-gray-700 font-medium text-sm">Total Credit Card Sales</FormLabel>
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
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>Expected: ${(creditTransactions * finalPerCarPrice).toFixed(2)}</span>
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
                    <FormLabel className="text-gray-700 font-medium text-sm">Total Receipts</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        inputMode="numeric"
                        min="0" 
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
                    <FormLabel className="text-gray-700 font-medium text-sm">Total Receipt Sales</FormLabel>
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
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>Calculated at $18.00 per receipt</span>
                      <span>Expected: ${(totalReceipts * 18).toFixed(2)}</span>
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
                    <FormLabel className="text-gray-700 font-medium text-sm">Total Cash Collected</FormLabel>
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
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>Expected: ${(cashCars * finalPerCarPrice).toFixed(2)}</span>
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
                      <FormLabel className="text-gray-700 font-medium text-sm">Company Cash Turn-In</FormLabel>
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
                      <div className="flex justify-between text-xs text-gray-600 mt-1">
                        <span>Expected: ${expectedCompanyCashTurnIn.toFixed(2)}</span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <div className="money-owed-display p-3 border rounded-md bg-blue-50 pt-[12px] pb-[12px] pl-[18px] pr-[18px] mt-[12px] mb-[12px]">
                  <h3 className="text-gray-700 font-medium text-sm mb-1">Company Cash Turn-In</h3>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">No cash turn-in required</span>
                    <span className="text-red-500">Money Owed: ${Math.abs(expectedCompanyCashTurnIn).toFixed(2)}</span>
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
            <h3 className="section-title uppercase font-bold">FINANCIAL SUMMARY</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
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
                    <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-300">
                      <span>Total Commission:</span>
                      <span>${totalCommission.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mt-2">
                    {(() => {
                      const locationId = form.watch("locationId");
                      let rate = 4;
                      let locationName = "";
                      
                      if (locationId === 1) {
                        rate = 4;
                        locationName = " (Capital Grille rate)";
                      } else if (locationId === 2) {
                        rate = 9;
                        locationName = " (Bob's rate)";
                      } else if (locationId === 3) {
                        rate = 7;
                        locationName = " (Truluck's rate)";
                      } else if (locationId === 4) {
                        rate = 6;
                        locationName = " (BOA Steakhouse rate)";
                      } else if (locationId >= 5) {
                        const location = locations?.find((loc: any) => loc.id === locationId);
                        rate = location?.employeeCommission || 4;
                        locationName = "";
                      }
                      
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
                
                <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
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
                    <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-300">
                      <span>Total Tips:</span>
                      <span>${totalTips.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mt-2">
                    {(() => {
                      const locationId = form.watch("locationId");
                      if (locationId === 4) {
                        return (
                          <>
                            <div>• Cash: $13 per cash car - cash collected (BOA rate)</div>
                            <div>• Credit: $13 per transaction - credit sales</div>
                            <div>• Receipt: $3 per receipt</div>
                          </>
                        );
                      } else if (locationId >= 5) {
                        const location = locations?.find((loc: any) => loc.id === locationId);
                        const rate = location?.curbsideRate || 15;
                        return (
                          <>
                            <div>• Cash: ${rate} per cash car - cash collected</div>
                            <div>• Credit: ${rate} per transaction - credit sales</div>
                            <div>• Receipt: $3 per receipt</div>
                          </>
                        );
                      } else {
                        return (
                          <>
                            <div>• Cash: $15 per cash car - cash collected</div>
                            <div>• Credit: $15 per transaction - credit sales</div>
                            <div>• Receipt: $3 per receipt</div>
                          </>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between bg-blue-100 p-4 rounded-md border border-blue-200 mt-[9px] mb-[9px] pt-[8px] pb-[8px]">
                <div className="text-blue-800 text-[13px] font-semibold">Total Commission and Tips</div>
                <div className="font-bold text-blue-800 text-[14px]">${totalCommissionAndTips.toFixed(2)}</div>
              </div>
              
              <div className="flex justify-between bg-gray-100 p-4 rounded-md border border-gray-200 mt-[7px] mb-[7px] pt-[8px] pb-[8px]">
                <div className="text-[14px] font-semibold">
                  {moneyOwed === 0 ? "Company Cash Turn-In" : "Money Owed"}
                </div>
                <div className="font-bold text-green-800 text-[14px]">
                  ${moneyOwed === 0 ? companyCashTurnIn.toFixed(2) : moneyOwed.toFixed(2)}
                </div>
              </div>
              {moneyOwed !== 0 && (
                <div className="text-sm text-red-600 italic">
                  * Money Owed represents the negative cash turn-in amount that needs to be made up
                </div>
              )}

              {/* Total Bank Calculation (Cars x Turn-in Rate) */}
              <div className="flex justify-between bg-blue-50 p-4 rounded-md border border-blue-200 mt-3 pt-[8px] pb-[8px]">
                <div className="text-blue-800 text-[14px] font-semibold">
                  Total Bank (Cars × Turn-in Rate)
                </div>
                <div className="font-bold text-blue-800 text-[14px]">
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
            <h3 className="section-title uppercase font-bold">EMPLOYEE PAYROLL</h3>
            
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="totalJobHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium text-sm">Total Job Hours</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        inputMode="decimal"
                        min="0" 
                        step="0.01" 
                        className="paperform-input" 
                        {...field} 
                        value={field.value === 0 ? '' : field.value}
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
              
              <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                <h4 className="font-medium mb-4">Employee Hours Distribution</h4>
                
                {form.watch("totalJobHours") > 0 ? (
                  <div className="space-y-5">
                    {/* Employee input section */}
                    <div className="bg-white p-4 rounded-md border border-gray-200">
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
                          className="text-xs h-8"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" /> Add Employee
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        {(Array.isArray(form.watch('employees')) ? form.watch('employees') : []).map((employee, index) => {
                          const totalHours = Number(form.watch("totalJobHours") || 0);
                          const hoursPercent = totalHours > 0 ? employee.hours / totalHours : 0;
                          const hourPercentage = (hoursPercent * 100).toFixed(1);
                          
                          return (
                            <div key={index} className="flex items-center gap-2 p-2 rounded bg-gray-50 border border-gray-100">
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
                                  <SelectTrigger className="h-9 w-full text-sm">
                                    <SelectValue placeholder="Select employee..." />
                                  </SelectTrigger>
                                  <SelectContent className="text-xs max-h-48 overflow-y-auto" position="popper" side="bottom" align="start">
                                    {employees
                                      .filter((emp: any) => emp.isActive)
                                      .sort((a: any, b: any) => a.fullName.localeCompare(b.fullName))
                                      .map((emp: any) => (
                                        <SelectItem key={emp.id} value={emp.key} className="text-xs py-1">
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
                                  min="0" 
                                  step="0.01" 
                                  className="h-9 text-center text-sm"
                                  value={employee.hours === 0 ? '' : employee.hours}
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
                              <div className="w-12 text-xs text-gray-500 text-center">
                                {hourPercentage}%
                              </div>
                              <Button 
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-red-500"
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
                          <div className="text-center text-sm text-gray-500 py-3 bg-gray-50 rounded-md">
                            Add employees to distribute hours
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Employee earnings calculation breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-md border border-gray-200">
                        <div className="text-sm font-medium mb-3">Total Payroll Summary</div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Commission:</span>
                            <span>${(cashCommission + creditCardCommission + receiptCommission).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Tips:</span>
                            <span>${(cashTips + creditCardTips + receiptTips).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm border-t border-gray-100 pt-2 mt-2 font-medium">
                            <span>Total Earnings:</span>
                            <span>${(cashCommission + creditCardCommission + receiptCommission + cashTips + creditCardTips + receiptTips).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Job Hours:</span>
                            <span>{form.watch("totalJobHours") || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Money Owed to Employees:</span>
                            <span>${expectedCompanyCashTurnIn < 0 ? Math.abs(expectedCompanyCashTurnIn).toFixed(2) : '0.00'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white p-4 rounded-md border border-gray-200">
                        <div className="text-sm font-medium mb-3">Distribution Formula</div>
                        <div className="space-y-1 text-xs text-gray-600">
                          <div>• Commission is distributed based on percentage of total hours worked</div>
                          <div>• Tips are distributed based on percentage of total hours worked</div>
                          <div>• Money owed is distributed based on percentage of total hours worked</div>
                          <div>• Tax calculation: 22% of total earnings (commission + tips)</div>
                          <div>• Cash turn-in = Tax amount - Money owed (if positive)</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Employee individual breakdowns */}
                    {(form.watch('employees') || []).length > 0 && (
                      <div className="bg-white p-4 rounded-md border border-gray-200">
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
                              
                            // Calculate total earnings and tax
                            const totalEarnings = employeeCommission + employeeTips;
                            const tax = totalEarnings * 0.22;
                            const cashTurnIn = Math.max(0, tax - employeeMoneyOwed);
                            
                            let employeeName = "Employee";
                            if (employee.name) {
                              // Get the full name from employee key
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
                              employeeName = nameMap[employee.name] || `Employee ${index+1}`;
                            }
                            
                            return (
                              <div key={index} className="border border-gray-100 rounded-md p-3 bg-gray-50">
                                <div className="flex justify-between mb-2 pb-1 border-b border-gray-200">
                                  <div className="font-medium text-sm text-sky-700">{employeeName}</div>
                                  <div className="text-xs text-gray-600">{employee.hours} hours ({(hoursPercent * 100).toFixed(1)}%)</div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-600">Commission:</span>
                                    <span>${employeeCommission.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-600">Tips:</span>
                                    <span>${employeeTips.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-600">Money Owed:</span>
                                    <span>${employeeMoneyOwed.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-600">22% Tax:</span>
                                    <span>${tax.toFixed(2)}</span>
                                  </div>
                                  <div className="col-span-2 flex justify-between text-xs font-medium border-t border-gray-200 pt-1 mt-1">
                                    <span>Total Earnings:</span>
                                    <span>${totalEarnings.toFixed(2)}</span>
                                  </div>
                                  <div className="col-span-2 flex justify-between text-xs font-medium text-sky-700">
                                    <span>Cash Turn-In:</span>
                                    <span>${cashTurnIn.toFixed(2)}</span>
                                  </div>
                                  
                                  {/* Tax Coverage Status */}
                                  <div className="col-span-2 flex justify-between text-xs mt-2 pt-1 border-t border-gray-200">
                                    <span className="text-gray-600">Tax Coverage Status:</span>
                                    {(employeeMoneyOwed + (employee.cashPaid || 0)) >= tax ? (
                                      <span className="text-green-600 font-medium">Taxes Covered</span>
                                    ) : (
                                      <span className="text-orange-600 font-medium">
                                        ${(tax - employeeMoneyOwed - (employee.cashPaid || 0)).toFixed(2)} still owed
                                      </span>
                                    )}
                                  </div>

                                  {/* Cash Paid Input */}
                                  {/* Only show tax box if taxes aren't fully covered */}
                                  {(() => {
                                    // Check if taxes are fully covered for this employee
                                    const cashPaid = parseFloat(String(employee.cashPaid)) || 0;
                                    const expectedAmount = tax > employeeMoneyOwed ? Math.ceil(tax - employeeMoneyOwed) : 0;
                                    const taxesCovered = cashPaid >= expectedAmount;
                                    
                                    // Only display the cash paid input for admins or if taxes aren't covered
                                    const isAdmin = window.location.pathname.includes('/admin');
                                    
                                    if (taxesCovered && !isAdmin) {
                                      return (
                                        <div className="col-span-2 mt-2 pt-1">
                                          <div className="text-xs text-green-600 font-medium">
                                            ✓ Taxes covered
                                          </div>
                                        </div>
                                      );
                                    } else {
                                      return (
                                        <div className="col-span-2 mt-2 pt-1">
                                          <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-600">Cash Paid:</span>
                                            <div className="relative w-20">
                                              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                                              <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                className="w-full h-6 pl-5 pr-2 text-xs rounded border border-gray-300"
                                                value={employee.cashPaid || ''}
                                                onChange={(e) => {
                                                  const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                                  const newEmployees = [...form.watch('employees')];
                                                  newEmployees[index] = {
                                                    ...newEmployees[index],
                                                    cashPaid: value
                                                  };
                                                  form.setValue('employees', newEmployees);
                                                }}
                                              />
                                            </div>
                                          </div>
                                          {tax > employeeMoneyOwed && (
                                            <div className="text-right text-xs text-gray-500 mt-1">
                                              Expected: ${Math.ceil(tax - employeeMoneyOwed)}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    }
                                  })()}
                                  
                                </div>
                              </div>
                            );
                          })}
                          
                          {/* Total Tax Coverage Summary */}
                          {form.watch('employees')?.length > 0 && (
                            <div className="mt-4 border-t-2 border-gray-200 pt-3">
                              <div className="flex justify-between items-center">
                                <h4 className="text-sm text-gray-800 uppercase">Tax Coverage Summary</h4>
                                
                                {(() => {
                                  const formEmployees = form.watch('employees') || [];
                                  const totalJobHrs = form.watch('totalJobHours') || 0;
                                  
                                  // Calculate total tax and total money owed
                                  let totalTax = 0;
                                  let totalMoneyOwed = 0;
                                  
                                  // Using the same calculations as used for individual employees
                                  const totalCars = form.watch('totalCars') || 0;
                                  const creditTransactions = form.watch('creditTransactions') || 0;
                                  const totalReceipts = form.watch('totalReceipts') || 0;
                                  const locationId = form.watch('locationId');
                                  const cashCars = totalCars - creditTransactions - totalReceipts;
                                  
                                  // Set commission rate based on location
                                  let commissionRate = 4; // Default for most locations
                                  if (locationId === 3) { // Truluck's
                                    commissionRate = 7;
                                  } else if (locationId === 4) { // BOA Steakhouse
                                    commissionRate = 6;
                                  }
                                  
                                  const creditCardCommission = creditTransactions * commissionRate;
                                  const cashCommission = cashCars * commissionRate;
                                  const receiptCommission = totalReceipts * commissionRate;
                                  const commission = cashCommission + creditCardCommission + receiptCommission;
                                  
                                  // Tips calculations
                                  const totalCreditSales = form.watch('totalCreditSales') || 0;
                                  const expectedCreditSales = creditTransactions * 15;
                                  const creditCardTips = Math.abs(expectedCreditSales - totalCreditSales);
                                  
                                  const totalCashCollected = form.watch('totalCashCollected') || 0;
                                  const expectedCashSales = cashCars * 15;
                                  const cashTips = Math.abs(expectedCashSales - totalCashCollected);
                                  
                                  const receiptTips = totalReceipts * 3;
                                  const tips = cashTips + creditCardTips + receiptTips;
                                  
                                  // Company cash turn-in calculation based on location
                                  let perCarRate = 11; // Default to Capital Grille rate
                                  if (locationId === 2) { // Bob's Steak and Chop House
                                    perCarRate = 6;
                                  } else if (locationId === 3) { // Truluck's
                                    perCarRate = 8;
                                  } else if (locationId === 4) { // BOA Steakhouse
                                    perCarRate = 7;
                                  }
                                  const companyCashTurnIn = totalCars * perCarRate - totalCreditSales;
                                  
                                  // Calculate for each employee
                                  formEmployees.forEach(emp => {
                                    const employeeHoursPercent = emp.hours / totalJobHrs;
                                    
                                    // Employee's share of commission and tips
                                    const empCommission = commission * employeeHoursPercent;
                                    const empTips = tips * employeeHoursPercent;
                                    const empEarnings = empCommission + empTips;
                                    const empTax = empEarnings * 0.22;
                                    
                                    // Money owed calculation
                                    const empMoneyOwed = Math.max(0, empEarnings - (companyCashTurnIn > 0 ? companyCashTurnIn * employeeHoursPercent : 0));
                                    
                                    totalTax += empTax;
                                    totalMoneyOwed += empMoneyOwed;
                                  });
                                  
                                  // Calculate total cash paid by all employees
                                  const totalCashPaid = formEmployees.reduce((sum, emp) => 
                                    sum + (parseFloat(String(emp.cashPaid)) || 0), 0
                                  );
                                  
                                  // Calculate the total expected amount (rounded up)
                                  const totalExpectedAmount = formEmployees.reduce((sum, emp) => {
                                    const employeeHoursPercent = emp.hours / totalJobHrs;
                                    const empCommission = commission * employeeHoursPercent;
                                    const empTips = tips * employeeHoursPercent;
                                    const empEarnings = empCommission + empTips;
                                    const empTax = empEarnings * 0.22;
                                    const empMoneyOwed = Math.max(0, empEarnings - (companyCashTurnIn > 0 ? companyCashTurnIn * employeeHoursPercent : 0));
                                    
                                    // Add to sum only if tax exceeds money owed
                                    return sum + (empTax > empMoneyOwed ? Math.ceil(empTax - empMoneyOwed) : 0);
                                  }, 0);
                                  
                                  // Add console logs to debug the values
                                  console.log('Tax Summary - Total Tax:', totalTax);
                                  console.log('Tax Summary - Money Owed:', totalMoneyOwed);
                                  console.log('Tax Summary - Cash Paid:', totalCashPaid);
                                  console.log('Tax Summary - Expected Amount:', totalExpectedAmount);
                                  
                                  // Check if all employees have covered their taxes
                                  const allEmployeesTaxCovered = formEmployees.every(emp => {
                                    const employeeHoursPercent = emp.hours / totalJobHrs;
                                    
                                    // Calculate employee's tax and money owed
                                    const empCommission = commission * employeeHoursPercent;
                                    const empTips = tips * employeeHoursPercent;
                                    const empEarnings = empCommission + empTips;
                                    const empTax = empEarnings * 0.22;
                                    const empMoneyOwed = Math.max(0, empEarnings - (companyCashTurnIn > 0 ? companyCashTurnIn * employeeHoursPercent : 0));
                                    
                                    // Check if either cash paid covers tax or if money owed covers tax
                                    const cashPaid = parseFloat(String(emp.cashPaid)) || 0;
                                    const taxObligation = Math.max(0, empTax - empMoneyOwed);
                                    
                                    // Tax is covered if either money owed covers it OR cash paid covers it
                                    return empMoneyOwed >= empTax || cashPaid >= Math.ceil(taxObligation);
                                  });
                                  
                                  // Only show "All Taxes Covered" if all employees have covered their taxes
                                  if (allEmployeesTaxCovered && totalTax > 0) {
                                    return (
                                      <div className="text-sm text-green-600">
                                        All Taxes Covered
                                      </div>
                                    );
                                  } else if (totalTax > 0) {
                                    // Calculate the remaining amount still owed - should be totalExpectedAmount minus totalCashPaid
                                    const stillOwed = totalExpectedAmount - totalCashPaid;
                                    return (
                                      <div className="text-sm text-orange-600">
                                        Total Still Owed: ${Math.max(0, stillOwed).toFixed(2)}
                                      </div>
                                    );
                                  } else {
                                    return (
                                      <div className="text-sm text-gray-600">
                                        No Tax Data Available
                                      </div>
                                    );
                                  }
                                })()}
                              </div>
                              
                              {/* Total Cash Tax Summary Section */}
                              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-3">
                                {(() => {
                                  const formEmployees = form.watch('employees') || [];
                                  const totalJobHrs = form.watch('totalJobHours') || 0;
                                  
                                  // Calculate total cash paid by all employees
                                  const totalCashPaid = formEmployees.reduce((sum, emp) => 
                                    sum + (parseFloat(String(emp.cashPaid)) || 0), 0
                                  );
                                  
                                  // Recalculate all the values we need (copied from above to maintain scope)
                                  const totalCars = form.watch('totalCars') || 0;
                                  const creditTransactions = form.watch('creditTransactions') || 0;
                                  const totalReceipts = form.watch('totalReceipts') || 0;
                                  const locationId = form.watch('locationId');
                                  const cashCars = totalCars - creditTransactions - totalReceipts;
                                  
                                  // Commission rates
                                  let commissionRate = 4; // Default for most locations
                                  if (locationId === 3) { // Truluck's
                                    commissionRate = 7;
                                  } else if (locationId === 4) { // BOA Steakhouse
                                    commissionRate = 6;
                                  }
                                  
                                  // Commission calculations
                                  const creditCardCommission = creditTransactions * commissionRate;
                                  const cashCommission = cashCars * commissionRate;
                                  const receiptCommission = totalReceipts * commissionRate;
                                  
                                  // Tips calculations
                                  const totalCreditSales = form.watch('totalCreditSales') || 0;
                                  const expectedCreditSales = creditTransactions * 15;
                                  const creditCardTips = Math.abs(expectedCreditSales - totalCreditSales);
                                  
                                  const totalCashCollected = form.watch('totalCashCollected') || 0;
                                  const expectedCashSales = cashCars * 15;
                                  const cashTips = Math.abs(expectedCashSales - totalCashCollected);
                                  
                                  const receiptTips = totalReceipts * 3;
                                  
                                  // Total calculations
                                  const totalCommission = cashCommission + creditCardCommission + receiptCommission;
                                  const totalTips = cashTips + creditCardTips + receiptTips;
                                  const totalEarnings = totalCommission + totalTips;
                                  const totalTaxAmount = totalEarnings * 0.22;
                                  
                                  // Calculate money owed (if company cash turn in is negative)
                                  let perCarRate = 11; // Default to Capital Grille rate
                                  if (locationId === 2) { // Bob's Steak and Chop House
                                    perCarRate = 6;
                                  } else if (locationId === 3) { // Truluck's
                                    perCarRate = 8;
                                  } else if (locationId === 4) { // BOA Steakhouse
                                    perCarRate = 7;
                                  }
                                  const companyCashTurnIn = totalCars * perCarRate - totalCreditSales;
                                  
                                  // Calculate total money owed to employees
                                  const calculatedMoneyOwed = companyCashTurnIn < 0 ? Math.abs(companyCashTurnIn) : 0;
                                  
                                  // Calculate net tax obligation (tax amount minus any money owed to employees)
                                  const netTaxObligationTotal = Math.max(0, totalTaxAmount - calculatedMoneyOwed);
                                  
                                  return (
                                    <>
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-blue-800">Total Cash for Taxes:</span>
                                        <span className="text-sm font-bold text-blue-900">${totalCashPaid.toFixed(2)}</span>
                                      </div>
                                      <p className="text-xs text-blue-700">
                                        The total cash needed to fulfill your tax obligation is ${Math.ceil(netTaxObligationTotal).toFixed(2)}. 
                                        This amount is calculated as 22% of total earnings (${totalEarnings.toFixed(2)}) minus any money owed to employees.
                                      </p>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-600 py-4 text-center bg-white rounded-md border border-gray-200">
                    Enter Total Job Hours above to begin distributing commission and tips to employees.
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="form-card">
            <h3 className="section-title uppercase font-bold">SHIFT NOTES</h3>
            
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium text-sm">Shift Notes</FormLabel>
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
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 bg-blue-50">
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
            <Button type="submit" disabled={isSubmitting} className="w-full max-w-md py-6 text-lg">
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
                  <span className="ml-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 2L11 13" />
                      <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                    </svg>
                  </span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}