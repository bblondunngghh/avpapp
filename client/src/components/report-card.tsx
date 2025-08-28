import { useState } from "react";
import { useLocation } from "wouter";
import { format, parseISO } from "date-fns";
import { Edit, Trash2, CircleDollarSign, Calendar, Clock, Car, CreditCard, Receipt, User } from "lucide-react";
import { formatDateForDisplay } from "@/lib/timezone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LOCATIONS, EMPLOYEE_NAMES } from "@/lib/constants";

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
  const [deletePassword, setDeletePassword] = useState("");
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  
  // Find location name
  const location = LOCATIONS.find(loc => loc.id === locationId)?.name || 'Unknown Location';
  
  // Format date display with proper timezone handling
  const formattedDate = formatDateForDisplay(date);
  
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
  
  // Handle delete report with password verification
  const handleDelete = () => {
    if (deletePassword === "bbonly") {
      deleteMutation.mutate();
      setShowPasswordDialog(false);
      setDeletePassword("");
    } else {
      toast({
        title: "Access Denied",
        description: "Incorrect password. Unable to delete report.",
        variant: "destructive"
      });
    }
  };

  // Handle password dialog submit
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleDelete();
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
  const totalReceiptCars = totalReceipts || 0;
  const cashCars = totalCars - displayCreditTransactions - totalReceiptCars;
  
  // Set per-car rates based on location
  let cashPerCar = 15; // Default
  let turnInPerCar = 11; // Default for Capital Grille
  
  switch(locationId) {
    case 1: // Capital Grille
      cashPerCar = 15;
      turnInPerCar = 11;
      break;
    case 2: // Bob's
      cashPerCar = 15;
      turnInPerCar = 6;
      break;
    case 3: // Truluck's
      cashPerCar = 15;
      turnInPerCar = 8;
      break;
    case 4: // BOA
      cashPerCar = 13;
      turnInPerCar = 7;
      break;
  }
  const expectedCashCollected = cashCars * cashPerCar;
  // Calculate expected total turn-in (this should match what's shown as Total Turn-In)
  const expectedTotalTurnIn = totalCars * turnInPerCar;
  const expectedCompanyCashTurnIn = expectedTotalTurnIn - totalCreditSales;
  
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
      <div className="relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl mb-4 animate-fade-in">
        {/* Enhanced Glass morphism overlay */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
        
        {/* Content with z-index */}
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div className="p-4">
              <h4 
                className="text-white cursor-pointer hover:underline font-medium hover:text-blue-300 transition-colors" 
                onClick={() => setDetailsOpen(true)}
              >
                {location}
              </h4>
              <p className="text-sm text-slate-300">{formattedDate} - {shift} Shift</p>
              <div className="mt-2 flex flex-wrap items-center gap-4">
                <div className="text-sm text-slate-300">
                  <span>Cars: </span>
                  <span className="text-white font-medium">{totalCars}</span>
                </div>
                <div className="text-sm text-slate-300">
                  <span>Cash: </span>
                  <span className="text-green-300 font-medium">{formatCurrency(totalCashCollected)}</span>
                </div>
                <div className="text-sm text-slate-300">
                  <span>Credit: </span>
                  <span className="text-purple-300 font-medium">{formatCurrency(totalCreditSales)}</span>
                </div>
                <div className="text-sm text-slate-300">
                  <span>Total: </span>
                  <span className="text-blue-300 font-medium">{formatCurrency(totalTurnIn)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-1 p-2">
              <Button
                size="icon"
                onClick={handleEdit}
                className="h-8 w-8 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-slate-300 hover:text-white border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>
              
              <Button
                size="icon"
                onClick={() => setShowPasswordDialog(true)}
                className="h-8 w-8 bg-white/10 backdrop-blur-sm hover:bg-red-500/20 text-slate-300 hover:text-red-300 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Report Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className={`${textColor} font-normal`}>{location}</span>
              <Badge variant="outline" className={`${textColor} bg-gray-50 font-normal`}>
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
                  <span className="text-sm font-semibold">{formatCurrency(expectedTotalTurnIn)}</span>
                  <span className="text-xs text-gray-500">({totalCars} × ${turnInPerCar})</span>
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
                      <th className="text-right py-2 px-2">Commission</th>
                      <th className="text-right py-2 px-2">Tips</th>
                      <th className="text-right py-2 px-2">Total Earned</th>
                      <th className="text-right py-2 px-2">Tax Due</th>
                      <th className="text-right py-2 px-2">Tax Paid</th>
                      <th className="text-right py-2 px-2">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedEmployees.map((employee, index) => {
                      // Get employee full name from employee key
                      const employeeNameMap: Record<string, string> = {
                        "antonio": "Antonio Martinez",
                        "arturo": "Arturo Sanchez",
                        "brandon": "Brandon Blond",
                        "brett": "Brett Willson",
                        "dave": "Dave Roehm",
                        "devin": "Devin Bean",
                        "dylan": "Dylan McMullen",
                        "eddie": "Eddie Coleman",
                        "joe": "Joe Albright",
                        "jorge": "Jorge Garcia",
                        "josh": "Josh Millan",
                        "juan": "Juan Carlos Moreno",
                        "justin": "Justin Hayworth",
                        "luke": "Luke Wilheim",
                        "luis": "Luis Banda",
                        "mitch": "Mitch Wilker",
                        "ray": "Ray Donovan",
                        "ruben": "Ruben Gutierrez",
                        "tim": "Tim Garza"
                      };
                      
                      const fullName = employeeNameMap[employee.name] || employee.name;
                      
                      // Calculate financial details for the employee
                      const commission = employee.hours * 4; // $4 per hour commission
                      const tips = employee.hours * 5; // $5 per hour in tips
                      const totalEarned = commission + tips;
                      const taxDue = Math.ceil(totalEarned * 0.22); // 22% tax rate, rounded up to next dollar
                      const taxPaid = employee.cashPaid || 0;
                      const balance = taxPaid - taxDue; // Negative means tax owed, positive means overpaid
                      
                      return (
                        <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                          <td className="py-2 px-2">{fullName}</td>
                          <td className="text-right py-2 px-2">{employee.hours}</td>
                          <td className="text-right py-2 px-2">{formatCurrency(commission)}</td>
                          <td className="text-right py-2 px-2">{formatCurrency(tips)}</td>
                          <td className="text-right py-2 px-2">{formatCurrency(totalEarned)}</td>
                          <td className="text-right py-2 px-2">{formatCurrency(taxDue)}</td>
                          <td className="text-right py-2 px-2">{formatCurrency(taxPaid)}</td>
                          <td className={`text-right py-2 px-2 font-medium ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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

      {/* Password Protection Dialog for Delete */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Confirmation Required</DialogTitle>
            <DialogDescription>
              Enter the password to delete this shift report for {location} on {formattedDate}.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delete-password">Password</Label>
              <Input
                id="delete-password"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter password"
                autoFocus
                className="w-full"
              />
            </div>
            
            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowPasswordDialog(false);
                  setDeletePassword("");
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="destructive"
                disabled={!deletePassword}
              >
                Delete Report
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
