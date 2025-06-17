import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Car, ShieldAlert, Construction, FileText, ArrowRight } from "lucide-react";
import { useTheme } from "@/App";
import shiftReportIcon from "@assets/Task-List-Add--Streamline-Ultimate.png";
import constructionConeIcon from "@assets/Construction-Cone--Streamline-Ultimate.png";
import carRepairIcon from "@assets/Car-Repair-Bottom-1--Streamline-Ultimate.png";
import newspaperIcon from "@assets/Newspaper--Streamline-Ultimate.png";
import deliveryManIcon from "@assets/Delivery-Man--Streamline-Ultimate.png";
import roadSignTurnRightIcon from "@assets/Road-Sign-Turn-Right-1--Streamline-Ultimate.png";

import LocationSelectorModal from "@/components/location-selector-modal";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isDark } = useTheme();
  
  const handleNewReport = () => {
    setIsModalOpen(true);
  };
  
  return (
    <div className={isDark 
      ? "min-h-screen bg-gradient-to-br from-[#020203] via-[#1a1a1b] to-[#2a2a2b]" 
      : "max-w-4xl mx-auto px-4 mt-8 md:mt-0"
    }>
      <div className="max-w-4xl mx-auto px-4 pt-8 md:pt-0">
        <div className="relative bg-gradient-to-r from-[#9c46df] to-[#35afe9] text-center mb-10 p-8 rounded-xl shadow-2xl overflow-hidden border border-[#536975]/20">
          <div className="absolute inset-0 bg-opacity-10 bg-white mix-blend-overlay" 
            style={{ 
              backgroundImage: "radial-gradient(circle at 25px 25px, rgba(255,255,255,0.15) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(255,255,255,0.15) 2%, transparent 0%)",
              backgroundSize: "100px 100px" 
            }}>
          </div>
          <div className="flex flex-col items-center justify-center relative z-10">
            <img 
              src="/assets/AVP LOGO 2024 - 2 HQ.jpg" 
              alt="AVP Logo 2024" 
              className="h-36 mb-4 object-contain bg-white p-2 rounded-lg"
            />
            <p className="text-white max-w-2xl mx-auto text-lg font-medium">
              Welcome to the Access Valet Parking Management Portal. Please select from the following options.
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Submit Shift Report Card */}
          <Card className="hover:shadow-2xl transition-all duration-300 overflow-hidden group border border-[#536975]/30 bg-gradient-to-b from-[#020203] to-[#1a1a1b] backdrop-blur-sm">
            <CardContent className="pt-6 pb-8 px-5 flex flex-col items-center text-center h-full">
              <div className="bg-gradient-to-br from-[#9c46df] to-[#35afe9] p-4 rounded-full mb-4 shadow-lg transform group-hover:scale-110 transition-transform">
                <img src={shiftReportIcon} alt="Task List Add" className="h-10 w-10 brightness-0 invert" />
              </div>
              <h3 className="text-xl mb-3 text-[#9c46df] font-semibold">Submit Shift Report</h3>
              <p className="text-[#536975] mb-6 flex-grow text-sm">
                Create a new shift report with hourly distributions, financial summaries, and employee payroll information.
              </p>
              <Button 
                onClick={handleNewReport}
                className="w-full bg-gradient-to-r from-[#9c46df] to-[#35afe9] hover:from-[#8a3bc7] hover:to-[#2e9bd1] text-white group-hover:shadow-lg border-0"
              >
                Create Report <img src={roadSignTurnRightIcon} alt="Road Sign Turn Right" className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform brightness-0 invert" />
              </Button>
            </CardContent>
          </Card>

          {/* Incident Report Card */}
          <Card className="hover:shadow-2xl transition-all duration-300 overflow-hidden group border border-[#536975]/30 bg-gradient-to-b from-[#020203] to-[#1a1a1b] backdrop-blur-sm">
            <CardContent className="pt-6 pb-8 px-5 flex flex-col items-center text-center h-full">
              <div className="bg-gradient-to-br from-[#edb7bf] to-[#9c46df] p-4 rounded-full mb-4 shadow-lg transform group-hover:scale-110 transition-transform">
                <img src={carRepairIcon} alt="Car Repair" className="h-10 w-10 brightness-0" />
              </div>
              <h3 className="text-xl mb-3 text-[#edb7bf] font-semibold">Incident Report</h3>
              <p className="text-[#536975] mb-6 flex-grow text-sm">
                Report any accidents, incidents, or situations that require documentation and follow-up actions.
              </p>
              <Button 
                onClick={() => navigate("/incident-report")}
                className="w-full bg-gradient-to-r from-[#edb7bf] to-[#9c46df] hover:from-[#e8a5b1] hover:to-[#8a3bc7] text-white group-hover:shadow-lg border-0"
              >
                Report Incident <img src={roadSignTurnRightIcon} alt="Road Sign Turn Right" className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform brightness-0 invert" />
              </Button>
            </CardContent>
          </Card>

          {/* Rules and Regulations Card */}
          <Card className="hover:shadow-2xl transition-all duration-300 overflow-hidden group border border-[#536975]/30 bg-gradient-to-b from-[#020203] to-[#1a1a1b] backdrop-blur-sm">
            <CardContent className="pt-6 pb-8 px-5 flex flex-col items-center text-center h-full">
              <div className="bg-gradient-to-br from-[#35afe9] to-[#536975] p-4 rounded-full mb-4 shadow-lg transform group-hover:scale-110 transition-transform">
                <img src={constructionConeIcon} alt="Construction Cone" className="h-10 w-10 brightness-0 invert" />
              </div>
              <h3 className="text-xl mb-3 text-[#35afe9] font-semibold">Rules & Regulations</h3>
              <p className="text-[#536975] mb-6 flex-grow text-sm">
                View Access Valet Parking rules and regulations for proper procedures and standards.
              </p>
              <Button 
                onClick={() => navigate("/regulations")}
                className="w-full bg-gradient-to-r from-[#35afe9] to-[#536975] hover:from-[#2e9bd1] hover:to-[#485d6a] text-white group-hover:shadow-lg border-0"
              >
                View Guidelines <img src={roadSignTurnRightIcon} alt="Road Sign Turn Right" className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform brightness-0 invert" />
              </Button>
            </CardContent>
          </Card>

          {/* Company Permits Card */}
          <Card className="hover:shadow-2xl transition-all duration-300 overflow-hidden group border border-[#536975]/30 bg-gradient-to-b from-[#020203] to-[#1a1a1b] backdrop-blur-sm">
            <CardContent className="pt-6 pb-8 px-5 flex flex-col items-center text-center h-full">
              <div className="bg-gradient-to-br from-[#536975] to-[#edb7bf] p-4 rounded-full mb-4 shadow-lg transform group-hover:scale-110 transition-transform">
                <img src={newspaperIcon} alt="Newspaper" className="h-10 w-10 brightness-0 invert" />
              </div>
              <h3 className="text-xl mb-3 text-[#536975] font-semibold">Company Permits</h3>
              <p className="text-[#536975] mb-6 flex-grow text-sm">
                View all company permits, licenses, and official documentation for our operations.
              </p>
              <Button 
                onClick={() => navigate("/permits")}
                className="w-full bg-gradient-to-r from-[#536975] to-[#edb7bf] hover:from-[#485d6a] hover:to-[#e8a5b1] text-white group-hover:shadow-lg border-0"
              >
                View Permits <img src={roadSignTurnRightIcon} alt="Road Sign Turn Right" className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform brightness-0 invert" />
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Admin and Employee Login Links */}
        <div className="text-center mt-8 pt-6 border-t border-[#536975]/30 pb-24">
          <div className="flex flex-col items-center justify-center">
            <p className="text-[#536975] mb-3 text-sm">View your hours, earnings and tax information:</p>
            <Button 
              variant="outline" 
              onClick={() => navigate("/employee-login")}
              className="border-[#536975] text-[#35afe9] hover:text-white hover:bg-[#35afe9] flex items-center justify-center gap-2 bg-transparent"
            >
              <img src={deliveryManIcon} alt="Delivery Man" className="h-5 w-5 brightness-0 invert" />
              Employee Login
            </Button>
          </div>
        </div>
        
        {/* Location selection modal */}
        <LocationSelectorModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      </div>
    </div>
  );
}
