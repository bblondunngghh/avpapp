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
        <h1 className="text-3xl text-sky-700 uppercase mb-2">Access Valet Parking</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Welcome to the Right of Way Valet Management Portal. Please select from the following options.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Submit Shift Report Card */}
        <Card className="hover:shadow-lg transition-all duration-300 overflow-hidden group">
          <div className="h-1 bg-sky-500 w-full"></div>
          <CardContent className="pt-6 pb-8 px-5 flex flex-col items-center text-center h-full">
            <div className="bg-sky-50 p-4 rounded-full mb-4">
              <FileText className="h-10 w-10 text-sky-600" />
            </div>
            <h3 className="text-xl font-medium mb-3 text-sky-700">Submit Shift Report</h3>
            <p className="text-gray-600 mb-6 flex-grow">
              Create a new shift report with hourly distributions, financial summaries, and employee payroll information.
            </p>
            <Button 
              onClick={handleNewReport}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white group-hover:shadow-md"
            >
              Create Report <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>

        {/* Incident Report Card */}
        <Card className="hover:shadow-lg transition-all duration-300 overflow-hidden group">
          <div className="h-1 bg-orange-500 w-full"></div>
          <CardContent className="pt-6 pb-8 px-5 flex flex-col items-center text-center h-full">
            <div className="bg-orange-50 p-4 rounded-full mb-4">
              <AlertTriangle className="h-10 w-10 text-orange-600" />
            </div>
            <h3 className="text-xl font-medium mb-3 text-orange-700">Incident Report</h3>
            <p className="text-gray-600 mb-6 flex-grow">
              Report any accidents, incidents, or situations that require documentation and follow-up actions.
            </p>
            <Button 
              onClick={() => navigate("/incident-report")}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white group-hover:shadow-md"
            >
              Report Incident <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>

        {/* Rules and Regulations Card */}
        <Card className="hover:shadow-lg transition-all duration-300 overflow-hidden group">
          <div className="h-1 bg-emerald-500 w-full"></div>
          <CardContent className="pt-6 pb-8 px-5 flex flex-col items-center text-center h-full">
            <div className="bg-emerald-50 p-4 rounded-full mb-4">
              <BookOpen className="h-10 w-10 text-emerald-600" />
            </div>
            <h3 className="text-xl font-medium mb-3 text-emerald-700">Rules & Regulations</h3>
            <p className="text-gray-600 mb-6 flex-grow">
              View Right of Way Valet Parking rules and regulations for proper procedures and standards.
            </p>
            <Button 
              onClick={() => navigate("/regulations")}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white group-hover:shadow-md"
            >
              View Guidelines <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Admin Portal Link */}
      <div className="text-center mt-8 pt-6 border-t border-gray-200">
        <p className="text-gray-500 mb-3">For administrative functions including ticket distribution and employee management:</p>
        <Button 
          variant="outline" 
          onClick={() => navigate("/admin-login")}
          className="border-sky-200 text-sky-700 hover:text-sky-800 hover:bg-sky-50"
        >
          Access Admin Portal
        </Button>
      </div>
      
      {/* Location selection modal */}
      <LocationSelectorModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
