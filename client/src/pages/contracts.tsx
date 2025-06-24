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
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface DaySchedule {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

interface TemporaryValetData {
  location: string;
  companyName: string;
  primaryContact: string;
  phoneNumber: string;
  altPhoneNumber: string;
  mailingAddress: string;
  city: string;
  state: string;
  zip: string;
  email: string;
  blockNumber: string;
  streetName: string;
  spacesRequested: string;
  curbSide: string;
  blockEnd: string;
  payStationNumbers: string[];
  unmmeteredDescription: string;
  eventDates: string;
  fromTime: string;
  toTime: string;
  selectedDays: string[];
  valetOperatorName: string;
  valetContact: string;
  emergencyNumber: string;
  valetAltPhone: string;
  valetAddress: string;
  valetCity: string;
  valetState: string;
  valetZip: string;
  valetEmail: string;
  permitExpiration: string;
  insuranceExpiration: string;
  onPremisesParking: boolean;
  parkingFacilityAddress: string;
  parkingFacilityCity: string;
  parkingFacilityState: string;
  parkingFacilityZip: string;
  facilityType: string;
  availableSpaces: string;
  contractDate: string;
  contractExpiration: string;
  facilityContactName: string;
  facilityContactPhone: string;
  facilityContactEmail: string;
}

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
  daySchedules: Record<string, DaySchedule>;
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
  const [documentType, setDocumentType] = useState<'contract' | 'temporary-valet' | 'permanent-valet' | 'capital-grille-renewal'>('contract');

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
    daySchedules: {
      monday: { enabled: false, startTime: '17:00', endTime: '23:00' },
      tuesday: { enabled: false, startTime: '17:00', endTime: '23:00' },
      wednesday: { enabled: false, startTime: '17:00', endTime: '23:00' },
      thursday: { enabled: false, startTime: '17:00', endTime: '23:00' },
      friday: { enabled: false, startTime: '17:00', endTime: '23:00' },
      saturday: { enabled: false, startTime: '17:00', endTime: '23:00' },
      sunday: { enabled: false, startTime: '17:00', endTime: '21:00' }
    },
    paymentTerms: '7',
    terminationNotice: '30',
    specialTerms: ''
  });

  // Simple renewal form data for Capital Grille
  const [renewalData, setRenewalData] = useState({
    businessInsuranceExpiration: '',
    valetPermitExpiration: '',
    valetInsuranceExpiration: ''
  });

  // Document upload state
  const [documentUploads, setDocumentUploads] = useState([
    { category: "authorized_agent", file: null as File | null, uploaded: false },
    { category: "resolution_authority", file: null as File | null, uploaded: false },
    { category: "valet_insurance", file: null as File | null, uploaded: false },
    { category: "business_insurance", file: null as File | null, uploaded: false },
  ]);

  const [temporaryValetData, setTemporaryValetData] = useState<TemporaryValetData>({
    location: '',
    companyName: '',
    primaryContact: '',
    phoneNumber: '',
    altPhoneNumber: '',
    mailingAddress: '',
    city: 'Austin',
    state: 'TX',
    zip: '',
    email: '',
    blockNumber: '',
    streetName: '',
    spacesRequested: '',
    curbSide: '',
    blockEnd: '',
    payStationNumbers: ['', '', '', ''],
    unmmeteredDescription: '',
    eventDates: '',
    fromTime: '',
    toTime: '',
    selectedDays: [],
    valetOperatorName: 'Access Valet Parking LLC',
    valetContact: '',
    emergencyNumber: '',
    valetAltPhone: '',
    valetAddress: '14910 Hartsmith Dr.',
    valetCity: 'Austin',
    valetState: 'TX',
    valetZip: '78725',
    valetEmail: '',
    permitExpiration: '',
    insuranceExpiration: '',
    onPremisesParking: true,
    parkingFacilityAddress: '',
    parkingFacilityCity: '',
    parkingFacilityState: '',
    parkingFacilityZip: '',
    facilityType: '',
    availableSpaces: '',
    contractDate: '',
    contractExpiration: '',
    facilityContactName: '',
    facilityContactPhone: '',
    facilityContactEmail: ''
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
        : [...prev.daysOfWeek, dayId],
      daySchedules: {
        ...prev.daySchedules,
        [dayId]: {
          ...prev.daySchedules[dayId],
          enabled: !prev.daySchedules[dayId]?.enabled
        }
      }
    }));
  };

  const handleScheduleChange = (dayId: string, field: 'startTime' | 'endTime', value: string) => {
    setContractData(prev => ({
      ...prev,
      daySchedules: {
        ...prev.daySchedules,
        [dayId]: {
          ...prev.daySchedules[dayId],
          [field]: value
        }
      }
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

  const handleFileUpload = (category: string, file: File | null) => {
    setDocumentUploads(prev => prev.map(doc => 
      doc.category === category ? { ...doc, file, uploaded: false } : doc
    ));
  };

  const uploadDocument = async (category: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    try {
      const response = await fetch('/api/upload-document', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      setDocumentUploads(prev => prev.map(doc => 
        doc.category === category ? { ...doc, uploaded: true } : doc
      ));

      return result.filename;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: `Failed to upload ${getCategoryDisplayName(category)} document.`,
        variant: "destructive",
      });
      return null;
    }
  };

  const getCategoryDisplayName = (category: string) => {
    const names = {
      authorized_agent: "Authorized Agent",
      resolution_authority: "Resolution of Authority",
      valet_insurance: "Valet Certificate of Insurance",
      business_insurance: "Business Certificate of Insurance",
    };
    return names[category as keyof typeof names] || category;
  };

  const generateCapitalGrilleRenewal = async () => {
    setIsGenerating(true);
    try {
      // Validate that at least one field is filled
      if (!renewalData.businessInsuranceExpiration && !renewalData.valetPermitExpiration && !renewalData.valetInsuranceExpiration) {
        toast({
          title: "Error",
          description: "Please enter at least one expiration date",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      // Upload documents first
      const uploadedFiles = [];
      for (const doc of documentUploads) {
        if (doc.file && !doc.uploaded) {
          const filename = await uploadDocument(doc.category, doc.file);
          if (filename) {
            uploadedFiles.push({ category: doc.category, filename });
          }
        }
      }

      // Load the Capital Grille renewal PDF template
      const response = await fetch('/api/pdf-template/capital-grille-renewal');
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const existingPdfBytes = await response.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const secondPage = pages[1];

      // Add text overlays for the three editable fields with coordinates for your specific PDF
      // Page 1: Business Insurance Expiration Date (after "Insurance Expiration Date")
      if (renewalData.businessInsuranceExpiration) {
        firstPage.drawText(renewalData.businessInsuranceExpiration, {
          x: 165, // Adjusted to align properly with the blank line after "Insurance Expiration Date"
          y: 440, 
          size: 9,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
      }

      // Page 2: Valet Operator Permit Expiration (final positioning)
      if (renewalData.valetPermitExpiration && secondPage) {
        secondPage.drawText(renewalData.valetPermitExpiration, {
          x: 235, // Adjusted left position
          y: 61, // Final Y coordinate
          size: 9,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
      }

      // Page 2: Valet Operator Insurance Expiration (final positioning)
      if (renewalData.valetInsuranceExpiration && secondPage) {
        secondPage.drawText(renewalData.valetInsuranceExpiration, {
          x: 499, // Right position maintained
          y: 61, // Final Y coordinate
          size: 9,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
      }

      // Generate and download the completed PDF
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `Capital_Grille_Renewal_${new Date().getTime()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Capital Grille renewal PDF generated successfully",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateTemporaryValetPDF = async () => {
    setIsGenerating(true);
    try {
      // Load your actual PDF template
      const response = await fetch('/api/pdf-template/valet-temporary');
      
      let pdfDoc;
      if (response.ok) {
        const existingPdfBytes = await response.arrayBuffer();
        pdfDoc = await PDFDocument.load(existingPdfBytes);
      } else {
        // If server route doesn't exist, try direct file access
        try {
          const directResponse = await fetch('/attached_assets/Valet Temporary Zone Application (10)_1750782335056.pdf');
          const existingPdfBytes = await directResponse.arrayBuffer();
          pdfDoc = await PDFDocument.load(existingPdfBytes);
        } catch (directError) {
          console.log('Could not load PDF template, creating fallback');
          throw new Error('PDF template not accessible');
        }
      }

      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const secondPage = pages[1] || pdfDoc.addPage();

      // Add text overlays to the existing PDF form
      // These coordinates need to be adjusted based on your actual PDF layout
      const overlayData = [
        // Page 1 - Applicant Information
        { text: temporaryValetData.companyName, x: 150, y: 650, page: 0 },
        { text: temporaryValetData.primaryContact, x: 150, y: 620, page: 0 },
        { text: temporaryValetData.phoneNumber, x: 150, y: 590, page: 0 },
        { text: temporaryValetData.altPhoneNumber, x: 350, y: 590, page: 0 },
        { text: temporaryValetData.mailingAddress, x: 150, y: 560, page: 0 },
        { text: temporaryValetData.city, x: 250, y: 530, page: 0 },
        { text: temporaryValetData.state, x: 320, y: 530, page: 0 },
        { text: temporaryValetData.zip, x: 370, y: 530, page: 0 },
        { text: temporaryValetData.email, x: 150, y: 500, page: 0 },
        
        // Proposed Zone Information
        { text: temporaryValetData.blockNumber, x: 150, y: 420, page: 0 },
        { text: temporaryValetData.streetName, x: 250, y: 420, page: 0 },
        { text: temporaryValetData.spacesRequested, x: 450, y: 420, page: 0 },
        
        // Pay Station Numbers
        { text: temporaryValetData.payStationNumbers[0] || '', x: 150, y: 360, page: 0 },
        { text: temporaryValetData.payStationNumbers[1] || '', x: 250, y: 360, page: 0 },
        { text: temporaryValetData.payStationNumbers[2] || '', x: 350, y: 360, page: 0 },
        { text: temporaryValetData.payStationNumbers[3] || '', x: 450, y: 360, page: 0 },
        
        { text: temporaryValetData.unmmeteredDescription, x: 150, y: 330, page: 0 },
        
        // Event Time and Date
        { text: temporaryValetData.eventDates, x: 150, y: 280, page: 0 },
        { text: temporaryValetData.fromTime, x: 150, y: 250, page: 0 },
        { text: temporaryValetData.toTime, x: 250, y: 250, page: 0 },
      ];

      // Add text to the appropriate pages
      overlayData.forEach(({ text, x, y, page: pageIndex }) => {
        if (text && text.trim()) {
          const targetPage = pageIndex === 0 ? firstPage : secondPage;
          targetPage.drawText(text, {
            x,
            y,
            size: 9,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
        }
      });

      // Add valet operator information to page 2
      if (pages.length > 1 || secondPage) {
        const page2Data = [
          { text: temporaryValetData.valetOperatorName, x: 150, y: 650 },
          { text: temporaryValetData.valetContact, x: 150, y: 620 },
          { text: temporaryValetData.emergencyNumber, x: 150, y: 590 },
          { text: temporaryValetData.valetAltPhone, x: 350, y: 590 },
          { text: temporaryValetData.valetAddress, x: 150, y: 560 },
          { text: temporaryValetData.valetCity, x: 250, y: 530 },
          { text: temporaryValetData.valetState, x: 320, y: 530 },
          { text: temporaryValetData.valetZip, x: 370, y: 530 },
          { text: temporaryValetData.valetEmail, x: 150, y: 500 },
          { text: temporaryValetData.permitExpiration, x: 150, y: 470 },
          { text: temporaryValetData.insuranceExpiration, x: 350, y: 470 },
        ];

        page2Data.forEach(({ text, x, y }) => {
          if (text && text.trim()) {
            secondPage.drawText(text, {
              x,
              y,
              size: 9,
              font: helveticaFont,
              color: rgb(0, 0, 0),
            });
          }
        });

        // Vehicle storage info if not on premises
        if (!temporaryValetData.onPremisesParking) {
          const storageData = [
            { text: temporaryValetData.parkingFacilityAddress, x: 150, y: 350 },
            { text: temporaryValetData.parkingFacilityCity, x: 250, y: 320 },
            { text: temporaryValetData.parkingFacilityState, x: 320, y: 320 },
            { text: temporaryValetData.parkingFacilityZip, x: 370, y: 320 },
            { text: temporaryValetData.availableSpaces, x: 150, y: 280 },
            { text: temporaryValetData.contractDate, x: 250, y: 280 },
            { text: temporaryValetData.contractExpiration, x: 400, y: 280 },
            { text: temporaryValetData.facilityContactName, x: 150, y: 250 },
            { text: temporaryValetData.facilityContactPhone, x: 300, y: 250 },
            { text: temporaryValetData.facilityContactEmail, x: 150, y: 220 },
          ];

          storageData.forEach(({ text, x, y }) => {
            if (text && text.trim()) {
              secondPage.drawText(text, {
                x,
                y,
                size: 9,
                font: helveticaFont,
                color: rgb(0, 0, 0),
              });
            }
          });
        }
      }

      // Mark checkboxes for selected days
      const dayPositions = [
        { day: 'Monday', x: 320, y: 240 },
        { day: 'Tuesday', x: 355, y: 240 },
        { day: 'Wednesday', x: 390, y: 240 },
        { day: 'Thursday', x: 425, y: 240 },
        { day: 'Friday', x: 460, y: 240 },
        { day: 'Saturday', x: 495, y: 240 },
        { day: 'Sunday', x: 530, y: 240 },
      ];

      dayPositions.forEach(({ day, x, y }) => {
        if (temporaryValetData.selectedDays.includes(day)) {
          firstPage.drawText('✓', {
            x,
            y,
            size: 8,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
        }
      });

      // Generate and download the filled PDF
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `Temporary_Valet_Zone_Application_${temporaryValetData.location || 'Form'}_${new Date().getTime()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "PDF template filled out successfully",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
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
        // Days of operation with specific hours - first instance
        const enabledDaysFirst = DAYS_OF_WEEK.filter(day => contractData.daySchedules[day.id]?.enabled);
        
        if (enabledDaysFirst.length > 0) {
          addText('Days and Hours of Operation:');
          yPosition += 2;
          
          enabledDaysFirst.forEach(day => {
            const schedule = contractData.daySchedules[day.id];
            if (schedule && schedule.enabled) {
              const startTime = new Date(`1970-01-01T${schedule.startTime}`).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              });
              const endTime = new Date(`1970-01-01T${schedule.endTime}`).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              });
              addText(`${day.label}: ${startTime} - ${endTime}`, false);
            }
          });
        } else {
          addText('Days of operation: To be determined');
        }
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
        // Days of operation with specific hours - second instance
        const enabledDaysSecond = DAYS_OF_WEEK.filter(day => contractData.daySchedules[day.id]?.enabled);
        
        if (enabledDaysSecond.length > 0) {
          addText('Days and Hours of Operation:');
          yPosition += 2;
          
          enabledDaysSecond.forEach(day => {
            const schedule = contractData.daySchedules[day.id];
            if (schedule && schedule.enabled) {
              const startTime = new Date(`1970-01-01T${schedule.startTime}`).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              });
              const endTime = new Date(`1970-01-01T${schedule.endTime}`).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              });
              addText(`${day.label}: ${startTime} - ${endTime}`, false);
            }
          });
        } else {
          addText('Days of operation: To be determined');
        }
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
        <h1 className="text-3xl font-bold text-gray-900">Document Generator</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Generator</CardTitle>
          <p className="text-sm text-gray-600">
            Generate customized documents for valet parking services.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Document Type Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Document Type</h3>
            <Select value={documentType} onValueChange={(value: any) => setDocumentType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contract">Contract Generator</SelectItem>
                <SelectItem value="temporary-valet">Temporary Valet Zone</SelectItem>
                <SelectItem value="permanent-valet">Permanent Valet Zone</SelectItem>
                <SelectItem value="capital-grille-renewal">Capital Grille Renewal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {documentType === 'contract' && (
            <>
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

            
            <div className="space-y-4">
              <Label>Days and Hours of Operation</Label>
              <div className="space-y-3">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <div className="flex items-center space-x-2 min-w-[100px]">
                      <Checkbox
                        id={day.id}
                        checked={contractData.daySchedules[day.id]?.enabled || false}
                        onCheckedChange={() => handleDayToggle(day.id)}
                      />
                      <Label htmlFor={day.id} className="text-sm font-medium">{day.label}</Label>
                    </div>
                    
                    {contractData.daySchedules[day.id]?.enabled && (
                      <div className="flex items-center space-x-2 flex-1">
                        <Input
                          type="time"
                          value={contractData.daySchedules[day.id]?.startTime || '17:00'}
                          onChange={(e) => handleScheduleChange(day.id, 'startTime', e.target.value)}
                          className="w-32"
                        />
                        <span className="text-sm text-gray-500">to</span>
                        <Input
                          type="time"
                          value={contractData.daySchedules[day.id]?.endTime || '23:00'}
                          onChange={(e) => handleScheduleChange(day.id, 'endTime', e.target.value)}
                          className="w-32"
                        />
                      </div>
                    )}
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
            </>
          )}

          {documentType === 'temporary-valet' && (
            <TemporaryValetForm 
              data={temporaryValetData} 
              onChange={setTemporaryValetData}
              onGenerate={generateTemporaryValetPDF}
              isGenerating={isGenerating}
            />
          )}

          {documentType === 'permanent-valet' && (
            <div className="text-center py-8">
              <p className="text-gray-500">Permanent Valet Zone generator coming soon...</p>
            </div>
          )}

          {documentType === 'capital-grille-renewal' && (
            <CapitalGrilleRenewalForm 
              data={renewalData}
              onChange={setRenewalData}
              onGenerate={generateCapitalGrilleRenewal}
              isGenerating={isGenerating}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Capital Grille Renewal Form Component
function CapitalGrilleRenewalForm({ 
  data, 
  onChange, 
  onGenerate, 
  isGenerating 
}: { 
  data: { businessInsuranceExpiration: string; valetPermitExpiration: string; valetInsuranceExpiration: string }; 
  onChange: (data: { businessInsuranceExpiration: string; valetPermitExpiration: string; valetInsuranceExpiration: string }) => void; 
  onGenerate: () => void;
  isGenerating: boolean;
}) {
  const handleInputChange = (field: string, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">Capital Grille Annual Renewal</h3>
        <p className="text-sm text-gray-600">Edit expiration dates on your existing renewal document</p>
      </div>

      <div className="space-y-4 bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
        <h4 className="text-md font-semibold text-blue-700">Update Expiration Dates</h4>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessInsuranceExpiration">Business Insurance Expiration Date</Label>
            <Input
              id="businessInsuranceExpiration"
              type="date"
              value={data.businessInsuranceExpiration}
              onChange={(e) => handleInputChange('businessInsuranceExpiration', e.target.value)}
              placeholder="Select expiration date"
            />
            <p className="text-xs text-gray-500">This will be added to Page 1 under Business Insurance</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valetPermitExpiration">Valet Operator Permit Expiration</Label>
            <Input
              id="valetPermitExpiration"
              type="date"
              value={data.valetPermitExpiration}
              onChange={(e) => handleInputChange('valetPermitExpiration', e.target.value)}
              placeholder="Select permit expiration date"
            />
            <p className="text-xs text-gray-500">This will be added to Page 2 at the bottom</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valetInsuranceExpiration">Valet Operator Insurance Expiration</Label>
            <Input
              id="valetInsuranceExpiration"
              type="date"
              value={data.valetInsuranceExpiration}
              onChange={(e) => handleInputChange('valetInsuranceExpiration', e.target.value)}
              placeholder="Select insurance expiration date"
            />
            <p className="text-xs text-gray-500">This will be added to Page 2 at the bottom</p>
          </div>
        </div>
      </div>

      <div className="pt-6">
        <Button 
          onClick={onGenerate} 
          disabled={isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? 'Generating...' : 'Generate Capital Grille Renewal PDF'}
        </Button>
      </div>
    </div>
  );
}

// Temporary Valet Form Component
function TemporaryValetForm({ 
  data, 
  onChange, 
  onGenerate, 
  isGenerating 
}: { 
  data: TemporaryValetData; 
  onChange: (data: TemporaryValetData) => void; 
  onGenerate: () => void;
  isGenerating: boolean;
}) {
  const handleInputChange = (field: keyof TemporaryValetData, value: string | boolean | string[]) => {
    onChange({ ...data, [field]: value });
  };

  const handleLocationPreset = (location: string) => {
    const locationPresets: Record<string, Partial<TemporaryValetData>> = {
      'trulucks': {
        companyName: 'Truluck\'s Restaurant',
        streetName: 'West 6th Street',
        city: 'Austin',
        state: 'TX',
        zip: '78701'
      },
      'capital-grille': {
        companyName: 'The Capital Grille',
        streetName: 'West 6th Street', 
        city: 'Austin',
        state: 'TX',
        zip: '78701'
      },
      'capital-grille-annual': {
        companyName: 'Colorado Third Street, LLC / The Capital Grille',
        primaryContact: 'Justin Bayne',
        phoneNumber: '512-477-4500',
        altPhoneNumber: '',
        mailingAddress: '117 W. 4th Street',
        city: 'Austin',
        state: 'TX',
        zip: '78701',
        email: 'jbayne@baynecommercial.com',
        blockNumber: '100',
        streetName: 'W 4th St.',
        spacesRequested: '6',
        curbSide: 'South',
        blockEnd: 'Midblock',
        payStationNumbers: ['0416', '', '', ''],
        unmmeteredDescription: '',
        valetOperatorName: 'Access Valet Parking #2017-054252',
        valetContact: 'Brandon Blond',
        emergencyNumber: '512-775-5739',
        valetAltPhone: '',
        valetAddress: '14910 Hartsmith Dr.',
        valetCity: 'Austin',
        valetState: 'TX',
        valetZip: '78725',
        valetEmail: 'brandon@accessvaletparking.com',
        permitExpiration: '5/23/25',
        insuranceExpiration: '4/1/26',
        onPremisesParking: false,
        parkingFacilityAddress: '405 Colorado',
        parkingFacilityCity: 'Austin',
        parkingFacilityState: 'TX',
        parkingFacilityZip: '78725',
        facilityType: 'Parking Garage',
        availableSpaces: '90',
        contractDate: '9/16/2021',
        contractExpiration: 'MTM',
        facilityContactName: 'Jim Riggio',
        facilityContactPhone: '267-825-3398',
        facilityContactEmail: 'jim.riggio@bdnreit.com'
      },
      'bobs-steak': {
        companyName: 'Bob\'s Steak & Chop House',
        streetName: 'Lamar Boulevard',
        city: 'Austin', 
        state: 'TX',
        zip: '78704'
      },
      'boa': {
        companyName: 'BOA Steakhouse',
        streetName: 'West 4th Street',
        city: 'Austin',
        state: 'TX', 
        zip: '78701'
      }
    };

    const preset = locationPresets[location];
    if (preset) {
      onChange({ ...data, location, ...preset });
    }
  };

  return (
    <>
      {/* Location Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Location Template</h3>
        <p className="text-sm text-gray-600">Select a location to auto-fill company and contact details. You can edit event-specific information below.</p>
        <Select value={data.location} onValueChange={(value) => handleLocationPreset(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select location template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="trulucks">Truluck's</SelectItem>
            <SelectItem value="capital-grille">The Capital Grille</SelectItem>
            <SelectItem value="capital-grille-annual">Capital Grille Annual Renewal</SelectItem>
            <SelectItem value="bobs-steak">Bob's Steak & Chop House</SelectItem>
            <SelectItem value="boa">BOA Steakhouse</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Applicant Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Applicant Information</h3>
        <p className="text-sm text-gray-500">Pre-filled from location template. Edit if needed.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              value={data.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              placeholder="Restaurant name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="primaryContact">Primary Contact Name *</Label>
            <Input
              id="primaryContact"
              value={data.primaryContact}
              onChange={(e) => handleInputChange('primaryContact', e.target.value)}
              placeholder="Contact person"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number *</Label>
            <Input
              id="phoneNumber"
              value={data.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              placeholder="(512) 555-0123"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="altPhoneNumber">Alternative Phone</Label>
            <Input
              id="altPhoneNumber"
              value={data.altPhoneNumber}
              onChange={(e) => handleInputChange('altPhoneNumber', e.target.value)}
              placeholder="(512) 555-0124"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mailingAddress">Mailing Address *</Label>
            <Input
              id="mailingAddress"
              value={data.mailingAddress}
              onChange={(e) => handleInputChange('mailingAddress', e.target.value)}
              placeholder="Street address"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={data.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="contact@restaurant.com"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={data.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Austin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={data.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="TX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">Zip *</Label>
              <Input
                id="zip"
                value={data.zip}
                onChange={(e) => handleInputChange('zip', e.target.value)}
                placeholder="78701"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Proposed Zone Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Proposed Zone Information</h3>
        <p className="text-sm text-gray-500">Location details pre-filled. Verify and adjust if needed.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="blockNumber">Block Number</Label>
            <Input
              id="blockNumber"
              value={data.blockNumber}
              onChange={(e) => handleInputChange('blockNumber', e.target.value)}
              placeholder="Block #"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="streetName">Street Name *</Label>
            <Input
              id="streetName"
              value={data.streetName}
              onChange={(e) => handleInputChange('streetName', e.target.value)}
              placeholder="Street name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="spacesRequested">Spaces Requested *</Label>
            <Input
              id="spacesRequested"
              value={data.spacesRequested}
              onChange={(e) => handleInputChange('spacesRequested', e.target.value)}
              placeholder="Number of spaces"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="curbSide">Curb Side</Label>
            <Select value={data.curbSide} onValueChange={(value) => handleInputChange('curbSide', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select curb side" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="North">North</SelectItem>
                <SelectItem value="South">South</SelectItem>
                <SelectItem value="East">East</SelectItem>
                <SelectItem value="West">West</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="blockEnd">Block End</Label>
            <Select value={data.blockEnd} onValueChange={(value) => handleInputChange('blockEnd', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select block end" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="North">North</SelectItem>
                <SelectItem value="South">South</SelectItem>
                <SelectItem value="East">East</SelectItem>
                <SelectItem value="West">West</SelectItem>
                <SelectItem value="Midblock">Midblock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Pay Station/Meter Numbers</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {data.payStationNumbers.map((num, index) => (
              <Input
                key={index}
                value={num}
                onChange={(e) => {
                  const newNumbers = [...data.payStationNumbers];
                  newNumbers[index] = e.target.value;
                  handleInputChange('payStationNumbers', newNumbers);
                }}
                placeholder={`PS/Meter #${index + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="unmmeteredDescription">Unmetered Area Description</Label>
          <Input
            id="unmmeteredDescription"
            value={data.unmmeteredDescription}
            onChange={(e) => handleInputChange('unmmeteredDescription', e.target.value)}
            placeholder="Description if area has no marked spaces"
          />
        </div>
      </div>

      {/* Event Time and Date */}
      <div className="space-y-4 bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-700">📅 Event Time and Date</h3>
        <p className="text-sm text-blue-600 font-medium">Update these fields for each new application:</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="eventDates">Date(s) *</Label>
            <Input
              id="eventDates"
              value={data.eventDates}
              onChange={(e) => handleInputChange('eventDates', e.target.value)}
              placeholder="e.g., December 31, 2024"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fromTime">From Time *</Label>
            <Input
              id="fromTime"
              value={data.fromTime}
              onChange={(e) => handleInputChange('fromTime', e.target.value)}
              placeholder="6:00 PM"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="toTime">To Time *</Label>
            <Input
              id="toTime"
              value={data.toTime}
              onChange={(e) => handleInputChange('toTime', e.target.value)}
              placeholder="12:00 AM"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Days of Week</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
              <div key={day} className="flex items-center space-x-2">
                <Checkbox
                  id={day}
                  checked={data.selectedDays.includes(day)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleInputChange('selectedDays', [...data.selectedDays, day]);
                    } else {
                      handleInputChange('selectedDays', data.selectedDays.filter(d => d !== day));
                    }
                  }}
                />
                <Label htmlFor={day} className="text-sm">{day}</Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div className="pt-6">
        <Button 
          onClick={onGenerate} 
          disabled={isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? 'Generating...' : 'Generate Temporary Valet Zone PDF'}
        </Button>
      </div>
    </>
  );
}