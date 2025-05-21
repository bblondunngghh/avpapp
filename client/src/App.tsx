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
import SubmissionComplete from "@/pages/submission-complete";
import AdminLogin from "@/pages/admin-login";
import AdminPanel from "@/pages/admin-panel";
import MobileAdminPanel from "@/pages/mobile-admin-panel"; // Mobile-friendly version
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
  
  // Detect if user is on a mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
        (window.innerWidth <= 768);
      setIsMobileDevice(isMobile);
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
      <main className={`${isAdminPage || isEmployeePage ? '' : 'container mx-auto px-4 py-4'} flex-grow`}>
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
          <Route path="/admin">
            {() => (isMobileDevice ? <MobileAdminPanel /> : <AdminPanel />)}
          </Route>
          <Route path="/admin/csv-upload" component={CSVUploadPage} />
          <Route path="/admin/tax-payments" component={AccountantPage} />
          <Route path="/reports">
            {() => {
              // Use our storage wrapper instead of directly accessing localStorage
              const checkAuth = async () => {
                try {
                  const { isAdminAuthenticated } = await import("@/lib/admin-auth");
                  return isAdminAuthenticated();
                } catch (err) {
                  console.error("Auth check error:", err);
                  return false;
                }
              };
              
              const [isAuthenticated, setIsAuthenticated] = useState(false);
              const [isChecking, setIsChecking] = useState(true);
              
              useEffect(() => {
                checkAuth().then(isAuth => {
                  setIsAuthenticated(isAuth);
                  setIsChecking(false);
                  
                  if (!isAuth) {
                    // Use navigate instead of directly changing window.location
                    setLocation("/admin-login");
                  }
                });
              }, [setLocation]);
              
              if (isChecking) return <div>Checking authentication...</div>;
              return isAuthenticated ? <Reports /> : null;
            }}
          </Route>
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
