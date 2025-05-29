import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft, FileText, Calendar, MapPin, CheckCircle } from "lucide-react";

export default function PermitsPage() {
  const [, navigate] = useLocation();

  const permits = [
    {
      id: 1,
      name: "Business License",
      type: "General Business",
      issueDate: "2024-01-15",
      expirationDate: "2025-01-15",
      status: "Active",
      location: "All Locations",
      permitNumber: "BL-2024-0485"
    },
    {
      id: 2,
      name: "Valet Parking Permit",
      type: "Parking Operations",
      issueDate: "2024-02-01",
      expirationDate: "2025-02-01",
      status: "Active",
      location: "The Capital Grille",
      permitNumber: "VP-CG-2024-001"
    },
    {
      id: 3,
      name: "Valet Parking Permit",
      type: "Parking Operations",
      issueDate: "2024-02-05",
      expirationDate: "2025-02-05",
      status: "Active",
      location: "Bob's Steak and Chop House",
      permitNumber: "VP-BSC-2024-002"
    },
    {
      id: 4,
      name: "Valet Parking Permit",
      type: "Parking Operations",
      issueDate: "2024-02-10",
      expirationDate: "2025-02-10",
      status: "Active",
      location: "Truluck's",
      permitNumber: "VP-TRU-2024-003"
    },
    {
      id: 5,
      name: "Valet Parking Permit",
      type: "Parking Operations",
      issueDate: "2024-02-15",
      expirationDate: "2025-02-15",
      status: "Active",
      location: "BOA Steakhouse",
      permitNumber: "VP-BOA-2024-004"
    },
    {
      id: 6,
      name: "Workers' Compensation Insurance",
      type: "Insurance",
      issueDate: "2024-01-01",
      expirationDate: "2025-01-01",
      status: "Active",
      location: "All Locations",
      permitNumber: "WC-2024-7892"
    },
    {
      id: 7,
      name: "General Liability Insurance",
      type: "Insurance",
      issueDate: "2024-01-01",
      expirationDate: "2025-01-01",
      status: "Active",
      location: "All Locations",
      permitNumber: "GL-2024-4556"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'expiring':
        return 'text-amber-600 bg-amber-100';
      case 'expired':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl text-black">Company Permits & Licenses</h1>
            <p className="text-gray-600 mt-1">View all active permits and licensing documentation</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Permits</p>
                <p className="text-2xl font-semibold">{permits.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-semibold text-green-600">
                  {permits.filter(p => p.status === 'Active').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Locations</p>
                <p className="text-2xl font-semibold">4</p>
              </div>
              <MapPin className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-semibold text-amber-600">0</p>
              </div>
              <Calendar className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Permits List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-black">Permit Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {permits.map((permit) => (
              <div key={permit.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-black">{permit.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(permit.status)}`}>
                        {permit.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Type:</span> {permit.type}
                      </div>
                      <div>
                        <span className="font-medium">Location:</span> {permit.location}
                      </div>
                      <div>
                        <span className="font-medium">Permit #:</span> {permit.permitNumber}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end text-sm text-gray-600">
                    <div className="mb-1">
                      <span className="font-medium">Issued:</span> {formatDate(permit.issueDate)}
                    </div>
                    <div>
                      <span className="font-medium">Expires:</span> {formatDate(permit.expirationDate)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}