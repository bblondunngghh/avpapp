import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { employeeWorkedInShift, findEmployeeInShift } from "@/lib/employee-utils";
import { formatDateForDisplay, parseReportDate } from "@/lib/timezone";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { LogOut, FileSpreadsheet, Users, Home, Download, FileDown, MapPin, BarChart as BarChartIcon, Ticket, PlusCircle, ArrowUpDown, Calendar, LineChart as LineChartIcon, PieChart as PieChartIcon, TrendingUp, Activity, DollarSign, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { 
  BarChart, 
  LineChart, 
  PieChart,
  Line,
  Pie,
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell,
  Area,
  AreaChart,
  ComposedChart
} from 'recharts';
import { LOCATIONS, EMPLOYEE_NAMES } from "@/lib/constants";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Define types for our data
interface Employee {
  name: string;
  hours: number;
}

interface EmployeeRecord {
  id: number;
  key: string;
  fullName: string;
  isActive: boolean;
  isShiftLeader: boolean;
  phone: string | null;
  email: string | null;
  hireDate: string;
  terminationDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

interface TicketDistribution {
  id: number;
  locationId: number;
  allocatedTickets: number;
  usedTickets: number;
  batchNumber: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

interface ShiftReport {
  id: number;
  locationId: number;
  date: string;
  shift: string;
  shiftLeader: string;
  totalCars: number;
  totalCreditSales: number;
  totalCashCollected: number;
  companyCashTurnIn: number;
  totalTurnIn: number;
  creditTransactions: number;
  totalReceipts: number;
  totalReceiptSales: number;
  employees: Employee[];
  totalJobHours: number;
  createdAt: string;
}

interface TicketDistribution {
  id: number;
  locationId: number;
  allocatedTickets: number;
  usedTickets: number;
  batchNumber: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export default function AdminPanel() {
  const [, navigate] = useLocation();
