import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

/**
 * Temporary placeholder component for demo purposes
 * In a real app, this would check authentication properly
 */
export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  // Always show content in admin area - no auth check
  // This is a simplified approach for the demo
  return <>{children}</>;
}