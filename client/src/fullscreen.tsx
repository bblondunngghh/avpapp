import { useEffect, useState } from 'react';

// This component adds fullscreen support for mobile devices and iPads
export default function FullscreenSupport() {
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if device is iOS (iPhone, iPad, iPod)
    const checkIsIOS = () => {
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                          (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      setIsIOS(isIOSDevice);
      return isIOSDevice;
    };

    function handleLoad() {
      // Add a small delay to allow the page to fully render
      setTimeout(() => {
        const isIOSDevice = checkIsIOS();
        
        // For iOS devices - hide address bar by scrolling down
        if (isIOSDevice) {
          window.scrollTo(0, 1);
        }
        
        // Add fullscreen event listener for first user interaction
        document.addEventListener('click', enableFullscreen, { once: true });
        
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
    
    // Don't add the iPad class as it's causing scrolling issues
    // if (checkIsIOS() && window.innerWidth >= 768) {
    //   document.body.classList.add('ipad-view');
    // }
    
    window.addEventListener('load', handleLoad);
    
    return () => {
      window.removeEventListener('load', handleLoad);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [isIOS]);
  
  return null;
}