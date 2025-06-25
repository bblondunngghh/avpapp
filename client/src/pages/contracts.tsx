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
import { PDFDocument, rgb, StandardFonts, PDFArray, PDFDict, PDFName, PDFHexString } from 'pdf-lib';

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
  eventDescription: string;
  fromTime: string;
  toTime: string;
  selectedDays: string[];
  selectedWeekdays: string[];
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
  certificateOfInsurance: File | null;
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
  const [documentType, setDocumentType] = useState<'contract' | 'temporary-valet' | 'annual-renewal'>('contract');
  const [selectedLocation, setSelectedLocation] = useState<string>('trulucks');
  const [selectedTempLocation, setSelectedTempLocation] = useState<string>('trulucks');

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

  // Simple renewal form data for Annual Renewal
  const [renewalData, setRenewalData] = useState({
    businessInsuranceExpiration: '',
    valetPermitExpiration: '',
    valetInsuranceExpiration: '',
    resolutionDate: '' // For Bob's Resolution of Authority date field
  });

  // Document upload state
  const [documentUploads, setDocumentUploads] = useState([
    { category: "authorized_agent", file: null as File | null, uploaded: false },
    { category: "resolution_authority", file: null as File | null, uploaded: false },
    { category: "valet_insurance", file: null as File | null, uploaded: false },
    { category: "business_insurance", file: null as File | null, uploaded: false },
    { category: "parking_agreement", file: null as File | null, uploaded: false },
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
    eventDescription: '',
    fromTime: '',
    toTime: '',
    selectedDays: [],
    selectedWeekdays: [],
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
    facilityContactEmail: '',
    certificateOfInsurance: null
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

  // Convert military time to standard time format
  const convertToStandardTime = (militaryTime: string): string => {
    if (!militaryTime) return '';
    
    const [hours, minutes] = militaryTime.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const standardHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    
    return `${standardHour}:${minutes} ${ampm}`;
  };

  // Get weekday rectangle coordinates for PDF overlay (Monday-Sunday order)
  const getWeekdayRectangleCoordinates = (location: string) => {
    const dayCoordinates = {
      'trulucks': {
        'Monday': { x: 285, y: 335 },
        'Tuesday': { x: 325, y: 335 },
        'Wednesday': { x: 380, y: 335 },
        'Thursday': { x: 430, y: 335 },
        'Friday': { x: 470, y: 335 },
        'Saturday': { x: 510, y: 335 },
        'Sunday': { x: 560, y: 335 }
      },
      'capital-grille': {
        'Monday': { x: 285, y: 305 },
        'Tuesday': { x: 325, y: 305 },
        'Wednesday': { x: 380, y: 305 },
        'Thursday': { x: 430, y: 305 },
        'Friday': { x: 470, y: 305 },
        'Saturday': { x: 510, y: 305 },
        'Sunday': { x: 560, y: 305 }
      },
      'default': {
        'Monday': { x: 50, y: 250 },
        'Tuesday': { x: 100, y: 250 },
        'Wednesday': { x: 150, y: 250 },
        'Thursday': { x: 200, y: 250 },
        'Friday': { x: 250, y: 250 },
        'Saturday': { x: 300, y: 250 },
        'Sunday': { x: 350, y: 250 }
      }
    };
    
    return dayCoordinates[location] || dayCoordinates['default'];
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

      return {
        filename: result.filename,
        category: result.category,
        originalName: result.originalName,
        mimeType: result.mimeType
      };
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
      parking_agreement: "Parking Agreement",
    };
    return names[category as keyof typeof names] || category;
  };

  const generateCapitalGrilleRenewal = async () => {
    setIsGenerating(true);
    try {
      // Validate location selection
      if (!selectedLocation) {
        toast({
          title: "Error",
          description: "Please select a location",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      // Validate that at least one field is filled
      if (!renewalData.businessInsuranceExpiration && !renewalData.valetPermitExpiration && !renewalData.valetInsuranceExpiration && !renewalData.resolutionDate) {
        toast({
          title: "Error",
          description: "Please enter at least one date field",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      // Upload documents first
      const uploadedFiles = [];
      for (const doc of documentUploads) {
        if (doc.file && !doc.uploaded) {
          const fileInfo = await uploadDocument(doc.category, doc.file);
          if (fileInfo) {
            uploadedFiles.push(fileInfo);
          }
        }
      }

      // Load the appropriate template based on location
      let templateEndpoint = '/api/pdf-template/capital-grille-renewal'; // default fallback
      if (selectedLocation === 'trulucks') {
        templateEndpoint = '/api/pdf-template/trulucks-renewal';
      } else if (selectedLocation === 'capital-grille') {
        templateEndpoint = '/api/pdf-template/capital-grille-renewal';
      } else if (selectedLocation === 'boa') {
        templateEndpoint = '/api/pdf-template/boa-renewal';
      } else if (selectedLocation === 'bobs') {
        templateEndpoint = '/api/pdf-template/bobs-renewal';
      }

      const response = await fetch(templateEndpoint);
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const existingPdfBytes = await response.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const secondPage = pages[1];

      // Location-specific text overlay logic
      if (selectedLocation === 'bobs' && renewalData.resolutionDate) {
        // Bob's specific: Resolution of Authority date on page 5 (split into month/day and year)
        const page5 = pages[4]; // Page 5 (0-indexed)
        if (page5 && renewalData.resolutionDate) {
          const date = new Date(renewalData.resolutionDate);
          const monthDay = `${date.getMonth() + 1}/${date.getDate()}`;
          const year = date.getFullYear().toString().slice(-2); // Last 2 digits of year
          
          // Month/Day field
          page5.drawText(monthDay, {
            x: 120, // Updated X coordinate for month/day field
            y: 140, // Adjust based on PDF positioning
            size: 9,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
          
          // Year field (separated)
          page5.drawText(year, {
            x: 245, // Updated X coordinate for year field
            y: 140, // Same Y coordinate as month/day
            size: 9,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
        }
      } else {
        // Standard fields for Capital Grille, Trulucks, BOA
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
      }

      // Add uploaded documents by creating additional pages in the PDF
      if (uploadedFiles.length > 0) {
        console.log(`Adding ${uploadedFiles.length} supporting documents to PDF...`);
        
        for (const file of uploadedFiles) {
          try {
            console.log(`Processing file: ${file.filename} (${file.category})`);
            
            // Fetch the uploaded file
            const fileResponse = await fetch(`/api/document/${file.filename}`);
            if (fileResponse.ok) {
              const fileBytes = await fileResponse.arrayBuffer();
              console.log(`File fetched, size: ${fileBytes.byteLength} bytes`);
              
              // If it's a PDF, merge its pages directly
              if (file.mimeType === 'application/pdf') {
                try {
                  const attachedPdf = await PDFDocument.load(fileBytes);
                  const pages = await pdfDoc.copyPages(attachedPdf, attachedPdf.getPageIndices());
                  
                  // Add all pages from the attached PDF directly
                  pages.forEach((page) => pdfDoc.addPage(page));
                  
                  console.log(`Successfully merged PDF: ${file.originalName || file.filename}`);
                } catch (pdfError) {
                  console.error(`Failed to merge PDF ${file.filename}:`, pdfError);
                }
              } else if (file.mimeType?.startsWith('image/')) {
                try {
                  // For images, create a new page and embed the image
                  const imagePage = pdfDoc.addPage([612, 792]);
                  
                  // Embed and draw the image
                  let image;
                  if (file.mimeType === 'image/jpeg' || file.mimeType === 'image/jpg') {
                    image = await pdfDoc.embedJpg(fileBytes);
                  } else if (file.mimeType === 'image/png') {
                    image = await pdfDoc.embedPng(fileBytes);
                  }
                  
                  if (image) {
                    const { width, height } = image.scale(0.5); // Scale down to fit page
                    const maxWidth = 500;
                    const maxHeight = 700;
                    
                    let drawWidth = width;
                    let drawHeight = height;
                    
                    // Scale to fit within page bounds
                    if (width > maxWidth) {
                      const ratio = maxWidth / width;
                      drawWidth = maxWidth;
                      drawHeight = height * ratio;
                    }
                    
                    if (drawHeight > maxHeight) {
                      const ratio = maxHeight / drawHeight;
                      drawHeight = maxHeight;
                      drawWidth = drawWidth * ratio;
                    }
                    
                    // Center the image on the page
                    const xOffset = (612 - drawWidth) / 2;
                    const yOffset = (792 - drawHeight) / 2;
                    
                    imagePage.drawImage(image, {
                      x: xOffset,
                      y: yOffset,
                      width: drawWidth,
                      height: drawHeight,
                    });
                  }
                  
                  console.log(`Successfully added image: ${file.originalName || file.filename}`);
                } catch (imageError) {
                  console.error(`Failed to embed image ${file.filename}:`, imageError);
                }
              }
            } else {
              console.error(`Failed to fetch file: ${file.filename}, status: ${fileResponse.status}`);
            }
          } catch (error) {
            console.error(`Failed to process ${file.filename}:`, error);
          }
        }
        
        console.log(`Successfully processed ${uploadedFiles.length} supporting documents`);
      }

      // Generate and download the completed PDF
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      const locationName = selectedLocation.charAt(0).toUpperCase() + selectedLocation.slice(1).replace('-', '_');
      a.download = `${locationName}_Annual_Renewal_${new Date().getTime()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `${locationName} annual renewal PDF generated with ${uploadedFiles.length} supporting documents!`,
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
      // Load the appropriate template based on location
      let templateEndpoint = '/api/pdf-template/trulucks-temp'; // default to Trulucks
      if (selectedTempLocation === 'trulucks') {
        templateEndpoint = '/api/pdf-template/trulucks-temp';
      } else if (selectedTempLocation === 'capital-grille') {
        templateEndpoint = '/api/pdf-template/capital-grille-temp';
      } else if (selectedTempLocation === 'bobs') {
        templateEndpoint = '/api/pdf-template/valet-temporary'; // fallback for now
      } else if (selectedTempLocation === 'boa') {
        templateEndpoint = '/api/pdf-template/valet-temporary'; // fallback for now
      }

      const response = await fetch(templateEndpoint);
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const existingPdfBytes = await response.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const secondPage = pages[1] || pdfDoc.addPage();

      // Define location-specific coordinates for text overlay
      const overlayData = selectedTempLocation === 'trulucks' ? [
        // Page 1 - Applicant Information (Trulucks template coordinates)
        { text: temporaryValetData.companyName, x: 154, y: 548, page: 0 },
        { text: temporaryValetData.primaryContact, x: 154, y: 532, page: 0 },
        { text: temporaryValetData.phoneNumber, x: 154, y: 516, page: 0 },
        { text: temporaryValetData.altPhoneNumber, x: 354, y: 516, page: 0 },
        { text: temporaryValetData.mailingAddress, x: 154, y: 500, page: 0 },
        { text: temporaryValetData.city, x: 254, y: 484, page: 0 },
        { text: temporaryValetData.state, x: 324, y: 484, page: 0 },
        { text: temporaryValetData.zip, x: 374, y: 484, page: 0 },
        { text: temporaryValetData.email, x: 154, y: 468, page: 0 },
        
        // Proposed Zone Information
        { text: temporaryValetData.blockNumber, x: 154, y: 398, page: 0 },
        { text: temporaryValetData.streetName, x: 254, y: 398, page: 0 },
        { text: temporaryValetData.spacesRequested, x: 454, y: 398, page: 0 },
        
        // Pay Station Numbers
        { text: temporaryValetData.payStationNumbers[0], x: 154, y: 346, page: 0 },
        
        // Event Time and Date
        { text: temporaryValetData.eventDates, x: 135, y: 350, page: 0 },
        { text: convertToStandardTime(temporaryValetData.fromTime), x: 75, y: 335, page: 0 },
        { text: convertToStandardTime(temporaryValetData.toTime), x: 175, y: 335, page: 0 },
      ] : selectedTempLocation === 'capital-grille' ? [
        // Page 1 - Applicant Information (Capital Grille template coordinates)
        { text: temporaryValetData.companyName, x: 150, y: 620, page: 0 },
        { text: temporaryValetData.primaryContact, x: 150, y: 604, page: 0 },
        { text: temporaryValetData.phoneNumber, x: 150, y: 588, page: 0 },
        { text: temporaryValetData.altPhoneNumber, x: 350, y: 588, page: 0 },
        { text: temporaryValetData.mailingAddress, x: 150, y: 572, page: 0 },
        { text: temporaryValetData.city, x: 250, y: 556, page: 0 },
        { text: temporaryValetData.state, x: 320, y: 556, page: 0 },
        { text: temporaryValetData.zip, x: 370, y: 556, page: 0 },
        { text: temporaryValetData.email, x: 150, y: 540, page: 0 },
        
        // Proposed Zone Information
        { text: temporaryValetData.blockNumber, x: 150, y: 470, page: 0 },
        { text: temporaryValetData.streetName, x: 250, y: 470, page: 0 },
        { text: temporaryValetData.spacesRequested, x: 450, y: 470, page: 0 },
        
        // Pay Station Numbers
        { text: temporaryValetData.payStationNumbers[0], x: 150, y: 418, page: 0 },
        
        // Event Time and Date
        { text: temporaryValetData.eventDates, x: 145, y: 360, page: 0 },
        { text: convertToStandardTime(temporaryValetData.fromTime), x: 85, y: 345, page: 0 },
        { text: convertToStandardTime(temporaryValetData.toTime), x: 185, y: 345, page: 0 },
      ] : [
        // Default coordinates for other templates
        { text: temporaryValetData.companyName, x: 150, y: 700, page: 0 },
        { text: temporaryValetData.primaryContact, x: 150, y: 670, page: 0 },
        { text: temporaryValetData.phoneNumber, x: 150, y: 640, page: 0 },
        { text: temporaryValetData.altPhoneNumber, x: 350, y: 640, page: 0 },
        { text: temporaryValetData.mailingAddress, x: 150, y: 610, page: 0 },
        { text: temporaryValetData.city, x: 250, y: 580, page: 0 },
        { text: temporaryValetData.state, x: 320, y: 580, page: 0 },
        { text: temporaryValetData.zip, x: 370, y: 580, page: 0 },
        { text: temporaryValetData.email, x: 150, y: 550, page: 0 },
        
        // Proposed Zone Information
        { text: temporaryValetData.blockNumber, x: 150, y: 480, page: 0 },
        { text: temporaryValetData.streetName, x: 250, y: 480, page: 0 },
        { text: temporaryValetData.spacesRequested, x: 450, y: 480, page: 0 },
        
        // Event Time and Date
        { text: temporaryValetData.eventDates, x: 150, y: 280, page: 0 },
        { text: convertToStandardTime(temporaryValetData.fromTime), x: 150, y: 250, page: 0 },
        { text: convertToStandardTime(temporaryValetData.toTime), x: 250, y: 250, page: 0 },
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

      // Add rectangles around selected weekdays with dynamic sizing
      if (selectedTempLocation === 'trulucks' || selectedTempLocation === 'capital-grille') {
        const dayCoordinates = getWeekdayRectangleCoordinates(selectedTempLocation);
        const dayWidths = {
          'Monday': 40,
          'Tuesday': 45,
          'Wednesday': 55,
          'Thursday': 50,
          'Friday': 35,
          'Saturday': 50,
          'Sunday': 45
        };
        
        temporaryValetData.selectedWeekdays.forEach(day => {
          const coords = dayCoordinates[day];
          const width = dayWidths[day] || 40;
          if (coords) {
            firstPage.drawEllipse({
              x: coords.x,
              y: coords.y,
              xScale: width / 1.8, // Moderate horizontal stretch
              yScale: 7, // Better height for visibility
              borderColor: rgb(0, 0, 0),
              borderWidth: 1.2,
              opacity: 0,
            });
          }
        });
      }

      // Note: Removed page 2 text overlay - Trulucks template only uses page 1

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

      // Merge certificate of insurance if uploaded for any location
      if (temporaryValetData.certificateOfInsurance) {
        try {
          const reader = new FileReader();
          const fileBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as ArrayBuffer);
            reader.onerror = reject;
            reader.readAsArrayBuffer(temporaryValetData.certificateOfInsurance!);
          });

          // Check if it's a PDF file
          if (temporaryValetData.certificateOfInsurance.type === 'application/pdf') {
            const insurancePdf = await PDFDocument.load(fileBuffer);
            const insurancePages = await pdfDoc.copyPages(insurancePdf, insurancePdf.getPageIndices());
            insurancePages.forEach((page) => pdfDoc.addPage(page));
          } else {
            // Handle image files (JPG, PNG, etc.)
            let imageBytes: Uint8Array;
            if (temporaryValetData.certificateOfInsurance.type.includes('png')) {
              const image = await pdfDoc.embedPng(fileBuffer);
              const page = pdfDoc.addPage();
              const { width, height } = page.getSize();
              const aspectRatio = image.width / image.height;
              
              let imgWidth = width - 100;
              let imgHeight = imgWidth / aspectRatio;
              
              if (imgHeight > height - 100) {
                imgHeight = height - 100;
                imgWidth = imgHeight * aspectRatio;
              }
              
              page.drawImage(image, {
                x: (width - imgWidth) / 2,
                y: (height - imgHeight) / 2,
                width: imgWidth,
                height: imgHeight,
              });
            } else {
              const image = await pdfDoc.embedJpg(fileBuffer);
              const page = pdfDoc.addPage();
              const { width, height } = page.getSize();
              const aspectRatio = image.width / image.height;
              
              let imgWidth = width - 100;
              let imgHeight = imgWidth / aspectRatio;
              
              if (imgHeight > height - 100) {
                imgHeight = height - 100;
                imgWidth = imgHeight * aspectRatio;
              }
              
              page.drawImage(image, {
                x: (width - imgWidth) / 2,
                y: (height - imgHeight) / 2,
                width: imgWidth,
                height: imgHeight,
              });
            }
          }
        } catch (error) {
          console.warn('Failed to merge certificate of insurance:', error);
          // Continue with PDF generation even if certificate merge fails
        }
      }

      // Generate and download the filled PDF
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Generate filename based on event description or fallback to location
      const sanitizeFilename = (str: string) => str.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '_');
      const eventName = temporaryValetData.eventDescription 
        ? sanitizeFilename(temporaryValetData.eventDescription)
        : `${temporaryValetData.location || 'Form'}_${new Date().getTime()}`;
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${eventName}_Temporary_Valet_Zone.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const successMessage = temporaryValetData.certificateOfInsurance 
        ? "PDF generated successfully with certificate of insurance attached"
        : "PDF template filled out successfully";
        
      toast({
        title: "Success",
        description: successMessage,
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
                <SelectItem value="contract">Service Contract</SelectItem>
                <SelectItem value="temporary-valet">Temporary Valet Zone Application</SelectItem>
                <SelectItem value="annual-renewal">Annual Renewal</SelectItem>
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
              selectedLocation={selectedTempLocation}
              onLocationChange={setSelectedTempLocation}
            />
          )}

          {documentType === 'annual-renewal' && (
            <AnnualRenewalForm 
              data={renewalData}
              onChange={setRenewalData}
              onGenerate={generateCapitalGrilleRenewal}
              isGenerating={isGenerating}
              documentUploads={documentUploads}
              onFileUpload={handleFileUpload}
              getCategoryDisplayName={getCategoryDisplayName}
              selectedLocation={selectedLocation}
              onLocationChange={setSelectedLocation}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Annual Renewal Form Component
function AnnualRenewalForm({ 
  data, 
  onChange, 
  onGenerate, 
  isGenerating,
  documentUploads,
  onFileUpload,
  getCategoryDisplayName,
  selectedLocation,
  onLocationChange
}: { 
  data: { businessInsuranceExpiration: string; valetPermitExpiration: string; valetInsuranceExpiration: string; resolutionDate?: string }; 
  onChange: (data: { businessInsuranceExpiration: string; valetPermitExpiration: string; valetInsuranceExpiration: string; resolutionDate?: string }) => void; 
  onGenerate: () => void;
  isGenerating: boolean;
  documentUploads: Array<{ category: string; file: File | null; uploaded: boolean }>;
  onFileUpload: (category: string, file: File | null) => void;
  getCategoryDisplayName: (category: string) => string;
  selectedLocation: string;
  onLocationChange: (location: string) => void;
}) {
  const handleInputChange = (field: string, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">Annual Renewal Application</h3>
        <p className="text-sm text-gray-600">Edit expiration dates and upload supporting documents</p>
      </div>

      {/* Location Selection */}
      <div className="space-y-4 bg-green-50 p-4 rounded-lg border-2 border-green-200">
        <h4 className="text-md font-semibold text-green-700">Select Location</h4>
        <Select value={selectedLocation} onValueChange={onLocationChange}>
          <SelectTrigger>
            <SelectValue placeholder="Choose restaurant location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="trulucks">Truluck's</SelectItem>
            <SelectItem value="capital-grille">The Capital Grille</SelectItem>
            <SelectItem value="bobs">Bob's Steak & Chop House</SelectItem>
            <SelectItem value="boa">BOA Steakhouse</SelectItem>
          </SelectContent>
        </Select>
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

      {/* Bob's Specific Resolution Date Field */}
      {selectedLocation === 'bobs' && (
        <div className="space-y-4 bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
          <h4 className="text-md font-semibold text-blue-700">Resolution of Authority Date</h4>
          <div className="space-y-2">
            <Label htmlFor="resolutionDate">Resolution Date (for page 5)</Label>
            <Input
              id="resolutionDate"
              type="date"
              value={data.resolutionDate || ''}
              onChange={(e) => handleInputChange('resolutionDate', e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-blue-600">This date will be split into month/day and year format on the Resolution of Authority page</p>
          </div>
        </div>
      )}

      {/* Document Upload Section */}
      <div className="space-y-4 bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
        <h4 className="text-md font-semibold text-gray-700">Supporting Documents</h4>
        <p className="text-sm text-gray-600">Upload supporting documents to include with the renewal application.</p>
        
        {documentUploads?.map((doc) => (
          <div key={doc.category} className="border rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-2">
              <Label className="font-medium">
                {getCategoryDisplayName(doc.category)}
              </Label>
              {doc.uploaded && (
                <span className="text-green-600 text-sm font-medium">✓ Uploaded</span>
              )}
            </div>
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                onFileUpload(doc.category, file);
              }}
              className="w-full"
            />
            {doc.file && (
              <p className="text-sm text-gray-500 mt-1">
                Selected: {doc.file.name} ({(doc.file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="pt-6">
        <Button 
          onClick={onGenerate} 
          disabled={isGenerating || !selectedLocation}
          className="w-full"
          size="lg"
        >
          {isGenerating ? 'Generating...' : `Generate ${selectedLocation ? selectedLocation.charAt(0).toUpperCase() + selectedLocation.slice(1).replace('-', ' ') : 'Annual Renewal'} PDF`}
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
  isGenerating,
  selectedLocation,
  onLocationChange
}: { 
  data: TemporaryValetData; 
  onChange: (data: TemporaryValetData) => void; 
  onGenerate: () => void;
  isGenerating: boolean;
  selectedLocation: string;
  onLocationChange: (location: string) => void;
}) {
  const handleInputChange = (field: keyof TemporaryValetData, value: string | boolean | string[]) => {
    onChange({ ...data, [field]: value });
  };

  const handleLocationPreset = (location: string) => {
    onLocationChange(location);
    
    const locationPresets: Record<string, Partial<TemporaryValetData>> = {
      'trulucks': {
        companyName: 'Access Valet Parking',
        primaryContact: 'Brandon Blond',
        phoneNumber: '512-775-5739',
        altPhoneNumber: '',
        mailingAddress: '14910 Hartsmith Dr.',
        city: 'Austin',
        state: 'TX',
        zip: '78725',
        email: 'brandon@accessvaletparking.com',
        blockNumber: '300',
        streetName: 'Colorado St.',
        spacesRequested: '3',
        curbSide: 'South',
        blockEnd: 'Midblock',
        payStationNumbers: ['39208', '', '', ''],
        valetOperatorName: 'Access Valet Parking',
        valetContact: 'Brandon Blond',
        emergencyNumber: '512-775-5739',
        valetAddress: '14910 Hartsmith Dr.',
        valetCity: 'Austin',
        valetState: 'TX',
        valetZip: '78725',
        valetEmail: 'brandon@accessvaletparking.com',
        permitExpiration: '5/23/26',
        insuranceExpiration: '4/1/26',
        onPremisesParking: false,
        parkingFacilityAddress: '405 Colorado',
        parkingFacilityCity: 'Austin',
        parkingFacilityState: 'TX',
        parkingFacilityZip: '78725',
        facilityType: 'Parking Garage',
        availableSpaces: '30',
        contractDate: '1/18/24',
        contractExpiration: 'MTM',
        facilityContactName: 'Jim Riggio',
        facilityContactPhone: '267-826-3398',
        facilityContactEmail: 'jim.riggio@bdnreit.com'
      },
      'capital-grille': {
        companyName: 'Access Valet Parking',
        primaryContact: 'Brandon Blond',
        phoneNumber: '512-775-5739',
        altPhoneNumber: '',
        mailingAddress: '14910 Hartsmith Dr.',
        city: 'Austin',
        state: 'TX',
        zip: '78725',
        email: 'brandon@accessvaletparking.com',
        blockNumber: '100',
        streetName: 'W 4th St.',
        spacesRequested: '6',
        curbSide: 'South',
        blockEnd: 'Midblock',
        payStationNumbers: ['0416', '', '', '']
      },
      'bobs': {
        companyName: 'Access Valet Parking',
        primaryContact: 'Brandon Blond',
        phoneNumber: '512-775-5739',
        altPhoneNumber: '',
        mailingAddress: '14910 Hartsmith Dr.',
        city: 'Austin',
        state: 'TX',
        zip: '78725',
        email: 'brandon@accessvaletparking.com'
      },
      'boa': {
        companyName: 'Access Valet Parking',
        primaryContact: 'Brandon Blond',
        phoneNumber: '512-775-5739',
        altPhoneNumber: '',
        mailingAddress: '14910 Hartsmith Dr.',
        city: 'Austin',
        state: 'TX',
        zip: '78725',
        email: 'brandon@accessvaletparking.com'
      }
    };

    const preset = locationPresets[location];
    if (preset) {
      onChange({ ...data, ...preset });
    }
  };

  return (
    <>
      {/* Location Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Location Template</h3>
        <p className="text-sm text-gray-600">Select a location to auto-fill all company and zone details. Only event date/time needs to be specified.</p>
        <Select value={selectedLocation} onValueChange={(value) => handleLocationPreset(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select location template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="trulucks">Truluck's</SelectItem>
            <SelectItem value="capital-grille">The Capital Grille</SelectItem>
            <SelectItem value="bobs">Bob's Steak & Chop House</SelectItem>
            <SelectItem value="boa">BOA Steakhouse</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Event Time and Date - Only Essential Fields */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Event Details</h3>
        <p className="text-sm text-gray-600">Specify when you need the temporary valet zone.</p>
        
        <div className="space-y-2">
          <Label htmlFor="eventDescription">Event Description</Label>
          <Input
            id="eventDescription"
            value={data.eventDescription}
            onChange={(e) => handleInputChange('eventDescription', e.target.value)}
            placeholder="e.g., Mothers Day 2025, New Year's Eve Party"
          />
          <p className="text-xs text-gray-500">Brief description of the event requiring valet services</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="eventDates">Event Date(s)</Label>
            <Input
              id="eventDates"
              value={data.eventDates}
              onChange={(e) => handleInputChange('eventDates', e.target.value)}
              placeholder="e.g., December 31, 2024"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fromTime">From Time</Label>
            <Input
              id="fromTime"
              type="time"
              value={data.fromTime}
              onChange={(e) => handleInputChange('fromTime', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="toTime">To Time</Label>
            <Input
              id="toTime"
              type="time"
              value={data.toTime}
              onChange={(e) => handleInputChange('toTime', e.target.value)}
            />
          </div>
        </div>
        
        {/* Day Selection */}
        <div className="space-y-2">
          <Label>Days of Week</Label>
          <div className="flex flex-wrap gap-2">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
              <label key={day} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.selectedWeekdays.includes(day)}
                  onChange={(e) => {
                    const updatedDays = e.target.checked
                      ? [...data.selectedWeekdays, day]
                      : data.selectedWeekdays.filter(d => d !== day);
                    handleInputChange('selectedWeekdays', updatedDays);
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{day}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Certificate of Insurance Upload - For All Locations */}
      {selectedLocation && (
        <div className="space-y-4 bg-green-50 p-4 rounded-lg border-2 border-green-200">
          <h3 className="text-lg font-semibold text-green-700">Certificate of Insurance - Valet Operator</h3>
          <p className="text-sm text-green-600">Upload certificate of insurance document for temporary permit application.</p>
          
          <div className="space-y-2">
            <Label htmlFor="certificateOfInsurance">Certificate of Insurance - Valet Operator</Label>
            <Input
              id="certificateOfInsurance"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                handleInputChange('certificateOfInsurance', file);
              }}
              className="w-full"
            />
            {data.certificateOfInsurance && (
              <p className="text-sm text-green-600 mt-1">
                Selected: {data.certificateOfInsurance.name} ({(data.certificateOfInsurance.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
            <p className="text-xs text-green-500">
              Accepted formats: PDF, JPG, JPEG, PNG (Max 10MB)
            </p>
          </div>
        </div>
      )}

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