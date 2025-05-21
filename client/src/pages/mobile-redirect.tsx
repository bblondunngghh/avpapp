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
    
    // If we're on an iPad, redirect to mobile admin panel
    if (isIPad || isiPadOS) {
      console.log("iPad detected, redirecting to mobile admin panel");
      navigate('/mobile-admin');
    } else {
      // If not iPad, go to regular admin
      navigate('/admin');
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