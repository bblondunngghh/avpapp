import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, Car, Home, ClipboardList, PlusCircle, User } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import navCarIcon from "@assets/Car-Dashboard-Gear-Automatic--Streamline-Ultimate.png";
import carToolKeysIcon from "@assets/Car-Tool-Keys--Streamline-Ultimate.png";
import dashboardIcon from "@assets/Layout-Dashboard-1--Streamline-Ultimate.png";
import employeeIcon from "@assets/Delivery-Man--Streamline-Ultimate.png";
import newReportIcon from "@assets/Paper-Write--Streamline-Ultimate.png";
import reportsIcon from "@assets/Monitor-Heart-Notes--Streamline-Ultimate.png";

export default function Header() {
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  
  const handleNavigation = (path: string) => {
    navigate(path);
    setOpen(false);
  };
  
  return (
    <header className="app-header">
      <div className="relative w-full">
        {/* Centered title container */}
        <div className="absolute inset-0 flex items-center justify-center py-2">
          <h1 className="app-title flex items-center gap-2">
            <img src={navCarIcon} alt="Car" className="h-6 w-6 animate-bounce-slow" />
            <span>ACCESS VALET PARKING</span>
            <img src={carToolKeysIcon} alt="Car Keys" className="h-6 w-6 animate-bounce-slow" />
          </h1>
        </div>
        
        {/* Right-aligned admin button container aligned with page content */}
        <div className="max-w-4xl mx-auto px-4 py-2 flex justify-end items-center relative z-10" style={{height: '56px'}}>
          <div className="flex items-center gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              className="bg-white text-blue-700 hover:bg-gray-100 hidden md:flex font-medium"
              onClick={() => handleNavigation('/admin-login')}
            >
              Admin Login
            </Button>
            
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col gap-4 mt-8">
                  <Button 
                    variant="ghost" 
                    className="justify-start" 
                    onClick={() => handleNavigation('/')}
                  >
                    <img src={dashboardIcon} alt="Dashboard" className="mr-2 h-5 w-5" />
                    Dashboard
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="justify-start" 
                    onClick={() => handleNavigation('/reports')}
                  >
                    <img src={reportsIcon} alt="Reports" className="mr-2 h-5 w-5" />
                    All Reports
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="justify-start" 
                    onClick={() => handleNavigation('/report-selection')}
                  >
                    <img src={newReportIcon} alt="New Report" className="mr-2 h-5 w-5" />
                    New Report
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="justify-start" 
                    onClick={() => handleNavigation('/admin-login')}
                  >
                    <img src={employeeIcon} alt="Admin" className="mr-2 h-5 w-5" />
                    Admin Login
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
