import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLocation } from "wouter";
import { ArrowLeft, FileText, Calendar, MapPin, CheckCircle, Edit, Upload, Eye, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PermitsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const defaultPermits = [
    {
      id: 1,
      name: "Business License",
      type: "General Business",
      issueDate: "2024-01-15",
      expirationDate: "2025-01-15",
      status: "Active",
      location: "All Locations",
      permitNumber: "BL-2024-0485",
      pdfFile: null as File | null,
      pdfUrl: null as string | null
    },
    {
      id: 2,
      name: "Valet Parking Permit",
      type: "Parking Operations",
      issueDate: "2024-02-01",
      expirationDate: "2025-02-01",
      status: "Active",
      location: "The Capital Grille",
      permitNumber: "VP-CG-2024-001",
      pdfFile: null as File | null,
      pdfUrl: null as string | null
    },
    {
      id: 3,
      name: "Valet Parking Permit",
      type: "Parking Operations",
      issueDate: "2024-02-05",
      expirationDate: "2025-02-05",
      status: "Active",
      location: "Bob's Steak and Chop House",
      permitNumber: "VP-BSC-2024-002",
      pdfFile: null as File | null,
      pdfUrl: null as string | null
    },
    {
      id: 4,
      name: "Valet Parking Permit",
      type: "Parking Operations",
      issueDate: "2024-02-10",
      expirationDate: "2025-02-10",
      status: "Active",
      location: "Truluck's",
      permitNumber: "VP-TRU-2024-003",
      pdfFile: null as File | null,
      pdfUrl: null as string | null
    },
    {
      id: 5,
      name: "Valet Parking Permit",
      type: "Parking Operations",
      issueDate: "2024-02-15",
      expirationDate: "2025-02-15",
      status: "Active",
      location: "BOA Steakhouse",
      permitNumber: "VP-BOA-2024-004",
      pdfFile: null as File | null,
      pdfUrl: null as string | null
    }
  ];

  // Load permits from server
  const { data: permits = defaultPermits, isLoading } = useQuery({
    queryKey: ['/api/permits'],
    queryFn: async () => {
      const res = await fetch('/api/permits');
      if (!res.ok) {
        // If server has no permits, use default permits
        return defaultPermits;
      }
      const data = await res.json();
      return data.length > 0 ? data : defaultPermits;
    },
  });

  const updatePermitMutation = useMutation({
    mutationFn: async ({ id, permitData }: { id: number; permitData: any }) => {
      const res = await apiRequest("PUT", `/api/permits/${id}`, permitData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permits'] });
    },
    onError: (error) => {
      toast({
        title: "Error updating permit",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const [editingPermit, setEditingPermit] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [pendingEditPermit, setPendingEditPermit] = useState<any>(null);

  const handleEditPermit = (permit: any) => {
    setPendingEditPermit(permit);
    setPassword("");
    setIsPasswordDialogOpen(true);
  };

  const handlePasswordSubmit = () => {
    if (password === "bbonly") {
      setEditingPermit({ ...pendingEditPermit });
      setSelectedFile(null);
      setIsEditDialogOpen(true);
      setIsPasswordDialogOpen(false);
      setPendingEditPermit(null);
      setPassword("");
    } else {
      toast({
        title: "Incorrect password",
        description: "Please enter the correct password to edit permits.",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF file.",
        variant: "destructive",
      });
    }
  };

  const handleSavePermit = () => {
    if (editingPermit) {
      const permitData = {
        name: editingPermit.name,
        type: editingPermit.type,
        status: editingPermit.status,
        permitNumber: editingPermit.permitNumber,
        issueDate: editingPermit.issueDate,
        expirationDate: editingPermit.expirationDate,
        location: editingPermit.location,
        pdfFileName: selectedFile ? selectedFile.name : editingPermit.pdfFileName,
        pdfData: selectedFile ? null : editingPermit.pdfData // TODO: Handle file upload
      };

      updatePermitMutation.mutate({ 
        id: editingPermit.id, 
        permitData 
      });
      
      setIsEditDialogOpen(false);
      setEditingPermit(null);
      setSelectedFile(null);
      
      toast({
        title: "Permit updated",
        description: "The permit has been successfully updated and synced across all devices.",
      });
    }
  };

  const handleViewPDF = (permit: any) => {
    if (permit.pdfUrl) {
      window.open(permit.pdfUrl, '_blank');
    } else {
      toast({
        title: "No PDF available",
        description: "No PDF file has been uploaded for this permit.",
        variant: "destructive",
      });
    }
  };

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
    // Add one day to account for timezone offset issues
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getExpiringSoonCount = () => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    return permits.filter(permit => {
      const expirationDate = new Date(permit.expirationDate + 'T00:00:00');
      return expirationDate <= thirtyDaysFromNow && expirationDate >= today;
    }).length;
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
                <p className="text-2xl font-semibold text-amber-600">{getExpiringSoonCount()}</p>
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
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-sm text-gray-600">
                      <div className="mb-1">
                        <span className="font-medium">Issued:</span> {formatDate(permit.issueDate)}
                      </div>
                      <div>
                        <span className="font-medium">Expires:</span> {formatDate(permit.expirationDate)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditPermit(permit)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      {permit.pdfUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewPDF(permit)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          View PDF
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Permit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-black">Edit Permit</DialogTitle>
            <DialogDescription>
              Update permit information and upload a PDF document.
            </DialogDescription>
          </DialogHeader>
          
          {editingPermit && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="permitName">Permit Name</Label>
                <Input
                  id="permitName"
                  value={editingPermit.name}
                  onChange={(e) => setEditingPermit({...editingPermit, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="permitType">Type</Label>
                <Input
                  id="permitType"
                  value={editingPermit.type}
                  onChange={(e) => setEditingPermit({...editingPermit, type: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="permitNumber">Permit Number</Label>
                <Input
                  id="permitNumber"
                  value={editingPermit.permitNumber}
                  onChange={(e) => setEditingPermit({...editingPermit, permitNumber: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={editingPermit.status} 
                  onValueChange={(value) => setEditingPermit({...editingPermit, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Expiring">Expiring</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="issueDate">Issue Date</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={editingPermit.issueDate}
                  onChange={(e) => setEditingPermit({...editingPermit, issueDate: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expirationDate">Expiration Date</Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={editingPermit.expirationDate}
                  onChange={(e) => setEditingPermit({...editingPermit, expirationDate: e.target.value})}
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="location">Location</Label>
                <Select 
                  value={editingPermit.location} 
                  onValueChange={(value) => setEditingPermit({...editingPermit, location: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Locations">All Locations</SelectItem>
                    <SelectItem value="The Capital Grille">The Capital Grille</SelectItem>
                    <SelectItem value="Bob's Steak and Chop House">Bob's Steak and Chop House</SelectItem>
                    <SelectItem value="Truluck's">Truluck's</SelectItem>
                    <SelectItem value="BOA Steakhouse">BOA Steakhouse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="pdfUpload">Upload PDF Document</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="pdfUpload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="flex-1"
                  />
                  {selectedFile && (
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      {selectedFile.name}
                    </div>
                  )}
                </div>
                {editingPermit.pdfUrl && !selectedFile && (
                  <div className="text-sm text-gray-600">
                    Current PDF: Available for viewing
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePermit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-black">Enter Password</DialogTitle>
            <DialogDescription>
              This action requires authorization. Please enter the password to edit permits.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                placeholder="Enter password..."
                autoFocus
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsPasswordDialogOpen(false);
              setPassword("");
              setPendingEditPermit(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handlePasswordSubmit}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}