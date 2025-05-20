import { Switch, Route, useLocation, RouteComponentProps } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import ReportForm from "@/pages/report-form";
import Reports from "@/pages/reports";
import SubmissionComplete from "@/pages/submission-complete";
import AdminLogin from "@/pages/admin-login";
import AdminPanel from "@/pages/admin-panel";
import IncidentReport from "@/pages/incident-report";
import IncidentSubmitted from "@/pages/incident-submitted";
import Regulations from "@/pages/regulations";
import Header from "@/components/layout/header";
import BottomNavigation from "@/components/layout/bottom-navigation";

function Router() {
  const [location, setLocation] = useLocation();
  
  // Determine if we're on an admin page to show/hide normal navigation
  const isAdminPage = location.startsWith('/admin');
  
  return (
    <div className="flex flex-col min-h-screen pb-16">
      {!isAdminPage && <Header />}
      <main className={`${isAdminPage ? '' : 'container mx-auto px-4 py-4'} flex-grow`}>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/reports" component={Reports} />
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
          <Route path="/admin" component={AdminPanel} />
          <Route component={NotFound} />
        </Switch>
      </main>
      {!isAdminPage && <BottomNavigation />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
