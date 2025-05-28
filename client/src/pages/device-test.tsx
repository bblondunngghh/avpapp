import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

export default function DeviceTest() {
  const [, navigate] = useLocation();
  const [deviceInfo, setDeviceInfo] = useState<any>({});

  useEffect(() => {
    const detectDevice = () => {
      const isIPad = /iPad/i.test(navigator.userAgent) || 
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isIPhone = /iPhone/i.test(navigator.userAgent);
      const isiPadOS = /Macintosh/.test(navigator.userAgent) && 
                      navigator.maxTouchPoints > 1;

      const info = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        maxTouchPoints: navigator.maxTouchPoints,
        isIPad,
        isIPhone,
        isiPadOS,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        timestamp: new Date().toISOString()
      };

      setDeviceInfo(info);
      console.log('Device Test Results:', info);
    };

    detectDevice();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Device Detection Test</h1>
      <div className="bg-gray-100 p-4 rounded-lg">
        <pre className="text-sm overflow-auto">
          {JSON.stringify(deviceInfo, null, 2)}
        </pre>
      </div>
      <div className="mt-4 space-x-4">
        <button 
          onClick={() => navigate('/admin')}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Go to /admin
        </button>
        <button 
          onClick={() => navigate('/mobile-admin')}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Go to /mobile-admin
        </button>
        <button 
          onClick={() => navigate('/')}
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
}