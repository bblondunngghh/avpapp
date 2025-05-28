import { useState, useEffect } from "react";
import { Switch, Route, useLocation, RouteComponentProps } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import FullscreenSupport from "./fullscreen";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import ReportForm from "@/pages/report-form";
import Reports from "@/pages/reports";
import ReportsWrapper from "@/pages/reports-wrapper";
import SubmissionComplete from "@/pages/submission-complete";
import AdminLogin from "@/pages/admin-login";
import AdminPanel from "@/pages/admin-panel";
import MobileAdminPanel from "@/pages/mobile-admin-panel"; // Mobile-friendly version
import SimpleMobileAdmin from "@/pages/simple-mobile-admin"; // Super-simplified mobile admin for iOS
import AdminAuthGuard from "@/pages/admin-auth-guard";
import CSVUploadPage from "@/pages/csv-upload-page";
import IncidentReport from "@/pages/incident-report";
import IncidentSubmitted from "@/pages/incident-submitted";
import Regulations from "@/pages/regulations";
import EmployeeLogin from "@/pages/employee-login";
import EmployeeDashboard from "@/pages/employee-dashboard";
import ReportSelection from "@/pages/report-selection";
import AccountantPage from "@/pages/tax-payments"; // Renamed from TaxPaymentsPage
import Header from "@/components/layout/header";
import BottomNavigation from "@/components/layout/bottom-navigation";

function Router() {
  const [location, setLocation] = useLocation();
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  
  // Enhanced detection for mobile devices - iPhone only for mobile admin
  useEffect(() => {
    const checkMobile = () => {
      // Specific iPad detection (including newer models)
      const isIPad = /iPad/i.test(navigator.userAgent) || 
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
                    
      // iPhone specific detection
      const isIPhone = /iPhone/i.test(navigator.userAgent);
      
      // Other mobile device detection (excluding iPad)
      const isOtherMobile = 
        /Android|webOS|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
        (window.innerWidth <= 480 && !isIPad); // Smaller screen threshold excluding iPad
        
      // Only use mobile admin for iPhones and other small mobile devices, NOT iPads
      setIsMobileDevice(isIPhone || isOtherMobile);
      
      // Debug info to console
      console.log("Device detection:", { 
        isIPad, 
        isIPhone,
        isOtherMobile,
        userAgent: navigator.userAgent, 
        platform: navigator.platform,
        touchPoints: navigator.maxTouchPoints,
        width: window.innerWidth,
        usingMobile: isIPhone || isOtherMobile
      });
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Determine if we're on an admin or employee page to show/hide normal navigation
  const isAdminPage = location.startsWith('/admin');
  const isEmployeePage = location.startsWith('/employee-dashboard');
  
  return (
    <div className="flex flex-col min-h-screen pb-16">
      {!isAdminPage && !isEmployeePage && <Header />}
      <main className={`${isAdminPage || isEmployeePage ? '' : 'container mx-auto px-4 py-4 mt-16'} flex-grow`}>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/report-selection" component={ReportSelection} />
          <Route path="/new-report">
            {() => <ReportForm />}
          </Route>
          <Route path="/edit-report/:id">
            {(params: {id: string}) => <ReportForm reportId={parseInt(params.id)} />}
          </Route>
          <Route path="/submission-complete/:reportId?">
            {(params: {reportId?: string}) => <SubmissionComplete />}
          </Route>
          <Route path="/incident-report" component={IncidentReport} />
          <Route path="/incident-submitted" component={IncidentSubmitted} />
          <Route path="/regulations" component={Regulations} />
          <Route path="/admin-login" component={AdminLogin} />
          <Route path="/mobile-admin" component={MobileAdminPanel} />
          <Route path="/simple-admin" component={SimpleMobileAdmin} />
          <Route path="/basic-admin" component={SimpleMobileAdmin} />
          <Route path="/admin-redirect" component={SimpleMobileAdmin} />
          <Route path="/admin">
            {() => {
              // Check if iPad - force desktop admin panel
              const isIPad = /iPad/i.test(navigator.userAgent) || 
                            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
              
              if (isIPad) {
                return <AdminPanel />;
              }
              
              // For iPhone and other mobile devices, check if should use mobile
              if (isMobileDevice) {
                return <MobileAdminPanel />;
              }
              
              return <AdminPanel />;
            }}
          </Route>
          <Route path="/admin/csv-upload" component={CSVUploadPage} />
          <Route path="/admin/tax-payments" component={AccountantPage} />
          <Route path="/reports" component={ReportsWrapper} />
          <Route path="/employee-login" component={EmployeeLogin} />
          <Route path="/employee-dashboard" component={EmployeeDashboard} />
          <Route component={NotFound} />
        </Switch>
      </main>
      {!isAdminPage && !isEmployeePage && <BottomNavigation />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <FullscreenSupport />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
