import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";

export default function CSVAccessButton() {
  const [_, setLocation] = useLocation();

  return (
    <Button 
      onClick={() => setLocation("/admin/csv-upload")}
      variant="outline"
      className="flex items-center gap-2 bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
    >
      <FileSpreadsheet className="h-4 w-4" />
      CSV Upload
    </Button>
  );
}