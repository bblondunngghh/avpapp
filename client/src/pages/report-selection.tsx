import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, ShieldAlert, ChevronLeft } from "lucide-react";
import { LOCATIONS } from "@/lib/constants";
import RestaurantIcon from "@/components/restaurant-icon";

export default function ReportSelection() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")} 
            className="p-0 h-10 w-10 rounded-full bg-white shadow-sm hover:shadow-md"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold text-center flex-1 pr-10 text-gray-900">
            Select Report Type
          </h1>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mt-10">
          {/* Shift Report Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all hover:scale-[1.02] hover:shadow-xl border-t-4 border-t-blue-500 bg-gradient-to-b from-white to-blue-50/30">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-full shadow-md">
                  <Car className="h-8 w-8 text-white" />
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-medium text-blue-600">Shift Report</h2>
                  <p className="text-gray-500">Track sales, tips, hours & more</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Record complete shift details including number of cars, transactions, employee hours, and financial summaries.
              </p>
              
              <div className="mt-6 mb-4">
                <p className="font-medium text-gray-700 mb-3">Select a location:</p>
                <div className="grid grid-cols-1 gap-3">
                  {LOCATIONS.map(location => (
                    <Button 
                      key={location.id}
                      onClick={() => navigate(`/new-report?locationId=${location.id}`)}
                      className="relative h-auto py-3 pl-10 w-full bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-800 border-0 shadow-sm hover:shadow group text-left"
                    >
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <RestaurantIcon locationId={location.id} size={16} />
                      </span>
                      <span className="font-medium">{location.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Incident Report Card */}
          <div 
            className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all hover:scale-[1.02] hover:shadow-xl border-t-4 border-t-blue-500 bg-gradient-to-b from-white to-blue-50/30 cursor-pointer" 
            onClick={() => navigate("/incident-report")}
          >
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-full shadow-md">
                  <ShieldAlert className="h-8 w-8 text-white" />
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-medium text-blue-600">Incident Report</h2>
                  <p className="text-gray-500">Document issues & accidents</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Submit detailed records of any incidents including vehicle damage, customer complaints, safety issues, or unusual events.
              </p>
              
              <ul className="text-sm text-gray-600 space-y-2 mb-6 mt-4">
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></div>
                  <span>Vehicle damage or accidents</span>
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></div>
                  <span>Customer complaints</span>
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></div>
                  <span>Safety concerns or issues</span>
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></div>
                  <span>Equipment issues</span>
                </li>
              </ul>
              
              <Button 
                className="w-full mt-2 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-500 border-0 shadow-sm hover:shadow"
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