import { useLocation, useRoute } from "wouter";
import { ClipboardList, Home, PlusCircle, User } from "lucide-react";
import { useEffect, useState } from "react";
import dashboardIcon from "@assets/Layout-Dashboard-1--Streamline-Ultimate.png";
import employeeIcon from "@assets/Delivery-Man--Streamline-Ultimate.png";
import newReportIcon from "@assets/Data-File-Edit--Streamline-Ultimate.png";

export default function BottomNavigation() {
  const [, navigate] = useLocation();
  const [isHome] = useRoute("/");
  const [isReports] = useRoute("/reports");
  const [isReportSelection] = useRoute("/report-selection");
  const [isEmployeeDashboard] = useRoute("/employee-dashboard");
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
        <img src={dashboardIcon} alt="Dashboard" className="bottom-nav-icon" />
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
        className={`bottom-nav-item ${isReportSelection ? 'active' : ''}`}
        onClick={() => navigate('/report-selection')}
      >
        <img src={newReportIcon} alt="New Report" className="bottom-nav-icon" />
        <span className="bottom-nav-label">New Report</span>
      </button>

      <button 
        className={`bottom-nav-item ${isEmployeeDashboard ? 'active' : ''}`}
        onClick={() => navigate('/employee-dashboard')}
      >
        <img src={employeeIcon} alt="Employee" className="bottom-nav-icon" />
        <span className="bottom-nav-label">Employee</span>
      </button>
    </nav>
  );
}
