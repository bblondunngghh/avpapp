import { ReactNode } from "react";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import BottomNavigation from "@/components/layout/bottom-navigation";

interface ThemeWrapperProps {
  children: ReactNode;
}

export default function ThemeWrapper({ children }: ThemeWrapperProps) {
  const [location] = useLocation();
  
  // Determine if we're on an admin or employee page to show/hide normal navigation
  const isAdminPage = location.startsWith('/admin');
  const isEmployeePage = location.startsWith('/employee-dashboard');
  
  return (
    <div className="flex flex-col min-h-screen pb-16">
      {!isAdminPage && !isEmployeePage && <Header />}
      <main className={`${isAdminPage || isEmployeePage ? '' : 'container mx-auto px-4 py-4 mt-16'} flex-grow`}>
        {children}
      </main>
      {!isAdminPage && !isEmployeePage && <BottomNavigation />}
    </div>
  );
}