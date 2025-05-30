import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Save } from "lucide-react";
import avpLogo from "@assets/new logo maybe.png";

export default function Regulations() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [acknowledgment, setAcknowledgment] = useState({
    employeeName: "",
    date: "",
    signature: ""
  });

  const handleSaveAcknowledgment = () => {
    if (!acknowledgment.employeeName || !acknowledgment.date || !acknowledgment.signature) {
      toast({
        title: "Missing Information",
        description: "Please fill out all fields before saving.",
        variant: "destructive",
      });
      return;
    }

    // Save to localStorage for persistence
    localStorage.setItem('safety_training_acknowledgment', JSON.stringify({
      ...acknowledgment,
      timestamp: new Date().toISOString()
    }));

    toast({
      title: "Acknowledgment Saved",
      description: "Your safety training acknowledgment has been recorded.",
    });
  };

  // Load saved acknowledgment on component mount
  useEffect(() => {
    const saved = localStorage.getItem('safety_training_acknowledgment');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setAcknowledgment({
          employeeName: data.employeeName || "",
          date: data.date || "",
          signature: data.signature || ""
        });
      } catch (error) {
        // Handle invalid JSON gracefully
      }
    }
  }, []);
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Button 
        variant="ghost" 
        className="mb-6" 
        onClick={() => navigate("/")}
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>
      <div className="mb-8 flex items-center gap-4">
        <img 
          src={avpLogo} 
          alt="Access Valet Parking Logo" 
          className="h-24 w-auto object-contain"
        />
        <div>
          <h1 className="text-2xl text-black uppercase">Access Valet Parking Safety Training Program</h1>
          <p className="text-gray-600 mt-1">
            Valet Operations Manual - Safety policies, procedures, and training guidelines
          </p>
        </div>
      </div>
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-medium mb-4 text-black">1. Safety Policy</h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-gray-700 text-sm leading-relaxed">
              Access Valet Parking is committed to providing a safe and productive work environment and fostering the well-being and health of its team members. It is the policy of this organization that employees report unsafe conditions and work-injuries, and do not perform work tasks if the work is considered unsafe.
            </p>
            <p className="text-gray-700 text-sm leading-relaxed mt-3">
              Employees must report all accidents, injuries, and unsafe conditions to their supervisors. Such reports will not result in retaliation, discrimination, penalty, or other disincentive. Management will give top priority to and provide the financial resources for the correction of unsafe conditions.
            </p>
          </div>

          <h2 className="text-lg font-medium mb-4 text-black">3. General Safety Rules</h2>
          <div className="space-y-6">
            <div>
              <p className="text-gray-700 mb-4">
                Access Valet Parking strives to provide a safe, healthful work environment. But safety begins with YOU. You are responsible for reporting any hazards to your supervisor immediately and following safe work procedures.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>Report all accidents to your supervisor</li>
                <li>Report all unsafe or broken tools or equipment to your supervisor</li>
                <li>Don't take chances</li>
                <li>Observe all warning signs, safety bulletins, and posters</li>
                <li>Avoid all horseplay and never distract another employee</li>
                <li>Wear protective clothing and equipment including sturdy shoes with good tread, layered clothing during cold months, and protective sunscreen and UVA/UVB sunglasses</li>
                <li>Report any safety hazard immediately to your supervisor</li>
                <li>To lift heavy objects, squat down, keep your back straight, and use the leg muscles when lifting</li>
                <li>When using sharp-edged tools, cut away from your body</li>
                <li>Before starting work, tuck in loose clothing</li>
                <li>Keep the floors, aisles, and walkways clear of trash, bags, luggage, etc. Keep the valet area clean and organized</li>
                <li>Do not undertake a job that appears to be unsafe</li>
                <li>Report any fire immediately to a manager or supervisor</li>
                <li>Do not block access to fire-fighting equipment, fire sprinklers, or fire exits</li>
                <li>Learn the location of all fire exits and fire extinguishers</li>
              </ul>
            </div>
          </div>
          
          <Separator className="my-8" />
          
          <h2 className="text-lg font-medium mb-4 text-black">5. Valet Procedures</h2>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-black">5.1 Arrival</AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  <li>Prior to the guest exiting their vehicle, request that they turn off and hand you the key/key fob</li>
                  <li>Ask for the guest's last name and write it on the ticket</li>
                  <li>Hang the key on your carabiner immediately</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-black">5.2 Conduct a Vehicle Inspection</AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  <li>Do a thorough walk around the vehicle while notating all dents, scratches, and cracks on the body of the vehicle</li>
                  <li>While notating damage on form, point with your hand at the damage (For locations with security cameras)</li>
                  <li>All other locations, note damage on the back side of claim check</li>
                  <li>Have customer initial identified damage on claim check</li>
                  <li>Hand them their claim check (This will be the item with which they request their vehicle)</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-black">5.3 Parking the Vehicle</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 text-gray-700">
                  <p className="font-medium">When parking the vehicle, you must be aware of:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>The direction of traffic (follow identified traffic pattern only)</li>
                    <li>No parking/high hazard areas</li>
                    <li>Where the vehicle must be parked</li>
                    <li>Luxury vehicles/oversized vehicles have their designated areas</li>
                    <li>Which spot to park in</li>
                    <li>When you have reached the designated area for the vehicle, begin by parking in spots located away from walls, poles, and other vehicles (Usually a center spot)</li>
                  </ul>
                  
                  <p className="font-medium mt-6">Safety Requirements:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Driver side window must be down</li>
                    <li>Honk when going around corners</li>
                    <li>In garages, also flash your headlights</li>
                    <li>Stop at all stop signs</li>
                    <li>Stop 5 feet in front of crosswalks</li>
                    <li>Look in all directions</li>
                    <li>Stay alert for pedestrians and scooters, allowing them the right-of-way</li>
                    <li>Golf carts may be present on the property. Allow carts the right-of-way</li>
                  </ul>

                  <p className="font-medium mt-6">Parking Process:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Select a space</li>
                    <li>Position vehicle at a 45-degree angle to the space</li>
                    <li>Backing up: Place right hand on passenger seat headrest, turn head over your right shoulder, use both mirrors as aid</li>
                    <li>Must be 12 inches from back wall or another vehicle</li>
                    <li>ONLY use brake pedal to move</li>
                    <li>Straighten wheels when in spot</li>
                    <li>Roll up all windows</li>
                    <li>Close sunroof</li>
                    <li>Get out of vehicle and immediately lock vehicle</li>
                    <li>Place key on carabiner</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger className="text-black">5.4 Retrieving Vehicle</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 text-gray-700">
                  <p className="font-medium">Vehicle Retrieval Process:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Match guest ticket to the key that you have just pulled</li>
                    <li>If guest has lost ticket, ask for Driver's License and complete lost claim check form</li>
                    <li>License must be matched to the registration/rental agreement when you arrive at the vehicle</li>
                    <li>Guest must be owner of vehicle</li>
                    <li>Clip key on carabiner</li>
                    <li>Check out key manually or through automated system</li>
                    <li>Return guest their ticket</li>
                    <li>Walk quickly to retrieve vehicle</li>
                  </ul>

                  <p className="font-medium mt-6">Vehicle Retrieval Safety:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Walk around vehicle</li>
                    <li>Ensure wheels are straight</li>
                    <li>Not touching any obstructions near vehicle (poles, columns, wall, and cars)</li>
                    <li>Unlock vehicle and turn on vehicle</li>
                    <li>If vehicle is a push start, leave the keys on your carabiner</li>
                    <li>Honk before pulling out of space</li>
                    <li>ONLY use brake pedal to move vehicle</li>
                    <li>Drive at five (5) miles an hour</li>
                    <li>Stop at all stop signs</li>
                    <li>Look for vehicles and pedestrians</li>
                    <li>Pull vehicle onto ramp at no more than ten (10) miles an hour</li>
                    <li>Match guest claim ticket to key ticket</li>
                    <li>Ask guest for name on the folio</li>
                    <li>Hand keys to guest</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          <Separator className="my-8" />
          
          <h2 className="text-lg font-medium mb-4 text-black">6. Exotic Car Policy</h2>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium mb-2 text-black">6.1 What Is an Exotic Car</h3>
            <p className="text-gray-700 text-sm">
              Exotic cars require special handling and parking procedures. These vehicles typically include high-end luxury and sports cars that require extra care and attention.
            </p>
          </div>

          <h2 className="text-lg font-medium mb-4 text-black">7. Reporting an Accident</h2>
          
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 mb-6">
            <h3 className="font-medium mb-2">Immediate Actions Required</h3>
            <p className="mb-3">All accidents must be reported immediately to your supervisor, regardless of severity.</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Ensure safety of all persons involved</li>
              <li>Contact emergency services if injuries are present</li>
              <li>Notify your supervisor immediately</li>
              <li>Document the scene thoroughly</li>
              <li>Collect witness information</li>
              <li>Complete all required incident reports</li>
              <li>Do not admit fault or liability</li>
            </ol>
          </div>

          <h2 className="text-lg font-medium mb-4 text-black">4. Safety and Health Training</h2>
          
          <div className="space-y-4">
            <p className="text-gray-700">
              Workplace safety and health orientation begins on the first day of initial employment or job transfer. Each employee has access to a copy of this safety program, through his or her supervisor, for review and future reference.
            </p>
            
            <div>
              <h3 className="text-base font-medium text-black mb-2">4.1 Job-Specific Training</h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>Management will initially train team members on how to perform assigned job tasks safely</li>
                <li>Management will give team members verbal instructions and specific directions on how to perform the work safely</li>
                <li>Management will observe team members performing the work</li>
                <li>All team members will receive safe operating instructions on ALL equipment before using the equipment</li>
                <li>Management will review safe work practices with team members before permitting the performance of new, non-routine, or specialized procedures</li>
              </ul>
            </div>
          </div>
          
          <Separator className="my-8" />
          
          <div className="rounded-md border border-blue-200 bg-blue-50 p-6">
            <h2 className="text-base font-medium mb-3 text-black">Training Acknowledgment</h2>
            <p className="text-sm text-gray-700 mb-4">
              By working with Access Valet Parking, I understand and agree to comply with all safety policies, procedures, and training requirements outlined in this manual. I acknowledge that:
            </p>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1 mb-4">
              <li>I have received and reviewed this safety training program</li>
              <li>I understand the importance of following all safety procedures</li>
              <li>I will report any unsafe conditions immediately to my supervisor</li>
              <li>Violations of safety rules may result in disciplinary action up to and including termination</li>
            </ul>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-4 border-t border-blue-200">
              <div>
                <Label htmlFor="employee-name" className="text-xs text-gray-600 mb-1">Employee Name:</Label>
                <Input
                  id="employee-name"
                  value={acknowledgment.employeeName}
                  onChange={(e) => setAcknowledgment(prev => ({ ...prev, employeeName: e.target.value }))}
                  placeholder="Enter full name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="training-date" className="text-xs text-gray-600 mb-1">Date:</Label>
                <Input
                  id="training-date"
                  type="date"
                  value={acknowledgment.date}
                  onChange={(e) => setAcknowledgment(prev => ({ ...prev, date: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="employee-signature" className="text-xs text-gray-600 mb-1">Signature:</Label>
                <Input
                  id="employee-signature"
                  value={acknowledgment.signature}
                  onChange={(e) => setAcknowledgment(prev => ({ ...prev, signature: e.target.value }))}
                  placeholder="Type your name as signature"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-center">
              <Button 
                onClick={handleSaveAcknowledgment}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4" />
                Save Acknowledgment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}