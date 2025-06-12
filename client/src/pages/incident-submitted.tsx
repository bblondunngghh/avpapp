import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Phone, Mail, MapPin, Home } from "lucide-react";
import houseIcon from "@assets/House-3--Streamline-Ultimate.png";

export default function IncidentSubmitted() {
  const [, navigate] = useLocation();
  
  // Get claim number from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const claimNumber = urlParams.get('claimNumber');

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-green-100 p-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Incident Report Submitted Successfully
        </h1>
        
        <p className="text-lg text-gray-600 mb-6">
          Thank you for submitting your incident report. We have received your information and will be in contact with you soon.
        </p>
      </div>

      {claimNumber && (
        <Card className="mb-8 border-orange-200 bg-orange-50">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold text-orange-800 mb-2">
              Your Claim Number
            </h2>
            <div className="text-3xl font-bold text-orange-600 mb-4 tracking-wider">
              {claimNumber}
            </div>
            <p className="text-orange-700">
              Please save this claim number for your records. You will need it for any future correspondence.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            What Happens Next?
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Review Process</h3>
                <p className="text-gray-600">Our team will review your incident report within 24 hours.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Contact</h3>
                <p className="text-gray-600">We will contact you directly to discuss next steps and any additional information needed.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Resolution</h3>
                <p className="text-gray-600">We will work with you to resolve this matter promptly and professionally.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Contact Information
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-orange-600" />
              <div>
                <span className="font-medium text-gray-900">Phone:</span>
                <span className="ml-2 text-gray-700">512-934-4859</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-orange-600" />
              <div>
                <span className="font-medium text-gray-900">Email:</span>
                <span className="ml-2 text-gray-700">ryan@accessvaletparking.com</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-orange-600" />
              <div>
                <span className="font-medium text-gray-900">Location:</span>
                <span className="ml-2 text-gray-700">Austin, Texas</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>Note:</strong> A confirmation email has been sent to the email address you provided. 
              If you have any questions or concerns, please don't hesitate to contact us using the information above.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button 
          onClick={() => navigate("/")}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          <img src={houseIcon} alt="Home" className="h-4 w-4 mr-2" />
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
}