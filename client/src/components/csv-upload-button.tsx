import { useNavigate } from "wouter";
import { Button } from "@/components/ui/button";
import { FileUp } from "lucide-react";

export default function CSVUploadButton() {
  const [_, navigate] = useNavigate();

  return (
    <Button 
      onClick={() => navigate("/admin/csv-upload")}
      variant="outline"
      className="flex items-center gap-2 bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
    >
      <FileUp className="h-4 w-4" />
      CSV Upload
    </Button>
  );
}