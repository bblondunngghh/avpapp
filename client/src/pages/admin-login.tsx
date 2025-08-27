import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Lock, Home, Fingerprint, Scan } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import houseIcon from "@assets/House-3--Streamline-Ultimate.png";
import lockShieldIcon from "@assets/Lock-Shield--Streamline-Ultimate.png";
import irisIcon from "@assets/Iris-Scan-Approved--Streamline-Ultimate.png";

// Define the admin password
const ADMIN_PASSWORD = "cg2023";

// Define form schema with zod
const formSchema = z.object({
  password: z.string().min(1, { message: "Password is required" })
});

type FormValues = z.infer<typeof formSchema>;

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [isIPad, setIsIPad] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricSetup, setBiometricSetup] = useState(false);
  const { toast } = useToast();
  
  // Check device type and biometric support on mount
  useEffect(() => {
    const checkDeviceType = () => {
      // Check for iPad
      const iPadDevice = /iPad/i.test(navigator.userAgent) || 
                       (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
      // Check for iPhone or iOS device (including mobile simulators)
      const isIOSDevice = /iPhone|iPod/i.test(navigator.userAgent) || 
                       (/iPad|iPhone|iPod/.test(navigator.userAgent)) ||
                       (navigator.platform === 'iPhone') ||
                       (/iPad|iPhone|iPod/.test(navigator.platform)) ||
                       // Also detect mobile simulators in desktop browsers
                       (/Android.*Mobile|Mobile.*Safari/i.test(navigator.userAgent) && window.innerWidth <= 768);
      
      setIsIPad(iPadDevice);
      setIsIOS(isIOSDevice);
      
      console.log("Device detection:", { 
        iPadDevice,
        isIOSDevice,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        touchPoints: navigator.maxTouchPoints
      });
    };
    
    const checkBiometricSupport = async () => {
      try {
        // Check if WebAuthn is supported
        if (window.PublicKeyCredential && 
            typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
          
          const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setBiometricSupported(available);
          
          // Check if admin biometric is already set up
          const storedCredential = localStorage.getItem('admin_biometric_credential');
          setBiometricSetup(!!storedCredential);
          
          console.log("Biometric support:", { available, setup: !!storedCredential });
        }
      } catch (error) {
        console.log("Biometric check failed:", error);
        setBiometricSupported(false);
      }
    };
    
    checkDeviceType();
    checkBiometricSupport();
  }, []);

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: ""
    }
  });

  // Handle biometric authentication setup
  const setupBiometric = async () => {
    if (!biometricSupported) return;
    
    setIsBiometricLoading(true);
    
    try {
      // Generate a random challenge
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      
      // Create credential for admin
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: "Access Valet Parking Admin",
            id: window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode("admin"),
            name: "admin",
            displayName: "Admin User",
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
          },
          timeout: 60000,
        },
      });

      if (credential && 'rawId' in credential) {
        // Store credential ID for later authentication (encode as base64)
        const publicKeyCredential = credential as PublicKeyCredential;
        const rawIdArray = Array.from(new Uint8Array(publicKeyCredential.rawId));
        const credentialId = btoa(String.fromCharCode.apply(null, rawIdArray as any));
        localStorage.setItem('admin_biometric_credential', credentialId);
        setBiometricSetup(true);
        
        toast({
          title: "Biometric setup complete",
          description: "You can now use Face ID or Touch ID to login",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Biometric setup error:", error);
      toast({
        title: "Biometric setup failed",
        description: "Unable to set up biometric authentication. Please try again.",
        variant: "destructive",
      });
    }
    
    setIsBiometricLoading(false);
  };

  // Handle biometric authentication
  const authenticateWithBiometric = async () => {
    if (!biometricSupported || !biometricSetup) return;
    
    setIsBiometricLoading(true);
    
    try {
      const credentialIdBase64 = localStorage.getItem('admin_biometric_credential');
      if (!credentialIdBase64) {
        throw new Error('No biometric credential found');
      }

      // Convert base64 credential ID back to ArrayBuffer
      const credentialId = Uint8Array.from(atob(credentialIdBase64), c => c.charCodeAt(0));

      // Generate a random challenge
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      
      // Authenticate with stored credential
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{
            id: credentialId,
            type: 'public-key',
          }],
          userVerification: 'required',
          timeout: 60000,
        },
      });

      if (assertion) {
        // Import admin auth utility
        const { loginAdmin } = await import("@/lib/admin-auth");
        
        // Set admin session
        loginAdmin();
        
        // Show success toast
        toast({
          title: "Biometric authentication successful",
          description: "Welcome to the admin panel",
          variant: "default",
        });
        
        // Navigate to admin panel
        setTimeout(() => {
          navigate("/admin");
        }, 100);
      }
    } catch (error) {
      console.error("Biometric authentication error:", error);
      toast({
        title: "Biometric authentication failed",
        description: "Please try again or use password login",
        variant: "destructive",
      });
    }
    
    setIsBiometricLoading(false);
  };

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    
    try {
      // Simple password check
      if (data.password === ADMIN_PASSWORD) {
        // Import admin auth utility
        const { loginAdmin } = await import("@/lib/admin-auth");
        
        // Set admin session
        loginAdmin();
        
        // Show success toast
        toast({
          title: "Authentication successful",
          description: "Welcome to the admin panel (session expires after 2 minutes of inactivity)",
          variant: "default",
        });
        
        // Short delay to ensure localStorage is set before navigation
        setTimeout(() => {
          // Detailed device detection for debugging
          const userAgent = navigator.userAgent;
          const platform = navigator.platform;
          const touchPoints = navigator.maxTouchPoints;
          
          console.log("Login device detection:", { userAgent, platform, touchPoints });
          
          // Only iPhone goes to mobile admin, everything else goes to desktop
          const isOnlyIPhone = /iPhone/i.test(userAgent) && !/iPad/i.test(userAgent);
          const isIPad = /iPad/i.test(userAgent) || (platform === 'MacIntel' && touchPoints > 1);
          
          console.log("Device classification:", { isOnlyIPhone, isIPad });
          
          // For now, send everyone to desktop admin panel to fix iPad issue
          console.log("Sending all devices to desktop admin panel");
          navigate("/admin");
        }, 100);
      } else {
        // Show error toast
        toast({
          title: "Authentication failed",
          description: "The password you entered is incorrect",
          variant: "destructive",
        });
        
        // Reset form
        form.reset();
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Authentication error",
        description: "There was a problem processing your login. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] auth-container">
      <div className="flex w-full max-w-md justify-end mb-4 px-4">
        <Button 
          variant="outline"
          size="sm"
          onClick={() => navigate("/")}
          className="bg-gray-800/60 backdrop-blur-sm hover:bg-gray-700/60 text-gray-300 hover:text-white border-gray-700/50 flex items-center gap-1 transition-all duration-300"
        >
          <img src={houseIcon} alt="House" className="h-4 w-4" />
          Return to Home
        </Button>
      </div>
      <Card className="w-full max-w-md mx-4 bg-gray-900/80 backdrop-blur-xl border-gray-800/50 shadow-2xl text-white">
        <CardHeader className="text-center border-b border-gray-800/50">
          <div className="mx-auto bg-gray-800/60 backdrop-blur-sm p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4 border border-gray-700/50">
            <img src={lockShieldIcon} alt="Lock Shield" className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl text-white font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Admin Access</CardTitle>
          <CardDescription className="text-gray-300">
            Enter the admin password to access the administration panel
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Biometric Authentication Section */}
          {biometricSupported && (
            <div className="space-y-4 mb-6">
              {biometricSetup ? (
                <Button 
                  onClick={authenticateWithBiometric}
                  className="w-full bg-gray-800/60 backdrop-blur-xl hover:bg-gray-700/60 text-gray-300 hover:text-white border border-gray-700/50 transition-all duration-300 shadow-lg"
                  disabled={isBiometricLoading}
                  size="lg"
                >
                  {isBiometricLoading ? (
                    "Authenticating..."
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <img src={irisIcon} alt="Biometric" className="h-5 w-5" />
                      Sign in with Face ID / Touch ID
                    </div>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={setupBiometric}
                  variant="outline" 
                  className="w-full bg-gray-800/60 backdrop-blur-xl border-gray-700/50 text-gray-300 hover:bg-gray-700/60 hover:text-white transition-all duration-300 shadow-lg"
                  disabled={isBiometricLoading}
                >
                  {isBiometricLoading ? (
                    "Setting up..."
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Fingerprint className="h-4 w-4" />
                      Set up Face ID / Touch ID
                    </div>
                  )}
                </Button>
              )}
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full bg-gray-700/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gray-900/80 px-2 text-gray-400">
                    Or continue with password
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Password Authentication Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter admin password" 
                        autoComplete="current-password"
                        className="bg-gray-800/60 backdrop-blur-sm border-gray-700/50 text-white placeholder:text-gray-400 focus:outline-none focus:border-white/40 focus:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full bg-gray-800/60 backdrop-blur-xl hover:bg-gray-700/60 text-gray-300 hover:text-white border border-gray-700/50 transition-all duration-300 shadow-lg" 
                disabled={isLoading}
              >
                {isLoading ? "Authenticating..." : "Login with Password"}
              </Button>
            </form>
          </Form>
        </CardContent>
        
        <CardFooter className="text-center text-sm text-gray-400 border-t border-gray-800/50 pt-4">
          <p className="w-full">
            This area is restricted to authorized personnel only.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}