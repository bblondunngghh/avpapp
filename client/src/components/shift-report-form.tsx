import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// @ts-ignore
import { ShiftReport } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, Plus } from "lucide-react";
import { InputMoney } from "@/components/ui/input-money";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { SHIFT_OPTIONS, LOCATIONS, LOCATION_ID_MAP } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";

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
  
  // Set the locationId from URL parameters or default to first location
  const initialLocationId = locationIdParam ? parseInt(locationIdParam) : 1;
  const [locationId, setLocationId] = useState(initialLocationId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Find location name
  const locationName = LOCATIONS.find(loc => loc.id === locationId)?.name || '';
  
  // Setup form with zod validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      locationId: locationId,
      date: format(new Date(), 'yyyy-MM-dd'),
      shift: "",
      manager: "",
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
    form.setValue("locationId", locationId);
  }, [locationId, form]);
  
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
        setLocationId(data.locationId);
      }
      
      // Set all other form values
      Object.entries(data).forEach(([key, value]) => {
        // @ts-ignore
        if (key in form.getValues()) {
          // @ts-ignore
          form.setValue(key, value);
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
    
    // Ensure all required fields are included
    const formData = {
      ...values,
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
      totalTurnIn: values.totalTurnIn || (values.totalCars * 11),
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
  
  // Use different rates based on location - Bob's = $6, others = $11
  const turnInRate = Number(form.watch("locationId")) === 2 ? 6 : 11;
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
  
  // Commission calculations - Bob's uses $9, others use $4
  const commissionRate = form.watch("locationId") === 2 ? 9 : 4;
  const creditCardCommission = creditTransactions * commissionRate; 
  const cashCommission = cashCars * commissionRate;
  const receiptCommission = totalReceipts * commissionRate;
  
  // Tips calculations based on specific formulas explained
  // For credit card tips: credit transactions * $15 = theoretical revenue
  // If theoretical revenue > actual sales, the difference is tips (excess)
  // If actual sales > theoretical revenue, the difference is also tips (shortfall)
  const creditCardTransactionsTotal = creditTransactions * 15;
  const creditCardTips = Math.abs(totalCreditSales - creditCardTransactionsTotal);
                      
  // For cash tips: cash cars * $15 = theoretical cash revenue
  // If theoretical cash > actual cash collected, the difference is tips (excess)
  // If actual cash > theoretical cash, the difference is also tips (shortfall)
  const cashCarsTotal = cashCars * 15;
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
          
          {form.watch('locationId') === 1 ? (
            <div className="form-header-content">
              <div className="restaurant-image">
                <img 
                  src="/src/assets/capital-grille.jpg" 
                  alt="The Capital Grille" 
                />
              </div>
              
              <div className="address">
                The Capital Grille<br />
                117 W 4th St. Austin, TX 78701
              </div>
            </div>
          ) : form.watch('locationId') === 2 ? (
            <div className="form-header-content">
              <div className="restaurant-image">
                <img 
                  src="/src/assets/bobs.jpg" 
                  alt="Bob's Steak and Chop House" 
                />
              </div>
              
              <div className="address">
                Bob's Steak and Chop House<br />
                301 Lavaca St. Austin, TX 78701
              </div>
            </div>
          ) : form.watch('locationId') === 3 ? (
            <div className="form-header-content">
              <div className="restaurant-image">
                <img 
                  src="/src/assets/trulucks.jpg" 
                  alt="Truluck's" 
                />
              </div>
              
              <div className="address">
                Truluck's<br />
                400 Colorado St. Austin, TX 78701
              </div>
            </div>
          ) : (
            <div className="form-header-content">
              <div className="restaurant-image">
                <img 
                  src="/src/assets/boa.jpg" 
                  alt="BOA Steakhouse" 
                />
              </div>
              
              <div className="address">
                BOA Steakhouse<br />
                305 E 3rd St. Austin, TX 78701
              </div>
            </div>
          )}
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="form-content-container">
            <div className="form-card">
              <h3 className="section-title uppercase font-bold">BASIC INFORMATION</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" className="paperform-input" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="manager"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shift Leader</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="paperform-input">
                              <SelectValue placeholder="Select Shift Leader" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Jordan Bainbridge">Jordan Bainbridge</SelectItem>
                            <SelectItem value="Javier Sosa">Javier Sosa</SelectItem>
                            <SelectItem value="Rami Ceballos">Rami Ceballos</SelectItem>
                            <SelectItem value="Edgar Rodriguez">Edgar Rodriguez</SelectItem>
                            <SelectItem value="Ryan Bonilla">Ryan Bonilla</SelectItem>
                            <SelectItem value="Sergio Acosta">Sergio Acosta</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="locationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(parseInt(value));
                            setLocationId(parseInt(value));
                          }} 
                          defaultValue={field.value.toString()}
                          value={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger 
                              className={`paperform-input ${
                                field.value === 1 ? 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-300' :
                                field.value === 2 ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300' :
                                field.value === 3 ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-300' :
                                'bg-gradient-to-r from-green-50 to-green-100 border-green-300'
                              }`}
                            >
                              <SelectValue placeholder="Select Location" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {LOCATIONS.map((location) => (
                              <SelectItem 
                                key={location.id} 
                                value={location.id.toString()}
                                className={`
                                  ${location.id === 1 ? 'text-amber-800' : 
                                    location.id === 2 ? 'text-blue-800' : 
                                    location.id === 3 ? 'text-red-800' : 
                                    'text-green-800'
                                  }
                                `}
                              >
                                {location.name}
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
                    name="shift"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shift</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="paperform-input">
                              <SelectValue placeholder="Select Shift" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SHIFT_OPTIONS.map((shift) => (
                              <SelectItem key={shift} value={shift}>
                                {shift}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
            
            <div className="form-card">
              <h3 className="section-title uppercase font-bold">TRANSACTION DETAILS</h3>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="totalCars"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Cars</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            className="paperform-input" 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(e.target.valueAsNumber || 0);
                              // Update company cash turn-in if car count changes
                              const currentCreditSales = form.getValues().totalCreditSales || 0;
                              const currentReceiptSales = form.getValues().totalReceiptSales || 0;
                              const newTotalCars = e.target.valueAsNumber || 0;
                              const perCarRate = form.getValues().locationId === 2 ? 6 : 11;
                              const newTotalTurnIn = newTotalCars * perCarRate;
                              
                              // Set the new totalTurnIn value
                              form.setValue("totalTurnIn", newTotalTurnIn);
                              
                              // Calculate new company cash turn-in
                              const newCompanyCashTurnIn = Math.max(0, newTotalTurnIn - currentCreditSales - currentReceiptSales);
                              form.setValue("companyCashTurnIn", newCompanyCashTurnIn);
                              
                              // Calculate over/short
                              const expectedCashTurnIn = newTotalTurnIn - currentCreditSales - currentReceiptSales;
                              form.setValue("overShort", expectedCashTurnIn);
                            }}
                            min={0}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="complimentaryCars"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complimentary Cars</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            className="paperform-input" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                            min={0}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-700 mb-3">Credit Card Sales</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="creditTransactions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Credit Card Transactions</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              className="paperform-input" 
                              {...field}
                              onChange={(e) => {
                                field.onChange(e.target.valueAsNumber || 0);
                                
                                // Recalculate credit card commission
                                const commissionRate = form.getValues().locationId === 2 ? 9 : 4;
                                const newCommission = (e.target.valueAsNumber || 0) * commissionRate;
                                form.setValue("creditCardCommission", newCommission);
                                
                                // Recalculate credit card tips
                                const newTransactions = e.target.valueAsNumber || 0;
                                const expectedCreditSales = newTransactions * 15;
                                const actualCreditSales = form.getValues().totalCreditSales || 0;
                                const newTips = Math.abs(expectedCreditSales - actualCreditSales);
                                form.setValue("creditCardTips", newTips);
                              }}
                              min={0}
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
                          <FormLabel>Total Credit Card Sales</FormLabel>
                          <FormControl>
                            <InputMoney 
                              {...field}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                field.onChange(value);
                                
                                // Update company cash turn-in and over/short when credit sales change
                                const totalCars = form.getValues().totalCars || 0;
                                const receiptSales = form.getValues().totalReceiptSales || 0;
                                const perCarRate = form.getValues().locationId === 2 ? 6 : 11;
                                const totalTurnIn = totalCars * perCarRate;
                                
                                // Calculate expected company cash turn-in
                                const expectedCashTurnIn = totalTurnIn - value - receiptSales;
                                
                                // Set over/short value
                                form.setValue("overShort", expectedCashTurnIn);
                                
                                // If expected cash turn-in is negative, it means money is owed to employees
                                // Set company cash turn-in to 0 in this case
                                if (expectedCashTurnIn < 0) {
                                  form.setValue("companyCashTurnIn", 0);
                                  form.setValue("moneyOwed", Math.abs(expectedCashTurnIn));
                                } else {
                                  // Otherwise, set the company cash turn-in to the expected value
                                  form.setValue("companyCashTurnIn", expectedCashTurnIn);
                                  form.setValue("moneyOwed", 0);
                                }
                                
                                // Recalculate credit card tips
                                const creditTransactions = form.getValues().creditTransactions || 0;
                                const expectedCreditSales = creditTransactions * 15;
                                const newTips = Math.abs(expectedCreditSales - value);
                                form.setValue("creditCardTips", newTips);
                              }}
                              className="paperform-input" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-700 mb-3">Cash Sales</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="totalCashCollected"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Cash Collected</FormLabel>
                          <FormControl>
                            <InputMoney 
                              {...field} 
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                field.onChange(value);
                                
                                // Recalculate cash tips
                                const totalCars = form.getValues().totalCars || 0;
                                const creditTransactions = form.getValues().creditTransactions || 0;
                                const receiptTransactions = form.getValues().totalReceipts || 0;
                                const cashCars = totalCars - creditTransactions - receiptTransactions;
                                const expectedCashSales = cashCars * 15;
                                const newTips = Math.abs(expectedCashSales - value);
                                form.setValue("cashTips", newTips);
                              }}
                              className="paperform-input"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="companyCashTurnIn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {expectedCompanyCashTurnIn >= 0 ? 
                              "Company Cash Turn-In" : 
                              "Money Owed"
                            }
                          </FormLabel>
                          <FormControl>
                            <InputMoney 
                              {...field} 
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                field.onChange(value);
                              }}
                              className={`paperform-input ${
                                expectedCompanyCashTurnIn < 0 ? "bg-amber-50" : ""
                              }`}
                              readOnly={expectedCompanyCashTurnIn < 0}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-700 mb-3">Receipt Sales</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="totalReceipts"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Receipts</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              className="paperform-input" 
                              {...field}
                              onChange={(e) => {
                                field.onChange(e.target.valueAsNumber || 0);
                                
                                // Calculate receipt sales (receipts * $18)
                                const newReceiptCount = e.target.valueAsNumber || 0;
                                const newReceiptSales = newReceiptCount * 18;
                                form.setValue("totalReceiptSales", newReceiptSales);
                                
                                // Recalculate receipt commission
                                const commissionRate = form.getValues().locationId === 2 ? 9 : 4;
                                const newCommission = newReceiptCount * commissionRate;
                                form.setValue("receiptCommission", newCommission);
                                
                                // Recalculate receipt tips ($3 per receipt)
                                const newTips = newReceiptCount * 3;
                                form.setValue("receiptTips", newTips);
                                
                                // Update receipt company share (usually $11 per receipt at Capital Grille, $6 at Bob's)
                                const perReceiptRate = form.getValues().locationId === 2 ? 6 : 11;
                                const newReceiptCompany = newReceiptCount * perReceiptRate;
                                form.setValue("totalReceiptCompany", newReceiptCompany);
                                
                                // Update company cash turn-in and over/short
                                const totalCars = form.getValues().totalCars || 0;
                                const creditSales = form.getValues().totalCreditSales || 0;
                                const perCarRate = form.getValues().locationId === 2 ? 6 : 11;
                                const totalTurnIn = totalCars * perCarRate;
                                
                                // Calculate expected company cash turn-in
                                const expectedCashTurnIn = totalTurnIn - creditSales - newReceiptSales;
                                
                                // Set over/short value
                                form.setValue("overShort", expectedCashTurnIn);
                                
                                // If expected cash turn-in is negative, it means money is owed to employees
                                if (expectedCashTurnIn < 0) {
                                  form.setValue("companyCashTurnIn", 0);
                                  form.setValue("moneyOwed", Math.abs(expectedCashTurnIn));
                                } else {
                                  // Otherwise, set the company cash turn-in to the expected value
                                  form.setValue("companyCashTurnIn", expectedCashTurnIn);
                                  form.setValue("moneyOwed", 0);
                                }
                              }}
                              min={0}
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
                          <FormLabel>Total Receipt Sales</FormLabel>
                          <FormControl>
                            <InputMoney 
                              {...field} 
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                field.onChange(value);
                              }}
                              className="paperform-input"
                              readOnly
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-700 mb-3">Financial Summary</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Commission Breakdown</h5>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between text-gray-600">
                          <span>Credit Card Commission:</span>
                          <span>${creditCardCommission.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Cash Commission:</span>
                          <span>${cashCommission.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Receipt Commission:</span>
                          <span>${receiptCommission.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-medium pt-1 border-t border-gray-100">
                          <span>Total Commission:</span>
                          <span>${totalCommission.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Tips Breakdown</h5>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between text-gray-600">
                          <span>Credit Card Tips:</span>
                          <span>${creditCardTips.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Cash Tips:</span>
                          <span>${cashTips.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Receipt Tips:</span>
                          <span>${receiptTips.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-medium pt-1 border-t border-gray-100">
                          <span>Total Tips:</span>
                          <span>${totalTips.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm md:col-span-2">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Totals</h5>
                      
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="flex justify-between text-gray-600">
                          <span>Total Cars:</span>
                          <span>{totalCars}</span>
                        </div>
                        
                        <div className="flex justify-between text-gray-600">
                          <span>Credit Card Cars:</span>
                          <span>{creditTransactions}</span>
                        </div>
                        
                        <div className="flex justify-between text-gray-600">
                          <span>Cash Cars:</span>
                          <span>{cashCars}</span>
                        </div>
                        
                        <div className="flex justify-between text-gray-600">
                          <span>Receipt Cars:</span>
                          <span>{totalReceipts}</span>
                        </div>
                        
                        <div className="flex justify-between text-gray-600 pt-2 border-t border-gray-100 col-span-2">
                          <span>Total Commission & Tips:</span>
                          <span>${totalCommissionAndTips.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-between text-gray-600 col-span-2">
                          <span>Required Company Turn-In:</span>
                          <span>${totalTurnIn.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-between text-gray-600 col-span-2">
                          {expectedCompanyCashTurnIn >= 0 ? (
                            <>
                              <span>Over/Short:</span>
                              <span className={overShort !== 0 ? "text-orange-600" : "text-green-600"}>
                                {overShort !== 0 ? `$${overShort.toFixed(2)}` : "Balanced"}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-amber-600 font-medium">Money Owed:</span>
                              <span className="text-amber-600 font-medium">${moneyOwed.toFixed(2)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="form-card">
              <h3 className="section-title uppercase font-bold">EMPLOYEE PAYROLL</h3>
              
              <div className="space-y-5">
                <FormField
                  control={form.control}
                  name="totalJobHours"
                  render={({ field }) => (
                    <FormItem className="mb-6">
                      <FormLabel>Total Job Hours</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          min="0"
                          className="paperform-input w-full md:w-48" 
                          {...field}
                          onChange={(e) => {
                            // When total job hours change, update all employee hours proportionally
                            const newTotal = e.target.valueAsNumber || 0;
                            const oldTotal = field.value || 0;
                            const employees = form.getValues().employees || [];
                            
                            if (oldTotal > 0 && employees.length > 0) {
                              // Calculate ratio between old and new total
                              const ratio = newTotal / oldTotal;
                              
                              // Update each employee's hours proportionally
                              const updatedEmployees = employees.map(emp => ({
                                ...emp,
                                hours: Math.round((emp.hours * ratio) * 100) / 100
                              }));
                              
                              form.setValue('employees', updatedEmployees);
                            }
                            
                            field.onChange(newTotal);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {form.watch('totalJobHours') > 0 ? (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm text-gray-800 uppercase">Hours Distribution</h4>
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const employees = form.getValues().employees || [];
                          form.setValue('employees', [
                            ...employees, 
                            { name: '', hours: 0 }
                          ]);
                        }}
                        className="h-8 text-xs border-gray-300"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add Employee
                      </Button>
                    </div>
                    
                    <div className="border rounded-md border-gray-200 bg-gray-50/50 divide-y divide-gray-200">
                      {form.watch('employees').map((employee, index) => {
                        // Calculate values for this employee based on hours percentage
                        const totalJobHrs = form.watch('totalJobHours') || 0;
                        const employeeHoursPercent = employee.hours / totalJobHrs;
                        
                        // Commission calculations
                        const commission = totalCommission;
                        const empCommission = commission * employeeHoursPercent;
                        
                        // Tips calculations
                        const tips = totalTips;
                        const empTips = tips * employeeHoursPercent;
                        
                        // Total earnings
                        const totalEarnings = empCommission + empTips;
                        
                        // Tax is 22% of total earnings
                        const tax = totalEarnings * 0.22;
                        
                        // Money owed calculation
                        const employeeMoneyOwed = Math.max(0, totalEarnings - (companyCashTurnIn > 0 ? companyCashTurnIn * employeeHoursPercent : 0));
                        
                        // Cash turn-in is the tax amount if there's no money owed to cover it
                        const cashTurnIn = Math.max(0, tax - employeeMoneyOwed);
                        
                        return (
                          <div key={index} className="p-4">
                            <div className="flex justify-between items-start mb-4">
                              <h5 className="text-sm font-medium">Employee {index + 1}</h5>
                              
                              {index > 0 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    // Remove this employee
                                    const employees = [...form.getValues().employees];
                                    employees.splice(index, 1);
                                    
                                    // If there are other employees, redistribute the hours
                                    if (employees.length > 0) {
                                      const removedHours = employee.hours;
                                      const totalOtherHours = employees.reduce((sum, emp) => sum + emp.hours, 0);
                                      
                                      // Redistribute proportionally
                                      if (totalOtherHours > 0) {
                                        employees.forEach((emp, i) => {
                                          const ratio = emp.hours / totalOtherHours;
                                          employees[i].hours = parseFloat((emp.hours + (removedHours * ratio)).toFixed(2));
                                        });
                                      }
                                    }
                                    
                                    form.setValue('employees', employees);
                                  }}
                                  className="h-7 text-xs text-gray-500 hover:text-gray-800"
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <FormField
                                control={form.control}
                                name={`employees.${index}.name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">Name</FormLabel>
                                    <Select 
                                      onValueChange={field.onChange} 
                                      defaultValue={field.value}
                                      value={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger className="paperform-input h-9 text-sm">
                                          <SelectValue placeholder="Select Employee" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="Cristian Hurtado">Cristian Hurtado</SelectItem>
                                        <SelectItem value="Oscar Vasquez">Oscar Vasquez</SelectItem>
                                        <SelectItem value="Noah Garza">Noah Garza</SelectItem>
                                        <SelectItem value="Emmanuel Acosta">Emmanuel Acosta</SelectItem>
                                        <SelectItem value="Alexis Rangel">Alexis Rangel</SelectItem>
                                        <SelectItem value="Aaron Veloz">Aaron Veloz</SelectItem>
                                        <SelectItem value="Vince Lozano">Vince Lozano</SelectItem>
                                        <SelectItem value="Jose Galvan">Jose Galvan</SelectItem>
                                        <SelectItem value="Miguel Torres">Miguel Torres</SelectItem>
                                        <SelectItem value="Mario Garza">Mario Garza</SelectItem>
                                        <SelectItem value="Manuel Caudillo">Manuel Caudillo</SelectItem>
                                        <SelectItem value="Cesar Olague">Cesar Olague</SelectItem>
                                        <SelectItem value="Randy Bornes">Randy Bornes</SelectItem>
                                        <SelectItem value="Roberto Acuna">Roberto Acuna</SelectItem>
                                        <SelectItem value="Raul Acosta">Raul Acosta</SelectItem>
                                        <SelectItem value="Eduardo Moreno">Eduardo Moreno</SelectItem>
                                        <SelectItem value="Jordan Bainbridge">Jordan Bainbridge</SelectItem>
                                        <SelectItem value="Javier Sosa">Javier Sosa</SelectItem>
                                        <SelectItem value="Rami Ceballos">Rami Ceballos</SelectItem>
                                        <SelectItem value="Edgar Rodriguez">Edgar Rodriguez</SelectItem>
                                        <SelectItem value="Ryan Bonilla">Ryan Bonilla</SelectItem>
                                        <SelectItem value="Sergio Acosta">Sergio Acosta</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`employees.${index}.hours`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">Hours</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        step="0.01"
                                        min="0"
                                        className="paperform-input h-9 text-sm" 
                                        {...field}
                                        value={field.value}
                                        onChange={(e) => {
                                          // When one employee's hours change, adjust other employees proportionally
                                          const newValue = parseFloat(e.target.value) || 0;
                                          const oldValue = field.value || 0;
                                          const diff = newValue - oldValue;
                                          
                                          // If hours are increased, reduce others proportionally
                                          // If hours are decreased, increase others proportionally
                                          if (diff !== 0) {
                                            const employees = [...form.getValues().employees];
                                            const otherEmployees = employees.filter((_, i) => i !== index);
                                            const totalOtherHours = otherEmployees.reduce((sum, emp) => sum + emp.hours, 0);
                                            
                                            if (totalOtherHours > 0) {
                                              // Adjust other employees' hours proportionally
                                              employees.forEach((emp, i) => {
                                                if (i !== index) {
                                                  const ratio = emp.hours / totalOtherHours;
                                                  employees[i].hours = Math.max(0, parseFloat((emp.hours - (diff * ratio)).toFixed(2)));
                                                }
                                              });
                                            }
                                            
                                            // Set the new value for the current employee
                                            employees[index].hours = newValue;
                                            
                                            // Update all employees
                                            form.setValue('employees', employees);
                                          } else {
                                            // Just update this employee's hours if no change in total
                                            field.onChange(newValue);
                                          }
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <div className="bg-white rounded-md border border-gray-200 p-3">
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                <div className="col-span-2 flex justify-between text-xs font-medium text-gray-700 mb-1">
                                  <span>Location:</span>
                                  <span className={`
                                    ${form.watch('locationId') === 1 ? 'text-amber-800' : 
                                      form.watch('locationId') === 2 ? 'text-blue-800' : 
                                      form.watch('locationId') === 3 ? 'text-red-800' : 
                                      'text-green-800'
                                    }
                                  `}>
                                    {LOCATIONS.find(loc => loc.id === form.watch('locationId'))?.name || ''}
                                  </span>
                                </div>
                                
                                <div className="col-span-2 flex justify-between text-xs text-gray-600">
                                  <span>Hours:</span>
                                  <span>{employee.hours} ({(employeeHoursPercent * 100).toFixed(1)}%)</span>
                                </div>
                                
                                <div className="col-span-2 pt-1 mt-1 border-t border-gray-200"></div>
                                
                                <div className="col-span-2 flex justify-between text-xs font-medium text-sky-700">
                                  <span>Commission:</span>
                                  <span>${empCommission.toFixed(2)}</span>
                                </div>
                                
                                <div className="col-span-2 flex justify-between text-xs font-medium text-sky-700">
                                  <span>Tips:</span>
                                  <span>${empTips.toFixed(2)}</span>
                                </div>
                                
                                <div className="col-span-2 flex justify-between text-xs font-medium text-sky-700 border-t border-gray-200 pt-1 mt-1">
                                  <span>Total Earnings:</span>
                                  <span>${totalEarnings.toFixed(2)}</span>
                                </div>
                                
                                <div className="col-span-2 flex justify-between text-xs font-medium text-gray-600">
                                  <span>Tax (22%):</span>
                                  <span>${tax.toFixed(2)}</span>
                                </div>
                                
                                {employeeMoneyOwed > 0 && (
                                  <div className="col-span-2 flex justify-between text-xs font-medium text-amber-600">
                                    <span>Money Owed:</span>
                                    <span>${employeeMoneyOwed.toFixed(2)}</span>
                                  </div>
                                )}
                                
                                <div className="col-span-2 flex justify-between text-xs font-medium text-sky-700">
                                  <span>Cash Turn-In:</span>
                                  <span>${cashTurnIn.toFixed(2)}</span>
                                </div>
                                
                                {/* Tax Coverage Status */}
                                <div className="col-span-2 flex justify-between text-xs mt-2 pt-1 border-t border-gray-200">
                                  <span className="text-gray-600">Tax Coverage Status:</span>
                                  {tax <= employeeMoneyOwed ? (
                                    <span className="text-green-600 font-medium">Taxes Covered</span>
                                  ) : (employee.cashPaid || 0) >= Math.ceil(tax - employeeMoneyOwed) ? (
                                    <span className="text-green-600 font-medium">Taxes Covered</span>
                                  ) : (
                                    <span className="text-orange-600 font-medium">
                                      ${(tax - employeeMoneyOwed - (employee.cashPaid || 0)).toFixed(2)} still owed
                                    </span>
                                  )}
                                </div>

                                {/* Cash Paid Input */}
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
                                        value={employee.cashPaid || 0}
                                        onChange={(e) => {
                                          const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
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
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600 py-4 text-center bg-white rounded-md border border-gray-200">
                    Enter Total Job Hours above to begin distributing commission and tips to employees.
                  </div>
                )}
              </div>
            </div>
          
          <div className="form-card">
            <h3 className="section-title uppercase font-bold">NOTES</h3>
            
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium text-sm">Notes</FormLabel>
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
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-blue-600"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-normal">
                          I confirm that all the information provided in this report is accurate and complete.
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
            
            <div className="flex justify-center mt-6">
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full md:w-auto px-10 py-6 text-lg rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-opacity-50 border-t-transparent rounded-full mr-2"></div>
                    Submitting...
                  </>
                ) : reportId ? "Update Report" : "Submit Report"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
