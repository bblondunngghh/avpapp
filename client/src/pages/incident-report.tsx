import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Camera, CarFront, ChevronLeft, Plus, Trash2, Upload, X } from "lucide-react";
import sendEmailIcon from "@assets/Send-Email-1--Streamline-Ultimate.png";
import houseIcon from "@assets/House-3--Streamline-Ultimate.png";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Employee } from "@shared/schema";

// Form validation schema
const formSchema = z.object({
  // Customer Information
  customerName: z.string().min(2, { message: "Name is required" }),
  customerEmail: z.string().email({ message: "Please enter a valid email" }),
  customerPhone: z.string().min(10, { message: "Please enter a valid phone number" }),
  
  // Incident Details
  incidentDate: z.string().min(1, { message: "Date is required" }),
  incidentTime: z.string().min(1, { message: "Time is required" }),
  incidentLocation: z.string().min(1, { message: "Location is required" }),
  employeeId: z.string().min(1, { message: "Employee is required" }),
  incidentDescription: z.string().min(10, { message: "Please provide a detailed description" }),
  witnessName: z.string().optional(),
  witnessPhone: z.string().optional(),
  
  // Vehicle Information
  vehicleMake: z.string().min(1, { message: "Make is required" }),
  vehicleModel: z.string().min(1, { message: "Model is required" }),
  vehicleYear: z.string().min(1, { message: "Year is required" }),
  vehicleColor: z.string().min(1, { message: "Color is required" }),
  vehicleLicensePlate: z.string().min(1, { message: "License plate is required" }),
  damageDescription: z.string().min(10, { message: "Please describe the damage" }),
  
  // Additional Information
  additionalNotes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function IncidentReport() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  
  // Fetch employees for the dropdown
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"]
  });
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      incidentDate: new Date().toISOString().split("T")[0],
      incidentTime: "",
      incidentLocation: "",
      employeeId: "",
      incidentDescription: "",
      witnessName: "",
      witnessPhone: "",
      vehicleMake: "",
      vehicleModel: "",
      vehicleYear: "",
      vehicleColor: "",
      vehicleLicensePlate: "",
      damageDescription: "",
      additionalNotes: "",
    },
  });
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const newFiles = Array.from(e.target.files);
    setPhotoFiles(prev => [...prev, ...newFiles]);
    
    // Generate previews
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPhotoPreviews(prev => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    // Clear input value so the same file can be selected again
    e.target.value = "";
  };
  
  const handleRemovePhoto = (index: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };
  
  const submitMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Create a FormData instance to handle the file uploads
      const formData = new FormData();
      
      // Append form values to FormData with proper handling of undefined/null values
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
      
      // Append photo files to FormData
      photoFiles.forEach((file, index) => {
        formData.append(`photos`, file);
      });
      
      // Submit the form data to the API
      const response = await apiRequest("POST", "/api/incident-reports", formData);
      return await response.json();
    },
    onSuccess: (response) => {
      toast({
        title: "Incident Report Submitted",
        description: "Your incident report has been successfully submitted.",
      });
      // Navigate to success page with claim number
      navigate(`/incident-submitted?claimNumber=${response.claimNumber}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "There was an error submitting your report. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: FormValues) => {
    console.log('Submitting form with photos:', photoFiles.length);
    submitMutation.mutate(data);
  };
  
  return (
    <>
      <div className="app-gradient-fixed"></div>
      <div className="min-h-screen-safe max-w-4xl mx-auto px-4 py-6 relative z-10">
        <Button 
          variant="ghost" 
          className="mb-6 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20" 
          onClick={() => navigate("/")}
        >
          <img src={houseIcon} alt="House" className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="mb-8">
          <h1 className="text-2xl text-white uppercase">Incident Report</h1>
          <p className="text-blue-200 mt-1">
            Please fill out this form to report any incidents or damages.
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Customer Information */}
          <Card className="bg-slate-800/50 backdrop-blur-xl border border-slate-600/50 rounded-lg shadow-xl text-white">
            <CardContent className="pt-6">
              <h2 className="text-lg font-medium mb-4 text-white">Customer Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-blue-200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="customerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Email</FormLabel>
                      <FormControl>
                        <Input placeholder="john.doe@example.com" type="email" className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-blue-200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="customerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 123-4567" className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-blue-200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Incident Details */}
          <Card className="bg-slate-800/50 backdrop-blur-xl border border-slate-600/50 rounded-lg shadow-xl text-white">
            <CardContent className="pt-6">
              <h2 className="text-lg font-medium mb-4 text-white">Incident Details</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="incidentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Date</FormLabel>
                        <FormControl>
                          <Input type="date" className="bg-white/10 backdrop-blur-sm border-white/20 text-white" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="incidentTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Time</FormLabel>
                        <FormControl>
                          <Input type="time" className="bg-white/10 backdrop-blur-sm border-white/20 text-white" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="incidentLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Location</FormLabel>
                        <FormControl>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <SelectTrigger className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                              <SelectValue placeholder="Select Location" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="capital-grille">The Capital Grille</SelectItem>
                              <SelectItem value="bobs-steak">Bob's Steak and Chop House</SelectItem>
                              <SelectItem value="trulucks">Truluck's</SelectItem>
                              <SelectItem value="boa-steakhouse">BOA Steakhouse</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Employee Involved</FormLabel>
                        <FormControl>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <SelectTrigger className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                              <SelectValue placeholder="Select Employee" />
                            </SelectTrigger>
                            <SelectContent className="z-50">
                              {employees.map((employee) => (
                                <SelectItem key={employee.id} value={employee.id.toString()}>
                                  {employee.fullName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <FormField
                    control={form.control}
                    name="incidentDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Incident Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Please describe what happened in detail..." 
                            className="min-h-[120px] bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-blue-200" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="witnessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Witness (if any)</FormLabel>
                      <FormControl>
                        <Input placeholder="Witness Name" className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-blue-200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="witnessPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Witness Phone (if any)</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 123-4567" className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-blue-200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Vehicle Information */}
          <Card className="bg-slate-800/50 backdrop-blur-xl border border-slate-600/50 rounded-lg shadow-xl text-white">
            <CardContent className="pt-6">
              <h2 className="text-lg font-medium mb-4 text-white">Vehicle Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="vehicleMake"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Make</FormLabel>
                      <FormControl>
                        <Input placeholder="Toyota, Ford, BMW..." className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-blue-200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="vehicleModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Model</FormLabel>
                      <FormControl>
                        <Input placeholder="Camry, F-150, X5..." className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-blue-200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="vehicleYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Year</FormLabel>
                      <FormControl>
                        <Input placeholder="2023" className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-blue-200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="vehicleColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Color</FormLabel>
                      <FormControl>
                        <Input placeholder="White, Black, Silver..." className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-blue-200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="vehicleLicensePlate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">License Plate</FormLabel>
                      <FormControl>
                        <Input placeholder="ABC123" className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-blue-200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="md:col-span-3">
                  <FormField
                    control={form.control}
                    name="damageDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Damage Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Please describe the damage in detail..." 
                            className="min-h-[100px] bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-blue-200" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Photo Upload Section */}
          <Card className="bg-slate-800/50 backdrop-blur-xl border border-slate-600/50 rounded-lg shadow-xl text-white">
            <CardContent className="pt-6">
              <h2 className="text-lg font-medium mb-4 text-white">Damage Photos</h2>
              <p className="text-sm text-blue-200 mb-4">
                Please upload photos of the damage from multiple angles. Clear photos help us process the incident report faster.
              </p>
              
              <div className="mb-6">
                <label htmlFor="photo-upload" className="block">
                  <div className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center hover:border-white/50 transition-colors cursor-pointer bg-white/5 backdrop-blur-sm">
                    <div className="flex flex-col items-center">
                      <Camera className="h-10 w-10 text-white/70 mb-2" />
                      <span className="text-sm font-medium text-white">
                        Click to upload photos
                      </span>
                      <span className="text-xs text-blue-200 mt-1">
                        JPG, PNG or HEIC up to 10MB
                      </span>
                    </div>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </div>
                </label>
              </div>
              
              {/* Photo Previews */}
              {photoPreviews.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Uploaded Photos ({photoPreviews.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {photoPreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Damage photo ${index + 1}`}
                          className="h-24 w-full object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute top-1 right-1 bg-black bg-opacity-60 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Remove photo"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Additional Notes */}
          <Card className="bg-slate-800/50 backdrop-blur-xl border border-slate-600/50 rounded-lg shadow-xl text-white">
            <CardContent className="pt-6">
              <h2 className="text-lg font-medium mb-4 text-white">Additional Information</h2>
              
              <FormField
                control={form.control}
                name="additionalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any other information you would like to provide..." 
                        className="min-h-[100px] bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-blue-200" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          {/* Submit Button */}
          <div className="flex justify-end">
            <Button 
              type="submit" 
              className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20 w-full md:w-auto"
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? (
                <div className="flex items-center">
                  <span className="animate-spin mr-2">⋯</span> Submitting Report
                </div>
              ) : (
                <div className="flex items-center">
                  <span>Submit Incident Report</span>
                  <img src={sendEmailIcon} alt="Send Email" className="ml-2 h-5 w-5" />
                </div>
              )}
            </Button>
          </div>
        </form>
      </Form>
      </div>
    </>
  );
}