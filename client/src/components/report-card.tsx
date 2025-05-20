import { useState } from "react";
import { useLocation } from "wouter";
import { format, parseISO } from "date-fns";
import { Edit, Trash2, CircleDollarSign, Calendar, Clock, Car, CreditCard, Receipt, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LOCATIONS } from "@/lib/constants";

// Define the Employee interface to include the cashPaid property
interface Employee {
  name: string;
  hours: number;
  cashPaid?: number;
}

interface ReportCardProps {
  id: number;
  locationId: number;
  date: string;
  shift: string;
  shiftLeader?: string;
  totalCars: number;
  totalCreditSales: number;
  totalCashCollected: number;
  companyCashTurnIn: number;
  totalTurnIn: number;
  creditTransactions?: number;
  totalReceipts?: number;
  totalReceiptSales?: number;
  employees?: Employee[] | string;
  totalJobHours?: number;
  createdAt: string;
}

export default function ReportCard({ 
  id, 
  locationId, 
  date, 
  shift, 
  shiftLeader,
  totalCars, 
  totalCreditSales, 
  totalCashCollected, 
  companyCashTurnIn, 
  totalTurnIn, 
  creditTransactions: reportCreditTransactions, 
  totalReceipts,
  totalReceiptSales,
  employees,
  totalJobHours,
  createdAt 
}: ReportCardProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Find location name
  const location = LOCATIONS.find(loc => loc.id === locationId)?.name || 'Unknown Location';
  
  // Format date display
  let formattedDate = date;
  try {
    formattedDate = format(parseISO(date), 'MMM d, yyyy');
  } catch (error) {
    // If date parsing fails, use the original date string
  }
  
  // Format createdAt date
  let formattedCreatedAt = '';
  try {
    formattedCreatedAt = format(parseISO(createdAt), 'MMM d, yyyy');
  } catch (error) {
    // If date parsing fails, use empty string
  }
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Delete report mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/shift-reports/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shift-reports'] });
      toast({
        title: "Report Deleted",
        description: "The shift report has been deleted successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete report: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Handle edit report
  const handleEdit = () => {
    navigate(`/edit-report/${id}`);
  };
  
  // Handle delete report
  const handleDelete = () => {
    deleteMutation.mutate();
  };
  
  // Get the color scheme based on location ID
  const getLocationColorScheme = () => {
    let borderColor = "border-indigo-500";
    let textColor = "text-indigo-700";
    let bgColor = "bg-indigo-50/30";
    
    switch(locationId) {
      case 1: // Capital Grille
        borderColor = "border-blue-500";
        textColor = "text-blue-700";
        bgColor = "bg-blue-50/30";
        break;
      case 2: // Bob's Steak
        borderColor = "border-green-500";
        textColor = "text-green-700";
        bgColor = "bg-green-50/30";
        break;
      case 3: // Truluck's
        borderColor = "border-red-500";
        textColor = "text-red-700";
        bgColor = "bg-red-50/30";
        break;
      case 4: // BOA Steakhouse
        borderColor = "border-sky-500";
        textColor = "text-sky-700";
        bgColor = "bg-sky-50/30";
        break;
    }
    
    return { borderColor, textColor, bgColor };
  };
  
  const { borderColor, textColor, bgColor } = getLocationColorScheme();
  
  // Calculate additional metrics for the detailed view
  const displayCreditTransactions = reportCreditTransactions || Math.round(totalCreditSales / 15);
  const cashCars = totalCars - displayCreditTransactions;
  const cashPerCar = locationId === 2 ? 15 : 15; // Same for all locations currently
  const turnInPerCar = locationId === 2 ? 6 : 11; // Bob's = $6, Capital Grille = $11
  const expectedCashCollected = cashCars * cashPerCar;
  const expectedCompanyCashTurnIn = totalCars * turnInPerCar - totalCreditSales;
  
  // Parse employees if it's a string
  let parsedEmployees: Employee[] = [];
  if (employees) {
    try {
      if (typeof employees === 'string') {
        const parsed = JSON.parse(employees);
        if (Array.isArray(parsed)) {
          parsedEmployees = parsed;
        }
      } else if (Array.isArray(employees)) {
        parsedEmployees = employees;
      }
    } catch (error) {
      console.error("Error parsing employees:", error);
    }
  }
  
  return (
    <>
      <Card className={`report-card mb-4 animate-fade-in border-l-4 ${borderColor} ${bgColor}`}>
        <CardContent className="p-0">
          <div className="flex justify-between items-start">
            <div className="p-4">
              <h4 
                className={`${textColor} cursor-pointer hover:underline font-medium`} 
                onClick={() => setDetailsOpen(true)}
              >
                {location}
              </h4>
              <p className="text-sm text-gray-600">{formattedDate} - {shift} Shift</p>
              <div className="mt-2 flex flex-wrap items-center gap-4">
                <div className="text-sm">
                  <span>Cars: </span>
                  <span>{totalCars}</span>
                </div>
                <div className="text-sm">
                  <span>Cash: </span>
                  <span>{formatCurrency(totalCashCollected)}</span>
                </div>
                <div className="text-sm">
                  <span>Credit: </span>
                  <span>{formatCurrency(totalCreditSales)}</span>
                </div>
                <div className="text-sm">
                  <span>Total: </span>
                  <span>{formatCurrency(totalTurnIn)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-1 p-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEdit}
                className="h-8 w-8 text-gray-500 hover:text-secondary"
              >
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the shift report for {location} on {formattedDate}.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Report Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className={textColor}>{location}</span>
              <Badge variant="outline" className={`${textColor} bg-gray-50`}>
                {shift} Shift
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Detailed shift report from {formattedDate}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Shift Information</h3>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Date:</span>
                  <span className="text-sm">{formattedDate}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Shift:</span>
                  <span className="text-sm">{shift}</span>
                </div>
                
                {shiftLeader && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Shift Leader:</span>
                    <span className="text-sm">{shiftLeader}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Total Cars:</span>
                  <span className="text-sm">{totalCars}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Credit Transactions:</span>
                  <span className="text-sm">{displayCreditTransactions}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Cash Cars:</span>
                  <span className="text-sm">{cashCars}</span>
                </div>
                
                {totalReceipts && totalReceipts > 0 && (
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Receipt Cars:</span>
                    <span className="text-sm">{totalReceipts}</span>
                  </div>
                )}
                
                {totalJobHours && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Total Job Hours:</span>
                    <span className="text-sm">{totalJobHours}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Financial Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Financial Summary</h3>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Credit Sales:</span>
                  <span className="text-sm">{formatCurrency(totalCreditSales)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Cash Collected:</span>
                  <span className="text-sm">{formatCurrency(totalCashCollected)}</span>
                </div>
                
                {totalReceiptSales && totalReceiptSales > 0 && (
                  <div className="flex items-center gap-2">
                    <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Receipt Sales:</span>
                    <span className="text-sm">{formatCurrency(totalReceiptSales)}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Company Cash Turn-In:</span>
                  <span className="text-sm">{formatCurrency(companyCashTurnIn)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Expected Company Turn-In:</span>
                  <span className="text-sm">{formatCurrency(expectedCompanyCashTurnIn)}</span>
                </div>
                
                <div className="flex items-center gap-2 pt-2 border-t">
                  <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Total Turn-In:</span>
                  <span className="text-sm font-semibold">{formatCurrency(totalTurnIn)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Employee Information */}
          {parsedEmployees.length > 0 && (
            <div className="space-y-4 mt-2 pt-6 border-t">
              <h3 className="text-lg font-medium">Employee Information</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">Name</th>
                      <th className="text-right py-2 px-2">Hours</th>
                      <th className="text-right py-2 px-2">Cash Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedEmployees.map((employee, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                        <td className="py-2 px-2">{employee.name}</td>
                        <td className="text-right py-2 px-2">{employee.hours}</td>
                        <td className="text-right py-2 px-2">
                          {employee.cashPaid ? formatCurrency(employee.cashPaid) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Other Details */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <span className="text-sm font-medium">Added on:</span>
                <span className="text-sm ml-1">{formattedCreatedAt}</span>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <span className="text-sm font-medium">Report ID:</span>
                <span className="text-sm ml-1">#{id}</span>
              </div>
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Close
            </Button>
            <Button onClick={handleEdit}>
              Edit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
