import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, AlertTriangle, ChevronLeft } from "lucide-react";

export default function ReportSelection() {
  const [, navigate] = useLocation();

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Button 
        variant="ghost" 
        onClick={() => navigate("/")} 
        className="mb-6 p-0 h-8 w-8"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      
      <h1 className="text-2xl md:text-3xl font-bold text-center text-blue-800 mb-8">
        Select Report Type
      </h1>
      
      <div className="grid gap-6">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow border-blue-100 hover:border-blue-300"
          onClick={() => navigate("/new-report")}
        >
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="bg-blue-100 p-2 rounded-full">
              <ClipboardCheck className="h-8 w-8 text-blue-700" />
            </div>
            <div>
              <CardTitle className="text-lg text-blue-800">Shift Report</CardTitle>
              <CardDescription>Create a new shift report for a location</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Use this form to record shift details including:
            </p>
            <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1 mb-4">
              <li>Number of cars parked</li>
              <li>Credit card and cash transactions</li>
              <li>Employee hours and pay</li>
              <li>Financial summaries</li>
            </ul>
            <div className="flex justify-end">
              <Button variant="outline" className="text-blue-600 border-blue-200">
                Create Shift Report
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow border-amber-100 hover:border-amber-300"
          onClick={() => navigate("/incident-report")}
        >
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="bg-amber-100 p-2 rounded-full">
              <AlertTriangle className="h-8 w-8 text-amber-700" />
            </div>
            <div>
              <CardTitle className="text-lg text-amber-800">Incident Report</CardTitle>
              <CardDescription>Report an incident or issue at a location</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Use this form to document incidents such as:
            </p>
            <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1 mb-4">
              <li>Vehicle damage or accidents</li>
              <li>Customer complaints</li>
              <li>Safety concerns</li>
              <li>Equipment issues</li>
            </ul>
            <div className="flex justify-end">
              <Button variant="outline" className="text-amber-600 border-amber-200">
                Create Incident Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}