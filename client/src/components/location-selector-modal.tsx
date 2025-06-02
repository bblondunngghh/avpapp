import { useLocation } from "wouter";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import LocationIcon from "@/components/location-icon";

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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center">
          <DialogTitle className="font-normal text-center">Select Location</DialogTitle>
          <DialogDescription className="text-center">
            Choose a location to create a new shift report
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 gap-3 mt-4">
          {isLoading ? (
            <div className="text-center py-4">Loading locations...</div>
          ) : (
            locations?.filter((location: any) => location.active)?.map((location: any) => (
              <Button
                key={location.id}
                variant="outline"
                className="justify-center h-auto py-3 px-4 text-center"
                onClick={() => handleLocationSelect(location.id)}
              >
                <span className="font-medium text-primary">{location.name}</span>
              </Button>
            )) || <div className="text-center py-4">No locations available</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
