import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, AlertTriangle, BookOpen, ArrowRight } from "lucide-react";
import LocationSelectorModal from "@/components/location-selector-modal";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleNewReport = () => {
    setIsModalOpen(true);
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl text-gray-900 uppercase mb-2">Access Valet Parking</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Welcome to the Right of Way Valet Management Portal. Please select from the following options.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Submit Shift Report Card */}
        <Card className="hover:shadow-lg transition-all duration-300 overflow-hidden group">
          <div className="h-1 bg-blue-500 w-full"></div>
          <CardContent className="pt-6 pb-8 px-5 flex flex-col items-center text-center h-full">
            <div className="bg-blue-50 p-4 rounded-full mb-4">
              <FileText className="h-10 w-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-medium mb-3 text-blue-500">Submit Shift Report</h3>
            <p className="text-gray-600 mb-6 flex-grow">
              Create a new shift report with hourly distributions, financial summaries, and employee payroll information.
            </p>
            <Button 
              onClick={handleNewReport}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white group-hover:shadow-md"
            >
              Create Report <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>

        {/* Incident Report Card */}
        <Card className="hover:shadow-lg transition-all duration-300 overflow-hidden group">
          <div className="h-1 bg-blue-500 w-full"></div>
          <CardContent className="pt-6 pb-8 px-5 flex flex-col items-center text-center h-full">
            <div className="bg-blue-50 p-4 rounded-full mb-4">
              <AlertTriangle className="h-10 w-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-medium mb-3 text-blue-500">Incident Report</h3>
            <p className="text-gray-600 mb-6 flex-grow">
              Report any accidents, incidents, or situations that require documentation and follow-up actions.
            </p>
            <Button 
              onClick={() => navigate("/incident-report")}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white group-hover:shadow-md"
            >
              Report Incident <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>

        {/* Rules and Regulations Card */}
        <Card className="hover:shadow-lg transition-all duration-300 overflow-hidden group">
          <div className="h-1 bg-blue-500 w-full"></div>
          <CardContent className="pt-6 pb-8 px-5 flex flex-col items-center text-center h-full">
            <div className="bg-blue-50 p-4 rounded-full mb-4">
              <BookOpen className="h-10 w-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-medium mb-3 text-blue-500">Rules & Regulations</h3>
            <p className="text-gray-600 mb-6 flex-grow">
              View Right of Way Valet Parking rules and regulations for proper procedures and standards.
            </p>
            <Button 
              onClick={() => navigate("/regulations")}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white group-hover:shadow-md"
            >
              View Guidelines <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Admin and Employee Login Links */}
      <div className="text-center mt-8 pt-6 border-t border-gray-200">
        <div className="flex flex-col md:flex-row justify-center gap-6 items-center">
          <div>
            <p className="text-gray-500 mb-3">View your hours, earnings and tax information:</p>
            <Button 
              variant="outline" 
              onClick={() => navigate("/employee-login")}
              className="border-blue-200 text-blue-700 hover:text-blue-800 hover:bg-blue-50"
            >
              Employee Login
            </Button>
          </div>

        </div>
      </div>
      
      {/* Location selection modal */}
      <LocationSelectorModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
