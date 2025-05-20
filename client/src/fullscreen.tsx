import { useEffect } from 'react';

// This component adds fullscreen support for mobile devices
export default function FullscreenSupport() {
  useEffect(() => {
    function handleLoad() {
      // Add a small delay to allow the page to fully render
      setTimeout(() => {
        // For iOS devices
        if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
          window.scrollTo(0, 1);
        }
        
        // Add fullscreen event listener
        document.addEventListener('click', enableFullscreen, { once: true });
      }, 100);
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
        requestFullScreen.call(docEl);
      }
    }
    
    window.addEventListener('load', handleLoad);
    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, []);
  
  return null;
}