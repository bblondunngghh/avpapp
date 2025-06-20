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
      <DialogContent className="sm:max-w-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
        <DialogHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
            <MapPin className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-blue-900 text-center">Select Location</DialogTitle>
          <DialogDescription className="text-center text-blue-700 text-lg">
            Choose a location to create a new shift report
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 gap-4 mt-6 px-2">
          {isLoading ? (
            <Card className="border-blue-200 shadow-md">
              <CardContent className="text-center py-8">
                <div className="animate-pulse flex flex-col items-center space-y-3">
                  <div className="w-12 h-12 bg-blue-200 rounded-full"></div>
                  <div className="text-blue-600 font-medium">Loading locations...</div>
                </div>
              </CardContent>
            </Card>
          ) : (
            locations?.filter((location: any) => location.active)?.map((location: any) => (
              <Card 
                key={location.id}
                className="border-blue-200 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer bg-white hover:bg-blue-50 border-2 hover:border-blue-400"
                onClick={() => handleLocationSelect(location.id)}
              >
                <CardContent className="flex items-center space-x-4 py-6 px-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-blue-900">{location.name}</h3>
                    <p className="text-blue-600 text-sm">Click to create report</p>
                  </div>
                  <div className="text-blue-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </CardContent>
              </Card>
            )) || (
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
