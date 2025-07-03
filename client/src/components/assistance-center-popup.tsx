import { useState, useEffect } from 'react';
import { X, HelpCircle, Users, Phone, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const POPUP_STORAGE_KEY = 'assistance-center-popup-dismissed';
const POPUP_LAUNCH_DATE = new Date('2025-01-03'); // January 3, 2025
const POPUP_DURATION_DAYS = 5;

export function AssistanceCenterPopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkPopupVisibility = () => {
      // Check if user has already dismissed the popup
      const dismissedDate = localStorage.getItem(POPUP_STORAGE_KEY);
      if (dismissedDate) {
        return false;
      }

      // Check if we're within the 5-day display window
      const now = new Date();
      const endDate = new Date(POPUP_LAUNCH_DATE);
      endDate.setDate(endDate.getDate() + POPUP_DURATION_DAYS);

      return now >= POPUP_LAUNCH_DATE && now <= endDate;
    };

    setIsVisible(checkPopupVisibility());
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(POPUP_STORAGE_KEY, new Date().toISOString());
  };

  const handleGoToAssistanceCenter = () => {
    handleDismiss();
    window.location.href = '/help-requests';
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg mx-auto shadow-2xl border-2 border-blue-200">
        <CardHeader className="relative pb-4">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 h-8 w-8 p-0"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-2 rounded-full">
              <HelpCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-blue-900">
                🎉 NEW: Assistance Center Now Live!
              </CardTitle>
              <CardDescription className="text-blue-700">
                Get help from other locations instantly
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              How to Use the Assistance Center:
            </h3>
            
            <div className="space-y-3 text-sm text-blue-800">
              <div className="flex items-start gap-3">
                <div className="bg-blue-200 text-blue-900 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">
                  1
                </div>
                <div>
                  <strong>Request Help:</strong> Tap "Request Help" when you need valet assistance from other locations
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-blue-200 text-blue-900 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">
                  2
                </div>
                <div>
                  <strong>Get Notified:</strong> Other locations receive instant notifications on their devices
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-blue-200 text-blue-900 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">
                  3
                </div>
                <div>
                  <strong>Quick Response:</strong> Receive confirmations when help is on the way
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-700 font-medium mb-1">
                <Phone className="h-4 w-4" />
                Instant Alerts
              </div>
              <p className="text-green-600 text-xs">
                Loud notification sounds ensure requests are heard immediately
              </p>
            </div>
            
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 text-purple-700 font-medium mb-1">
                <Clock className="h-4 w-4" />
                24/7 Available
              </div>
              <p className="text-purple-600 text-xs">
                Request assistance any time during operating hours
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              onClick={handleGoToAssistanceCenter}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Try Assistance Center
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleDismiss}
              className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Got It
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 text-center pt-2">
            This notification will be shown for 5 days to ensure all team members are informed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}