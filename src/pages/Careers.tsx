import { Link } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, DollarSign, Heart, Zap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const Careers = () => {
  const benefits = [
    { icon: Heart, title: "Health & Wellness", description: "Comprehensive medical, dental, and vision coverage" },
    { icon: DollarSign, title: "Competitive Pay", description: "Top-tier salaries with equity packages" },
    { icon: Clock, title: "Flexible Work", description: "Remote-first with optional office spaces" },
    { icon: Users, title: "Great Team", description: "Work with world-class engineers and physicians" },
  ];

  const jobs = [
    { title: "Senior Frontend Engineer", department: "Engineering", location: "Remote", type: "Full-time" },
    { title: "Backend Engineer", department: "Engineering", location: "San Francisco, CA", type: "Full-time" },
    { title: "Product Designer", department: "Design", location: "Remote", type: "Full-time" },
    { title: "Medical Content Specialist", department: "Content", location: "Remote", type: "Full-time" },
    { title: "Customer Success Manager", department: "Operations", location: "New York, NY", type: "Full-time" },
    { title: "Security Engineer", department: "Engineering", location: "Remote", type: "Full-time" },
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
            <Zap className="w-4 h-4" />
            Join Our Team
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Help Us Transform Medical Networking
          </h1>
          <p className="text-xl text-muted-foreground">
            We're building the future of professional connections in healthcare. 
            Join us and make a real impact on how medical professionals connect and collaborate.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="p-6 bg-card rounded-xl border border-border">
              <benefit.icon className="w-10 h-10 text-primary mb-4" />
              <h3 className="font-semibold text-foreground mb-2">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* Open Positions */}
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-8">Open Positions</h2>
          <div className="space-y-4">
            {jobs.map((job) => (
              <div 
                key={job.title} 
                className="p-6 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <h3 className="font-semibold text-foreground text-lg">{job.title}</h3>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span>{job.department}</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {job.type}
                    </span>
                  </div>
                </div>
                <Button>Apply Now</Button>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center p-12 bg-primary/5 rounded-2xl border border-primary/20">
          <h2 className="text-2xl font-bold text-foreground mb-4">Don't see the right role?</h2>
          <p className="text-muted-foreground mb-6">
            We're always looking for talented individuals. Send us your resume and we'll keep you in mind.
          </p>
          <Button variant="outline">Send Resume</Button>
        </div>
      </main>
    </div>
  );
};

export default Careers;
