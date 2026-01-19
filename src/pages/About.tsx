import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Users, Award, Globe } from "lucide-react";

const About = () => {
  const stats = [
    { label: "Verified Professionals", value: "50,000+" },
    { label: "Institutions", value: "500+" },
    { label: "Countries", value: "45" },
    { label: "Daily Connections", value: "10,000+" },
  ];

  const team = [
    { name: "Dr. Sarah Chen", role: "CEO & Co-Founder", bio: "Former Chief Medical Officer at Stanford Health" },
    { name: "Dr. Michael Torres", role: "CTO & Co-Founder", bio: "Ex-Google Health, MIT PhD in Biomedical Informatics" },
    { name: "Dr. Emily Watson", role: "Chief Medical Officer", bio: "Board-certified internist, 20 years clinical experience" },
    { name: "James Park", role: "VP of Engineering", bio: "Former LinkedIn, expert in professional networks" },
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
            <ShieldCheck className="w-4 h-4" />
            Our Mission
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Building Trust in Medical Professional Networking
          </h1>
          <p className="text-xl text-muted-foreground">
            MedNet was founded on a simple belief: medical professionals deserve a platform 
            where they can trust that every connection is verified and every interaction is meaningful.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center p-6 bg-card rounded-xl border border-border">
              <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Story */}
        <div className="max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-foreground mb-6">Our Story</h2>
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-muted-foreground">
            <p>
              MedNet was born in 2024 when our founders, both physicians, grew frustrated with existing 
              professional networks. Too often, they encountered unverified accounts, spam, and a lack 
              of trust that undermined meaningful professional connections.
            </p>
            <p>
              They envisioned a platform where verification comes first—where every member's credentials 
              are confirmed before they can participate. This verification-first approach has become the 
              foundation of everything we do.
            </p>
            <p>
              Today, MedNet serves over 50,000 verified medical professionals across 45 countries. Our 
              platform enables trusted connections, knowledge sharing, and career advancement in a 
              secure, HIPAA-compliant environment.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-card rounded-xl border border-border">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Trust First</h3>
              <p className="text-muted-foreground">
                Every feature we build starts with the question: does this maintain and enhance trust?
              </p>
            </div>
            <div className="text-center p-8 bg-card rounded-xl border border-border">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Community Driven</h3>
              <p className="text-muted-foreground">
                Our platform is shaped by the needs of medical professionals, for medical professionals.
              </p>
            </div>
            <div className="text-center p-8 bg-card rounded-xl border border-border">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Globe className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Global Impact</h3>
              <p className="text-muted-foreground">
                We're building bridges across borders to advance medicine worldwide.
              </p>
            </div>
          </div>
        </div>

        {/* Team */}
        <div>
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">Leadership Team</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member) => (
              <div key={member.name} className="p-6 bg-card rounded-xl border border-border text-center">
                <div className="w-20 h-20 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Award className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground">{member.name}</h3>
                <p className="text-sm text-primary mb-2">{member.role}</p>
                <p className="text-sm text-muted-foreground">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;
