import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { insertShiftReportSchema, type Employee, type Location, type EmployeeWithCashPaid } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
// import notesTasksIcon from "@assets/NOTES TASKS_1750779398802.png";
// import sendEmailIcon from "@assets/SEND EMAIL_1750779398746.png";

// Form schema based on the shift report schema
const formSchema = insertShiftReportSchema.extend({
  employees: z.array(z.object({
    name: z.string(),
    hours: z.number(),
    cashPaid: z.number().optional()
  })).default([]),
  confirmationCheck: z.boolean().refine(val => val === true, {
    message: "You must confirm the accuracy of the report"
  })
});

type FormValues = z.infer<typeof formSchema>;

interface ShiftReportFormProps {
  reportId?: number;
}

export default function ShiftReportForm({ reportId }: ShiftReportFormProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch locations for dropdown
  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"]
  });

  // Fetch employees for payroll calculations
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"]
  });

  // Fetch existing report if editing
  const { data: existingReport } = useQuery({
    queryKey: ["/api/shift-reports", reportId],
    enabled: !!reportId
  });

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      locationId: 0,
      date: new Date().toISOString().split("T")[0],
      shift: "",
      manager: "",
      totalCars: 0,
      complimentaryCars: 0,
      creditTransactions: 0,
      totalCreditSales: 0,
      totalReceipts: 0,
      totalReceiptSales: 0,
      totalCashCollected: 0,
      companyCashTurnIn: 0,
      totalTurnIn: 0,
      overShort: 0,
      totalJobHours: 0,
      employees: [],
      notes: "",
      incidents: "",
      confirmationCheck: false,
    },
  });

  // Load existing report data
  useEffect(() => {
    if (existingReport) {
      const employeesData = typeof (existingReport as any).employees === 'string' 
        ? JSON.parse((existingReport as any).employees) 
        : (existingReport as any).employees || [];
      
      form.reset({
        ...existingReport,
        employees: employeesData,
        confirmationCheck: false, // Always require re-confirmation
      });
    }
  }, [existingReport, form]);

  // Watch form values for calculations
  const watchedValues = form.watch([
    "totalCars", 
    "complimentaryCars", 
    "totalCreditSales", 
    "totalCashCollected",
    "totalReceiptSales",
    "totalJobHours",
    "employees"
  ]);

  // Perform calculations when values change
  useEffect(() => {
    const [totalCars, complimentaryCars, totalCreditSales, totalCashCollected, totalReceiptSales] = watchedValues;
    
    // Calculate company cash turn-in (billable cars * $11)
    const billableCars = (totalCars || 0) - (complimentaryCars || 0);
    const companyCashTurnIn = billableCars * 11;
    
    // Calculate total turn-in
    const totalTurnIn = (totalCreditSales || 0) + companyCashTurnIn;
    
    // Calculate over/short
    const overShort = (totalCashCollected || 0) - companyCashTurnIn;
    
    // Update calculated fields
    form.setValue("companyCashTurnIn", companyCashTurnIn);
    form.setValue("totalTurnIn", totalTurnIn);
    form.setValue("overShort", overShort);
  }, [watchedValues, form]);

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const endpoint = reportId ? `/api/shift-reports/${reportId}` : "/api/shift-reports";
      const method = reportId ? "PATCH" : "POST";
      
      // Convert employees array to JSON string for storage
      const { confirmationCheck, ...submitData } = data;
      const finalData = {
        ...submitData,
        employees: JSON.stringify(data.employees || []),
      };
      
      return apiRequest(endpoint, {
        method,
        body: JSON.stringify(finalData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shift-reports"] });
      toast({
        title: reportId ? "Report Updated" : "Report Submitted",
        description: reportId ? "Shift report has been updated successfully." : "Shift report has been submitted successfully.",
      });
      navigate("/submission-complete");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit report",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await submitMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get current form values for payroll calculations
  const totalJobHours = form.watch("totalJobHours") || 0;
  const formEmployees = form.watch("employees") || [];
  const totalCars = form.watch("totalCars") || 0;
  const complimentaryCars = form.watch("complimentaryCars") || 0;
  const totalCreditSales = form.watch("totalCreditSales") || 0;
  const totalReceiptSales = form.watch("totalReceiptSales") || 0;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Basic Information */}
          <div className="form-card">
            <h3 className="section-title uppercase font-bold">BASIC INFORMATION</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="locationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id.toString()}>
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
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                    <FormLabel>Shift</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select shift" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Lunch">Lunch</SelectItem>
                        <SelectItem value="Dinner">Dinner</SelectItem>
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
                    <FormLabel>Shift Leader</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Car Counts and Sales */}
          <div className="form-card">
            <h3 className="section-title uppercase font-bold">CAR COUNTS & SALES</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="totalCars"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Cars</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="creditTransactions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Transactions</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                    <FormLabel>Total Credit Sales ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
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
                    <FormLabel>Total Receipts</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                    <FormLabel>Total Receipt Sales ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalCashCollected"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Cash Collected ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Employee Payroll */}
          <div className="form-card">
            <h3 className="section-title uppercase font-bold">EMPLOYEE PAYROLL</h3>
            
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="totalJobHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Job Hours</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.5"
                        {...field} 
                        value={field.value?.toString() || ''}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {totalJobHours > 0 && formEmployees.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Employee Earnings Breakdown</h4>
                  <div className="space-y-3">
                    {formEmployees.map((employee: EmployeeWithCashPaid, index: number) => {
                      if (!employee.hours || employee.hours <= 0) return null;

                      // Calculate percentages and earnings
                      const hoursPercent = employee.hours / totalJobHours;
                      const billableCars = totalCars - complimentaryCars;
                      
                      // Commission calculations ($4 per billable car)
                      const employeeCommission = hoursPercent * billableCars * 4;
                      
                      // Tips from credit sales (remaining after company takes $11 per car)
                      const creditTips = hoursPercent * Math.max(0, totalCreditSales - (billableCars * 11));
                      
                      // Tips from receipt sales
                      const receiptTips = hoursPercent * totalReceiptSales;
                      
                      const employeeTips = creditTips + receiptTips;
                      
                      // Money owed calculation
                      const expectedCompanyCashTurnIn = billableCars * 11;
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
                            <div className="col-span-2 flex justify-between text-xs font-medium border-t border-gray-200 pt-1 mt-1">
                              <span>Total Earnings:</span>
                              <span>${totalEarnings.toFixed(2)}</span>
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
                              <h4 className="font-semibold text-blue-800">Tax Policy Update Notice</h4>
                              <div className="text-xs text-blue-700">
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
              ) : (
                <div className="text-sm text-gray-600 py-4 text-center bg-white rounded-md border border-gray-200">
                  Enter Total Job Hours above to begin distributing commission and tips to employees.
                </div>
              )}
            </div>
          </div>
          
          <div className="form-card">
            <h3 className="section-title uppercase font-bold flex items-center gap-2">
              SHIFT NOTES
            </h3>
            
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium text-sm">Shift Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        className="paperform-input h-32" 
                        {...field}
                        value={field.value || ''}
                      />
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
            <Button type="submit" disabled={isSubmitting} className="w-full max-w-md py-6 text-lg shadow-lg">
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
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}