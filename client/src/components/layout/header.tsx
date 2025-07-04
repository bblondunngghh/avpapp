import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, Car, Home, ClipboardList, PlusCircle, User, HelpCircle } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import navCarIcon from "@assets/Car-Dashboard-Steering--Streamline-Ultimate.png";
import carToolKeysIcon from "@assets/Car-Tool-Keys--Streamline-Ultimate.png";
import dashboardIcon from "@assets/Layout-Dashboard-1--Streamline-Ultimate.png";
import employeeIcon from "@assets/Delivery-Man--Streamline-Ultimate.png";
import newReportIcon from "@assets/Paper-Write--Streamline-Ultimate.png";
import reportsIcon from "@assets/Monitor-Heart-Notes--Streamline-Ultimate.png";
import lockShieldIcon from "@assets/Lock-Shield--Streamline-Ultimate_1749313201026.png";
import insuranceHandIcon from "@assets/Insurance-Hand--Streamline-Ultimate_1751309954246.png";
import hamburgerMenuIcon from "@assets/Layout-Headline--Streamline-Ultimate_1751405186453.png";

export default function Header() {
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [isIPad, setIsIPad] = useState(false);

  // Detect iPad device
  useEffect(() => {
    const checkIsIPad = () => {
      const iPadDevice = /iPad/i.test(navigator.userAgent) || 
                        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      setIsIPad(iPadDevice);
    };
    
    checkIsIPad();
  }, []);
  
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
            <span>Access Valet Parking</span>
            <img src={carToolKeysIcon} alt="Car Keys" className="h-6 w-6 animate-bounce-slow" />
          </h1>
        </div>
        
        {/* Navigation container with hamburger menu for all devices */}
        <div className="max-w-4xl mx-auto px-4 py-2 flex justify-end items-center relative z-10" style={{height: '56px'}}>
          {/* Hamburger menu for all devices - positioned at content edge */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white -mr-1"
              >
                <img src={hamburgerMenuIcon} alt="Menu" className="h-5 w-5" />
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
                    onClick={() => handleNavigation('/report-selection')}
                  >
                    <img src={newReportIcon} alt="New Report" className="mr-2 h-5 w-5" />
                    New Report
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="justify-start" 
                    onClick={() => handleNavigation('/employee-login')}
                  >
                    <img src={employeeIcon} alt="Employee" className="mr-2 h-5 w-5" />
                    Employee Login
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="justify-start" 
                    onClick={() => handleNavigation('/help-request')}
                  >
                    <img src={insuranceHandIcon} alt="Assistance" className="mr-2 h-5 w-5" />
                    Assistance Center
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="justify-start" 
                    onClick={() => handleNavigation('/admin-login')}
                  >
                    <img src={lockShieldIcon} alt="Admin" className="mr-2 h-5 w-5" />
                    Admin Login
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
        </div>
      </div>
    </header>
  );
}
