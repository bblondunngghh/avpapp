import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import houseIcon from "@assets/House-3--Streamline-Ultimate.png";
import avpLogo from "@assets/AVPLOGO PROPER3_1750780386225.png";
import jsPDF from 'jspdf';

interface ContractData {
  businessName: string;
  businessEntityType: string;
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessZip: string;
  contactName: string;
  contactTitle: string;
  startDate: string;
  endDate: string;
  parkingRate: string;
  managementFee: string;
  hoursOfOperation: string;
  daysOfWeek: string[];
  paymentTerms: string;
  terminationNotice: string;
  specialTerms: string;
}

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
  { id: 'sunday', label: 'Sunday' }
];

export default function Contracts() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const [contractData, setContractData] = useState<ContractData>({
    businessName: '',
    businessEntityType: 'corporation',
    businessAddress: '',
    businessCity: '',
    businessState: 'TX',
    businessZip: '',
    contactName: '',
    contactTitle: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    parkingRate: '15.00',
    managementFee: '800.00',
    hoursOfOperation: '',
    daysOfWeek: [],
    paymentTerms: '7',
    terminationNotice: '30',
    specialTerms: ''
  });

  const handleInputChange = (field: keyof ContractData, value: string) => {
    setContractData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDayToggle = (dayId: string) => {
    setContractData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(dayId)
        ? prev.daysOfWeek.filter(d => d !== dayId)
        : [...prev.daysOfWeek, dayId]
    }));
  };

  const generateEndDate = () => {
    if (contractData.startDate) {
      const startDate = new Date(contractData.startDate);
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1); // Set to 1 year from start date
      
      handleInputChange('endDate', endDate.toISOString().split('T')[0]);
    }
  };

  const generateContract = async () => {
    if (!contractData.businessName || !contractData.businessAddress || !contractData.contactName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (Business Name, Address, Contact Name)",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      };

      const daysText = contractData.daysOfWeek.length > 0 
        ? contractData.daysOfWeek.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', ')
        : 'As specified by client';

      // Create PDF
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = 20;

      // Load and add logo
      const logoImg = new Image();
      logoImg.onload = () => {
        // Add logo at the top center
        const logoSize = 40;
        const logoX = (pageWidth - logoSize) / 2;
        pdf.addImage(logoImg, 'PNG', logoX, yPosition, logoSize, logoSize);
        yPosition += logoSize + 15;

        // Title
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('ACCESS VALET PARKING – SERVICE AGREEMENT', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 20;

        pdf.setFontSize(14);
        pdf.text('VALET SERVICES CONTRACT', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 15;

        // Contract content
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        const addText = (text: string, isBold: boolean = false) => {
          pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
          const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
          
          // Check if we need a new page
          if (yPosition + (lines.length * 5) > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          
          pdf.text(lines, margin, yPosition);
          yPosition += lines.length * 5 + 3;
        };

        addText(`This Valet Services Contract ("Contract") is entered into on ${formatDate(contractData.startDate)}, by and between:`);
        yPosition += 3;

        addText(`${contractData.businessName}, a ${contractData.businessEntityType} with its principal place of business located at ${contractData.businessAddress}, ${contractData.businessCity}, ${contractData.businessState} ${contractData.businessZip} ("Client"), and`);
        yPosition += 3;

        addText(`Access Valet Parking LLC, a Texas Limited Liability Company with its principal place of business located at 14910 Hartsmith Dr., Austin, TX 78725 ("Service Provider").`);
        yPosition += 8;

        addText('RECITALS', true);
        addText('WHEREAS, Client operates a business that requires valet parking services for its customers;');
        addText('WHEREAS, Service Provider is engaged in the business of providing valet parking services;');
        addText('WHEREAS, Client desires to engage Service Provider to provide valet parking services and Service Provider agrees to provide such services under the terms and conditions set forth herein;');
        yPosition += 5;

        addText('NOW, THEREFORE, in consideration of the mutual promises and agreements contained herein, the parties agree as follows:');
        yPosition += 8;

        addText('1. SCOPE OF SERVICES', true);
        addText(`Service Provider shall provide valet parking services ("Services") for the customers of Client at the premises of ${contractData.businessName}, located at ${contractData.businessAddress}, ${contractData.businessCity}, ${contractData.businessState} ${contractData.businessZip}. The Services shall include, but not be limited to, parking and retrieving customer vehicles in a safe, efficient, and professional manner.`);
        yPosition += 5;

        addText('2. HOURS OF OPERATION', true);
        addText(`Valet services will be provided during the following hours: ${contractData.hoursOfOperation || 'As agreed upon by both parties'}`);
        addText(`Days of operation: ${daysText}`);
        yPosition += 5;

        addText('3. TERM', true);
        addText(`This Contract shall commence on ${formatDate(contractData.startDate)}, and shall continue until ${contractData.endDate ? formatDate(contractData.endDate) : '[END DATE]'} unless terminated earlier in accordance with the provisions of this Contract. Upon expiration of the initial term, this Contract shall automatically renew for successive one-year periods unless either party provides written notice of non-renewal in accordance with the termination provisions set forth herein.`);
        yPosition += 5;

        addText('4. COMPENSATION', true);
        addText(`a. Parking Rate: Service Provider shall charge customers a parking rate of $${contractData.parkingRate} per vehicle. All parking fees collected shall be retained by Service Provider as compensation for the Services, unless otherwise agreed in writing.`);
        addText(`b. Management Fee: Client shall pay Service Provider a monthly management fee of $${contractData.managementFee} for overseeing and managing the valet parking operations. The management fee for the first month shall be due and payable by Client to Service Provider within ${contractData.paymentTerms} days of contract execution.`);
        yPosition += 5;

        addText('5. PAYMENT TERMS', true);
        addText(`The management fee shall be paid via check or electronic transfer to an account designated by Service Provider. Payment is due within ${contractData.paymentTerms} days of the invoice date. Late payments shall incur a penalty of 1.5% per month on the outstanding balance.`);
        yPosition += 5;

        addText('6. RESPONSIBILITIES OF SERVICE PROVIDER', true);
        addText('Service Provider agrees to:');
        addText('a. Provide trained, uniformed, and professional valet staff to perform the Services;');
        addText('b. Maintain adequate insurance coverage, including general liability and garage keeper\'s liability insurance, and provide proof of such coverage upon request;');
        addText('c. Ensure all vehicles are handled with care and parked in a secure manner;');
        addText('d. Comply with all applicable federal, state, and local laws and regulations.');
        yPosition += 5;

        addText('7. RESPONSIBILITIES OF CLIENT', true);
        addText('Client agrees to:');
        addText('a. Pay the management fee in a timely manner as outlined in Section 4;');
        addText('b. Notify Service Provider of any specific operational requirements or changes in advance.');
        yPosition += 5;

        addText('8. TERMINATION', true);
        addText(`Either party may terminate this Contract during the unless terminated earlier in accordance with the provisions of this Contract. Upon termination, Client shall pay Service Provider for any outstanding management fees owed up to the termination date.`);
        yPosition += 5;

        addText('9. INDEMNIFICATION', true);
        addText('Service Provider shall indemnify and hold Client harmless from any claims, damages, or liabilities arising from Service Provider\'s negligence or willful misconduct in performing the Services. Client shall indemnify and hold Service Provider harmless from any claims, damages, or liabilities arising from Client\'s premises or actions unrelated to Service Provider\'s performance of the Services.');
        yPosition += 5;

        addText('10. GOVERNING LAW', true);
        addText('This Contract shall be governed by and construed in accordance with the laws of the State of Texas. Any disputes arising under this Contract shall be resolved in a court of competent jurisdiction in Travis County, Texas.');
        yPosition += 5;

        addText('11. ENTIRE AGREEMENT', true);
        addText('This Contract constitutes the entire agreement between the parties and supersedes all prior agreements or understandings, whether written or oral. Any amendments to this Contract must be made in writing and signed by both parties.');
        yPosition += 5;

        addText('12. NOTICES', true);
        addText('Any notices required under this Contract shall be sent in writing to the respective addresses of the parties listed above via certified mail, email, or hand delivery.');
        yPosition += 5;

        if (contractData.specialTerms) {
          addText('13. SPECIAL TERMS', true);
          addText(contractData.specialTerms);
          yPosition += 5;
        }

        addText('IN WITNESS WHEREOF, the parties have executed this Contract as of the date first written above.');
        yPosition += 15;

        // Signature blocks
        addText(`${contractData.businessName}`, true);
        addText('By: _______________________________');
        addText(`Name: ${contractData.contactName}`);
        addText(`Title: ${contractData.contactTitle || '_______________________________'}`);
        addText(`Date: ${formatDate(contractData.startDate)}`);
        yPosition += 10;

        addText('Access Valet Parking', true);
        addText('By: _______________________________');
        addText('Name: Brandon Blond');
        addText('Title: Owner');
        addText(`Date: ${formatDate(contractData.startDate)}`);

        // Save PDF
        const fileName = `${contractData.businessName.replace(/[^a-zA-Z0-9]/g, '_')}_Valet_Contract.pdf`;
        pdf.save(fileName);

        setIsGenerating(false);
        
        toast({
          title: "Contract Generated",
          description: "The PDF contract has been generated and downloaded successfully.",
        });
      };

      logoImg.onerror = () => {
        // Fallback: generate PDF without logo
        console.error('Failed to load logo, generating PDF without logo');
        
        // Title without logo
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('ACCESS VALET PARKING – SERVICE AGREEMENT', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 20;

        pdf.setFontSize(14);
        pdf.text('VALET SERVICES CONTRACT', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 15;

        // Contract content
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        const addText = (text: string, isBold: boolean = false) => {
          pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
          const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
          
          // Check if we need a new page
          if (yPosition + (lines.length * 5) > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          
          pdf.text(lines, margin, yPosition);
          yPosition += lines.length * 5 + 3;
        };

        addText(`This Valet Services Contract ("Contract") is entered into on ${formatDate(contractData.startDate)}, by and between:`);
        yPosition += 3;

        addText(`${contractData.businessName}, a ${contractData.businessEntityType} with its principal place of business located at ${contractData.businessAddress}, ${contractData.businessCity}, ${contractData.businessState} ${contractData.businessZip} ("Client"), and`);
        yPosition += 3;

        addText(`Access Valet Parking LLC, a Texas Limited Liability Company with its principal place of business located at 14910 Hartsmith Dr., Austin, TX 78725 ("Service Provider").`);
        yPosition += 8;

        addText('RECITALS', true);
        addText('WHEREAS, Client operates a business that requires valet parking services for its customers;');
        addText('WHEREAS, Service Provider is engaged in the business of providing valet parking services;');
        addText('WHEREAS, Client desires to engage Service Provider to provide valet parking services and Service Provider agrees to provide such services under the terms and conditions set forth herein;');
        yPosition += 5;

        addText('NOW, THEREFORE, in consideration of the mutual promises and agreements contained herein, the parties agree as follows:');
        yPosition += 8;

        addText('1. SCOPE OF SERVICES', true);
        addText(`Service Provider shall provide valet parking services ("Services") for the customers of Client at the premises of ${contractData.businessName}, located at ${contractData.businessAddress}, ${contractData.businessCity}, ${contractData.businessState} ${contractData.businessZip}. The Services shall include, but not be limited to, parking and retrieving customer vehicles in a safe, efficient, and professional manner.`);
        yPosition += 5;

        addText('2. HOURS OF OPERATION', true);
        addText(`Valet services will be provided during the following hours: ${contractData.hoursOfOperation || 'As agreed upon by both parties'}`);
        addText(`Days of operation: ${daysText}`);
        yPosition += 5;

        addText('3. TERM', true);
        addText(`This Contract shall commence on ${formatDate(contractData.startDate)}, and shall continue until ${contractData.endDate ? formatDate(contractData.endDate) : '[END DATE]'} unless terminated earlier in accordance with the provisions of this Contract. Upon expiration of the initial term, this Contract shall automatically renew for successive one-year periods unless either party provides written notice of non-renewal in accordance with the termination provisions set forth herein.`);
        yPosition += 5;

        addText('4. COMPENSATION', true);
        addText(`a. Parking Rate: Service Provider shall charge customers a parking rate of $${contractData.parkingRate} per vehicle. All parking fees collected shall be retained by Service Provider as compensation for the Services, unless otherwise agreed in writing.`);
        addText(`b. Management Fee: Client shall pay Service Provider a monthly management fee of $${contractData.managementFee} for overseeing and managing the valet parking operations. The management fee for the first month shall be due and payable by Client to Service Provider within ${contractData.paymentTerms} days of contract execution.`);
        yPosition += 5;

        addText('5. PAYMENT TERMS', true);
        addText(`The management fee shall be paid via check or electronic transfer to an account designated by Service Provider. Payment is due within ${contractData.paymentTerms} days of the invoice date. Late payments shall incur a penalty of 1.5% per month on the outstanding balance.`);
        yPosition += 5;

        addText('6. RESPONSIBILITIES OF SERVICE PROVIDER', true);
        addText('Service Provider agrees to:');
        addText('a. Provide trained, uniformed, and professional valet staff to perform the Services;');
        addText('b. Maintain adequate insurance coverage, including general liability and garage keeper\'s liability insurance, and provide proof of such coverage upon request;');
        addText('c. Ensure all vehicles are handled with care and parked in a secure manner;');
        addText('d. Comply with all applicable federal, state, and local laws and regulations.');
        yPosition += 5;

        addText('7. RESPONSIBILITIES OF CLIENT', true);
        addText('Client agrees to:');
        addText('a. Pay the management fee in a timely manner as outlined in Section 4;');
        addText('b. Notify Service Provider of any specific operational requirements or changes in advance.');
        yPosition += 5;

        addText('8. TERMINATION', true);
        addText(`Either party may terminate this Contract during the unless terminated earlier in accordance with the provisions of this Contract. Upon termination, Client shall pay Service Provider for any outstanding management fees owed up to the termination date.`);
        yPosition += 5;

        addText('9. INDEMNIFICATION', true);
        addText('Service Provider shall indemnify and hold Client harmless from any claims, damages, or liabilities arising from Service Provider\'s negligence or willful misconduct in performing the Services. Client shall indemnify and hold Service Provider harmless from any claims, damages, or liabilities arising from Client\'s premises or actions unrelated to Service Provider\'s performance of the Services.');
        yPosition += 5;

        addText('10. GOVERNING LAW', true);
        addText('This Contract shall be governed by and construed in accordance with the laws of the State of Texas. Any disputes arising under this Contract shall be resolved in a court of competent jurisdiction in Travis County, Texas.');
        yPosition += 5;

        addText('11. ENTIRE AGREEMENT', true);
        addText('This Contract constitutes the entire agreement between the parties and supersedes all prior agreements or understandings, whether written or oral. Any amendments to this Contract must be made in writing and signed by both parties.');
        yPosition += 5;

        addText('12. NOTICES', true);
        addText('Any notices required under this Contract shall be sent in writing to the respective addresses of the parties listed above via certified mail, email, or hand delivery.');
        yPosition += 5;

        if (contractData.specialTerms) {
          addText('13. SPECIAL TERMS', true);
          addText(contractData.specialTerms);
          yPosition += 5;
        }

        addText('IN WITNESS WHEREOF, the parties have executed this Contract as of the date first written above.');
        yPosition += 15;

        // Signature blocks
        addText(`${contractData.businessName}`, true);
        addText('By: _______________________________');
        addText(`Name: ${contractData.contactName}`);
        addText(`Title: ${contractData.contactTitle || '_______________________________'}`);
        addText(`Date: ${formatDate(contractData.startDate)}`);
        yPosition += 10;

        addText('Access Valet Parking', true);
        addText('By: _______________________________');
        addText('Name: Brandon Blond');
        addText('Title: Owner');
        addText(`Date: ${formatDate(contractData.startDate)}`);
        
        // Continue with the rest of the PDF generation...
        
        const fileName = `${contractData.businessName.replace(/[^a-zA-Z0-9]/g, '_')}_Valet_Contract.pdf`;
        pdf.save(fileName);

        setIsGenerating(false);
        
        toast({
          title: "Contract Generated",
          description: "The PDF contract has been generated and downloaded successfully.",
        });
      };

      logoImg.src = avpLogo;

    } catch (error) {
      console.error('Error generating PDF:', error);
      setIsGenerating(false);
      
      toast({
        title: "Generation Failed",
        description: "There was an error generating the contract PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/admin")} 
          className="p-0 h-10 w-10 rounded-full bg-white shadow-sm hover:shadow-md mr-4"
        >
          <img src={houseIcon} alt="Back to Admin" className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Contract Generator</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Valet Parking Service Agreement</CardTitle>
          <p className="text-sm text-gray-600">
            Fill in the details below to generate a customized valet parking service contract.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Business Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={contractData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  placeholder="e.g., Parker Jazz INC"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessEntityType">Business Entity Type</Label>
                <Select value={contractData.businessEntityType} onValueChange={(value) => handleInputChange('businessEntityType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corporation">Corporation</SelectItem>
                    <SelectItem value="limited liability company">Limited Liability Company (LLC)</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                    <SelectItem value="limited partnership">Limited Partnership</SelectItem>
                    <SelectItem value="sole proprietorship">Sole Proprietorship</SelectItem>
                    <SelectItem value="professional corporation">Professional Corporation</SelectItem>
                    <SelectItem value="nonprofit corporation">Nonprofit Corporation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name *</Label>
                <Input
                  id="contactName"
                  value={contractData.contactName}
                  onChange={(e) => handleInputChange('contactName', e.target.value)}
                  placeholder="Primary contact person"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactTitle">Contact Title</Label>
                <Input
                  id="contactTitle"
                  value={contractData.contactTitle}
                  onChange={(e) => handleInputChange('contactTitle', e.target.value)}
                  placeholder="e.g., Manager, Owner"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="businessAddress">Business Address *</Label>
              <Input
                id="businessAddress"
                value={contractData.businessAddress}
                onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                placeholder="Street address"
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessCity">City</Label>
                <Input
                  id="businessCity"
                  value={contractData.businessCity}
                  onChange={(e) => handleInputChange('businessCity', e.target.value)}
                  placeholder="Austin"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessState">State</Label>
                <Select value={contractData.businessState} onValueChange={(value) => handleInputChange('businessState', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TX">Texas</SelectItem>
                    <SelectItem value="CA">California</SelectItem>
                    <SelectItem value="NY">New York</SelectItem>
                    <SelectItem value="FL">Florida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessZip">ZIP Code</Label>
                <Input
                  id="businessZip"
                  value={contractData.businessZip}
                  onChange={(e) => handleInputChange('businessZip', e.target.value)}
                  placeholder="78746"
                />
              </div>
            </div>
          </div>

          {/* Contract Terms */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Contract Terms</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={contractData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <div className="flex gap-2">
                  <Input
                    id="endDate"
                    type="date"
                    value={contractData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateEndDate}
                    className="whitespace-nowrap"
                  >
                    Auto
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Terms */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Financial Terms</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parkingRate">Parking Rate ($)</Label>
                <Input
                  id="parkingRate"
                  type="number"
                  step="0.01"
                  value={contractData.parkingRate}
                  onChange={(e) => handleInputChange('parkingRate', e.target.value)}
                  placeholder="15.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="managementFee">Monthly Management Fee ($)</Label>
                <Input
                  id="managementFee"
                  type="number"
                  step="0.01"
                  value={contractData.managementFee}
                  onChange={(e) => handleInputChange('managementFee', e.target.value)}
                  placeholder="800.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms (days)</Label>
                <Select value={contractData.paymentTerms} onValueChange={(value) => handleInputChange('paymentTerms', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Operational Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Operational Details</h3>
            <div className="space-y-2">
              <Label htmlFor="hoursOfOperation">Hours of Operation</Label>
              <Input
                id="hoursOfOperation"
                value={contractData.hoursOfOperation}
                onChange={(e) => handleInputChange('hoursOfOperation', e.target.value)}
                placeholder="e.g., 5:00 PM - 11:00 PM"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Days of Operation</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={day.id}
                      checked={contractData.daysOfWeek.includes(day.id)}
                      onCheckedChange={() => handleDayToggle(day.id)}
                    />
                    <Label htmlFor={day.id} className="text-sm">{day.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contract Termination */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Contract Termination</h3>
            <div className="space-y-2">
              <Label htmlFor="terminationNotice">Notice Period for Termination</Label>
              <Select value={contractData.terminationNotice} onValueChange={(value) => handleInputChange('terminationNotice', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days notice</SelectItem>
                  <SelectItem value="60">60 days notice</SelectItem>
                  <SelectItem value="90">90 days notice</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Number of days notice required for either party to terminate the contract.
              </p>
            </div>
          </div>

          {/* Special Terms */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Additional Terms</h3>
            <div className="space-y-2">
              <Label htmlFor="specialTerms">Special Terms (Optional)</Label>
              <Textarea
                id="specialTerms"
                value={contractData.specialTerms}
                onChange={(e) => handleInputChange('specialTerms', e.target.value)}
                placeholder="Any additional terms or conditions specific to this contract..."
                rows={4}
              />
            </div>
          </div>

          {/* Generate Button */}
          <div className="pt-6 border-t">
            <Button
              onClick={generateContract}
              disabled={isGenerating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isGenerating ? 'Generating Contract...' : 'Generate Contract'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}