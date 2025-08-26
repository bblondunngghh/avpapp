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
import houseIcon from "@assets/House-3--Streamline-Ultimate.png";
import newspaperIcon from "@assets/Newspaper--Streamline-Ultimate.png";
import checkCircleIcon from "@assets/Check-Circle-1--Streamline-Ultimate.png";
import pinLocationIcon from "@assets/Pin-Location-1--Streamline-Ultimate.png";
import calendarWarningIcon from "@assets/Calendar-Warning--Streamline-Ultimate.png";
import paperWriteIcon from "@assets/Paper-Write--Streamline-Ultimate.png";
import eyeIcon from "@assets/Glasses-Sun-Circle--Streamline-Ultimate.png";
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
  const { data: permits = [], isLoading } = useQuery({
    queryKey: ['/api/permits'],
    queryFn: async () => {
      const res = await fetch('/api/permits');
      if (!res.ok) {
        throw new Error('Failed to fetch permits');
      }
      return await res.json();
    },
  });

  const updatePermitMutation = useMutation({
    mutationFn: async ({ id, permitData }: { id: number; permitData: any }) => {
      const res = await apiRequest("PUT", `/api/permits/${id}`, permitData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permits'] });
      toast({
        title: "Permit updated",
        description: "The permit has been successfully updated and synced across all devices.",
      });
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
  const [viewingPDF, setViewingPDF] = useState<string | null>(null);
  const [isPDFViewerOpen, setIsPDFViewerOpen] = useState(false);
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

  const handleSavePermit = async () => {
    if (editingPermit) {
      let pdfData = editingPermit.pdfData;
      let pdfFileName = editingPermit.pdfFileName;

      // Convert selected file to base64 if there's a new file
      if (selectedFile) {
        try {
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              // Remove the data URL prefix to get just the base64 data
              const base64 = result.split(',')[1];
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(selectedFile);
          });
          
          pdfData = base64Data;
          pdfFileName = selectedFile.name;
        } catch (error) {
          toast({
            title: "Error processing file",
            description: "Failed to upload PDF file.",
            variant: "destructive",
          });
          return;
        }
      }

      const permitData = {
        name: editingPermit.name,
        type: editingPermit.type,
        status: editingPermit.status,
        permitNumber: editingPermit.permitNumber,
        issueDate: editingPermit.issueDate,
        expirationDate: editingPermit.expirationDate,
        location: editingPermit.location,
        pdfFileName,
        pdfData
      };

      updatePermitMutation.mutate({ 
        id: editingPermit.id, 
        permitData 
      });
      
      setIsEditDialogOpen(false);
      setEditingPermit(null);
      setSelectedFile(null);
    }
  };

  const handleViewPDF = (permit: any) => {
    if (permit.pdfData) {
      try {
        // Use data URL approach which Chrome allows
        const dataUrl = `data:application/pdf;base64,${permit.pdfData}`;
        setViewingPDF(dataUrl);
        setIsPDFViewerOpen(true);
      } catch (error) {
        toast({
          title: "Error viewing PDF",
          description: "Unable to open the PDF file.",
          variant: "destructive",
        });
      }
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
        return 'text-green-100 bg-green-600/30';
      case 'expiring':
        return 'text-amber-100 bg-amber-600/30';
      case 'expired':
        return 'text-red-100 bg-red-600/30';
      default:
        return 'text-gray-100 bg-gray-600/30';
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
    <>
      <div className="app-gradient-fixed"></div>
      <div className="min-h-screen-safe max-w-6xl mx-auto px-4 py-6 relative z-10">
      <Button
        variant="ghost"
        className="mb-6 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20"
        onClick={() => navigate("/")}
      >
        <img src={houseIcon} alt="House" className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl text-white">Company Permits & Licenses</h1>
        <p className="text-blue-200 mt-1">View all active permits and licensing documentation</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-slate-800/50 backdrop-blur-xl border border-slate-600/50 rounded-lg shadow-xl text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-200">Total Permits</p>
                <p className="text-2xl font-semibold text-white">{permits.length}</p>
              </div>
              <img src={newspaperIcon} alt="Newspaper" className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-xl border border-slate-600/50 rounded-lg shadow-xl text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-200">Active</p>
                <p className="text-2xl font-semibold text-green-400">
                  {permits.filter(p => p.status === 'Active').length}
                </p>
              </div>
              <img src={checkCircleIcon} alt="Check Circle" className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-xl border border-slate-600/50 rounded-lg shadow-xl text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-200">Locations</p>
                <p className="text-2xl font-semibold text-white">4</p>
              </div>
              <img src={pinLocationIcon} alt="Pin Location" className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-xl border border-slate-600/50 rounded-lg shadow-xl text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-200">Expiring Soon</p>
                <p className="text-2xl font-semibold text-amber-400">{getExpiringSoonCount()}</p>
              </div>
              <img src={calendarWarningIcon} alt="Calendar Warning" className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Permits List */}
      <Card className="bg-slate-800/50 backdrop-blur-xl border border-slate-600/50 rounded-lg shadow-xl text-white">
        <CardHeader>
          <CardTitle className="text-white">Permit Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {permits.map((permit) => (
              <div key={permit.id} className="border border-white/20 rounded-lg p-4 hover:shadow-md transition-shadow bg-white/5 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{permit.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(permit.status)}`}>
                        {permit.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-blue-200">
                      <div>
                        <span className="font-medium text-white">Type:</span> {permit.type}
                      </div>
                      <div>
                        <span className="font-medium text-white">Location:</span> {permit.location}
                      </div>
                      <div>
                        <span className="font-medium text-white">Permit #:</span> {permit.permitNumber}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-sm text-blue-200">
                      <div className="mb-1">
                        <span className="font-medium text-white">Issued:</span> {formatDate(permit.issueDate)}
                      </div>
                      <div>
                        <span className="font-medium text-white">Expires:</span> {formatDate(permit.expirationDate)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditPermit(permit)}
                        className="flex items-center gap-1 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border-white/20"
                      >
                        <img src={paperWriteIcon} alt="Paper Write" className="h-3 w-3" />
                        Edit
                      </Button>
                      {permit.pdfData && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewPDF(permit)}
                          className="flex items-center gap-1 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border-white/20"
                        >
                          <img src={eyeIcon} alt="Eye" className="h-3 w-3" />
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
        <DialogContent className="max-w-2xl bg-gradient-to-r from-[#2a2a2a] via-blue-900 to-indigo-900 border-[#3a3a3a] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Permit</DialogTitle>
            <DialogDescription className="text-blue-200">
              Update permit information and upload a PDF document.
            </DialogDescription>
          </DialogHeader>
          
          {editingPermit && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="permitName" className="text-white">Permit Name</Label>
                <Input
                  id="permitName"
                  value={editingPermit.name}
                  onChange={(e) => setEditingPermit({...editingPermit, name: e.target.value})}
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="permitType" className="text-white">Type</Label>
                <Input
                  id="permitType"
                  value={editingPermit.type}
                  onChange={(e) => setEditingPermit({...editingPermit, type: e.target.value})}
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="permitNumber" className="text-white">Permit Number</Label>
                <Input
                  id="permitNumber"
                  value={editingPermit.permitNumber}
                  onChange={(e) => setEditingPermit({...editingPermit, permitNumber: e.target.value})}
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status" className="text-white">Status</Label>
                <Select 
                  value={editingPermit.status} 
                  onValueChange={(value) => setEditingPermit({...editingPermit, status: value})}
                >
                  <SelectTrigger className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
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
                <Label htmlFor="issueDate" className="text-white">Issue Date</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={editingPermit.issueDate}
                  onChange={(e) => setEditingPermit({...editingPermit, issueDate: e.target.value})}
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expirationDate" className="text-white">Expiration Date</Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={editingPermit.expirationDate}
                  onChange={(e) => setEditingPermit({...editingPermit, expirationDate: e.target.value})}
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="location" className="text-white">Location</Label>
                <Select 
                  value={editingPermit.location} 
                  onValueChange={(value) => setEditingPermit({...editingPermit, location: value})}
                >
                  <SelectTrigger className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
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
                <Label htmlFor="pdfUpload" className="text-white">Upload PDF Document</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="pdfUpload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="flex-1 bg-white/10 backdrop-blur-sm border-white/20 text-white"
                  />
                  {selectedFile && (
                    <div className="flex items-center gap-1 text-sm text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      {selectedFile.name}
                    </div>
                  )}
                </div>
                {editingPermit.pdfUrl && !selectedFile && (
                  <div className="text-sm text-blue-200">
                    Current PDF: Available for viewing
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border-white/20">
              Cancel
            </Button>
            <Button onClick={handleSavePermit} className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="max-w-md bg-gradient-to-r from-[#2a2a2a] via-blue-900 to-indigo-900 border-[#3a3a3a] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Enter Password</DialogTitle>
            <DialogDescription className="text-blue-200">
              This action requires authorization. Please enter the password to edit permits.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                placeholder="Enter password..."
                autoFocus
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-blue-200"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsPasswordDialogOpen(false);
              setPassword("");
              setPendingEditPermit(null);
            }} className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border-white/20">
              Cancel
            </Button>
            <Button onClick={handlePasswordSubmit} className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20">
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Viewer Modal */}
      <Dialog open={isPDFViewerOpen} onOpenChange={setIsPDFViewerOpen}>
        <DialogContent className="max-w-6xl w-full h-[90vh] p-6 bg-gradient-to-r from-[#2a2a2a] via-blue-900 to-indigo-900 border-[#3a3a3a] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">View PDF Document</DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-full">
            {viewingPDF && (
              <div className="w-full h-full flex flex-col">
                <div className="mb-4 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                  <p className="text-sm text-blue-200 mb-2">
                    If the PDF doesn't display below, you can download it directly:
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = viewingPDF;
                      link.download = 'permit-document.pdf';
                      link.click();
                    }}
                    className="flex items-center gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border-white/20"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
                <embed
                  src={viewingPDF}
                  type="application/pdf"
                  className="w-full flex-1 border rounded-lg"
                  title="PDF Viewer"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => {
              setIsPDFViewerOpen(false);
              setViewingPDF(null);
            }} className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
}