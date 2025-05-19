import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
  totalCashCollected: z.coerce.number().min(0, "Cannot be negative"),
  companyCashTurnIn: z.coerce.number().min(0, "Cannot be negative"),
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
  tipShare: z.coerce.number().min(0, "Cannot be negative").default(0),
  moneyOwed: z.coerce.number().default(0),
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
      tipShare: 0,
      moneyOwed: 0,
      notes: "",
      incidents: "",
    }
  });
  
  // Update locationId in form when it changes
  useEffect(() => {
    form.setValue("locationId", locationId);
  }, [locationId, form]);

  // Handle totalCars changes
  useEffect(() => {
    const totalCars = form.getValues("totalCars") || 0;
    const companyTurnIn = totalCars * 11;
    
    // We just update the display value without triggering additional watch events
    form.setValue("companyCashTurnIn", companyTurnIn, { 
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false
    });
  }, [form.watch("totalCars")]);
  
  // Fetch report data if editing
  const { data: reportData, isLoading: isLoadingReport } = useQuery({
    queryKey: reportId ? [`/api/shift-reports/${reportId}`] : null,
    enabled: !!reportId,
  });
  
  // Populate form with report data when editing
  useEffect(() => {
    if (reportData && reportId) {
      // Set the location ID from the report data
      if (reportData.locationId) {
        setLocationId(reportData.locationId);
      }
      
      // Set all other form values
      Object.entries(reportData).forEach(([key, value]) => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shift-reports'] });
      toast({
        title: "Success!",
        description: "Report has been submitted successfully.",
      });
      navigate('/');
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shift-reports'] });
      toast({
        title: "Success!",
        description: "Report has been updated successfully.",
      });
      navigate('/');
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
    
    if (reportId) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
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
  const companyTurnIn = totalCars * 11;
  const totalCreditSales = Number(form.watch("totalCreditSales") || 0);
  const totalCashCollected = Number(form.watch("totalCashCollected") || 0);
  const totalTurnIn = totalCreditSales + companyTurnIn;
  const overShort = totalCashCollected - companyTurnIn;
  
  // Commission calculations - based on actual business rules
  const employeeCommission = totalCars * 4; // $4 per car employee commission
  const creditTransactions = Number(form.watch("creditTransactions") || 0);
  const creditCardCommission = creditTransactions * 4; // $4 per credit card transaction
  
  // Calculate cash cars (total cars - credit card transactions)
  const cashCars = totalCars - creditTransactions;
  const cashCommission = cashCars * 4; // $4 per cash car
  const receiptCommission = Number(form.watch("totalReceiptSales") || 0) * 0.05; // 5% of receipt sales
  
  // Tips calculations - based on actual business rules
  const creditCardTips = (creditTransactions * 15) - totalCreditSales; // $15 per transaction minus total credit sales
  const cashTips = (cashCars * 15) - totalCashCollected; // $15 per cash car minus total cash collected
  const receiptTips = Number(form.watch("totalReceiptSales") || 0) * 0.15; // 15% of receipt sales
  const tipShare = (creditCardTips + cashTips + receiptTips) * 0.10; // 10% of total tips
  
  // Totals
  const totalCommission = employeeCommission + creditCardCommission + cashCommission + receiptCommission;
  const totalTips = creditCardTips + cashTips + receiptTips - tipShare;
  const totalCommissionAndTips = totalCommission + totalTips;
  const moneyOwed = totalCashCollected - companyTurnIn - totalTips; // Example calculation
  
  return (
    <div className="form-section">
      <div className="form-title">
        <Button variant="ghost" onClick={handleBack} className="mr-2 p-0 h-8 w-8 self-start">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1>ACCESS VALET PARKING SHIFT REPORT</h1>
        
        <div className="capital-grille-logo">
          <div className="the">T H E</div>
          <div className="capital">CAPITAL</div>
          <div className="grille">
            G<span className="grille-dot">•</span>R<span className="grille-dot">•</span>I<span className="grille-dot">•</span>L<span className="grille-dot">•</span>L<span className="grille-dot">•</span>E
          </div>
        </div>
        
        <div className="address">
          THE CAPITAL GRILLE<br />
          117 W 4TH ST. AUSTIN, TX 78701
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="form-card">
            <h3 className="section-title uppercase font-bold">COMPANY TURN-IN SECTION</h3>
            
            <div className="grid grid-cols-1 gap-6">
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
                    <p className="text-xs text-red-500 mt-1">This question is required</p>
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
                        <SelectItem value="john">John Doe</SelectItem>
                        <SelectItem value="jane">Jane Smith</SelectItem>
                        <SelectItem value="bob">Bob Johnson</SelectItem>
                        <SelectItem value="sarah">Sarah Williams</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    <p className="text-xs text-red-500 mt-1">This question is required</p>
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          <div className="form-card">
            <FormField
              control={form.control}
              name="totalCars"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium text-base">Cars Parked</FormLabel>
                  <div className="text-xs text-gray-500 mb-1">Capital Grille Turn-In Rate = $11.00</div>
                  <FormControl>
                    <Input type="number" min="0" className="paperform-input" {...field} />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-red-500 mt-1">This question is required</p>
                </FormItem>
              )}
            />
            
            <div className="bg-white p-4 rounded-md border border-gray-200 mt-4">
              <div className="flex justify-between items-center">
                <div className="font-medium">Company Turn-In</div>
                <div className="font-bold text-lg">${companyTurnIn.toFixed(2)}</div>
              </div>
            </div>
          </div>
          
          <div className="form-card">
            <h3 className="section-title uppercase font-bold">TRANSACTIONS AND SALES</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="creditTransactions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium text-sm">Number of Credit Card Transactions</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" className="paperform-input" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="totalReceipts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium text-sm">Total Number of Receipts</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" className="paperform-input" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <FormField
                control={form.control}
                name="totalCreditSales"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium text-sm">Total Credit Card Sales</FormLabel>
                    <FormControl>
                      <InputMoney className="paperform-input" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="totalReceipts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium text-sm">Total Number of Receipts</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" className="paperform-input" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <FormField
                control={form.control}
                name="totalCashCollected"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium text-sm">Total Cash Collected</FormLabel>
                    <FormControl>
                      <InputMoney className="paperform-input" {...field} />
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
                    <FormLabel className="text-gray-700 font-medium text-sm">Company Cash Turn-in</FormLabel>
                    <FormControl>
                      <InputMoney 
                        className="paperform-input bg-gray-50"
                        {...field} 
                        readOnly 
                        value={companyTurnIn}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="calculation-box mt-6">
              <div className="calculation-row">
                <span className="calculation-label">Total Turn-in:</span>
                <span className="calculation-value">${totalTurnIn.toFixed(2)}</span>
              </div>
              
              <div className="calculation-row">
                <span className="calculation-label">Over/Short:</span>
                <span className={`calculation-value ${overShort < 0 ? "text-red-500" : overShort > 0 ? "text-green-500" : ""}`}>
                  ${overShort.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="form-card">
            <h3 className="section-title uppercase font-bold">TOTAL COMMISSION AND TIP SUMMARY</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-md">
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
                  <div>• Receipt: 5% of receipt sales</div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-md">
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
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Tip Share:</span>
                    <span>-${tipShare.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-300">
                    <span>Total Tips:</span>
                    <span>${totalTips.toFixed(2)}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  <div>• Cash: $15 per cash car - cash collected</div>
                  <div>• Credit: $15 per transaction - credit sales</div>
                  <div>• Tip Share: 10% of total tips</div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 bg-blue-50 p-4 rounded-md border border-blue-200">
              <div className="flex justify-between items-center">
                <div className="text-base font-bold text-blue-800">Total Commission and Tips</div>
                <div className="text-xl font-bold text-blue-800">${totalCommissionAndTips.toFixed(2)}</div>
              </div>
            </div>
            
            <div className="mt-4 bg-gray-100 p-4 rounded-md border border-gray-300">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-base font-bold">Total Money Owed</div>
                  <div className="text-xs text-gray-600">Amount to be collected from employee</div>
                </div>
                <div className="text-xl font-bold">${moneyOwed.toFixed(2)}</div>
              </div>
            </div>
          </div>
          
          <div className="form-card">
            <h3 className="section-title uppercase font-bold">NOTES AND INCIDENTS</h3>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="mb-6">
                  <FormLabel className="text-gray-700 font-medium text-sm">Shift Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={3} className="paperform-input" {...field} />
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
                    <Textarea rows={3} className="paperform-input" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="mt-8 flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              className="px-6 py-3 rounded-md"
              onClick={handleBack}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="submit-button"
              disabled={isSubmitting}
            >
              {reportId ? "Update Report" : "Submit Report"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
