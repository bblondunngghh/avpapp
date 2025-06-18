import { useState, useEffect } from "react";
import { NetworkMonitor, OfflineStorage } from "@/lib/offline-storage";
import { Wifi, WifiOff, Clock, CheckCircle } from "lucide-react";

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(NetworkMonitor.getStatus());
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Initialize network monitoring
    NetworkMonitor.init();
    
    // Subscribe to network status changes
    const unsubscribe = NetworkMonitor.addCallback((online) => {
      setIsOnline(online);
    });
    
    // Update pending count periodically
    const updatePendingCount = () => {
      setPendingCount(OfflineStorage.getPendingCount());
    };
    
    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);
    
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  if (isOnline && pendingCount === 0) {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm">
        <Wifi className="w-4 h-4" />
        <span>Connected</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 text-red-600 text-sm">
        <WifiOff className="w-4 h-4" />
        <span>Offline Mode</span>
        {pendingCount > 0 && (
          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
            {pendingCount} pending
          </span>
        )}
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div className="flex items-center gap-2 text-orange-600 text-sm">
        <Clock className="w-4 h-4" />
        <span>Syncing reports...</span>
        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
          {pendingCount} pending
        </span>
      </div>
    );
  }

  return null;
}

export function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState(NetworkMonitor.getStatus());
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    NetworkMonitor.init();
    
    const unsubscribe = NetworkMonitor.addCallback((online) => {
      setIsOnline(online);
    });
    
    const updatePendingCount = () => {
      setPendingCount(OfflineStorage.getPendingCount());
    };
    
    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);
    
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Always show a subtle status indicator
  if (isOnline && pendingCount === 0) {
    return (
      <div className="w-full p-2 text-center text-xs bg-green-50 text-green-700 border-b border-green-100 rounded-lg">
        <div className="flex items-center justify-center gap-2">
          <Wifi className="w-3 h-3" />
          <span>Connected - Reports will submit immediately</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full p-3 text-center text-sm font-medium ${
      !isOnline 
        ? 'bg-red-50 text-red-800 border-b border-red-200' 
        : 'bg-orange-50 text-orange-800 border-b border-orange-200'
    }`}>
      {!isOnline ? (
        <div className="flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          <span>
            You're working offline. Reports will be saved locally and submitted when connection is restored.
          </span>
          {pendingCount > 0 && (
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded ml-2">
              {pendingCount} reports waiting
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2">
          <Clock className="w-4 h-4" />
          <span>
            Submitting {pendingCount} saved report{pendingCount !== 1 ? 's' : ''}...
          </span>
        </div>
      )}
    </div>
  );
}