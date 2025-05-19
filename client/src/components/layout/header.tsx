import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
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
          <h1 className="app-title">Access Valet Parking</h1>
        </div>
        
        <div className="flex items-center gap-2">
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
                  Dashboard
                </Button>
                <Button 
                  variant="ghost" 
                  className="justify-start" 
                  onClick={() => handleNavigation('/reports')}
                >
                  All Reports
                </Button>
                <Button 
                  variant="ghost" 
                  className="justify-start" 
                  onClick={() => handleNavigation('/new-report')}
                >
                  New Report
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
