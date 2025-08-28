import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Car, Construction, ArrowRight, HelpCircle } from "lucide-react";
import shiftReportIcon from "@assets/Task-List-Add--Streamline-Ultimate.png";
import constructionConeIcon from "@assets/Construction-Cone--Streamline-Ultimate.png";
import carRepairIcon from "@assets/Car-Repair-Bottom-1--Streamline-Ultimate.png";
import newspaperIcon from "@assets/Newspaper--Streamline-Ultimate.png";
import deliveryManIcon from "@assets/Delivery-Man--Streamline-Ultimate.png";
import roadSignTurnRightIcon from "@assets/Road-Sign-Turn-Right-1--Streamline-Ultimate.png";
import calendarIcon from "@assets/Calendar-Date--Streamline-Ultimate_1750258792058.png";
import lockShieldIcon from "@assets/Lock-Shield--Streamline-Ultimate_1749313201026.png";
import realreal from "../../../realreal.jpg";
import LocationSelectorModal from "@/components/location-selector-modal";
import { getVersionDisplay } from "@/config/version";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleNewReport = () => {
    setIsModalOpen(true);
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 mt-4 md:mt-0 relative">
        {/* Enhanced Header Section with Glassmorphism */}
        <div className="relative bg-white/5 backdrop-blur-xl text-center mb-12 p-8 rounded-3xl overflow-hidden shadow-2xl border border-white/20">
          {/* Enhanced Glass morphism overlay */}
          <div className="absolute inset-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
          
          {/* Enhanced pattern background */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9InN2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA0MCAwIEwgMCAwIDAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
          <div className="relative z-10">
            <div className="flex flex-col items-center justify-center space-y-6">
              {/* Professional Header */}
              <div className="mb-6">
                <div className="text-center">
                  <h1 className="text-white text-3xl md:text-4xl font-bold tracking-wide animate-scale-in">
                    Access Valet Parking
                  </h1>
                  <p className="text-blue-100 text-sm md:text-base font-medium mt-1">
                    Professional Management Portal
                  </p>
                </div>
              </div>
              
              {/* Logo Section */}
              <img
                src={realreal}
                alt="Access Valet Parking Logo"
                className="w-full h-auto mx-auto block rounded-2xl"
                style={{ 
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                  maxWidth: '800px'
                }}
              />
              
              <div className="text-center space-y-2">
                <p className="text-blue-50 max-w-2xl mx-auto text-lg md:text-xl font-medium">
                  Welcome to your comprehensive management dashboard
                </p>
                <p className="text-blue-200 max-w-2xl mx-auto text-base">
                  Select from the professional tools below to manage operations efficiently
                </p>
              </div>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-4 right-4 w-32 h-32 bg-gradient-to-r from-blue-400/10 to-indigo-400/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-4 left-4 w-24 h-24 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-xl"></div>
          
        </div>
      
        {/* Enhanced Professional Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Submit Shift Report Card */}
          <div className="group relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-2xl hover:bg-white/10 animate-scale-in [animation-delay:0.2s]">
            {/* Enhanced Glass morphism overlay */}
            <div className="absolute inset-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
            
            <div className="relative z-10 pt-8 pb-8 px-6 flex flex-col items-center text-center h-full">
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-5 rounded-2xl mb-6 shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 border border-blue-400/30">
                <img src={shiftReportIcon} alt="Submit Report" className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-white group-hover:text-blue-400 transition-colors">
                Submit Shift Report
              </h3>
              <p className="text-gray-300 mb-6 flex-grow leading-relaxed text-sm">
                Create comprehensive shift reports with financial summaries, employee payroll, and operational insights.
              </p>
              <div className="flex justify-center">
                <Button 
                  onClick={handleNewReport}
                  className="w-40 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl py-3 font-semibold"
                >
                  Create Report 
                  <img src={roadSignTurnRightIcon} alt="Arrow" className="ml-2 h-4 w-4 transition-transform" />
                </Button>
              </div>
            </div>
          </div>

          {/* Incident Report Card */}
          <div className="group relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-2xl hover:bg-white/10 animate-scale-in [animation-delay:0.4s]">
            <div className="absolute inset-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
            
            <div className="relative z-10 pt-8 pb-8 px-6 flex flex-col items-center text-center h-full">
              <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-5 rounded-2xl mb-6 shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 border border-orange-400/30">
                <img src={carRepairIcon} alt="Incident Report" className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-white group-hover:text-orange-400 transition-colors">
                Incident Report
              </h3>
              <p className="text-gray-300 mb-6 flex-grow leading-relaxed text-sm">
                Document incidents, accidents, and situations requiring immediate attention and follow-up actions.
              </p>
              <div className="flex justify-center">
                <Button 
                  onClick={() => navigate("/incident-report")}
                  className="w-40 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl py-3 font-semibold"
                >
                  Report Incident 
                  <img src={roadSignTurnRightIcon} alt="Arrow" className="ml-2 h-4 w-4 transition-transform" />
                </Button>
              </div>
            </div>
          </div>

          {/* Rules & Regulations Card */}
          <div className="group relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-2xl hover:bg-white/10 animate-scale-in [animation-delay:0.6s]">
            <div className="absolute inset-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
            
            <div className="relative z-10 pt-8 pb-8 px-6 flex flex-col items-center text-center h-full">
              <div className="bg-gradient-to-br from-teal-500 to-teal-700 p-5 rounded-2xl mb-6 shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 border border-teal-400/30">
                <img src={constructionConeIcon} alt="Rules" className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-white group-hover:text-teal-400 transition-colors">
                Rules & Regulations
              </h3>
              <p className="text-gray-300 mb-6 flex-grow leading-relaxed text-sm">
                Access comprehensive guidelines, procedures, and standards for professional valet operations.
              </p>
              <div className="flex justify-center">
                <Button onClick={() => navigate("/regulations")} className="w-40 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl py-3 font-semibold">
                  View Guidelines 
                  <img src={roadSignTurnRightIcon} alt="Arrow" className="ml-2 h-4 w-4 transition-transform" />
                </Button>
              </div>
            </div>
          </div>

          {/* Company Permits Card */}
          <div className="group relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-2xl hover:bg-white/10 animate-scale-in [animation-delay:0.8s]">
            <div className="absolute inset-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
            
            <div className="relative z-10 pt-8 pb-8 px-6 flex flex-col items-center text-center h-full">
              <div className="bg-gradient-to-br from-purple-500 to-purple-700 p-5 rounded-2xl mb-6 shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 border border-purple-400/30">
                <img src={newspaperIcon} alt="Permits" className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-white group-hover:text-purple-400 transition-colors">
                Company Permits
              </h3>
              <p className="text-gray-300 mb-6 flex-grow leading-relaxed text-sm">
                View official permits, licenses, and regulatory documentation for business operations.
              </p>
              <div className="flex justify-center">
                <Button 
                  onClick={() => navigate("/permits")}
                  className="w-40 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl py-3 font-semibold"
                >
                  View Permits 
                  <img src={roadSignTurnRightIcon} alt="Arrow" className="ml-2 h-4 w-4 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Access Section with Enhanced Glassmorphism */}
        <div className="relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl p-8 mt-12 border border-white/20 shadow-2xl">
          {/* Enhanced Glass morphism overlay */}
          <div className="absolute inset-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
          
          <div className="relative z-10 text-center">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-1">Quick Access</h2>
              <p className="text-blue-200">Access your dashboards and management tools</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="flex justify-center">
                <Button 
                  onClick={() => navigate("/employee-login")}
                  className="w-40 bg-white/10 backdrop-blur-sm hover:bg-white/20 h-10 text-sm text-white border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <img src={deliveryManIcon} alt="Employee" className="h-4 w-4 mr-2" />
                  Employee Portal
                </Button>
              </div>
              <div className="flex justify-center">
                <Button 
                  onClick={() => navigate("/schedule")}
                  className="w-40 bg-white/10 backdrop-blur-sm hover:bg-white/20 h-10 text-sm text-white border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <img src={calendarIcon} alt="Schedule" className="h-4 w-4 mr-2" />
                  View Schedule
                </Button>
              </div>
              <div className="flex justify-center">
                <Button 
                  onClick={() => navigate("/admin-login")}
                  className="w-40 bg-white/10 backdrop-blur-sm hover:bg-white/20 h-10 text-sm text-white border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <img src={lockShieldIcon} alt="Admin" className="h-4 w-4 mr-2" />
                  Admin Login
                </Button>
              </div>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-4 right-4 w-32 h-32 bg-gradient-to-r from-blue-400/10 to-indigo-400/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-4 left-4 w-24 h-24 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-xl"></div>
        </div>
      
      {/* Location selection modal */}
      <LocationSelectorModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}

