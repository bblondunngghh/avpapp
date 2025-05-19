import ShiftReportForm from "@/components/shift-report-form";

interface ReportFormProps {
  reportId?: number;
}

export default function ReportForm({ reportId }: ReportFormProps) {
  return <ShiftReportForm reportId={reportId} />;
}
