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
            <h3 className="section-title">Date & Shift Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          <SelectValue placeholder="Select Shift" />
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
            </div>
            
            <div className="mt-6">
              <FormField
                control={form.control}
                name="manager"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium text-sm">Shift Leader</FormLabel>
                    <FormControl>
                      <Input className="paperform-input" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          <div className="form-card">
            <h3 className="section-title">Company Turn-In Section</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="totalCars"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium text-sm">Number of Cars Parked</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" className="paperform-input" {...field} />
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
                    <FormLabel className="text-gray-700 font-medium text-sm">Company Turn-In ($11 per car)</FormLabel>
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
                <span className="calculation-label">Total Charge Per Car:</span>
                <span className="calculation-value">$15.00</span>
              </div>
              <div className="calculation-row">
                <span className="calculation-label">Employee Commission Per Car:</span>
                <span className="calculation-value">$4.00</span>
              </div>
              <div className="calculation-row">
                <span className="calculation-label">Company Turn-In Per Car:</span>
                <span className="calculation-value">$11.00</span>
              </div>
              <div className="calculation-row font-bold mt-2 pt-2 border-t border-gray-300">
                <span className="calculation-label">Total Company Turn-In (Cars × $11):</span>
                <span className="calculation-value">${companyTurnIn.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="form-card">
            <h3 className="section-title">Transactions and Sales</h3>
            
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
            <h3 className="section-title">Notes and Incidents</h3>
            
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
