import { useState, useEffect, createContext, useContext } from "react";
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
import PermitsPage from "@/pages/permits";
import AccountantPage from "@/pages/tax-payments"; // Renamed from TaxPaymentsPage
import Header from "@/components/layout/header";
import BottomNavigation from "@/components/layout/bottom-navigation";
import ThemeWrapper from "@/components/theme-wrapper";
import avpLogo from "@assets/AVP LOGO 2024 - 2 HQ.jpg";

// Theme Context
const ThemeContext = createContext<{
  isDark: boolean;
  toggleTheme: () => void;
} | null>(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

function RouterContent() {
  const [location, setLocation] = useLocation();
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [wasInProtectedArea, setWasInProtectedArea] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const { isDark } = useTheme();
  
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
              
              // Check if iPhone (not iPad)
              const isIPhone = /iPhone/i.test(navigator.userAgent);
              
              // Force desktop admin panel for iPads
              if (isIPad) {
                console.log("iPad detected - using desktop admin panel");
                return <AdminPanel />;
              }
              
              // Use mobile admin panel only for iPhones
              if (isIPhone) {
                console.log("iPhone detected - using mobile admin panel");
                return <MobileAdminPanel />;
              }
              
              // Default to desktop admin panel for all other devices
              console.log("Desktop/other device - using desktop admin panel");
              return <AdminPanel />;
            }}
          </Route>
          <Route path="/admin-panel">
            {() => {
              // Check if iPad - force desktop admin panel
              const isIPad = /iPad/i.test(navigator.userAgent) || 
                            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
              
              // Check if iPhone (not iPad)
              const isIPhone = /iPhone/i.test(navigator.userAgent);
              
              // Force desktop admin panel for iPads
              if (isIPad) {
                console.log("iPad detected - using desktop admin panel");
                return <AdminPanel />;
              }
              
              // Use mobile admin panel only for iPhones
              if (isIPhone) {
                console.log("iPhone detected - using mobile admin panel");
                return <MobileAdminPanel />;
              }
              
              // Default to desktop admin panel for all other devices
              console.log("Desktop/other device - using desktop admin panel");
              return <AdminPanel />;
            }}
          </Route>
          <Route path="/admin/csv-upload" component={CSVUploadPage} />
          <Route path="/admin/tax-payments" component={AccountantPage} />
          <Route path="/reports" component={ReportsWrapper} />
          <Route path="/permits" component={PermitsPage} />
          <Route path="/employee-login" component={EmployeeLogin} />
          <Route path="/employee-dashboard" component={EmployeeDashboard} />
          <Route component={NotFound} />
        </Switch>
      </main>
      {!isAdminPage && !isEmployeePage && <BottomNavigation />}
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
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage for saved theme preference
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });

  const toggleTheme = () => {
    setIsDark(prev => {
      const newTheme = !prev;
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      return newTheme;
    });
  };

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
      <ThemeContext.Provider value={{ isDark, toggleTheme }}>
        <TooltipProvider>
          <div className={isDark ? 'dark' : ''}>
            <Toaster />
            <FullscreenSupport />
            {showSplash && isMobile ? <SplashScreen /> : (
              <ThemeWrapper>
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
                  <Route path="/admin-login">
                    {() => <AdminLogin />}
                  </Route>
                  <Route path="/mobile-admin" component={SimpleMobileAdmin} />
                  <Route path="/simple-admin" component={SimpleMobileAdmin} />
                  <Route path="/basic-admin" component={SimpleMobileAdmin} />
                  <Route path="/admin-redirect" component={SimpleMobileAdmin} />
                  <Route path="/admin">
                    {() => {
                      const isIPad = /iPad/i.test(navigator.userAgent) || 
                                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
                      const isIPhone = /iPhone/i.test(navigator.userAgent);
                      
                      if (isIPad) {
                        console.log("iPad detected - using desktop admin panel");
                        return <AdminPanel />;
                      }
                      
                      if (isIPhone) {
                        console.log("iPhone detected - using mobile admin panel");
                        return <MobileAdminPanel />;
                      }
                      
                      console.log("Desktop/other device - using desktop admin panel");
                      return <AdminPanel />;
                    }}
                  </Route>
                  <Route path="/admin-panel">
                    {() => {
                      const isIPad = /iPad/i.test(navigator.userAgent) || 
                                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
                      const isIPhone = /iPhone/i.test(navigator.userAgent);
                      
                      if (isIPad) {
                        console.log("iPad detected - using desktop admin panel");
                        return <AdminPanel />;
                      }
                      
                      if (isIPhone) {
                        console.log("iPhone detected - using mobile admin panel");
                        return <MobileAdminPanel />;
                      }
                      
                      console.log("Desktop/other device - using desktop admin panel");
                      return <AdminPanel />;
                    }}
                  </Route>
                  <Route path="/admin/csv-upload" component={CSVUploadPage} />
                  <Route path="/admin/tax-payments" component={AccountantPage} />
                  <Route path="/reports" component={ReportsWrapper} />
                  <Route path="/permits" component={PermitsPage} />
                  <Route path="/employee-login" component={EmployeeLogin} />
                  <Route path="/employee-dashboard" component={EmployeeDashboard} />
                  <Route component={NotFound} />
                </Switch>
              </ThemeWrapper>
            )}
          </div>
        </TooltipProvider>
      </ThemeContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
