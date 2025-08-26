import { useState, useEffect } from "react";
import { NetworkMonitor, OfflineStorage } from "@/lib/offline-storage";
import { Wifi, WifiOff, Clock, CheckCircle } from "lucide-react";
import wifiCheckIcon from "@assets/Wifi-Check--Streamline-Ultimate_1750257859991.png";
import wifiQuestionIcon from "@assets/Wifi-Question--Streamline-Ultimate_1750258014461.png";

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
          <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded text-xs border border-red-500/30">
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
        <span className="bg-orange-500/20 text-orange-300 px-2 py-1 rounded text-xs border border-orange-500/30">
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
      <div className="w-full p-2 text-center text-xs bg-white/10 backdrop-blur-sm text-green-400 border border-white/20 rounded mb-4">
        <div className="flex items-center justify-center gap-2">
          <img src={wifiCheckIcon} alt="Connected" className="w-3 h-3" />
          <span>Connected - Reports will submit immediately</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full p-2 text-center text-xs ${
      !isOnline 
        ? 'bg-white/10 backdrop-blur-sm text-red-400 border border-white/20' 
        : 'bg-white/10 backdrop-blur-sm text-orange-400 border border-white/20'
    } rounded mb-4`}>
      {!isOnline ? (
        <div className="flex items-center justify-center gap-2">
          <img src={wifiQuestionIcon} alt="Offline" className="w-3 h-3" />
          <span>
            You're working offline. Reports will be saved locally and submitted when connection is restored.
          </span>
          {pendingCount > 0 && (
            <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded ml-2 border border-red-500/30">
              {pendingCount} reports waiting
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2">
          <Clock className="w-3 h-3" />
          <span>
            Submitting {pendingCount} saved report{pendingCount !== 1 ? 's' : ''}...
          </span>
        </div>
      )}
    </div>
  );
}