import { Link } from "react-router-dom";
import { ArrowLeft, Book, Code, Shield, Users, Settings, HelpCircle, Search } from "lucide-react";

const Documentation = () => {
  const sections = [
    {
      icon: Book,
      title: "Getting Started",
      description: "Learn the basics of MedNet and set up your verified profile",
      links: ["Account Setup", "Verification Process", "Profile Optimization", "First Connections"],
    },
    {
      icon: Users,
      title: "Networking",
      description: "Make meaningful professional connections",
      links: ["Finding Colleagues", "Connection Requests", "Messaging Guidelines", "Groups & Communities"],
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      description: "Understand how we protect your data",
      links: ["Privacy Settings", "Data Protection", "HIPAA Compliance", "Reporting Issues"],
    },
    {
      icon: Settings,
      title: "Account Management",
      description: "Manage your account and preferences",
      links: ["Subscription Plans", "Notification Settings", "Profile Visibility", "Account Deletion"],
    },
    {
      icon: Code,
      title: "API Reference",
      description: "For developers integrating with MedNet",
      links: ["Authentication", "Endpoints", "Rate Limits", "Webhooks"],
    },
    {
      icon: HelpCircle,
      title: "FAQ",
      description: "Answers to common questions",
      links: ["Verification FAQ", "Billing FAQ", "Technical FAQ", "Policy FAQ"],
    },
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
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Documentation</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Everything you need to know about using MedNet effectively.
          </p>
          
          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search documentation..." 
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-card text-foreground"
            />
          </div>
        </div>

        {/* Sections Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => (
            <div 
              key={section.title} 
              className="bg-card rounded-xl border border-border p-6 hover:border-primary/50 transition-colors"
            >
              <section.icon className="w-10 h-10 text-primary mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">{section.title}</h2>
              <p className="text-sm text-muted-foreground mb-4">{section.description}</p>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-primary hover:underline">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Help */}
        <div className="mt-16 text-center p-12 bg-muted/50 rounded-2xl">
          <h2 className="text-2xl font-bold text-foreground mb-4">Can't find what you're looking for?</h2>
          <p className="text-muted-foreground mb-6">
            Our support team is here to help you with any questions.
          </p>
          <Link to="/contact" className="inline-flex items-center gap-2 text-primary hover:underline">
            Contact Support
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Documentation;
