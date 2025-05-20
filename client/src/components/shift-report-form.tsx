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
  incidents: z.string().optional(),
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
      incidents: "",
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
                300 W 6th St. Austin, TX 78701
              </div>
            </div>
          )}
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
                      <Input type="date" className="paperform-input" {...field} />
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
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="paperform-input h-[46px]">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="antonio">Antonio Martinez</SelectItem>
                        <SelectItem value="arturo">Arturo Sanchez</SelectItem>
                        <SelectItem value="brandon">Brandon Blond</SelectItem>
                        <SelectItem value="brett">Brett Willson</SelectItem>
                        <SelectItem value="dave">Dave Roehm</SelectItem>
                        <SelectItem value="devin">Devin Bean</SelectItem>
                        <SelectItem value="dylan">Dylan McMullen</SelectItem>
                        <SelectItem value="elijah">Elijah Aguilar</SelectItem>
                        <SelectItem value="ethan">Ethan Walker</SelectItem>
                        <SelectItem value="gabe">Gabe Ott</SelectItem>
                        <SelectItem value="jacob">Jacob Weldon</SelectItem>
                        <SelectItem value="joe">Joe Albright</SelectItem>
                        <SelectItem value="jonathan">Jonathan Zaccheo</SelectItem>
                        <SelectItem value="kevin">Kevin Hanrahan</SelectItem>
                        <SelectItem value="melvin">Melvin Lobos</SelectItem>
                        <SelectItem value="noe">Noe Coronado</SelectItem>
                        <SelectItem value="riley">Riley McIntyre</SelectItem>
                        <SelectItem value="ryan">Ryan Hocevar</SelectItem>
                        <SelectItem value="zane">Zane Springer</SelectItem>
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
                      <span>{form.watch("locationId") === 2 ? "Bob's Steak & Chop House" : "Capital Grille"} Rate: ${form.watch("locationId") === 2 ? "6.00" : "11.00"} per car</span>
                      <span>Expected Turn-In: ${(totalCars * (form.watch("locationId") === 2 ? 6 : 11)).toFixed(2)}</span>
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
                      <span>Expected: ${(creditTransactions * 15).toFixed(2)}</span>
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
                      <span>Expected: ${(cashCars * 15).toFixed(2)}</span>
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
                        <InputMoney className="paperform-input" {...field} />
                      </FormControl>
                      <div className="flex justify-between text-xs text-gray-600 mt-1">
                        <span>Expected: ${expectedCompanyCashTurnIn.toFixed(2)}</span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <div className="money-owed-display p-3 border rounded-md bg-blue-50">
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
                    <div>• Cash: $4 per cash car</div>
                    <div>• Credit: $4 per card transaction</div>
                    <div>• Receipt: $4 per receipt</div>
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
                    <div>• Cash: $15 per cash car - cash collected</div>
                    <div>• Credit: $15 per transaction - credit sales</div>
                    <div>• Receipt: $3 per receipt</div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between bg-blue-100 p-4 rounded-md border border-blue-200">
                <div className="text-base font-bold text-blue-800">Total Commission and Tips</div>
                <div className="text-xl font-bold text-blue-800">${totalCommissionAndTips.toFixed(2)}</div>
              </div>
              
              <div className="flex justify-between bg-gray-100 p-4 rounded-md border border-gray-200">
                <div className="text-base font-bold">
                  {moneyOwed === 0 ? "Company Cash Turn-In" : "Money Owed"}
                </div>
                <div className={`text-xl font-bold ${moneyOwed === 0 ? 'text-green-800' : 'text-red-800'}`}>
                  ${moneyOwed === 0 ? companyCashTurnIn.toFixed(2) : moneyOwed.toFixed(2)}
                </div>
              </div>
              {moneyOwed !== 0 && (
                <div className="text-sm text-red-600 italic">
                  * Money Owed represents the negative cash turn-in amount that needs to be made up
                </div>
              )}
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
                        min="0" 
                        step="0.01" 
                        className="paperform-input" 
                        {...field} 
                        value={field.value === 0 ? '' : field.value}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          field.onChange(value);
                          
                          // Get current employees
                          const currentEmployees = form.watch('employees') || [];
                          
                          // If there are no employees and a total was set, create a default employee
                          if (value > 0 && currentEmployees.length === 0) {
                            form.setValue('employees', [{ name: '', hours: value }]);
                            return;
                          }
                          
                          // If there are employees, adjust their hours to match the new total
                          if (value > 0 && currentEmployees.length > 0) {
                            // Calculate current sum of hours
                            const currentSum = currentEmployees.reduce(
                              (sum, emp) => sum + (parseFloat(String(emp.hours)) || 0), 
                              0
                            );
                            
                            if (currentSum !== value) {
                              // Adjust hours proportionally
                              const ratio = value / currentSum;
                              const updatedEmployees = currentEmployees.map(emp => ({
                                ...emp,
                                hours: Math.round((parseFloat(String(emp.hours)) || 0) * ratio * 100) / 100
                              }));
                              
                              form.setValue('employees', updatedEmployees);
                            }
                          }
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
                        {(form.watch('employees') || []).map((employee, index) => {
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
                                  <SelectContent className="text-xs">
                                    <SelectItem value="antonio" className="text-xs py-1">Antonio Martinez</SelectItem>
                                    <SelectItem value="arturo" className="text-xs py-1">Arturo Sanchez</SelectItem>
                                    <SelectItem value="brandon" className="text-xs py-1">Brandon Blond</SelectItem>
                                    <SelectItem value="brett" className="text-xs py-1">Brett Willson</SelectItem>
                                    <SelectItem value="dave" className="text-xs py-1">Dave Roehm</SelectItem>
                                    <SelectItem value="devin" className="text-xs py-1">Devin Bean</SelectItem>
                                    <SelectItem value="dylan" className="text-xs py-1">Dylan McMullen</SelectItem>
                                    <SelectItem value="elijah" className="text-xs py-1">Elijah Aguilar</SelectItem>
                                    <SelectItem value="ethan" className="text-xs py-1">Ethan Walker</SelectItem>
                                    <SelectItem value="gabe" className="text-xs py-1">Gabe Ott</SelectItem>
                                    <SelectItem value="jacob" className="text-xs py-1">Jacob Weldon</SelectItem>
                                    <SelectItem value="joe" className="text-xs py-1">Joe Albright</SelectItem>
                                    <SelectItem value="jonathan" className="text-xs py-1">Jonathan Zaccheo</SelectItem>
                                    <SelectItem value="kevin" className="text-xs py-1">Kevin Hanrahan</SelectItem>
                                    <SelectItem value="melvin" className="text-xs py-1">Melvin Lobos</SelectItem>
                                    <SelectItem value="noe" className="text-xs py-1">Noe Coronado</SelectItem>
                                    <SelectItem value="riley" className="text-xs py-1">Riley McIntyre</SelectItem>
                                    <SelectItem value="ryan" className="text-xs py-1">Ryan Hocevar</SelectItem>
                                    <SelectItem value="zane" className="text-xs py-1">Zane Springer</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="w-20">
                                <Input 
                                  type="number" 
                                  min="0" 
                                  step="0.01" 
                                  className="h-9 text-center text-sm"
                                  value={employee.hours === 0 ? '' : employee.hours}
                                  onChange={(e) => {
                                    const newEmployees = [...(form.watch('employees') || [])];
                                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                    newEmployees[index] = { 
                                      ...newEmployees[index], 
                                      hours: value
                                    };
                                    form.setValue('employees', newEmployees);
                                    
                                    // Calculate total employee hours and update the total job hours
                                    const totalEmployeeHours = newEmployees.reduce(
                                      (sum, emp) => sum + (parseFloat(String(emp.hours)) || 0), 
                                      0
                                    );
                                    
                                    // Update total job hours to match employee hours distribution
                                    form.setValue('totalJobHours', totalEmployeeHours);
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
                                </div>
                              </div>
                            );
                          })}
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
            <h3 className="section-title uppercase font-bold">NOTES & INCIDENTS</h3>
            
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
              
              <FormField
                control={form.control}
                name="incidents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium text-sm">Incidents</FormLabel>
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