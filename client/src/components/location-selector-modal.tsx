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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white/5 backdrop-blur-xl border border-white/20 text-white animate-scale-in shadow-2xl overflow-hidden">
        {/* Enhanced Glass morphism overlay */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
        
        <DialogHeader className="text-center space-y-3 pb-2 relative z-10">
          <div className="mx-auto w-12 h-12 flex items-center justify-center">
            <img 
              src="/assets/pin-location-icon.png" 
              alt="Location Pin" 
              className="w-12 h-12 object-contain"
            />
          </div>
          <DialogTitle className="text-xl font-bold text-white text-center">Select Location</DialogTitle>
          <DialogDescription className="text-center text-gray-300">
            Choose a location to create a new shift report
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 gap-3 mt-4 px-1 relative z-10">
          {isLoading ? (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl rounded-lg">
              <div className="text-center py-8">
                <div className="animate-pulse flex flex-col items-center space-y-3">
                  <div className="w-12 h-12 bg-white/10 rounded-full"></div>
                  <div className="text-gray-300 font-medium">Loading locations...</div>
                </div>
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
                  className="relative bg-white/5 backdrop-blur-xl border border-white/20 shadow-xl hover:bg-white/10 transition-all duration-300 cursor-pointer hover:border-white/30 hover:shadow-2xl rounded-lg overflow-hidden"
                  onClick={() => handleLocationSelect(location.id)}
                >
                  {/* Glassmorphism overlay for location cards */}
                  <div className="absolute inset-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                  <div className="flex items-center space-x-3 py-4 px-4 relative z-10">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600/80 to-indigo-700/80 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm">
                      {getLocationIcon(location.name)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">{location.name}</h3>
                      <p className="text-gray-300 text-xs">Click to create report</p>
                    </div>
                    <div className="text-gray-400 hover:text-gray-300 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            }) || (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl rounded-lg">
                <div className="text-center py-8">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <Building2 className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="text-gray-300 font-medium">No locations available</div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
