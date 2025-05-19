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
import { ChevronLeft } from "lucide-react";
import { InputMoney } from "@/components/ui/input-money";
import { apiRequest } from "@/lib/queryClient";
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
  
  // Create mutation for submitting new reports
  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest('POST', '/api/shift-reports', data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/shift-reports'] });
      toast({
        title: "Success!",
        description: "Report has been submitted successfully.",
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
    
    // Ensure all required fields are included
    const formData = {
      ...values,
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
  const totalTurnIn = totalCars * 11; // Total Turn-In is calculated as total cars * $11
  
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
  
  // Commission calculations
  const creditCardCommission = creditTransactions * 4; // $4 per credit card transaction
  const cashCommission = cashCars * 4; // $4 per cash car
  const receiptCommission = totalReceipts * 4; // $4 commission per receipt
  
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
      <div className="form-title">
        <Button variant="ghost" onClick={handleBack} className="mr-2 p-0 h-8 w-8 self-start">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="company-logo-container">
          <div className="overflow-hidden" style={{ height: "80px" }}>
            <img 
              src="/src/assets/avp-logo-original.png" 
              alt="Access Valet Parking" 
              style={{ 
                height: "130px", 
                width: "auto", 
                marginTop: "-15px", 
                objectFit: "cover", 
                objectPosition: "center 40%" 
              }} 
            />
          </div>
        </div>
        <h1>Access Valet Parking Shift Report</h1>
        
        {form.watch('locationId') === 1 ? (
          <>
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
          </>
        ) : form.watch('locationId') === 2 ? (
          <>
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
          </>
        ) : form.watch('locationId') === 3 ? (
          <>
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
          </>
        ) : (
          <>
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
          </>
        )}
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
                      <Input type="number" min="0" className="paperform-input" {...field} />
                    </FormControl>
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>Capital Grille Rate: $11.00 per car</span>
                      <span>Expected Turn-In: ${(totalCars * 11).toFixed(2)}</span>
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
                      <Input type="number" min="0" className="paperform-input" {...field} />
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
                      <InputMoney className="paperform-input" {...field} />
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
                      <Input type="number" min="0" className="paperform-input" {...field} />
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
                      <InputMoney className="paperform-input" {...field} />
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
                      <InputMoney className="paperform-input" {...field} />
                    </FormControl>
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>Expected: ${(cashCars * 15).toFixed(2)}</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
                      <span>Expected: ${expectedCompanyCashTurnIn > 0 ? expectedCompanyCashTurnIn.toFixed(2) : '0.00'}</span>
                      {expectedCompanyCashTurnIn < 0 && (
                        <span className="text-red-500">Money Owed: ${Math.abs(expectedCompanyCashTurnIn).toFixed(2)}</span>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                        step="0.5" 
                        className="paperform-input" 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(parseFloat(e.target.value) || 0);
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
                  <div className="space-y-4">
                    <div className="grid grid-cols-9 gap-2 font-medium text-sm pb-2 text-center">
                      <div className="text-left">Employee</div>
                      <div>Hours</div>
                      <div>% of Total</div>
                      <div>Commission</div>
                      <div>Tips</div>
                      <div>Money Owed</div>
                      <div>Total Earnings</div>
                      <div>Taxes (22%)</div>
                      <div>Cash Turn-In</div>
                    </div>
                    
                    {(form.watch('employees') || []).map((employee, index) => {
                      const totalHours = Number(form.watch("totalJobHours") || 0);
                      const hoursPercent = totalHours > 0 ? employee.hours / totalHours : 0;
                      const hourPercentage = (hoursPercent * 100).toFixed(1);
                      
                      // Calculate individual amounts based on hourly percentage
                      const totalCommission = cashCommission + creditCardCommission + receiptCommission;
                      const totalTips = cashTips + creditCardTips + receiptTips;
                      const employeeCommission = hoursPercent * totalCommission;
                      const employeeTips = hoursPercent * totalTips;
                      
                      // Calculate money owed (if negative cashTurnIn) 
                      const employeeMoneyOwed = expectedCompanyCashTurnIn < 0 ? 
                        hoursPercent * Math.abs(expectedCompanyCashTurnIn) : 0;
                      
                      return (
                        <div key={index} className="grid grid-cols-9 gap-2 items-center">
                          <div>
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
                              <SelectTrigger className="paperform-input">
                                <SelectValue placeholder="Select employee..." />
                              </SelectTrigger>
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
                          </div>
                          <div className="text-center">
                            <Input 
                              type="number" 
                              min="0" 
                              step="0.5" 
                              className="paperform-input text-center"
                              value={employee.hours || 0}
                              onChange={(e) => {
                                const newEmployees = [...(form.watch('employees') || [])];
                                newEmployees[index] = { 
                                  ...newEmployees[index], 
                                  hours: parseFloat(e.target.value) || 0 
                                };
                                form.setValue('employees', newEmployees);
                              }}
                            />
                          </div>
                          <div className="text-sm text-center">
                            {hourPercentage}%
                          </div>
                          <div className="text-sm font-medium text-center">
                            ${employeeCommission.toFixed(2)}
                          </div>
                          <div className="text-sm font-medium text-center">
                            ${employeeTips.toFixed(2)}
                          </div>
                          <div className="text-sm font-medium text-center">
                            ${employeeMoneyOwed.toFixed(2)}
                          </div>
                          <div className="text-sm font-medium text-center text-blue-800">
                            ${(employeeCommission + employeeTips).toFixed(2)}
                          </div>
                          {/* Taxes (22% of total earnings) */}
                          <div className="text-sm font-medium text-center text-red-700">
                            ${((employeeCommission + employeeTips) * 0.22).toFixed(2)}
                          </div>
                          {/* Cash Turn-In (taxes minus money owed, if positive) */}
                          <div className="text-sm font-medium text-center">
                            ${Math.max(((employeeCommission + employeeTips) * 0.22) - employeeMoneyOwed, 0).toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                    
                    <div className="mt-4 flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const currentEmployees = form.watch('employees') || [];
                          form.setValue('employees', [...currentEmployees, { name: '', hours: 0 }]);
                        }}
                      >
                        Add Employee
                      </Button>
                      
                      {(form.watch('employees')?.length || 0) > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const currentEmployees = [...(form.watch('employees') || [])];
                            currentEmployees.pop();
                            form.setValue('employees', currentEmployees);
                          }}
                        >
                          Remove Last
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
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
            </div>
          </div>
          
          <div className="py-8 flex justify-center">
            <Button type="submit" disabled={isSubmitting} className="w-full max-w-md py-6 text-lg">
              {isSubmitting ? "Submitting..." : reportId ? "Update Report" : "Submit Report"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}