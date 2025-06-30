import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  
  const [requestType, setRequestType] = useState("");
  const [requestingLocation, setRequestingLocation] = useState("");
  const [description, setDescription] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);

  // Fetch active help requests
  const { data: helpRequests = [], isLoading } = useQuery<HelpRequest[]>({
    queryKey: ["/api/help-requests/active"],
  });

  // Create help request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (data: { requestingLocation: string; requestType: string; description: string }) => {
      return apiRequest("/api/help-requests", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Help Request Sent",
        description: "Your request has been sent to all locations. Someone will respond soon.",
      });
      setRequestType("");
      setRequestingLocation("");
      setDescription("");
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
    mutationFn: async (data: { helpRequestId: number; respondingLocation: string; message: string }) => {
      return apiRequest("/api/help-requests/respond", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Response Sent",
        description: "Your response has been sent successfully.",
      });
      setResponseMessage("");
      setSelectedRequestId(null);
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
    if (!requestingLocation || !requestType || !description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields before submitting.",
        variant: "destructive",
      });
      return;
    }

    createRequestMutation.mutate({
      requestingLocation,
      requestType,
      description: description.trim(),
    });
  };

  const handleSubmitResponse = (requestId: number) => {
    if (!responseMessage.trim()) {
      toast({
        title: "Missing Message",
        description: "Please enter a response message.",
        variant: "destructive",
      });
      return;
    }

    const respondingLocation = prompt("Enter your location name:");
    if (!respondingLocation) {
      toast({
        title: "Missing Location",
        description: "Please specify which location you're responding from.",
        variant: "destructive",
      });
      return;
    }

    createResponseMutation.mutate({
      helpRequestId: requestId,
      respondingLocation: respondingLocation.trim(),
      message: responseMessage.trim(),
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
                  <SelectItem value="Bob's Steak & Chop House">Bob's Steak & Chop House</SelectItem>
                  <SelectItem value="Truluck's">Truluck's</SelectItem>
                  <SelectItem value="BOA Steakhouse">BOA Steakhouse</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="request-type">Type of Help Needed</Label>
              <Select value={requestType} onValueChange={setRequestType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select help type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Staff Coverage">Need Staff Coverage</SelectItem>
                  <SelectItem value="Equipment Issue">Equipment Issue</SelectItem>
                  <SelectItem value="Training Support">Training Support</SelectItem>
                  <SelectItem value="Emergency Assistance">Emergency Assistance</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what help you need..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
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
                        <h3 className="font-semibold text-gray-900">{request.requestingLocation}</h3>
                        <p className="text-sm text-orange-600 font-medium">{request.requestType}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(request.requestedAt).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{request.description}</p>
                    
                    {selectedRequestId === request.id ? (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Type your response..."
                          value={responseMessage}
                          onChange={(e) => setResponseMessage(e.target.value)}
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button 
                            size="sm"
                            onClick={() => handleSubmitResponse(request.id)}
                            disabled={createResponseMutation.isPending}
                          >
                            {createResponseMutation.isPending ? "Sending..." : "Send Response"}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedRequestId(null);
                              setResponseMessage("");
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
                        Respond to Request
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