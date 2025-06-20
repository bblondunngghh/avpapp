import { useLocation } from "wouter";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import LocationIcon from "@/components/location-icon";
import { MapPin, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface LocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LocationSelectorModal({ isOpen, onClose }: LocationSelectorModalProps) {
  const [, navigate] = useLocation();
  
  // Fetch locations from API with fallback
  const { data: locations, isLoading, error } = useQuery({
    queryKey: ["/api/locations"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: 2,
    retryDelay: 1000,
  });

  // Fallback locations if API fails
  const fallbackLocations = [
    { id: 1, name: "The Capital Grille", active: true },
    { id: 2, name: "Bob's Steak & Chop House", active: true },
    { id: 3, name: "Truluck's", active: true },
    { id: 4, name: "BOA Steakhouse", active: true }
  ];

  const displayLocations = locations || (error ? fallbackLocations : null);
  
  const handleLocationSelect = (locationId: number) => {
    navigate(`/new-report?locationId=${locationId}`);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
        <DialogHeader className="text-center space-y-3 pb-2">
          <div className="mx-auto w-12 h-12 flex items-center justify-center">
            <img 
              src="/assets/shop-pin-icon.png" 
              alt="Shop Location Pin" 
              className="w-12 h-12 object-contain"
            />
          </div>
          <DialogTitle className="text-xl font-bold text-blue-900 text-center">Select Location</DialogTitle>
          <DialogDescription className="text-center text-blue-700">
            Choose a location to create a new shift report
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 gap-3 mt-4 px-1">
          {isLoading && !error ? (
            <Card className="border-blue-200 shadow-md">
              <CardContent className="text-center py-8">
                <div className="animate-pulse flex flex-col items-center space-y-3">
                  <div className="w-12 h-12 bg-blue-200 rounded-full"></div>
                  <div className="text-blue-600 font-medium">Loading locations...</div>
                </div>
              </CardContent>
            </Card>
          ) : (
            displayLocations?.filter((location: any) => location.active)?.map((location: any) => {
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
                      src="/assets/capital-grille-icon.png" 
                      alt="Capital Grille BBQ" 
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
                  className="border-blue-200 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer bg-white hover:bg-blue-50 border-2 hover:border-blue-400"
                  onClick={() => handleLocationSelect(location.id)}
                >
                  <CardContent className="flex items-center space-x-3 py-4 px-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                      {getLocationIcon(location.name)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-blue-900">{location.name}</h3>
                      <p className="text-blue-600 text-xs">Click to create report</p>
                    </div>
                    <div className="text-blue-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </CardContent>
                </Card>
              );
            }) || (
              <Card className="border-blue-200 shadow-md">
                <CardContent className="text-center py-8">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="text-gray-600 font-medium">No locations available</div>
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
