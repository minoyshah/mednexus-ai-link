import { CheckCircle2, Shield, UserCheck, Building, FileCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const Verification = () => {
  const steps = [
    {
      icon: UserCheck,
      title: "Identity Submission",
      description: "Submit your medical credentials, license number, and institutional affiliation.",
    },
    {
      icon: FileCheck,
      title: "Database Verification",
      description: "Your credentials are verified against national licensing databases and NPI registry.",
    },
    {
      icon: Building,
      title: "Institution Confirmation",
      description: "Institutional email verification and optional employer confirmation.",
    },
    {
      icon: Shield,
      title: "Access Granted",
      description: "Full platform access with role-specific permissions and verified status.",
    },
  ];

  const roles = [
    { role: "Physicians", description: "Attendings & Fellows", verified: true },
    { role: "Residents", description: "Training Programs", verified: true },
    { role: "Medical Students", description: "Enrolled Programs", verified: true },
    { role: "Researchers", description: "Academic & Industry", verified: true },
    { role: "Allied Health", description: "NPs, PAs, RNs", verified: true },
    { role: "Industry", description: "Pharma & MedTech", verified: true },
  ];

  return (
    <section id="verification" className="py-24 bg-secondary/30 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-50">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-trust/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-trust/10 text-trust text-sm font-medium mb-4">
            <Shield className="w-3.5 h-3.5" />
            Trust Infrastructure
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Verification Is Not Optional
          </h2>
          <p className="text-muted-foreground text-lg">
            Every user must verify their credentials before posting, messaging, or joining discussions. 
            This is the foundation of MedNet's trusted environment.
          </p>
        </div>

        {/* Verification Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              <div className="p-6 rounded-xl bg-card border border-border h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent text-accent-foreground text-sm font-bold">
                    {index + 1}
                  </div>
                  <step.icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-border" />
              )}
            </div>
          ))}
        </div>

        {/* Roles Grid */}
        <div className="bg-card rounded-2xl border border-border p-8">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-semibold text-foreground">
              Average verification time: <span className="text-accent">24 hours</span>
            </h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {roles.map((item) => (
              <div key={item.role} className="text-center p-4 rounded-lg bg-secondary/50 border border-border">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-5 h-5 text-trust" />
                </div>
                <div className="font-medium text-foreground text-sm">{item.role}</div>
                <div className="text-xs text-muted-foreground">{item.description}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Button variant="trust" size="lg">
              Begin Verification Process
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Verification;
