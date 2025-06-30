import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, HelpCircle, Users, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface HelpRequest {
  id: number;
  requestingLocation: string;
  requestType: string;
  description: string;
  status: "active" | "fulfilled";
  requestedAt: string;
  resolvedAt?: string | null;
}

interface HelpResponse {
  id: number;
  helpRequestId: number;
  respondingLocation: string;
  message: string;
  respondedAt: string;
}

export default function HelpRequestPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [requestingLocation, setRequestingLocation] = useState("");
  const [helpType, setHelpType] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [respondingLocation, setRespondingLocation] = useState("");
  const [attendantsOffered, setAttendantsOffered] = useState("");
  const [responseType, setResponseType] = useState<"help" | "busy">("help");

  // Fetch locations for ID mapping
  const { data: locations = [] } = useQuery<Array<{ id: number; name: string }>>({
    queryKey: ["/api/locations"],
  });

  // Fetch active help requests
  const { data: helpRequests = [], isLoading } = useQuery<HelpRequest[]>({
    queryKey: ["/api/help-requests/active"],
    refetchInterval: 5000, // Poll every 5 seconds for real-time updates
  });

  // Check for new responses to show popup notifications
  const { data: allResponses = [] } = useQuery<HelpResponse[]>({
    queryKey: ["/api/help-requests/responses"],
    refetchInterval: 3000, // Check for responses every 3 seconds
    onSuccess: (responses) => {
      // Show popup notification for new responses
      const now = Date.now();
      const recentResponses = responses.filter(response => {
        const responseTime = new Date(response.respondedAt).getTime();
        return now - responseTime < 10000; // Show notification for responses in last 10 seconds
      });

      recentResponses.forEach(response => {
        const helpingLocation = locations.find(loc => loc.id === response.respondingLocationId)?.name;
        if (response.attendantsOffered > 0) {
          toast({
            title: "🚨 Help is on the way!",
            description: `${helpingLocation} is sending ${response.attendantsOffered} attendant(s). ETA: ${response.estimatedArrival}`,
            className: "bg-green-600 text-white",
            duration: 8000,
          });
        } else {
          toast({
            title: "📢 Response Received",
            description: `${helpingLocation} is too busy to send help at this time.`,
            className: "bg-orange-500 text-white",
            duration: 6000,
          });
        }
      });
    },
  });

  // Create help request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (data: { requestingLocationId: number; message: string; priority: string; staffCount: number }) => {
      return apiRequest("POST", "/api/help-requests", data);
    },
    onSuccess: () => {
      toast({
        title: "Help Request Sent",
        description: "Your valet assistance request has been sent to all locations.",
      });
      setRequestingLocation("");
      setHelpType("");
      queryClient.invalidateQueries({ queryKey: ["/api/help-requests/active"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send help request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create response mutation
  const createResponseMutation = useMutation({
    mutationFn: async (data: { helpRequestId: number; respondingLocationId: number; attendantsOffered: number; message: string }) => {
      return apiRequest("POST", "/api/help-requests/respond", data);
    },
    onSuccess: () => {
      toast({
        title: "Help Dispatched!",
        description: "Your assistance team has been sent and the requesting location has been notified.",
        className: "bg-green-600 text-white",
      });
      setResponseMessage("");
      setSelectedRequestId(null);
      setRespondingLocation("");
      setAttendantsOffered("");
      setResponseType("help");
      queryClient.invalidateQueries({ queryKey: ["/api/help-requests/active"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send response. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitRequest = () => {
    if (!requestingLocation || !helpType) {
      toast({
        title: "Missing Information",
        description: "Please select your location and type of help needed.",
        variant: "destructive",
      });
      return;
    }

    // Find the location ID from the location name
    const location = locations.find(loc => loc.name === requestingLocation);
    if (!location) {
      toast({
        title: "Invalid Location",
        description: "Please select a valid location.",
        variant: "destructive",
      });
      return;
    }

    createRequestMutation.mutate({
      requestingLocationId: location.id,
      message: `Valet assistance needed: ${helpType}`,
      priority: "normal",
      staffCount: 1,
    });
  };

  const handleSubmitResponse = (requestId: number) => {
    if (!respondingLocation) {
      toast({
        title: "Missing Information",
        description: "Please select your responding location.",
        variant: "destructive",
      });
      return;
    }

    if (responseType === "help" && !attendantsOffered) {
      toast({
        title: "Missing Information",
        description: "Please specify number of attendants to send.",
        variant: "destructive",
      });
      return;
    }

    // Find the responding location ID
    const location = locations.find(loc => loc.name === respondingLocation);
    if (!location) {
      toast({
        title: "Invalid Location",
        description: "Please select a valid responding location.",
        variant: "destructive",
      });
      return;
    }

    const isBusy = responseType === "busy";
    const attendants = isBusy ? 0 : parseInt(attendantsOffered);
    const autoMessage = isBusy 
      ? `${respondingLocation} is too busy to send help at this time.`
      : `Sending ${attendantsOffered} attendant(s) from ${respondingLocation}.`;

    createResponseMutation.mutate({
      helpRequestId: requestId,
      respondingLocationId: location.id,
      attendantsOffered: attendants,
      message: responseMessage.trim() || autoMessage,
    });
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-orange-600" />
            <h1 className="text-2xl font-bold text-gray-900">Inter-Location Help Requests</h1>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Request Help Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Request Help
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="requesting-location">Your Location</Label>
              <Select value={requestingLocation} onValueChange={setRequestingLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="The Capital Grille">The Capital Grille</SelectItem>
                  <SelectItem value="Bob's Steak and Chop House">Bob's Steak and Chop House</SelectItem>
                  <SelectItem value="Truluck's">Truluck's</SelectItem>
                  <SelectItem value="BOA Steakhouse">BOA Steakhouse</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Type of Valet Assistance Needed</Label>
              <RadioGroup value={helpType} onValueChange={setHelpType} className="mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="backed up" id="backed-up" />
                  <Label htmlFor="backed-up">Backed Up - Need help with overflow</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pulls" id="pulls" />
                  <Label htmlFor="pulls">Pulls - Need help retrieving cars</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="parks" id="parks" />
                  <Label htmlFor="parks">Parks - Need help parking cars</Label>
                </div>
              </RadioGroup>
            </div>

            <Button 
              onClick={handleSubmitRequest}
              disabled={createRequestMutation.isPending}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {createRequestMutation.isPending ? "Sending..." : "Send Help Request"}
            </Button>
          </CardContent>
        </Card>

        {/* Active Requests Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Active Help Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading requests...</div>
            ) : helpRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No active help requests at this time
              </div>
            ) : (
              <div className="space-y-4">
                {helpRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{request.requestingLocation} requesting help</h3>
                        <p className="text-sm text-orange-600 font-medium">Type: {request.requestType}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(request.requestedAt).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{request.description}</p>
                    
                    {selectedRequestId === request.id ? (
                      <div className="space-y-4 bg-white p-4 rounded-lg border">
                        <h4 className="font-medium text-gray-900">Respond to Help Request</h4>
                        
                        {/* Location Dropdown */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Your Location
                          </label>
                          <Select value={respondingLocation} onValueChange={setRespondingLocation}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your location" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="The Capital Grille">The Capital Grille</SelectItem>
                              <SelectItem value="Bob's Steak and Chop House">Bob's Steak and Chop House</SelectItem>
                              <SelectItem value="Truluck's">Truluck's</SelectItem>
                              <SelectItem value="BOA Steakhouse">BOA Steakhouse</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Response Type Radio Buttons */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Response Type
                          </label>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="help"
                                name="responseType"
                                value="help"
                                checked={responseType === "help"}
                                onChange={(e) => setResponseType(e.target.value as "help" | "busy")}
                                className="text-blue-600"
                              />
                              <label htmlFor="help" className="text-sm text-gray-700">
                                Help is on the way
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="busy"
                                name="responseType"
                                value="busy"
                                checked={responseType === "busy"}
                                onChange={(e) => setResponseType(e.target.value as "help" | "busy")}
                                className="text-blue-600"
                              />
                              <label htmlFor="busy" className="text-sm text-gray-700">
                                Too busy to send help
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Conditional Fields for Help Response */}
                        {responseType === "help" && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Number of Attendants Sending
                              </label>
                              <Select value={attendantsOffered} onValueChange={setAttendantsOffered}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select number" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">1 attendant</SelectItem>
                                  <SelectItem value="2">2 attendants</SelectItem>
                                  <SelectItem value="3">3 attendants</SelectItem>
                                  <SelectItem value="4">4 attendants</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>


                          </>
                        )}

                        {/* Optional Message */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Additional Message (Optional)
                          </label>
                          <Textarea
                            placeholder="Type any additional details..."
                            value={responseMessage}
                            onChange={(e) => setResponseMessage(e.target.value)}
                            rows={2}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            size="sm"
                            onClick={() => handleSubmitResponse(request.id)}
                            disabled={createResponseMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {createResponseMutation.isPending ? "Sending..." : "Send Response"}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedRequestId(null);
                              setResponseMessage("");
                              setRespondingLocation("");
                              setAttendantsOffered("");
                              setResponseType("help");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedRequestId(request.id)}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        Respond to {request.requestingLocation}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}