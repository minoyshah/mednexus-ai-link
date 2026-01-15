import { Button } from "@/components/ui/button";
import { ShieldCheck, Users, Brain, Video, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  const trustIndicators = [
    "License Verified",
    "NPI Authenticated",
    "Institution Confirmed",
  ];

  return (
    <section className="relative min-h-screen hero-gradient overflow-hidden">
      {/* Glow Effect */}
      <div className="absolute inset-0 glow-overlay pointer-events-none" />
      
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-8 animate-fade-up">
            <ShieldCheck className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">Verification-First Professional Network</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-6 animate-fade-up delay-100">
            The Professional Operating System for{" "}
            <span className="text-gradient-accent">Modern Medicine</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-primary-foreground/70 max-w-2xl mx-auto mb-8 animate-fade-up delay-200">
            Connect with verified physicians, researchers, and medical professionals. 
            Every interaction occurs in a trusted, high-signal environment—no noise, no spam.
          </p>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-4 mb-10 animate-fade-up delay-300">
            {trustIndicators.map((indicator) => (
              <div key={indicator} className="flex items-center gap-2 text-sm text-primary-foreground/60">
                <CheckCircle2 className="w-4 h-4 text-trust" />
                <span>{indicator}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-up delay-400">
            <Button variant="hero" size="xl" className="w-full sm:w-auto" asChild>
              <Link to="/signup">
                Start Verification
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="heroOutline" size="xl" className="w-full sm:w-auto" asChild>
              <Link to="/features">Explore Features</Link>
            </Button>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 animate-fade-up delay-500">
            <FeaturePill icon={Users} label="Professional Network" />
            <FeaturePill icon={Video} label="Secure Collaboration" />
            <FeaturePill icon={Brain} label="AI Study Tools" />
          </div>
        </div>

        {/* Floating Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto mt-20 animate-fade-up delay-500">
          <StatCard number="50,000+" label="Verified Physicians" />
          <StatCard number="200+" label="Medical Institutions" />
          <StatCard number="35+" label="Specialties Covered" />
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

const FeaturePill = ({ icon: Icon, label }: { icon: React.ElementType; label: string }) => (
  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground/80 text-sm">
    <Icon className="w-4 h-4" />
    <span>{label}</span>
  </div>
);

const StatCard = ({ number, label }: { number: string; label: string }) => (
  <div className="text-center p-6 rounded-xl bg-primary-foreground/5 border border-primary-foreground/10 backdrop-blur-sm">
    <div className="text-3xl font-bold text-primary-foreground mb-1">{number}</div>
    <div className="text-sm text-primary-foreground/60">{label}</div>
  </div>
);

export default Hero;
