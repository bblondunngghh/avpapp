import { useEffect } from 'react';
import { useLocation } from 'wouter';

// This component redirects to the mobile admin panel specifically for iPads
export default function MobileRedirect() {
  const [, navigate] = useLocation();
  
  useEffect(() => {
    // Check if we're on an iPad
    const isIPad = /iPad/i.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
                  
    // Additional check specifically for iPad OS
    const isiPadOS = /Macintosh/.test(navigator.userAgent) && 
                   navigator.maxTouchPoints > 1;
    
    // Force desktop admin panel for iPads
    if (isIPad || isiPadOS) {
      console.log("iPad detected, redirecting to desktop admin panel");
      navigate('/admin');
    } else {
      // Check if iPhone for mobile admin
      const isIPhone = /iPhone/i.test(navigator.userAgent);
      if (isIPhone) {
        console.log("iPhone detected, redirecting to mobile admin panel");
        navigate('/mobile-admin');
      } else {
        // Desktop or other devices go to regular admin
        navigate('/admin');
      }
    }
  }, [navigate]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-center">
        Redirecting to the appropriate admin panel for your device...
      </p>
    </div>
  );
}