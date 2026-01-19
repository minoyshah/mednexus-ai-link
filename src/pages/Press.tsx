import { Link } from "react-router-dom";
import { ArrowLeft, Download, Mail, Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const Press = () => {
  const pressReleases = [
    { date: "January 2026", title: "MedNet Reaches 50,000 Verified Medical Professionals" },
    { date: "December 2025", title: "MedNet Launches AI-Powered Study Assistant for Medical Students" },
    { date: "October 2025", title: "MedNet Secures $25M Series B Funding" },
    { date: "August 2025", title: "MedNet Expands to 45 Countries" },
  ];

  const coverage = [
    { outlet: "TechCrunch", title: "MedNet is LinkedIn for Doctors, But With Trust Built In" },
    { outlet: "STAT News", title: "How One Startup is Solving Medicine's Networking Problem" },
    { outlet: "Forbes", title: "The 50 Most Innovative Healthcare Startups of 2025" },
    { outlet: "Wired", title: "The Future of Professional Networks is Verification-First" },
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
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Press & Media</h1>
          <p className="text-xl text-muted-foreground">
            Latest news, press releases, and media resources about MedNet.
          </p>
        </div>

        {/* Contact */}
        <div className="bg-card border border-border rounded-xl p-8 mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Media Inquiries</h2>
            <p className="text-muted-foreground">For press inquiries, please contact our communications team.</p>
          </div>
          <Button className="gap-2">
            <Mail className="w-4 h-4" />
            press@mednet.com
          </Button>
        </div>

        {/* Press Releases */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-8">Press Releases</h2>
          <div className="space-y-4">
            {pressReleases.map((release) => (
              <div 
                key={release.title} 
                className="p-6 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Calendar className="w-4 h-4" />
                    {release.date}
                  </div>
                  <h3 className="font-semibold text-foreground">{release.title}</h3>
                </div>
                <Button variant="ghost" size="sm" className="gap-2">
                  Read More
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Media Coverage */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-8">Media Coverage</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {coverage.map((article) => (
              <div 
                key={article.title} 
                className="p-6 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors"
              >
                <span className="text-sm font-medium text-primary">{article.outlet}</span>
                <h3 className="font-semibold text-foreground mt-2">{article.title}</h3>
              </div>
            ))}
          </div>
        </div>

        {/* Brand Assets */}
        <div className="bg-muted/50 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Brand Assets</h2>
          <p className="text-muted-foreground mb-6">
            Download our logo, brand guidelines, and other media assets.
          </p>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Download Press Kit
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Press;
