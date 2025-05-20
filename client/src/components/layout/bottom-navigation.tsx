import { useLocation, useRoute } from "wouter";
import { ClipboardList, Home, PlusCircle } from "lucide-react";

export default function BottomNavigation() {
  const [, navigate] = useLocation();
  const [isHome] = useRoute("/");
  const [isReports] = useRoute("/reports");
  const [isNewReport] = useRoute("/new-report");
  
  return (
    <nav className="bottom-nav">
      <button 
        className={`bottom-nav-item ${isHome ? 'active' : ''}`}
        onClick={() => navigate('/')}
      >
        <Home className="bottom-nav-icon" size={20} />
        <span className="bottom-nav-label">Dashboard</span>
      </button>
      
      <button 
        className={`bottom-nav-item ${isReports ? 'active' : ''}`}
        onClick={() => navigate('/reports')}
      >
        <ClipboardList className="bottom-nav-icon" size={20} />
        <span className="bottom-nav-label">Reports</span>
      </button>
      
      <button 
        className={`bottom-nav-item ${isNewReport ? 'active' : ''}`}
        onClick={() => navigate('/new-report')}
      >
        <PlusCircle className="bottom-nav-icon" size={20} />
        <span className="bottom-nav-label">New Report</span>
      </button>
    </nav>
  );
}
