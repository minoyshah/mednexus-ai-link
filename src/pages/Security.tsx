import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Lock, Eye, Server, Key, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const Security = () => {
  const features = [
    { icon: Lock, title: "End-to-End Encryption", description: "All data is encrypted in transit and at rest using AES-256 encryption." },
    { icon: Shield, title: "HIPAA Compliance", description: "Our infrastructure meets all HIPAA security requirements for healthcare data." },
    { icon: Eye, title: "Privacy by Design", description: "Privacy controls are built into every feature from the ground up." },
    { icon: Server, title: "SOC 2 Certified", description: "Annual third-party audits verify our security controls and processes." },
    { icon: Key, title: "Multi-Factor Auth", description: "Secure your account with multiple authentication factors." },
    { icon: FileCheck, title: "Regular Audits", description: "Continuous security monitoring and penetration testing." },
  ];

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
            <Shield className="w-4 h-4" />
            Enterprise-Grade Security
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Your Data is Safe With Us
          </h1>
          <p className="text-xl text-muted-foreground">
            MedNet is built with security at its core. We employ industry-leading practices 
            to protect your professional data and communications.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature) => (
            <div key={feature.title} className="p-6 bg-card rounded-xl border border-border">
              <feature.icon className="w-10 h-10 text-primary mb-4" />
              <h3 className="font-semibold text-foreground text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Certifications */}
        <div className="bg-muted/50 rounded-2xl p-8 mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Certifications & Compliance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {["SOC 2 Type II", "HIPAA", "ISO 27001", "HITRUST CSF"].map((cert) => (
              <div key={cert} className="bg-card rounded-xl p-6 text-center border border-border">
                <Shield className="w-8 h-8 text-primary mx-auto mb-3" />
                <span className="font-medium text-foreground">{cert}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Security Practices */}
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-8">Our Security Practices</h2>
          <div className="space-y-6 text-muted-foreground">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Infrastructure Security</h3>
              <p>Our platform runs on enterprise-grade cloud infrastructure with 24/7 monitoring, 
              automatic threat detection, and geographic redundancy for maximum availability.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Access Controls</h3>
              <p>We implement strict role-based access controls, ensuring employees only have access 
              to the systems they need. All access is logged and regularly audited.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Vulnerability Management</h3>
              <p>Regular penetration testing by third-party security firms, automated vulnerability 
              scanning, and a responsible disclosure program help us stay ahead of threats.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Incident Response</h3>
              <p>Our dedicated security team maintains detailed incident response procedures, 
              with regular drills to ensure rapid response to any security events.</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center p-12 bg-primary/5 rounded-2xl border border-primary/20">
          <h2 className="text-2xl font-bold text-foreground mb-4">Have Security Questions?</h2>
          <p className="text-muted-foreground mb-6">
            Our security team is available to answer questions and provide documentation for compliance reviews.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/contact">
              <Button>Contact Security Team</Button>
            </Link>
            <Link to="/legal?tab=compliance">
              <Button variant="outline">View Compliance Docs</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Security;
