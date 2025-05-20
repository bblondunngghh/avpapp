import { useLocation } from "wouter";
import { format, parseISO } from "date-fns";
import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LOCATIONS } from "@/lib/constants";

interface ReportCardProps {
  id: number;
  locationId: number;
  date: string;
  shift: string;
  totalCars: number;
  totalCreditSales: number;
  totalCashCollected: number;
  companyCashTurnIn: number;
  totalTurnIn: number;
  createdAt: string;
}

export default function ReportCard({ id, locationId, date, shift, totalCars, totalCreditSales, totalCashCollected, companyCashTurnIn, totalTurnIn, createdAt }: ReportCardProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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
        borderColor = "border-purple-500";
        textColor = "text-purple-700";
        bgColor = "bg-purple-50/30";
        break;
    }
    
    return { borderColor, textColor, bgColor };
  };
  
  const { borderColor, textColor, bgColor } = getLocationColorScheme();
  
  return (
    <Card className={`report-card mb-4 animate-fade-in border-l-4 ${borderColor} ${bgColor}`}>
      <CardContent className="p-0">
        <div className="flex justify-between items-start">
          <div className="p-4">
            <h4 className={`${textColor}`}>{location}</h4>
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
                <span className="font-medium">Total: </span>
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
  );
}
