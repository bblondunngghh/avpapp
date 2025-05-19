import { useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function SubmissionComplete() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute<{ reportId?: string }>("/submission-complete/:reportId?");

  // Redirect to home if accessed directly without submission
  useEffect(() => {
    if (!params?.reportId) {
      const timer = setTimeout(() => {
        navigate("/");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [params, navigate]);

  const handleViewReports = () => {
    navigate("/");
  };

  const handleNewReport = () => {
    navigate("/report-form");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="max-w-xl w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Report Submitted Successfully!</h1>
        <p className="text-gray-600 mb-6">
          {params?.reportId 
            ? `Your report #${params.reportId} has been saved to the database.`
            : "Your report has been saved to the database."}
        </p>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-md border border-blue-200 text-left">
            <h3 className="font-medium text-blue-800 mb-2">Report Details</h3>
            <p className="text-gray-600">
              The shift report has been successfully processed and stored. You can view it in the reports dashboard.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <Button 
              onClick={handleViewReports}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              View All Reports
            </Button>
            <Button 
              onClick={handleNewReport}
              variant="outline"
              className="flex-1"
            >
              Create New Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}