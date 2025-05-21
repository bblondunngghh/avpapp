import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, Car, Home, ClipboardList, PlusCircle, User } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ModeToggle } from "@/components/ui/mode-toggle";

export default function Header() {
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  
  const handleNavigation = (path: string) => {
    navigate(path);
    setOpen(false);
  };
  
  return (
    <header className="app-header">
      <div className="app-header-content">
        <div className="flex items-center gap-3">
          <h1 className="app-title flex items-center gap-2">
            <Car className="h-5 w-5 animate-bounce-slow" />
            <span>ACCESS VALET PARKING</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            className="bg-white text-blue-700 hover:bg-gray-100 hidden md:flex font-medium"
            onClick={() => window.location.href = '/admin-access.html'}
          >
            Admin Login
          </Button>
          
          <ModeToggle />
          
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
                  <Home className="mr-2 h-5 w-5" />
                  Dashboard
                </Button>
                <Button 
                  variant="ghost" 
                  className="justify-start" 
                  onClick={() => handleNavigation('/reports')}
                >
                  <ClipboardList className="mr-2 h-5 w-5" />
                  All Reports
                </Button>
                <Button 
                  variant="ghost" 
                  className="justify-start" 
                  onClick={() => handleNavigation('/report-selection')}
                >
                  <PlusCircle className="mr-2 h-5 w-5" />
                  New Report
                </Button>
                <Button 
                  variant="ghost" 
                  className="justify-start" 
                  onClick={() => window.location.href = '/admin-access.html'}
                >
                  <User className="mr-2 h-5 w-5" />
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
