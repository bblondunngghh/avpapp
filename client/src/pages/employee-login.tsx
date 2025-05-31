import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft } from "lucide-react";

const formSchema = z.object({
  employeeId: z.string().min(1, "Please select an employee"),
  ssn: z.string().length(4, "Please enter the last 4 digits of your SSN"),
});

type FormValues = z.infer<typeof formSchema>;

export default function EmployeeLogin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch employees for dropdown
  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ["/api/employees"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId: "",
      ssn: "",
    },
  });
  
  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    
    try {
      // Find the selected employee
      const selectedEmployee = employees.find((emp: any) => emp.id.toString() === data.employeeId);
      
      if (!selectedEmployee) {
        throw new Error("Selected employee not found");
      }
      
      // Verify SSN (last 4 digits)
      if (!selectedEmployee.ssn) {
        throw new Error("SSN not set for this employee. Please contact your administrator.");
      }
      
      const lastFourSSN = selectedEmployee.ssn.slice(-4);
      if (data.ssn !== lastFourSSN) {
        throw new Error("Incorrect SSN. Please enter the last 4 digits of your Social Security Number.");
      }
      
      // Store employee info in localStorage for session
      localStorage.setItem("employee_authenticated", "true");
      localStorage.setItem("employee_id", selectedEmployee.id.toString());
      localStorage.setItem("employee_name", selectedEmployee.fullName);
      localStorage.setItem("employee_key", selectedEmployee.key);
      localStorage.setItem("employee_auth_time", Date.now().toString());
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${selectedEmployee.fullName}!`,
      });
      
      // Redirect to employee dashboard
      navigate("/employee-dashboard");
      
    } catch (error: any) {
      console.error("Login error details:", error);
      toast({
        title: "Login failed",
        description: error.message || "Unable to login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute left-2 top-2"
            onClick={() => navigate("/")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="text-2xl text-indigo-700">Employee Login</CardTitle>
          <CardDescription>
            Access your payroll information and timesheets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Your Name</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={isLoading || employeesLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose your name from the list..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees
                          .filter((emp: any) => emp.isActive)
                          .sort((a: any, b: any) => a.fullName.localeCompare(b.fullName))
                          .map((emp: any) => (
                            <SelectItem key={emp.id} value={emp.id.toString()}>
                              {emp.fullName} ({emp.key})
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
                name="ssn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last 4 digits of SSN</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Enter last 4 digits"
                        maxLength={4}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                          field.onChange(value);
                        }}
                        disabled={isLoading || employeesLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={isLoading || employeesLoading}
              >
                {isLoading ? "Logging in..." : employeesLoading ? "Loading employees..." : "Login"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}