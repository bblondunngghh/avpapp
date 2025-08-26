import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, ShieldAlert, ChevronLeft } from "lucide-react";
import houseIcon from "@assets/House-3--Streamline-Ultimate.png";
import { LOCATIONS } from "@/lib/constants";
import RestaurantIcon from "@/components/restaurant-icon";
import shiftReportIcon from "@assets/Task-List-Add--Streamline-Ultimate.png";
import carRepairIcon from "@assets/Car-Repair-Bottom-1--Streamline-Ultimate.png";

export default function ReportSelection() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 -z-10"></div>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")} 
            className="p-0 h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20"
          >
            <img src={houseIcon} alt="House" className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold text-center flex-1 pr-10 text-white">
            Select Report Type
          </h1>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mt-10">
          {/* Shift Report Card */}
          <div className="bg-gradient-to-r from-[#2a2a2a] via-blue-900 to-indigo-900 border-[#3a3a3a] text-white rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl border-t-4 border-t-blue-400">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-full shadow-md">
                  <img src={shiftReportIcon} alt="Shift Report" className="h-8 w-8" />
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-medium text-blue-400">Shift Report</h2>
                  <p className="text-blue-200">Track sales, tips, hours & more</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-200 mb-4">
                Record complete shift details including number of cars, transactions, employee hours, and financial summaries.
              </p>
              
              <div className="mt-6 mb-4">
                <p className="font-medium text-white mb-3">Select a location:</p>
                <div className="grid grid-cols-1 gap-3">
                  {LOCATIONS.map(location => (
                    <Button 
                      key={location.id}
                      onClick={() => navigate(`/new-report?locationId=${location.id}`)}
                      className="h-auto py-3 w-full bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20 shadow-sm hover:shadow group text-center"
                    >
                      <span className="font-medium">{location.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Incident Report Card */}
          <div 
            className="bg-gradient-to-r from-[#2a2a2a] via-orange-900 to-red-900 border-[#3a3a3a] text-white rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl border-t-4 border-t-orange-400 cursor-pointer" 
            onClick={() => navigate("/incident-report")}
          >
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-full shadow-md">
                  <img src={carRepairIcon} alt="Incident Report" className="h-8 w-8" />
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-medium text-orange-400">Incident Report</h2>
                  <p className="text-orange-200">Document issues & accidents</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-200 mb-4">
                Submit detailed records of any incidents including vehicle damage, customer complaints, safety issues, or unusual events.
              </p>
              
              <ul className="text-sm text-gray-200 space-y-2 mb-6 mt-4">
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-2"></div>
                  <span>Vehicle damage or accidents</span>
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-2"></div>
                  <span>Customer complaints</span>
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-2"></div>
                  <span>Safety concerns or issues</span>
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-2"></div>
                  <span>Equipment issues</span>
                </li>
              </ul>
              
              <Button 
                className="w-full mt-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20 shadow-sm hover:shadow"
              >
                Create Incident Report
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}