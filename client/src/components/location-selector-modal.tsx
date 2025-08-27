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
      <DialogContent className="sm:max-w-md bg-slate-800/50 backdrop-blur-xl border border-slate-600/50 text-white">
        <DialogHeader className="text-center space-y-3 pb-2">
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
        
        <div className="grid grid-cols-1 gap-3 mt-4 px-1">
          {isLoading ? (
            <Card className="bg-slate-700/50 border border-slate-600/50 shadow-xl">
              <CardContent className="text-center py-8">
                <div className="animate-pulse flex flex-col items-center space-y-3">
                  <div className="w-12 h-12 bg-slate-600/50 rounded-full"></div>
                  <div className="text-gray-300 font-medium">Loading locations...</div>
                </div>
              </CardContent>
            </Card>
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
                <Card 
                  key={location.id}
                  className="bg-slate-700/50 border border-slate-600/50 shadow-xl hover:bg-slate-600/50 transition-all duration-300 cursor-pointer hover:border-slate-500/60 hover:shadow-2xl"
                  onClick={() => handleLocationSelect(location.id)}
                >
                  <CardContent className="flex items-center space-x-3 py-4 px-4">
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
                  </CardContent>
                </Card>
              );
            }) || (
              <Card className="bg-slate-700/50 border border-slate-600/50 shadow-xl">
                <CardContent className="text-center py-8">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 bg-slate-600/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <Building2 className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="text-gray-300 font-medium">No locations available</div>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
