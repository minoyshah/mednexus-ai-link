import { Link } from "react-router-dom";
import { ArrowLeft, Code, Key, Zap, Shield, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

const API = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Code className="w-4 h-4" />
            Developer API
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Build with MedNet
          </h1>
          <p className="text-xl text-muted-foreground">
            Integrate verified medical professional data into your applications with our secure, HIPAA-compliant API.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="p-6 bg-card rounded-xl border border-border">
            <Key className="w-10 h-10 text-primary mb-4" />
            <h3 className="font-semibold text-foreground text-lg mb-2">OAuth 2.0</h3>
            <p className="text-sm text-muted-foreground">
              Industry-standard authentication with secure token management.
            </p>
          </div>
          <div className="p-6 bg-card rounded-xl border border-border">
            <Zap className="w-10 h-10 text-primary mb-4" />
            <h3 className="font-semibold text-foreground text-lg mb-2">RESTful Endpoints</h3>
            <p className="text-sm text-muted-foreground">
              Clean, predictable API design with comprehensive documentation.
            </p>
          </div>
          <div className="p-6 bg-card rounded-xl border border-border">
            <Shield className="w-10 h-10 text-primary mb-4" />
            <h3 className="font-semibold text-foreground text-lg mb-2">HIPAA Compliant</h3>
            <p className="text-sm text-muted-foreground">
              Built with healthcare security requirements in mind.
            </p>
          </div>
        </div>

        {/* Code Example */}
        <div className="bg-slate-900 rounded-xl p-6 mb-16">
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="w-5 h-5 text-slate-400" />
            <span className="text-sm text-slate-400">Example Request</span>
          </div>
          <pre className="text-sm text-slate-300 overflow-x-auto">
{`curl -X GET "https://api.mednet.com/v1/professionals" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
          </pre>
        </div>

        {/* Endpoints */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-8">Available Endpoints</h2>
          <div className="space-y-4">
            {[
              { method: "GET", endpoint: "/v1/professionals", description: "List verified professionals" },
              { method: "GET", endpoint: "/v1/professionals/:id", description: "Get professional by ID" },
              { method: "GET", endpoint: "/v1/institutions", description: "List verified institutions" },
              { method: "POST", endpoint: "/v1/verify", description: "Submit verification request" },
              { method: "GET", endpoint: "/v1/specialties", description: "List medical specialties" },
            ].map((endpoint) => (
              <div 
                key={endpoint.endpoint} 
                className="p-4 bg-card rounded-lg border border-border flex items-center gap-4"
              >
                <span className={`px-2 py-1 text-xs font-mono rounded ${
                  endpoint.method === 'GET' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'
                }`}>
                  {endpoint.method}
                </span>
                <code className="text-sm text-foreground font-mono">{endpoint.endpoint}</code>
                <span className="text-sm text-muted-foreground ml-auto">{endpoint.description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center p-12 bg-primary/5 rounded-2xl border border-primary/20">
          <h2 className="text-2xl font-bold text-foreground mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-6">
            Contact us for API access and enterprise integration support.
          </p>
          <div className="flex gap-4 justify-center">
            <Button>Request API Access</Button>
            <Link to="/documentation">
              <Button variant="outline">View Full Docs</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default API;
