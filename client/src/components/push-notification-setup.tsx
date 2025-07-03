import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Smartphone } from 'lucide-react';
import { pushNotificationService } from '@/lib/push-notifications';
import { useToast } from '@/hooks/use-toast';

export function PushNotificationSetup() {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    checkSupport();
  }, []);

  const checkSupport = async () => {
    try {
      const supported = await pushNotificationService.isSupported();
      setIsSupported(supported);
      
      if (supported) {
        const currentPermission = await pushNotificationService.getPermissionStatus();
        setPermission(currentPermission);
        
        const subscription = await pushNotificationService.getSubscription();
        setIsSubscribed(!!subscription);
      }
    } catch (error) {
      console.error('Error checking notification support:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const subscription = await pushNotificationService.subscribe();
      if (subscription) {
        await pushNotificationService.sendSubscriptionToServer(subscription);
        setIsSubscribed(true);
        setPermission('granted');
        
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive help request notifications on this device",
        });
      }
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      toast({
        title: "Subscription Failed",
        description: error instanceof Error ? error.message : "Failed to enable notifications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    try {
      const subscription = await pushNotificationService.getSubscription();
      if (subscription) {
        await pushNotificationService.removeSubscriptionFromServer(subscription);
        await pushNotificationService.unsubscribe();
        setIsSubscribed(false);
        
        toast({
          title: "Notifications Disabled",
          description: "You'll no longer receive push notifications on this device",
        });
      }
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error);
      toast({
        title: "Unsubscribe Failed",
        description: "Failed to disable notifications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testNotification = () => {
    if (permission === 'granted') {
      pushNotificationService.showLocalNotification(
        'Test Notification',
        'This is a test notification to verify everything is working!',
        '/icon-192x192.png'
      );
    }
  };

  if (!isSupported) {
    return (
      <Card className="border-blue-200 shadow-md">
        <CardHeader className="bg-blue-50 border-b border-blue-200">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <BellOff className="w-5 h-5" />
            Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            Push notifications are not supported in this browser.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 shadow-md">
      <CardHeader className="bg-blue-50 border-b border-blue-200">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Smartphone className="w-5 h-5" />
          Push Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <Badge variant={isSubscribed ? "default" : "secondary"}>
            {isSubscribed ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Permission:</span>
          <Badge variant={permission === 'granted' ? "default" : permission === 'denied' ? "destructive" : "secondary"}>
            {permission.charAt(0).toUpperCase() + permission.slice(1)}
          </Badge>
        </div>

        <div className="space-y-2">
          {!isSubscribed ? (
            <Button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full"
            >
              <Bell className="w-4 h-4 mr-2" />
              {isLoading ? 'Enabling...' : 'Enable Notifications'}
            </Button>
          ) : (
            <div className="space-y-2">
              <Button
                onClick={handleUnsubscribe}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                <BellOff className="w-4 h-4 mr-2" />
                {isLoading ? 'Disabling...' : 'Disable Notifications'}
              </Button>
              
              <Button
                onClick={testNotification}
                variant="secondary"
                className="w-full"
              >
                Test Notification
              </Button>
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          <p>• Get instant notifications when help requests are submitted</p>
          <p>• Works even when the app is closed</p>
          <p>• Perfect for iPad and mobile devices</p>
        </div>
      </CardContent>
    </Card>
  );
}