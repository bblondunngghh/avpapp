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
import AdminPanelSimple from "@/pages/admin-panel-simple";
import MobileAdminPanel from "@/pages/mobile-admin-panel"; // Mobile-friendly version
import SimpleMobileAdmin from "@/pages/simple-mobile-admin"; // Super-simplified mobile admin for iOS
import AdminAuthGuard from "@/pages/admin-auth-guard";
import CSVUploadPage from "@/pages/csv-upload-page";
import IncidentReport from "@/pages/incident-report";
import IncidentSubmitted from "@/pages/incident-submitted";
import Regulations from "@/pages/regulations";
import EmployeeLogin from "@/pages/employee-login";
import EmployeeDashboard from "@/pages/employee-dashboard";
import HelpRequestPage from "@/pages/help-request";
import ReportSelection from "@/pages/report-selection";
import PermitsPage from "@/pages/permits";
import AccountantPage from "@/pages/tax-payments"; // Renamed from TaxPaymentsPage
import Contracts from "@/pages/contracts";
import Demo from "@/pages/demo";
import NotificationsPage from "@/pages/notifications";
import Header from "@/components/layout/header";
import BottomNavigation from "@/components/layout/bottom-navigation";
// import { AssistanceCenterPopup } from "@/components/assistance-center-popup";
import { notificationSoundService } from "@/lib/notification-sound";
import avpLogo from "@assets/AVPLOGO PROPER3_1750779399227.png";

function Router() {
  const [location, setLocation] = useLocation();
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [wasInProtectedArea, setWasInProtectedArea] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  
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

  // Auto-logout when exiting password-protected areas
  useEffect(() => {
    const isCurrentlyInProtectedArea = 
      location.startsWith('/admin') || 
      location.startsWith('/admin-login') ||
      location.startsWith('/reports') ||
      location === '/mobile-admin' ||
      location === '/simple-admin' ||
      location === '/basic-admin' ||
      location === '/admin-redirect';

    // If user was in a protected area and now isn't, clear auth state
    if (wasInProtectedArea && !isCurrentlyInProtectedArea) {
      // Clear any stored admin authentication
      sessionStorage.removeItem('adminAuthenticated');
      sessionStorage.removeItem('accountantAuthenticated');
      localStorage.removeItem('adminAuthenticated');
      localStorage.removeItem('accountantAuthenticated');
      
      console.log('Auto-logout: Exited password-protected area');
    }

    setWasInProtectedArea(isCurrentlyInProtectedArea);
  }, [location, wasInProtectedArea]);

  // Activity tracking for timeout
  useEffect(() => {
    const isCurrentlyInProtectedArea = 
      location.startsWith('/admin') || 
      location.startsWith('/admin-login') ||
      location.startsWith('/reports') ||
      location === '/mobile-admin' ||
      location === '/simple-admin' ||
      location === '/basic-admin' ||
      location === '/admin-redirect';

    if (!isCurrentlyInProtectedArea) return;

    const updateActivity = () => {
      setLastActivity(Date.now());
      // Enable audio context after user interaction
      notificationSoundService.enableSoundForUserInteraction();
    };

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    // Check for inactivity every 10 seconds
    const inactivityCheck = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;
      
      // 60 seconds = 60,000 milliseconds
      if (timeSinceLastActivity > 60000) {
        // Clear authentication and redirect
        sessionStorage.removeItem('adminAuthenticated');
        sessionStorage.removeItem('accountantAuthenticated');
        localStorage.removeItem('adminAuthenticated');
        localStorage.removeItem('accountantAuthenticated');
        
        console.log('Auto-logout: Inactivity timeout');
        window.location.href = '/';
      }
    }, 10000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
      clearInterval(inactivityCheck);
    };
  }, [location, lastActivity]);
  
  // Determine if we're on an admin or employee page to show/hide normal navigation
  const isAdminPage = location.startsWith('/admin');
  const isEmployeePage = location.startsWith('/employee-dashboard');
  const isDemoPage = location === '/demo';
  
  return (
    <div className="flex flex-col min-h-screen pb-16">
      {!isAdminPage && !isEmployeePage && !isDemoPage && <Header />}
      <main className={`${isAdminPage || isEmployeePage || isDemoPage ? '' : 'container mx-auto px-4 py-4 mt-16'} flex-grow`}>
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
          <Route path="/admin-simple" component={AdminPanelSimple} />
          <Route path="/admin" component={AdminPanelSimple} />
          <Route path="/admin-full" component={AdminPanel} />
          <Route path="/admin-panel" component={AdminPanelSimple} />
          <Route path="/admin/csv-upload" component={CSVUploadPage} />
          <Route path="/admin/tax-payments" component={AccountantPage} />
          <Route path="/contracts" component={Contracts} />
          <Route path="/reports" component={ReportsWrapper} />
          <Route path="/permits" component={PermitsPage} />
          <Route path="/employee-login" component={EmployeeLogin} />
          <Route path="/employee-dashboard" component={EmployeeDashboard} />
          <Route path="/help-request" component={HelpRequestPage} />
          <Route path="/notifications" component={NotificationsPage} />
          <Route path="/demo" component={Demo} />
          <Route component={NotFound} />
        </Switch>
      </main>
      {!isAdminPage && !isEmployeePage && !isDemoPage && <BottomNavigation />}
    </div>
  );
}

function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Logo with animation */}
        <div className="mb-8 animate-pulse">
          <div className="w-40 h-40 mx-auto bg-white rounded-full flex items-center justify-center shadow-2xl p-4">
            <img 
              src={avpLogo} 
              alt="Access Valet Parking Logo" 
              className="w-full h-full object-contain rounded-full"
              style={{ 
                imageRendering: 'crisp-edges',
                filter: 'contrast(1.1) saturate(1.05)'
              }}
            />
          </div>
        </div>
        
        {/* Company name with fade-in animation */}
        <div className="animate-fade-in-up">
          <h1 className="text-white text-3xl font-bold mb-2 tracking-wide">
            ACCESS VALET PARKING
          </h1>
          <div className="w-24 h-1 bg-white mx-auto rounded-full opacity-80"></div>
        </div>
        
        {/* Loading indicator */}
        <div className="mt-12 flex justify-center">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      const isIPad = /iPad/i.test(navigator.userAgent) || 
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isIPhone = /iPhone/i.test(navigator.userAgent);
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isOtherMobile = /webOS|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      setIsMobile(isIPhone || isAndroid || isOtherMobile || isIPad);
    };

    checkMobile();

    // Show splash screen for 2.5 seconds on mobile devices
    if (isMobile) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 2500);

      return () => clearTimeout(timer);
    } else {
      setShowSplash(false);
    }
  }, [isMobile]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <FullscreenSupport />
        {showSplash && isMobile ? <SplashScreen /> : <Router />}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
