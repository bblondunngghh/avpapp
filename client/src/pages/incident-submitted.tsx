import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, HomeIcon } from "lucide-react";
import houseIcon from "@assets/House-3--Streamline-Ultimate.png";

export default function IncidentSubmitted() {
  const [, navigate] = useLocation();
  
  // Redirect to home after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/");
    }, 10000);
    
    return () => clearTimeout(timer);
  }, [navigate]);
  
  return (
    <div className="max-w-md mx-auto px-4 py-16 flex items-center justify-center min-h-[80vh]">
      <Card className="w-full">
        <CardContent className="pt-6 pb-8 px-6 text-center">
          <div className="mb-6">
            <div className="bg-green-50 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-medium text-gray-900 mb-2">Report Submitted</h1>
          
          <p className="text-gray-600 mb-6">
            Your incident report has been successfully submitted. Our team will review it and contact you shortly.
          </p>
          
          <Button 
            onClick={() => navigate("/")}
            className="w-full"
          >
            <img src={houseIcon} alt="House" className="h-4 w-4 mr-2" />
            Return to Dashboard
          </Button>
          
          <p className="text-xs text-gray-500 mt-4">
            You will be redirected to the dashboard in a few seconds...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}