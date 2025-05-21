import { useEffect, useState } from "react";
import { useLocation } from "wouter";

// Ultra-simple mobile admin that uses minimal JavaScript and React features
export default function BasicMobileAdmin() {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [htmlContent, setHtmlContent] = useState("");
  
  // Load data on component mount
  useEffect(() => {
    // Verify authentication
    const isAuthenticated = localStorage.getItem("admin_authenticated") === "true";
    if (!isAuthenticated) {
      navigate("/admin-login");
      return;
    }
    
    // Fetch data and generate HTML content
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch reports
        const reportsResponse = await fetch('/api/shift-reports');
        let reports = [];
        if (reportsResponse.ok) {
          reports = await reportsResponse.json();
        }
        
        // Fetch ticket distributions
        const ticketsResponse = await fetch('/api/ticket-distributions');
        let tickets = [];
        if (ticketsResponse.ok) {
          tickets = await ticketsResponse.json();
        }
        
        // Generate simple HTML content
        const html = generateStaticHtml(reports, tickets);
        setHtmlContent(html);
      } catch (error) {
        console.error('Error fetching data:', error);
        setHtmlContent('<p style="color: red; padding: 20px;">Error loading data. Please try again.</p>');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [navigate]);
  
  // Function to generate static HTML
  const generateStaticHtml = (reports: any[], tickets: any[]) => {
    // Sort reports by date (newest first)
    const sortedReports = [...reports].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // Limit to recent entries
    const recentReports = sortedReports.slice(0, 10);
    
    // Location names mapping
    const locationNames: Record<number, string> = {
      1: "The Capital Grille",
      2: "Bob's Steak & Chop House",
      3: "Truluck's",
      4: "BOA Steakhouse"
    };
    
    // Format for display
    const formatDate = (dateStr: string) => {
      try {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }).format(date);
      } catch (e) {
        return dateStr;
      }
    };
    
    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      }).format(amount);
    };
    
    // Calculate location performance
    const locationStats: Record<number, {cars: number, revenue: number}> = {
      1: {cars: 0, revenue: 0},
      2: {cars: 0, revenue: 0},
      3: {cars: 0, revenue: 0},
      4: {cars: 0, revenue: 0}
    };
    
    // Process report data for stats
    if (Array.isArray(reports)) {
      reports.forEach((report: any) => {
        if (report && typeof report === 'object') {
          const locationId = report.locationId;
          if (locationStats[locationId]) {
            locationStats[locationId].cars += Number(report.totalCars) || 0;
            locationStats[locationId].revenue += Number(report.totalTurnIn) || 0;
          }
        }
      });
    }
    
    // Build the HTML content
    let html = `
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
          -webkit-text-size-adjust: 100%;
        }
        .container {
          padding: 16px;
          max-width: 100%;
          margin: 0 auto;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .logout {
          background-color: #f44336;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
        }
        .card {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 16px;
          overflow: hidden;
        }
        .card-header {
          padding: 16px;
          border-bottom: 1px solid #eee;
        }
        .card-content {
          padding: 16px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 16px;
        }
        .stat-card {
          background-color: #f0f7ff;
          padding: 12px;
          border-radius: 6px;
        }
        .stat-label {
          font-size: 14px;
          color: #666;
          margin-bottom: 4px;
        }
        .stat-value {
          font-size: 20px;
          font-weight: 500;
        }
        .tabs {
          display: flex;
          margin-bottom: 16px;
        }
        .tab {
          flex: 1;
          text-align: center;
          padding: 12px;
          background-color: #f0f0f0;
          cursor: pointer;
          font-weight: 500;
        }
        .tab.active {
          background-color: white;
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
        }
        .report-item {
          border-bottom: 1px solid #eee;
          padding: 12px 16px;
        }
        .report-item:last-child {
          border-bottom: none;
        }
        .report-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .report-title {
          font-weight: 500;
        }
        .report-date {
          font-size: 13px;
          color: #666;
        }
        .report-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          font-size: 14px;
        }
        .detail-label {
          color: #666;
        }
        .performance-item {
          padding: 12px 16px;
          border-bottom: 1px solid #eee;
        }
        .performance-item:last-child {
          border-bottom: none;
        }
        .tab-content {
          display: none;
        }
        .tab-content.active {
          display: block;
        }
      </style>
      
      <div class="container">
        <div class="header">
          <h1 style="font-size: 24px; margin: 0;">Basic Admin</h1>
          <button class="logout" onclick="logout()">Logout</button>
        </div>
        
        <!-- Stats Summary -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Reports</div>
            <div class="stat-value">${reports.length}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Tickets</div>
            <div class="stat-value">${tickets.length}</div>
          </div>
        </div>
        
        <!-- Tabs -->
        <div class="tabs">
          <div class="tab active" onclick="switchTab('reports')">Reports</div>
          <div class="tab" onclick="switchTab('performance')">Performance</div>
        </div>
        
        <!-- Reports Tab -->
        <div id="reports-tab" class="card tab-content active">
          <div class="card-header">
            <h2 style="font-size: 18px; margin: 0;">Latest Reports</h2>
          </div>
          <div class="card-content" style="padding: 0;">
    `;
    
    if (recentReports.length === 0) {
      html += `<p style="padding: 16px; color: #666;">No reports available</p>`;
    } else {
      recentReports.forEach(report => {
        const locationName = locationNames[report.locationId] || "Unknown Location";
        
        html += `
          <div class="report-item">
            <div class="report-header">
              <div class="report-title">${locationName}</div>
              <div class="report-date">${formatDate(report.date)} - ${report.shift}</div>
            </div>
            <div class="report-details">
              <div>
                <div class="detail-label">Total Cars:</div>
                <div>${report.totalCars}</div>
              </div>
              <div>
                <div class="detail-label">Cash Collected:</div>
                <div>${formatCurrency(report.totalCashCollected || 0)}</div>
              </div>
              <div>
                <div class="detail-label">Credit Sales:</div>
                <div>${formatCurrency(report.totalCreditSales || 0)}</div>
              </div>
              <div>
                <div class="detail-label">Turn-In:</div>
                <div>${formatCurrency(report.totalTurnIn || 0)}</div>
              </div>
            </div>
          </div>
        `;
      });
    }
    
    html += `
          </div>
        </div>
        
        <!-- Performance Tab -->
        <div id="performance-tab" class="card tab-content">
          <div class="card-header">
            <h2 style="font-size: 18px; margin: 0;">Location Performance</h2>
          </div>
          <div class="card-content" style="padding: 0;">
    `;
    
    Object.keys(locationStats).forEach(locationIdStr => {
      const locationId = parseInt(locationIdStr);
      const stats = locationStats[locationId];
      const locationName = locationNames[locationId] || "Unknown Location";
      
      html += `
        <div class="performance-item">
          <div class="report-title" style="margin-bottom: 8px;">${locationName}</div>
          <div class="report-details">
            <div>
              <div class="detail-label">Total Cars:</div>
              <div>${stats.cars}</div>
            </div>
            <div>
              <div class="detail-label">Revenue:</div>
              <div>${formatCurrency(stats.revenue)}</div>
            </div>
          </div>
        </div>
      `;
    });
    
    html += `
          </div>
        </div>
      </div>
      
      <script>
        function switchTab(tabName) {
          // Hide all tab contents
          document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
          });
          
          // Deactivate all tab buttons
          document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
          });
          
          // Activate selected tab
          document.getElementById(tabName + '-tab').classList.add('active');
          
          // Activate selected tab button (find index)
          const tabs = ['reports', 'performance'];
          const index = tabs.indexOf(tabName);
          document.querySelectorAll('.tab')[index].classList.add('active');
        }
        
        function logout() {
          localStorage.removeItem('admin_authenticated');
          localStorage.removeItem('admin_auth_time');
          window.location.href = '/admin-login';
        }
      </script>
    `;
    
    return html;
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p>Loading basic admin panel...</p>
      </div>
    );
  }

  // Render the HTML content directly
  return (
    <div 
      dangerouslySetInnerHTML={{ __html: htmlContent }} 
      className="basic-admin"
    />
  );
}