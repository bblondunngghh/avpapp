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
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900/80 via-blue-900/80 to-indigo-900/80 border-b border-white/20 backdrop-blur-xl shadow-2xl">
        {/* Enhanced Glass morphism overlay */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-xl border-b border-white/10"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
        
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
              className="relative overflow-hidden bg-gradient-to-r from-slate-900/80 via-blue-900/80 to-indigo-900/80 backdrop-blur-xl border border-white/20 text-white shadow-2xl min-w-[280px] p-2 rounded-2xl"
              align="end"
              sideOffset={8}
            >
              {/* Enhanced Glass morphism overlay for dropdown */}
              <div className="absolute inset-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
              
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
