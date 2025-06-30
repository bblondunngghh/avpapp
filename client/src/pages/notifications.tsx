import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Bell } from 'lucide-react';

interface HelpRequest {
  id: number;
  requestingLocation: string;
  requestType: string;
  description: string;
  status: string;
  requestedAt: string;
}

export default function NotificationsPage() {
  const { data: helpRequests = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/help-requests/active'],
    refetchInterval: 3000, // Check every 3 seconds
  });

  const activeRequests = helpRequests.filter((req: HelpRequest) => req.status === 'active');

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Live Notifications
          </h1>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">Loading notifications...</div>
            </CardContent>
          </Card>
        ) : activeRequests.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-gray-500">
                No active help requests at this time.
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {activeRequests.map((request: HelpRequest) => (
              <Card key={request.id} className="border-l-4 border-l-orange-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">
                      {request.requestingLocation}
                    </CardTitle>
                    <Badge variant="destructive" className="animate-pulse">
                      URGENT
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-2">{request.description}</p>
                  <div className="text-sm text-gray-500">
                    Requested: {new Date(request.requestedAt).toLocaleTimeString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">📱 Bookmark This Page</h3>
          <p className="text-blue-800 text-sm">
            Add this page to your phone's home screen for instant access to live help request notifications.
            On iPhone: Share → Add to Home Screen. On Android: Menu → Add to Home Screen.
          </p>
        </div>
      </div>
    </div>
  );
}