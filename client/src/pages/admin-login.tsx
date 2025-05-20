import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Define the admin password
const ADMIN_PASSWORD = "cg2023";

// Define form schema with zod
const formSchema = z.object({
  password: z.string().min(1, { message: "Password is required" })
});

type FormValues = z.infer<typeof formSchema>;

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: ""
    }
  });

  // Handle form submission
  const onSubmit = (data: FormValues) => {
    setIsLoading(true);
    
    // Simple password check
    if (data.password === ADMIN_PASSWORD) {
      // Import admin auth utility
      import("@/lib/admin-auth").then(({ loginAdmin }) => {
        // Set admin session
        loginAdmin();
        
        // Show success toast
        toast({
          title: "Authentication successful",
          description: "Welcome to the admin panel (session expires after 2 minutes of inactivity)",
          variant: "default",
        });
        
        // Redirect to admin dashboard
        navigate("/admin");
      });
    } else {
      // Show error toast
      toast({
        title: "Authentication failed",
        description: "The password you entered is incorrect",
        variant: "destructive",
      });
      
      // Reset form
      form.reset();
    }
    
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="flex w-full max-w-md justify-end mb-4">
        <Button 
          variant="outline"
          size="sm"
          onClick={() => navigate("/")}
          className="bg-white hover:bg-gray-100 flex items-center gap-1"
        >
          <Home className="h-4 w-4" />
          Return to Home
        </Button>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-blue-100 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
            <Lock className="h-7 w-7 text-blue-700" />
          </div>
          <CardTitle className="text-2xl">Admin Access</CardTitle>
          <CardDescription>
            Enter the admin password to access the administration panel
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter admin password" 
                        autoComplete="current-password"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Authenticating..." : "Login"}
              </Button>
            </form>
          </Form>
        </CardContent>
        
        <CardFooter className="text-center text-sm text-gray-500 border-t pt-4">
          <p className="w-full">
            This area is restricted to authorized personnel only.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}