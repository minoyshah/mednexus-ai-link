import { Link } from "react-router-dom";
import { ArrowLeft, MessageCircle, Mail, Phone, Clock, Search, HelpCircle, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const Support = () => {
  const faqs = [
    { q: "How long does verification take?", a: "Most verifications are completed within 24-48 hours." },
    { q: "Can I change my specialty after verification?", a: "Yes, contact support with documentation of your new credentials." },
    { q: "How do I upgrade to Premium?", a: "Go to Settings > Subscription to upgrade your account." },
    { q: "Is my data HIPAA compliant?", a: "Yes, our platform is fully HIPAA compliant." },
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
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">How can we help?</h1>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search for help..." 
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-card text-foreground"
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Link to="/documentation" className="p-6 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors text-center">
            <FileText className="w-10 h-10 text-primary mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">Documentation</h3>
            <p className="text-sm text-muted-foreground">Browse our comprehensive guides</p>
          </Link>
          <Link to="/guidelines" className="p-6 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors text-center">
            <Users className="w-10 h-10 text-primary mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">Community Guidelines</h3>
            <p className="text-sm text-muted-foreground">Learn about our standards</p>
          </Link>
          <div className="p-6 bg-card rounded-xl border border-border text-center">
            <HelpCircle className="w-10 h-10 text-primary mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">FAQ</h3>
            <p className="text-sm text-muted-foreground">Find quick answers</p>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="p-6 bg-card rounded-xl border border-border">
                <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                <p className="text-muted-foreground text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Options */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-8">Contact Support</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-card rounded-xl border border-border text-center">
              <MessageCircle className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Live Chat</h3>
              <p className="text-sm text-muted-foreground mb-4">Chat with our support team</p>
              <Button size="sm">Start Chat</Button>
            </div>
            <div className="p-6 bg-card rounded-xl border border-border text-center">
              <Mail className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Email</h3>
              <p className="text-sm text-muted-foreground mb-4">support@mednet.com</p>
              <Button size="sm" variant="outline">Send Email</Button>
            </div>
            <div className="p-6 bg-card rounded-xl border border-border text-center">
              <Phone className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Phone</h3>
              <p className="text-sm text-muted-foreground mb-4">1-800-MEDNET</p>
              <Button size="sm" variant="outline">Call Us</Button>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mt-8 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            Support available 24/7 for verified medical professionals
          </div>
        </div>
      </main>
    </div>
  );
};

export default Support;
