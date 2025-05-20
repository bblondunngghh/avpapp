import { useLocation, useRoute } from "wouter";
import { ClipboardList, Home, PlusCircle } from "lucide-react";
import { useEffect, useState } from "react";

export default function BottomNavigation() {
  const [, navigate] = useLocation();
  const [isHome] = useRoute("/");
  const [isReports] = useRoute("/reports");
  const [isNewReport] = useRoute("/new-report");
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check if user is logged in as admin
  useEffect(() => {
    const checkAdminStatus = () => {
      const isAuthenticated = localStorage.getItem("admin_authenticated") === "true";
      const authTime = Number(localStorage.getItem("admin_auth_time") || "0");
      const currentTime = Date.now();
      const fourHoursInMs = 4 * 60 * 60 * 1000;
      
      // If authenticated and session hasn't expired
      if (isAuthenticated && (currentTime - authTime <= fourHoursInMs)) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    };
    
    checkAdminStatus();
    
    // Check admin status whenever localStorage changes
    window.addEventListener('storage', checkAdminStatus);
    
    return () => {
      window.removeEventListener('storage', checkAdminStatus);
    };
  }, []);
  
  return (
    <nav className="bottom-nav">
      <button 
        className={`bottom-nav-item ${isHome ? 'active' : ''}`}
        onClick={() => navigate('/')}
      >
        <Home className="bottom-nav-icon" size={20} />
        <span className="bottom-nav-label">Dashboard</span>
      </button>
      
      {isAdmin && (
        <button 
          className={`bottom-nav-item ${isReports ? 'active' : ''}`}
          onClick={() => navigate('/reports')}
        >
          <ClipboardList className="bottom-nav-icon" size={20} />
          <span className="bottom-nav-label">Reports</span>
        </button>
      )}
      
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
