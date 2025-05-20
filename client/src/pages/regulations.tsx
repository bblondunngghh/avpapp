import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronLeft } from "lucide-react";

export default function Regulations() {
  const [, navigate] = useLocation();
  
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
      
      <div className="mb-8">
        <h1 className="text-2xl text-emerald-700 uppercase">Right of Way Valet Parking Rules & Regulations</h1>
        <p className="text-gray-600 mt-1">
          Standard operating procedures and guidelines for all valet staff members.
        </p>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-medium mb-4">General Policies</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-medium text-emerald-700 mb-2">Dress Code</h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>Black dress pants (no jeans)</li>
                <li>Company-issued shirt must be clean and pressed</li>
                <li>Black dress shoes (polished, no sneakers)</li>
                <li>Company-issued name tag must be worn at all times</li>
                <li>No visible tattoos or excessive jewelry</li>
                <li>Hair must be neat and well-groomed</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-base font-medium text-emerald-700 mb-2">Conduct</h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>Always treat customers with courtesy and respect</li>
                <li>Maintain professional demeanor at all times</li>
                <li>No smoking, eating, or use of mobile phones while on duty</li>
                <li>Never leave the valet stand unattended</li>
                <li>Report all incidents immediately to shift leader</li>
                <li>Maintain confidentiality regarding customer information</li>
              </ul>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-base font-medium text-emerald-700 mb-2">Vehicle Handling Procedures</h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>Always use seat covers and floor mats</li>
                <li>Adjust seat and mirrors only when necessary</li>
                <li>No testing of vehicle features (radio, climate control, etc.)</li>
                <li>Drive at safe speeds - no more than 5 mph in parking areas</li>
                <li>Park vehicles according to designated layout plan</li>
                <li>Lock all vehicles and store keys securely</li>
                <li>Document any pre-existing damage before moving vehicle</li>
              </ul>
            </div>
          </div>
          
          <Separator className="my-8" />
          
          <h2 className="text-lg font-medium mb-4">Operational Procedures</h2>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-emerald-700">Customer Service Protocol</AccordionTrigger>
              <AccordionContent>
                <ol className="list-decimal pl-5 space-y-2 text-gray-700">
                  <li>Greet customers within 30 seconds of arrival</li>
                  <li>Open doors for all passengers</li>
                  <li>Provide clear instructions about retrieval process</li>
                  <li>Issue claim ticket and explain retrieval procedure</li>
                  <li>Thank customers upon departure</li>
                  <li>Handle complaints professionally and escalate to shift leader when needed</li>
                </ol>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-emerald-700">Parking Operations</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 text-gray-700">
                  <p>All valets must follow the standardized parking process:</p>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Inspect vehicle for damage before moving (note any existing damage)</li>
                    <li>Adjust seat only if necessary for safe operation</li>
                    <li>Follow designated route to parking area</li>
                    <li>Park in assigned zones according to shift instructions</li>
                    <li>Return keys to secure key storage area</li>
                    <li>Record parking location on ticket system</li>
                  </ol>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-emerald-700">Vehicle Retrieval Process</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 text-gray-700">
                  <p>When retrieving vehicles:</p>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Verify claim ticket matches customer record</li>
                    <li>Retrieve vehicle without delay</li>
                    <li>Position vehicle at designated pickup point</li>
                    <li>Open door for customer</li>
                    <li>Thank customer for their business</li>
                  </ol>
                  <p className="mt-4 font-medium">Response Times:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Retrieve vehicles within 5 minutes during standard volume</li>
                    <li>Maintain 7-10 minute maximum wait during peak periods</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger className="text-emerald-700">Payment Handling</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 text-gray-700">
                  <p>All staff members must follow these payment procedures:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Process all payments according to company protocol</li>
                    <li>Count change back to customer verbally</li>
                    <li>Issue receipts for all transactions</li>
                    <li>Report any payment discrepancies to shift leader immediately</li>
                    <li>Never accept personal tips in lieu of standard payment</li>
                    <li>Only accept approved payment methods (cash, credit cards, validated tickets)</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          <Separator className="my-8" />
          
          <h2 className="text-lg font-medium mb-4">Safety & Emergency Procedures</h2>
          
          <div className="rounded-md border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800 mb-6">
            <h3 className="font-medium mb-2">Emergency Response Protocol</h3>
            <p>In case of emergency:</p>
            <ol className="list-decimal pl-5 mt-2 space-y-1">
              <li>Ensure personal safety and safety of customers</li>
              <li>Contact emergency services if necessary (911)</li>
              <li>Notify shift leader immediately</li>
              <li>Document all incidents thoroughly</li>
              <li>Never admit liability or fault</li>
              <li>Secure the area if needed</li>
            </ol>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-medium text-emerald-700 mb-2">Incident Reporting</h3>
              <p className="text-gray-700 mb-2">
                All incidents must be reported immediately, no matter how minor they may seem.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>Complete incident report form with detailed information</li>
                <li>Take photographs of any damage</li>
                <li>Collect contact information from all involved parties</li>
                <li>Gather statements from witnesses</li>
                <li>Submit all documentation to management within 24 hours</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-base font-medium text-emerald-700 mb-2">Health & Safety</h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>Always use proper lifting techniques</li>
                <li>Do not run in parking areas</li>
                <li>Report hazardous conditions immediately</li>
                <li>Be aware of surroundings at all times</li>
                <li>Know the location of first aid kits and fire extinguishers</li>
                <li>Maintain clear walkways and emergency exits</li>
              </ul>
            </div>
          </div>
          
          <Separator className="my-8" />
          
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <h2 className="text-base font-medium mb-2">Acknowledgment</h2>
            <p className="text-sm text-gray-600">
              These regulations are subject to change. Updates will be communicated through shift leaders. 
              All staff members are responsible for adhering to these guidelines at all times.
              Violations may result in disciplinary action up to and including termination.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}