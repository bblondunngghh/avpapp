import { useEffect, useState } from 'react';

// This component adds fullscreen support only for mobile devices and iPads, not desktop browsers
export default function FullscreenSupport() {
  const [isIOS, setIsIOS] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    // Check if device is iOS (iPhone, iPad, iPod)
    const checkIsIOS = () => {
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                          (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      setIsIOS(isIOSDevice);
      return isIOSDevice;
    };
    
    // Check if device is a mobile device (including iPad)
    const checkIsMobileDevice = () => {
      // Regular expression to detect mobile devices
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      
      // Check if it's a mobile device based on user agent
      const isMobile = mobileRegex.test(navigator.userAgent);
      
      // Additional check for iPad on newer iOS (which reports as MacIntel)
      const isModernIPad = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
      
      const result = isMobile || isModernIPad;
      setIsMobileDevice(result);
      return result;
    };

    function handleLoad() {
      // Add a small delay to allow the page to fully render
      setTimeout(() => {
        const isIOSDevice = checkIsIOS();
        const isMobile = checkIsMobileDevice();
        
        // For iOS devices - hide address bar by scrolling down
        if (isIOSDevice) {
          window.scrollTo(0, 1);
        }
        
        // Only add fullscreen event listener for mobile devices
        if (isMobile) {
          document.addEventListener('click', enableFullscreen, { once: true });
        }
        
        // For iPad - ensure proper orientation change handling
        if (isIOSDevice && window.innerWidth >= 768) {
          window.addEventListener('orientationchange', handleOrientationChange);
        }
      }, 100);
    }
    
    function handleOrientationChange() {
      // Fix for iPad orientation changes - re-apply fullscreen
      setTimeout(() => {
        window.scrollTo(0, 1);
      }, 300);
    }
    
    function enableFullscreen() {
      // Only attempt fullscreen on mobile devices
      if (!isMobileDevice) return;
      
      // Try to enable fullscreen mode on interaction
      const doc = window.document as any;
      const docEl = doc.documentElement;

      const requestFullScreen = 
        docEl.requestFullscreen || 
        docEl.mozRequestFullScreen || 
        docEl.webkitRequestFullScreen || 
        docEl.msRequestFullscreen;
      
      if (requestFullScreen && !doc.fullscreenElement) {
        requestFullScreen.call(docEl).catch(() => {
          // If regular fullscreen fails (as it often does on iOS), use iOS-specific approach
          if (isIOS) {
            window.scrollTo(0, 1);
          }
        });
      } else if (isIOS) {
        // iOS fallback if fullscreen API doesn't work
        window.scrollTo(0, 1);
      }
    }
    
    // Initialize detection
    checkIsIOS();
    checkIsMobileDevice();
    
    window.addEventListener('load', handleLoad);
    
    return () => {
      window.removeEventListener('load', handleLoad);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [isIOS, isMobileDevice]);
  
  return null;
}