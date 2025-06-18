// Offline storage for shift reports in poor network conditions
export interface PendingReport {
  id: string;
  data: any;
  timestamp: number;
  attempts: number;
  type: 'shift-report' | 'incident-report' | 'tax-payment';
}

const PENDING_REPORTS_KEY = 'avp_pending_reports';
const MAX_RETRY_ATTEMPTS = 5;

export class OfflineStorage {
  static savePendingReport(data: any, type: 'shift-report' | 'incident-report' | 'tax-payment'): string {
    const reports = this.getPendingReports();
    const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const pendingReport: PendingReport = {
      id,
      data,
      timestamp: Date.now(),
      attempts: 0,
      type
    };
    
    reports.push(pendingReport);
    localStorage.setItem(PENDING_REPORTS_KEY, JSON.stringify(reports));
    
    console.log(`Report saved offline: ${id}`);
    return id;
  }
  
  static getPendingReports(): PendingReport[] {
    try {
      const stored = localStorage.getItem(PENDING_REPORTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading pending reports:', error);
      return [];
    }
  }
  
  static removePendingReport(id: string): void {
    const reports = this.getPendingReports().filter(report => report.id !== id);
    localStorage.setItem(PENDING_REPORTS_KEY, JSON.stringify(reports));
    console.log(`Removed pending report: ${id}`);
  }
  
  static incrementAttempts(id: string): void {
    const reports = this.getPendingReports();
    const report = reports.find(r => r.id === id);
    if (report) {
      report.attempts++;
      localStorage.setItem(PENDING_REPORTS_KEY, JSON.stringify(reports));
    }
  }
  
  static getReportsToRetry(): PendingReport[] {
    return this.getPendingReports().filter(report => 
      report.attempts < MAX_RETRY_ATTEMPTS && 
      Date.now() - report.timestamp > 30000 // Wait at least 30 seconds before retry
    );
  }
  
  static clearExpiredReports(): void {
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days old
    const reports = this.getPendingReports().filter(report => 
      report.timestamp > cutoff && report.attempts < MAX_RETRY_ATTEMPTS
    );
    localStorage.setItem(PENDING_REPORTS_KEY, JSON.stringify(reports));
  }
  
  static getPendingCount(): number {
    return this.getPendingReports().length;
  }
}

// Network status detection
export class NetworkMonitor {
  private static callbacks: Set<(online: boolean) => void> = new Set();
  private static isOnline = navigator.onLine;
  
  static init() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyCallbacks(true);
      this.triggerOfflineSync();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyCallbacks(false);
    });
    
    // Clean up expired reports on init
    OfflineStorage.clearExpiredReports();
    
    // Set up periodic sync attempts
    setInterval(() => {
      if (this.isOnline) {
        this.triggerOfflineSync();
      }
    }, 60000); // Check every minute
  }
  
  static addCallback(callback: (online: boolean) => void) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }
  
  private static notifyCallbacks(online: boolean) {
    this.callbacks.forEach(callback => callback(online));
  }
  
  private static async triggerOfflineSync() {
    const reportsToRetry = OfflineStorage.getReportsToRetry();
    
    for (const report of reportsToRetry) {
      try {
        OfflineStorage.incrementAttempts(report.id);
        
        // Import apiRequest dynamically to avoid circular dependencies
        const { apiRequest } = await import('./queryClient');
        
        let endpoint = '';
        switch (report.type) {
          case 'shift-report':
            endpoint = '/api/shift-reports';
            break;
          case 'incident-report':
            endpoint = '/api/incident-reports';
            break;
          case 'tax-payment':
            endpoint = '/api/tax-payments';
            break;
        }
        
        const response = await apiRequest('POST', endpoint, report.data);
        
        if (response.ok) {
          OfflineStorage.removePendingReport(report.id);
          console.log(`Successfully synced offline report: ${report.id}`);
          
          // Show success notification
          if ('serviceWorker' in navigator && 'Notification' in window) {
            new Notification('Report Synced', {
              body: `Your ${report.type} has been successfully submitted.`,
              icon: '/favicon.ico'
            });
          }
        }
      } catch (error) {
        console.error(`Failed to sync report ${report.id}:`, error);
      }
    }
  }
  
  static getStatus() {
    return this.isOnline;
  }
}