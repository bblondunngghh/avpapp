import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Car, 
  DollarSign, 
  Users, 
  FileText, 
  TrendingUp, 
  Shield, 
  Clock, 
  BarChart3,
  ArrowRight,
  CheckCircle,
  Star
} from "lucide-react";
import newLogoImage from "@assets/AVPLOGO PROPER3_1750779399227.png";
import { getVersionDisplay } from "@/config/version";

export default function Demo() {
  const [, navigate] = useLocation();
  const [currentSection, setCurrentSection] = useState("overview");

  const features = [
    {
      icon: <Car className="h-8 w-8 text-blue-600" />,
      title: "Shift Management",
      description: "Complete shift reporting with vehicle counts, financial tracking, and employee hours",
      benefits: ["Real-time data entry", "Automated calculations", "Multi-location support"]
    },
    {
      icon: <DollarSign className="h-8 w-8 text-green-600" />,
      title: "Financial Tracking",
      description: "Comprehensive payroll management with commission, tips, and tax calculations",
      benefits: ["Automated payroll", "Tax compliance", "Commission tracking"]
    },
    {
      icon: <Users className="h-8 w-8 text-purple-600" />,
      title: "Employee Management",
      description: "Complete employee database with performance tracking and scheduling",
      benefits: ["Biometric login", "Performance analytics", "Scheduling tools"]
    },
    {
      icon: <FileText className="h-8 w-8 text-orange-600" />,
      title: "Document Generation",
      description: "Automated PDF generation for permits, contracts, and compliance documents",
      benefits: ["Legal compliance", "Professional documents", "Template system"]
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-teal-600" />,
      title: "Analytics & Reporting",
      description: "Advanced reporting with CSV exports and performance insights",
      benefits: ["Data insights", "Export capabilities", "Trend analysis"]
    },
    {
      icon: <Shield className="h-8 w-8 text-red-600" />,
      title: "Incident Reporting",
      description: "Complete incident management with automated notifications and documentation",
      benefits: ["Risk management", "Insurance compliance", "Automated alerts"]
    }
  ];

  const demoStats = {
    totalRevenue: "$127,450",
    totalVehicles: "2,847",
    activeEmployees: "23",
    locations: "4",
    monthlyGrowth: "+18%",
    customerSatisfaction: "98.5%"
  };

  const testimonials = [
    {
      company: "The Capital Grille",
      quote: "This system transformed our valet operations. We've seen a 30% increase in efficiency.",
      rating: 5
    },
    {
      company: "BOA Steakhouse",
      quote: "The automated payroll and compliance features saved us countless hours each month.",
      rating: 5
    },
    {
      company: "Truluck's Restaurant",
      quote: "Professional, reliable, and exactly what we needed for our valet service management.",
      rating: 5
    }
  ];

  const pricingTiers = [
    {
      name: "Starter",
      price: "$299/month",
      features: ["Up to 2 locations", "Basic reporting", "Email support", "Mobile responsive"],
      highlight: false
    },
    {
      name: "Professional",
      price: "$599/month",
      features: ["Up to 5 locations", "Advanced analytics", "Document generation", "Priority support", "Custom branding"],
      highlight: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      features: ["Unlimited locations", "Full customization", "API access", "Dedicated support", "On-premise option"],
      highlight: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <img src={newLogoImage} alt="Access Valet Parking" className="h-10 w-auto" />
              <div className="hidden md:flex space-x-6">
                <button 
                  onClick={() => setCurrentSection("overview")}
                  className={`px-3 py-2 text-sm font-medium ${currentSection === "overview" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900"}`}
                >
                  Overview
                </button>
                <button 
                  onClick={() => setCurrentSection("features")}
                  className={`px-3 py-2 text-sm font-medium ${currentSection === "features" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900"}`}
                >
                  Features
                </button>
                <button 
                  onClick={() => setCurrentSection("demo")}
                  className={`px-3 py-2 text-sm font-medium ${currentSection === "demo" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900"}`}
                >
                  Live Demo
                </button>
                <button 
                  onClick={() => setCurrentSection("pricing")}
                  className={`px-3 py-2 text-sm font-medium ${currentSection === "pricing" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900"}`}
                >
                  Pricing
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => navigate("/")} variant="outline">
                Exit Demo
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      {currentSection === "overview" && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Transform Your Valet Operations
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
                Complete management solution for restaurant valet services with automated payroll, compliance tracking, and professional document generation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-gray-100"
                  onClick={() => setCurrentSection("demo")}
                >
                  Try Live Demo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-blue-600"
                  onClick={() => setCurrentSection("pricing")}
                >
                  View Pricing
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Section */}
      {currentSection === "overview" && (
        <div className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Proven Results</h2>
              <p className="text-lg text-gray-600">Real metrics from our current restaurant partners</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-8">
              {Object.entries(demoStats).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{value}</div>
                  <div className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      {(currentSection === "features" || currentSection === "overview") && (
        <div className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Comprehensive Features</h2>
              <p className="text-lg text-gray-600">Everything you need to manage your valet operations professionally</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-4">
                      {feature.icon}
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{feature.description}</p>
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-700">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Live Demo Section */}
      {currentSection === "demo" && (
        <div className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Interactive Demo</h2>
              <p className="text-lg text-gray-600">Experience the full system with real restaurant data</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-4">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => navigate("/shift-report/1")}
                  >
                    <Car className="mr-2 h-4 w-4" />
                    Submit Shift Report
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => navigate("/admin-login")}
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Admin Dashboard
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => navigate("/contracts")}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Documents
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => navigate("/incident-report")}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Report Incident
                  </Button>
                </div>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">System Highlights</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Real-time data synchronization</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Mobile-optimized interface</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm">Automated compliance tracking</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm">Professional PDF generation</span>
                  </div>
                </div>
              </Card>
            </div>

            <div className="bg-blue-50 rounded-lg p-8 text-center">
              <h3 className="text-2xl font-semibold text-blue-900 mb-4">Ready to Experience the Full System?</h3>
              <p className="text-blue-700 mb-6">Click any button above to interact with the live application and see how it works with real restaurant operations.</p>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Version {getVersionDisplay().replace('v', '')} - Production Ready
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Section */}
      {currentSection === "pricing" && (
        <div className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
              <p className="text-lg text-gray-600">Choose the plan that fits your restaurant's needs</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {pricingTiers.map((tier, index) => (
                <Card key={index} className={`relative ${tier.highlight ? "border-blue-500 shadow-lg scale-105" : ""}`}>
                  {tier.highlight && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{tier.name}</CardTitle>
                    <div className="text-3xl font-bold text-blue-600 mt-4">{tier.price}</div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className={`w-full mt-6 ${tier.highlight ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                      variant={tier.highlight ? "default" : "outline"}
                    >
                      Get Started
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Testimonials */}
      {currentSection === "overview" && (
        <div className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Clients Say</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 italic">"{testimonial.quote}"</p>
                  <div className="font-semibold text-gray-900">{testimonial.company}</div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Valet Operations?</h2>
          <p className="text-xl text-blue-100 mb-8">Join leading restaurants already using our platform</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100"
              onClick={() => setCurrentSection("demo")}
            >
              Start Free Trial
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-blue-600"
            >
              Schedule Demo Call
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <img src={newLogoImage} alt="Access Valet Parking" className="h-10 w-auto mb-4" />
              <p className="text-gray-400">Professional valet management solutions for the hospitality industry.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Features</li>
                <li>Pricing</li>
                <li>Security</li>
                <li>Integrations</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>About</li>
                <li>Careers</li>
                <li>Press</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Documentation</li>
                <li>Help Center</li>
                <li>Training</li>
                <li>Status</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Access Valet Parking. All rights reserved. Version {getVersionDisplay().replace('v', '')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}