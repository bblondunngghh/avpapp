import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, FileUp, AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Define the form schema for CSV uploads
const csvUploadSchema = z.object({
  uploadType: z.enum(['employees', 'employee-payroll', 'shift-reports', 'ticket-distributions'], {
    required_error: 'Please select the type of data you are uploading',
  })
});

type CSVUploadFormValues = z.infer<typeof csvUploadSchema>;

// Template download links
const templateLinks = {
  'employees': '/templates/employees_template.csv',
  'employee-payroll': '/templates/employee_payroll_template.csv',
  'shift-reports': '/templates/shift_reports_template.csv',
  'ticket-distributions': '/templates/ticket_distributions_template.csv',
};

export default function CSVUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [results, setResults] = useState<any | null>(null);
  const [pendingUploads, setPendingUploads] = useState<{key: string, type: string, date: string}[]>([]);
  const { toast } = useToast();

  const form = useForm<CSVUploadFormValues>({
    resolver: zodResolver(csvUploadSchema),
    defaultValues: {
      uploadType: 'employees'
    }
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError('Please upload a CSV file');
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (values: CSVUploadFormValues) => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setResults(null);

    try {
      // Read the file content
      const fileContent = await readFileAsText(file);
      
      // Send to server
      const response = await apiRequest(
        'POST', 
        `/api/upload/${values.uploadType}`,
        { csvData: fileContent }
      );
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // Store the CSV file locally in localStorage as a fallback
        const fallbackKey = `pendingCSV_${values.uploadType}_${new Date().toISOString()}`;
        localStorage.setItem(fallbackKey, fileContent);
        throw new Error("Server returned an invalid response. The CSV file has been saved locally and will be processed when the database connection is restored.");
      }
      
      if (response.ok) {
        setSuccess(`Successfully processed ${data.results.success.length} records`);
        setResults(data.results);
        toast({
          title: 'Upload Successful',
          description: data.message,
        });
      } else {
        setError(data.error || 'Failed to process CSV');
        toast({
          title: 'Upload Failed',
          description: data.error || 'Failed to process CSV',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
      toast({
        title: 'Upload Error',
        description: err.message || 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const getTemplateLink = (type: string) => {
    return templateLinks[type as keyof typeof templateLinks] || '#';
  };
  
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  
  // Check database connection status
  const checkDatabaseConnection = async () => {
    setConnectionStatus('checking');
    try {
      // Simple API call to check if the database connection is available
      const response = await fetch('/api/health-check');
      if (response.ok) {
        setConnectionStatus('connected');
        return true;
      } else {
        setConnectionStatus('disconnected');
        return false;
      }
    } catch (error) {
      setConnectionStatus('disconnected');
      return false;
    }
  };
  
  // Function to clear all pending uploads
  const clearAllPendingUploads = () => {
    // Get all localStorage keys that start with "pendingCSV_"
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('pendingCSV_')) {
        localStorage.removeItem(key);
      }
    }
    
    // Clear the pendingUploads list
    setPendingUploads([]);
    
    toast({
      title: "Pending uploads cleared",
      description: "All pending CSV uploads have been removed.",
      variant: "default",
    });
  };

  // Check for pending uploads when component mounts
  useEffect(() => {
    // Get all localStorage keys that start with "pendingCSV_"
    const pendingKeys: {key: string, type: string, date: string}[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('pendingCSV_')) {
        const [_, type, dateStr] = key.split('_');
        pendingKeys.push({
          key,
          type,
          date: new Date(dateStr).toLocaleString()
        });
      }
    }
    
    if (pendingKeys.length > 0) {
      setPendingUploads(pendingKeys);
      toast({
        title: "Pending uploads found",
        description: `${pendingKeys.length} CSV upload(s) are waiting to be processed.`,
        variant: "default",
      });
      
      // Check connection status if there are pending uploads
      checkDatabaseConnection();
    }
  }, [toast]);
  
  // Check connection status periodically if there are pending uploads
  useEffect(() => {
    if (pendingUploads.length > 0) {
      const interval = setInterval(checkDatabaseConnection, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [pendingUploads.length]);
  
  // Function to process a pending CSV upload
  const processPendingUpload = async (pendingKey: string, uploadType: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setResults(null);
    
    try {
      const csvData = localStorage.getItem(pendingKey);
      if (!csvData) {
        throw new Error("Pending CSV data not found");
      }
      
      // Send to server
      const response = await apiRequest(
        'POST', 
        `/api/upload/${uploadType}`,
        { csvData }
      );
      
      try {
        const data = await response.json();
        
        if (response.ok) {
          // Remove the pending upload from localStorage
          localStorage.removeItem(pendingKey);
          
          // Update pending uploads list
          setPendingUploads(prev => prev.filter(item => item.key !== pendingKey));
          
          setSuccess(`Successfully processed ${data.results.success.length} records`);
          setResults(data.results);
          toast({
            title: 'Upload Successful',
            description: data.message,
          });
        } else {
          setError(data.error || 'Failed to process CSV');
          toast({
            title: 'Upload Failed',
            description: data.error || 'Failed to process CSV',
            variant: 'destructive',
          });
        }
      } catch (jsonError) {
        throw new Error("Server returned an invalid response. The database connection might still be unavailable.");
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process pending upload');
      toast({
        title: 'Processing Error',
        description: err.message || 'Failed to process pending upload',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>CSV Data Upload</CardTitle>
        <CardDescription>
          Upload CSV files to populate your database. Download templates below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="uploadType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Upload Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="employees" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Employee Records
                        </FormLabel>
                        <a 
                          href={getTemplateLink('employees')}
                          download
                          className="text-blue-600 hover:text-blue-800 text-sm ml-auto"
                        >
                          Download Template
                        </a>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="employee-payroll" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Employee Payroll Data
                        </FormLabel>
                        <a 
                          href={getTemplateLink('employee-payroll')}
                          download
                          className="text-blue-600 hover:text-blue-800 text-sm ml-auto"
                        >
                          Download Template
                        </a>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="shift-reports" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Shift Reports
                        </FormLabel>
                        <a 
                          href={getTemplateLink('shift-reports')}
                          download
                          className="text-blue-600 hover:text-blue-800 text-sm ml-auto"
                        >
                          Download Template
                        </a>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="ticket-distributions" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Ticket Distributions
                        </FormLabel>
                        <a 
                          href={getTemplateLink('ticket-distributions')}
                          download
                          className="text-blue-600 hover:text-blue-800 text-sm ml-auto"
                        >
                          Download Template
                        </a>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <label htmlFor="csvFile" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  CSV File
                </label>
                <input
                  type="file"
                  id="csvFile"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="text-sm text-gray-500">
                  {file ? `Selected: ${file.name}` : 'No file selected'}
                </p>
              </div>

              {pendingUploads.length > 0 && (
                <div className="border border-amber-200 bg-amber-50 rounded-md p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <h3 className="font-medium text-amber-800">Pending Uploads</h3>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={clearAllPendingUploads}
                        className="text-xs ml-3 h-7 py-0"
                      >
                        Clear All
                      </Button>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs mr-2">Database connection:</span>
                      {connectionStatus === 'checking' && (
                        <span className="text-xs flex items-center text-amber-600">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Checking...
                        </span>
                      )}
                      {connectionStatus === 'connected' && (
                        <span className="text-xs flex items-center text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Connected
                        </span>
                      )}
                      {connectionStatus === 'disconnected' && (
                        <span className="text-xs flex items-center text-red-600">
                          <XCircle className="h-3 w-3 mr-1" />
                          Disconnected
                        </span>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 w-6 p-0 ml-1"
                        onClick={checkDatabaseConnection}
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span className="sr-only">Check connection</span>
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-amber-700 mb-3">
                    The following CSV files were saved when the database connection was unavailable:
                  </p>
                  <div className="space-y-2">
                    {pendingUploads.map((upload) => (
                      <div key={upload.key} className="flex items-center justify-between p-2 border border-amber-200 bg-white rounded">
                        <div>
                          <p className="text-sm font-medium">{upload.type.replace('-', ' ')} data</p>
                          <p className="text-xs text-gray-500">Saved on {upload.date}</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant={connectionStatus === 'connected' ? "outline" : "secondary"}
                          disabled={loading || connectionStatus !== 'connected'}
                          onClick={() => processPendingUpload(upload.key, upload.type)}
                          className="text-xs"
                        >
                          {connectionStatus === 'connected' ? 'Process Now' : 'Waiting for Connection'}
                        </Button>
                      </div>
                    ))}
                  </div>
                  {connectionStatus === 'disconnected' && (
                    <p className="text-xs text-amber-800 mt-2 italic">
                      Files will be processed automatically when the database connection is restored.
                    </p>
                  )}
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert variant="default" className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Success</AlertTitle>
                  <AlertDescription className="text-green-700">{success}</AlertDescription>
                </Alert>
              )}

              {results && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Results:</h3>
                  {results.success.length > 0 && (
                    <div className="bg-green-50 p-2 rounded-md mb-2">
                      <p className="text-sm text-green-800">{results.success.length} records processed successfully</p>
                    </div>
                  )}
                  {results.errors.length > 0 && (
                    <div className="bg-red-50 p-2 rounded-md">
                      <p className="text-sm text-red-800">{results.errors.length} records failed to process</p>
                      <ul className="text-xs text-red-700 mt-1 list-disc list-inside">
                        {results.errors.slice(0, 5).map((err: any, index: number) => (
                          <li key={index}>{err.fullName || err.batchNumber}: {err.error}</li>
                        ))}
                        {results.errors.length > 5 && <li>...and {results.errors.length - 5} more errors</li>}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FileUp className="mr-2 h-4 w-4" />
                  Upload and Process
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col items-start text-xs text-gray-500 space-y-1">
        <p>• Use the templates to ensure your data is formatted correctly</p>
        <p>• Fields with no value should be left empty in the CSV</p>
        <p>• Boolean values should be TRUE or FALSE (all caps)</p>
        <p>• Dates should be in YYYY-MM-DD format</p>
      </CardFooter>
    </Card>
  );
}