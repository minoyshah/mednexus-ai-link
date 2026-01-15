import { 
  ShieldCheck, 
  Users, 
  Brain, 
  Video, 
  MessageSquare, 
  TrendingUp,
  BookOpen,
  Building2,
  Lock
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: ShieldCheck,
      title: "Credential Verification",
      description: "Every user verified against licensing databases. No imposters, no bots—just real medical professionals.",
      color: "accent",
    },
    {
      icon: Users,
      title: "Specialty Networks",
      description: "Connect within your specialty. Content discovery driven by expertise, not popularity metrics.",
      color: "trust",
    },
    {
      icon: Brain,
      title: "AI Study Engine",
      description: "AAMC-style practice questions, adaptive learning, and board-prep tools powered by medical AI.",
      color: "accent",
    },
    {
      icon: Video,
      title: "Secure Collaboration",
      description: "Encrypted video calls, screen sharing, and meeting rooms designed for clinical discussions.",
      color: "trust",
    },
    {
      icon: MessageSquare,
      title: "Spam-Free Messaging",
      description: "Rate-limited direct messaging with consent-based inbox. Quality over quantity.",
      color: "accent",
    },
    {
      icon: TrendingUp,
      title: "Career Development",
      description: "Job opportunities, recruiter connections, and career path visualization for medical professionals.",
      color: "trust",
    },
  ];

  return (
    <section id="features" className="py-24 bg-background relative">
      {/* Section Header */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            <Lock className="w-3.5 h-3.5" />
            Built for Trust
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Everything Medicine Needs. Nothing It Doesn't.
          </h2>
          <p className="text-muted-foreground text-lg">
            A purpose-built platform combining professional networking, secure collaboration, 
            and AI-powered education—all within a verified ecosystem.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>

        {/* Bottom Highlight */}
        <div className="mt-16 p-8 rounded-2xl bg-secondary/50 border border-border">
          <div className="grid md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-2">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Designed for Institutions
              </h3>
              <p className="text-muted-foreground">
                Hospitals, universities, and health systems can deploy MedNet for internal 
                communication, grand rounds, and verified staff coordination.
              </p>
            </div>
            <div className="flex items-center justify-center md:justify-end gap-4">
              <Building2 className="w-12 h-12 text-accent" />
              <BookOpen className="w-12 h-12 text-trust" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({ 
  feature, 
  index 
}: { 
  feature: { icon: React.ElementType; title: string; description: string; color: string }; 
  index: number;
}) => {
  const Icon = feature.icon;
  const isAccent = feature.color === "accent";
  
  return (
    <div 
      className="group p-6 rounded-xl bg-card border border-border hover:border-accent/30 transition-all duration-300 hover:shadow-lg"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${
        isAccent ? 'bg-accent/10 text-accent' : 'bg-trust/10 text-trust'
      }`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
        {feature.title}
      </h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {feature.description}
      </p>
    </div>
  );
};

export default Features;
