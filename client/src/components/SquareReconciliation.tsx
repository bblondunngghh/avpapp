import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, CheckCircle, DollarSign, CreditCard } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ShiftReport } from "@shared/schema";

interface SquareDailySales {
  date: string;
  totalSales: number;
  cardTransactions: number;
  cardSales: number;
  tips: number;
  transactions: SquareTransaction[];
}

interface SquareTransaction {
  id: string;
  amount: number;
  tipAmount: number;
  createdAt: string;
  cardBrand?: string;
  lastFour?: string;
}

interface ReconciliationResult {
  match: boolean;
  discrepancies: string[];
  squareData: SquareDailySales;
  differences: {
    creditTransactions: number;
    creditSales: number;
    tips: number;
  };
}

export default function SquareReconciliation() {
  const [selectedShiftReport, setSelectedShiftReport] = useState<ShiftReport | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const { toast } = useToast();

  // Fetch shift reports for selection
  const { data: shiftReports, isLoading: shiftReportsLoading } = useQuery({
    queryKey: ['/api/shift-reports'],
    queryFn: () => apiRequest('/api/shift-reports')
  });

  // Fetch Square daily sales data
  const { data: squareData, isLoading: squareDataLoading, refetch: refetchSquareData } = useQuery({
    queryKey: ['/api/square/daily-sales', selectedDate],
    queryFn: () => apiRequest(`/api/square/daily-sales/${selectedDate}`),
    enabled: !!selectedDate
  });

  // Create test payment mutation
  const createTestPaymentMutation = useMutation({
    mutationFn: async ({ amount, tipAmount }: { amount: number; tipAmount: number }) =>
      apiRequest('/api/square/create-test-payment', {
        method: 'POST',
        body: JSON.stringify({ amount, tipAmount }),
        headers: {
          'Content-Type': 'application/json'
        }
      }),
    onSuccess: (data) => {
      toast({
        title: "Test Payment Created",
        description: `Successfully created test payment for $${data.payment.amountMoney?.amount / 100} + $${data.payment.tipMoney?.amount / 100 || 0} tip`,
      });
      // Refresh Square data if date is selected
      if (selectedDate) {
        refetchSquareData();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Test Payment Failed",
        description: error.message || "Failed to create test payment",
        variant: "destructive",
      });
    }
  });

  // Reconciliation mutation
  const reconciliationMutation = useMutation({
    mutationFn: async ({ shiftReportId, date }: { shiftReportId: number; date: string }) =>
      apiRequest('/api/square/reconcile', {
        method: 'POST',
        body: JSON.stringify({ shiftReportId, date }),
        headers: {
          'Content-Type': 'application/json'
        }
      }),
    onSuccess: () => {
      toast({
        title: "Reconciliation Complete",
        description: "Square data has been reconciled with the shift report.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Reconciliation Failed",
        description: error.message || "Failed to reconcile Square data",
        variant: "destructive",
      });
    }
  });

  const handleReconcile = () => {
    if (!selectedShiftReport || !selectedDate) {
      toast({
        title: "Missing Information",
        description: "Please select both a shift report and date.",
        variant: "destructive",
      });
      return;
    }

    reconciliationMutation.mutate({ 
      shiftReportId: selectedShiftReport.id, 
      date: selectedDate 
    });
  };

  const reconciliationResult = reconciliationMutation.data as ReconciliationResult | undefined;

  return (
    <div className="relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 backdrop-blur-xl shadow-2xl p-6">
      {/* Glass morphism overlay */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
      
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
      
      <div className="relative z-10">
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <CreditCard className="h-6 w-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Square Revenue Reconciliation</h2>
          </div>
          <p className="text-slate-400">
            Compare Square POS data with shift reports to identify discrepancies
          </p>
        </div>

        <div className="space-y-6">
          {/* Selection Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-white mb-2 block">Select Shift Report</label>
              <Select
                onValueChange={(value) => {
                  const report = shiftReports?.find((r: ShiftReport) => r.id.toString() === value);
                  setSelectedShiftReport(report || null);
                  setSelectedDate(report?.date || "");
                }}
              >
                <SelectTrigger className="bg-white/10 backdrop-blur-sm text-white border-white/20">
                  <SelectValue placeholder="Choose a shift report" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/20 text-white backdrop-blur-sm">
                  {shiftReports?.map((report: ShiftReport) => (
                    <SelectItem key={report.id} value={report.id.toString()} className="text-white bg-transparent hover:!bg-blue-500 focus:!bg-blue-600 cursor-pointer">
                      {report.date} - {report.shift} ({report.manager})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-white mb-2 block">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => createTestPaymentMutation.mutate({ amount: 2000, tipAmount: 300 })}
              disabled={createTestPaymentMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {createTestPaymentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Test Payment ($20 + $3 tip)
            </Button>

            <Button
              onClick={() => selectedDate && refetchSquareData()}
              disabled={!selectedDate || squareDataLoading}
              className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20"
            >
              {squareDataLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Fetch Square Data
            </Button>

            <Button
              onClick={handleReconcile}
              disabled={!selectedShiftReport || !selectedDate || reconciliationMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {reconciliationMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reconcile
            </Button>
          </div>

          {/* Square Data Display */}
          {squareData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Card Transactions</p>
                    <p className="text-2xl font-bold text-white">{squareData.cardTransactions}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-blue-400" />
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Card Sales</p>
                    <p className="text-2xl font-bold text-white">${squareData.cardSales.toFixed(2)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-400" />
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Tips</p>
                    <p className="text-2xl font-bold text-white">${squareData.tips.toFixed(2)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-yellow-400" />
                </div>
              </div>
            </div>
          )}

          {/* Reconciliation Results */}
          {reconciliationResult && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                {reconciliationResult.match ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                )}
                <Badge 
                  variant={reconciliationResult.match ? "default" : "destructive"}
                  className={reconciliationResult.match ? "bg-green-600" : "bg-yellow-600"}
                >
                  {reconciliationResult.match ? "Perfect Match" : "Discrepancies Found"}
                </Badge>
              </div>

              {!reconciliationResult.match && (
                <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Discrepancies:</h4>
                  <ul className="space-y-1">
                    {reconciliationResult.discrepancies.map((discrepancy, index) => (
                      <li key={index} className="text-sm text-red-300 flex items-start">
                        <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                        {discrepancy}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Comparison Table */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-white/10">
                    <tr>
                      <th className="px-4 py-2 text-left text-white font-medium">Metric</th>
                      <th className="px-4 py-2 text-left text-white font-medium">Square</th>
                      <th className="px-4 py-2 text-left text-white font-medium">Shift Report</th>
                      <th className="px-4 py-2 text-left text-white font-medium">Difference</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300">
                    <tr className="border-t border-white/10">
                      <td className="px-4 py-2">Credit Transactions</td>
                      <td className="px-4 py-2">{reconciliationResult.squareData.cardTransactions}</td>
                      <td className="px-4 py-2">{selectedShiftReport?.creditTransactions}</td>
                      <td className={`px-4 py-2 ${reconciliationResult.differences.creditTransactions !== 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {reconciliationResult.differences.creditTransactions > 0 ? '+' : ''}{reconciliationResult.differences.creditTransactions}
                      </td>
                    </tr>
                    <tr className="border-t border-white/10">
                      <td className="px-4 py-2">Credit Sales</td>
                      <td className="px-4 py-2">${reconciliationResult.squareData.cardSales.toFixed(2)}</td>
                      <td className="px-4 py-2">${selectedShiftReport?.totalCreditSales?.toFixed(2)}</td>
                      <td className={`px-4 py-2 ${Math.abs(reconciliationResult.differences.creditSales) > 0.01 ? 'text-red-400' : 'text-green-400'}`}>
                        ${reconciliationResult.differences.creditSales > 0 ? '+' : ''}${reconciliationResult.differences.creditSales.toFixed(2)}
                      </td>
                    </tr>
                    <tr className="border-t border-white/10">
                      <td className="px-4 py-2">Credit Tips</td>
                      <td className="px-4 py-2">${reconciliationResult.squareData.tips.toFixed(2)}</td>
                      <td className="px-4 py-2">${(selectedShiftReport as any)?.ccTips?.toFixed(2) || '0.00'}</td>
                      <td className={`px-4 py-2 ${Math.abs(reconciliationResult.differences.tips) > 0.01 ? 'text-red-400' : 'text-green-400'}`}>
                        ${reconciliationResult.differences.tips > 0 ? '+' : ''}${reconciliationResult.differences.tips.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}