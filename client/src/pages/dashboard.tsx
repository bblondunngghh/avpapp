import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, AlertTriangle, BookOpen, ArrowRight, Car } from "lucide-react";
import LocationSelectorModal from "@/components/location-selector-modal";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleNewReport = () => {
    setIsModalOpen(true);
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-400 text-center mb-10 p-8 rounded-lg shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-opacity-10 bg-white mix-blend-overlay" 
          style={{ 
            backgroundImage: "radial-gradient(circle at 25px 25px, rgba(255,255,255,0.15) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(255,255,255,0.15) 2%, transparent 0%)",
            backgroundSize: "100px 100px" 
          }}>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white uppercase mb-3 relative z-10 tracking-wide flex items-center justify-center">
          Access Valet Parking
        </h1>
        <p className="text-blue-50 max-w-2xl mx-auto text-lg relative z-10">
          Welcome to the Right of Way Valet Management Portal. Please select from the following options.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Submit Shift Report Card */}
        <Card className="hover:shadow-xl transition-all duration-300 overflow-hidden group border-t-4 border-t-blue-500 bg-gradient-to-b from-white to-blue-50/30">
          <CardContent className="pt-6 pb-8 px-5 flex flex-col items-center text-center h-full">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-full mb-4 shadow-md transform group-hover:scale-110 transition-transform">
              <FileText className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-blue-600">Submit Shift Report</h3>
            <p className="text-gray-600 mb-6 flex-grow">
              Create a new shift report with hourly distributions, financial summaries, and employee payroll information.
            </p>
            <Button 
              onClick={handleNewReport}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white group-hover:shadow-md"
            >
              Create Report <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>

        {/* Incident Report Card */}
        <Card className="hover:shadow-xl transition-all duration-300 overflow-hidden group border-t-4 border-t-amber-500 bg-gradient-to-b from-white to-amber-50/30">
          <CardContent className="pt-6 pb-8 px-5 flex flex-col items-center text-center h-full">
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-4 rounded-full mb-4 shadow-md transform group-hover:scale-110 transition-transform">
              <AlertTriangle className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-amber-600">Incident Report</h3>
            <p className="text-gray-600 mb-6 flex-grow">
              Report any accidents, incidents, or situations that require documentation and follow-up actions.
            </p>
            <Button 
              onClick={() => navigate("/incident-report")}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white group-hover:shadow-md"
            >
              Report Incident <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>

        {/* Rules and Regulations Card */}
        <Card className="hover:shadow-xl transition-all duration-300 overflow-hidden group border-t-4 border-t-teal-500 bg-gradient-to-b from-white to-teal-50/30">
          <CardContent className="pt-6 pb-8 px-5 flex flex-col items-center text-center h-full">
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-4 rounded-full mb-4 shadow-md transform group-hover:scale-110 transition-transform">
              <BookOpen className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-teal-600">Rules & Regulations</h3>
            <p className="text-gray-600 mb-6 flex-grow">
              View Right of Way Valet Parking rules and regulations for proper procedures and standards.
            </p>
            <Button 
              onClick={() => navigate("/regulations")}
              className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white group-hover:shadow-md"
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
