import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, Car, Home, ClipboardList, PlusCircle, User, HelpCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import navCarIcon from "@assets/Car-Dashboard-Steering--Streamline-Ultimate.png";
import carToolKeysIcon from "@assets/Car-Tool-Keys--Streamline-Ultimate.png";
import dashboardIcon from "@assets/Layout-Dashboard-1--Streamline-Ultimate.png";
import employeeIcon from "@assets/Delivery-Man--Streamline-Ultimate.png";
import newReportIcon from "@assets/Paper-Write--Streamline-Ultimate.png";
import reportsIcon from "@assets/Monitor-Heart-Notes--Streamline-Ultimate.png";
import lockShieldIcon from "@assets/Lock-Shield--Streamline-Ultimate_1749313201026.png";
import insuranceHandIcon from "@assets/Insurance-Hand--Streamline-Ultimate_1751309954246.png";
import hamburgerMenuIcon from "@assets/Layout-Headline--Streamline-Ultimate_1751405186453.png";
import calendarIcon from "@assets/Calendar-Date--Streamline-Ultimate_1750258792058.png";

export default function Header() {
  const [, navigate] = useLocation();
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
  };
  
  return (
    <header className="app-header fixed top-0 left-0 right-0 z-50">
      {/* Glassmorphism container */}
      <div className="relative overflow-hidden backdrop-blur-xl bg-white/10 border-b border-white/30 shadow-2xl">
        
        {/* Navigation container with content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-2 flex justify-end items-center" style={{height: '56px'}}>
          {/* Hamburger menu for all devices - positioned at content edge */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 -mr-1"
              >
                <img src={hamburgerMenuIcon} alt="Menu" className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="relative overflow-hidden backdrop-blur-xl bg-white/10 border border-white/30 text-white shadow-2xl min-w-[280px] p-2 rounded-2xl"
              align="end"
              sideOffset={8}
            >
              
              {/* Dropdown content with z-index */}
              <div className="relative z-10">
                <DropdownMenuItem 
                  className="text-white hover:bg-white/10 cursor-pointer px-4 py-3 text-base"
                  onClick={() => handleNavigation('/')}
                >
                  <img src={dashboardIcon} alt="Dashboard" className="mr-3 h-5 w-5" />
                  Dashboard
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  className="text-white hover:bg-white/10 cursor-pointer px-4 py-3 text-base"
                  onClick={() => handleNavigation('/schedule')}
                >
                  <img src={calendarIcon} alt="Schedule" className="mr-3 h-5 w-5" />
                  View Schedule
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  className="text-white hover:bg-white/10 cursor-pointer px-4 py-3 text-base"
                  onClick={() => handleNavigation('/employee-login')}
                >
                  <img src={employeeIcon} alt="Employee" className="mr-3 h-5 w-5" />
                  Employee Login
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  className="text-white hover:bg-white/10 cursor-pointer px-4 py-3 text-base"
                  onClick={() => handleNavigation('/admin-login')}
                >
                  <img src={lockShieldIcon} alt="Admin" className="mr-3 h-5 w-5" />
                  Admin Login
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
