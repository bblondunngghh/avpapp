import { useLocation } from "wouter";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import LocationIcon from "@/components/location-icon";
import { MapPin, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import stoveIcon from "@assets/Stove-Gas--Streamline-Ultimate_1751494739426.png";

interface LocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LocationSelectorModal({ isOpen, onClose }: LocationSelectorModalProps) {
  const [, navigate] = useLocation();
  
  // Fetch locations from API
  const { data: locations, isLoading } = useQuery({
    queryKey: ["/api/locations"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  const handleLocationSelect = (locationId: number) => {
    navigate(`/new-report?locationId=${locationId}`);
    onClose();
  };
  
  return (
    <>
      <style>{`
        .location-selector-modal[data-radix-dialog-content] {
          position: fixed !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          max-height: 90vh !important;
          height: auto !important;
          overflow-y: auto !important;
          z-index: 9999 !important;
          width: 90vw !important;
          max-width: 400px !important;
          margin: 0 !important;
          inset: unset !important;
        }
        [data-radix-dialog-overlay] {
          z-index: 9998 !important;
        }
        .location-selector-modal .relative.z-10 {
          max-height: 80vh;
          overflow-y: auto;
        }
      `}</style>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent 
          className="location-selector-modal relative bg-slate-800/50 backdrop-blur-xl border border-slate-600/50 shadow-xl text-white max-w-md rounded-lg overflow-hidden"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            maxHeight: '85vh',
            width: '90vw',
            maxWidth: '400px',
            margin: '0',
            zIndex: 9999
          }}
        >
        {/* Glass morphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700/10 to-slate-900/5 rounded-lg"></div>
        
        <div className="relative z-10 p-4">
          <div className="mb-4">
            <h2 className="text-white text-lg font-semibold">Select Location</h2>
            <p className="text-gray-300 text-xs">Choose a location to create a new shift report</p>
          </div>
          
          <div className="space-y-3">
            {isLoading ? (
              <div className="bg-slate-700/50 border border-slate-600/50 rounded-lg p-4 text-center">
                <div className="animate-pulse flex flex-col items-center space-y-2">
                  <div className="w-8 h-8 bg-slate-600/50 rounded-full"></div>
                  <div className="text-gray-300 text-sm">Loading locations...</div>
                </div>
              </div>
          ) : (
            locations?.filter((location: any) => location.active)?.map((location: any) => {
              const getLocationIcon = (locationName: string) => {
                if (locationName.toLowerCase().includes('truluck')) {
                  return (
                    <img 
                      src="/assets/trulucks-crab-icon.png" 
                      alt="Truluck's Crab" 
                      className="w-6 h-6 object-contain"
                    />
                  );
                }
                if (locationName.toLowerCase().includes('capital grille')) {
                  return (
                    <img 
                      src={stoveIcon} 
                      alt="Capital Grille Stove" 
                      className="w-6 h-6 object-contain"
                    />
                  );
                }
                if (locationName.toLowerCase().includes('boa')) {
                  return (
                    <img 
                      src="/assets/boa-steakhouse-icon.png" 
                      alt="BOA Steak" 
                      className="w-6 h-6 object-contain"
                    />
                  );
                }
                if (locationName.toLowerCase().includes('bob')) {
                  return (
                    <img 
                      src="/assets/bobs-steak-icon.png" 
                      alt="Bob's Steak" 
                      className="w-6 h-6 object-contain"
                    />
                  );
                }
                return <Building2 className="h-5 w-5 text-white" />;
              };

              return (
                <div 
                  key={location.id}
                  className="bg-slate-700/50 border border-slate-600/50 hover:bg-slate-600/50 rounded-lg p-3 cursor-pointer transition-all duration-200"
                  onClick={() => handleLocationSelect(location.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-slate-600/50 flex items-center justify-center">
                      {getLocationIcon(location.name)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{location.name}</h3>
                      <p className="text-slate-400 text-sm">Click to create report</p>
                    </div>
                    <div className="text-slate-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            }) || (
              <div className="bg-slate-700/50 border border-slate-600/50 rounded-lg p-6">
                <div className="flex flex-col items-center space-y-3 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-600/50 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-slate-400" />
                  </div>
                  <div className="text-slate-300 font-medium">No locations available</div>
                </div>
              </div>
            )
          )}
        </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
