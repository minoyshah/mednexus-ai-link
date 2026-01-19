import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

const Guidelines = () => {
  const doList = [
    "Share professional knowledge and clinical insights",
    "Engage respectfully with colleagues across specialties",
    "Cite sources when sharing research or statistics",
    "Report content that violates our community standards",
    "Keep discussions educational and evidence-based",
    "Respect patient privacy at all times",
  ];

  const dontList = [
    "Share any patient information or PHI",
    "Provide specific medical advice to non-professionals",
    "Engage in harassment or discriminatory behavior",
    "Spread misinformation or unverified claims",
    "Promote products or services inappropriately",
    "Impersonate other medical professionals",
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
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Community Guidelines</h1>
          <p className="text-xl text-muted-foreground">
            Standards for maintaining a professional, trusted medical community.
          </p>
        </div>

        {/* Introduction */}
        <div className="max-w-3xl mx-auto mb-16 prose prose-slate dark:prose-invert">
          <p className="text-muted-foreground text-lg">
            MedNet is built on trust. Our community guidelines ensure that every interaction on our platform 
            upholds the highest standards of professionalism and ethics that the medical community expects.
          </p>
        </div>

        {/* Do and Don't */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-8">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-6">
              <CheckCircle className="w-6 h-6 text-green-500" />
              Do
            </h2>
            <ul className="space-y-4">
              {doList.map((item) => (
                <li key={item} className="flex items-start gap-3 text-muted-foreground">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-8">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-6">
              <XCircle className="w-6 h-6 text-red-500" />
              Don't
            </h2>
            <ul className="space-y-4">
              {dontList.map((item) => (
                <li key={item} className="flex items-start gap-3 text-muted-foreground">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Content Categories */}
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-8">Content Categories</h2>
          <div className="space-y-6">
            <div className="p-6 bg-card rounded-xl border border-border">
              <h3 className="font-semibold text-foreground mb-2">Clinical Discussions</h3>
              <p className="text-muted-foreground text-sm">
                Share case studies, clinical pearls, and treatment approaches. Always de-identify patient information 
                and focus on educational value.
              </p>
            </div>
            <div className="p-6 bg-card rounded-xl border border-border">
              <h3 className="font-semibold text-foreground mb-2">Research & Evidence</h3>
              <p className="text-muted-foreground text-sm">
                Discuss new studies, meta-analyses, and evidence-based medicine. Provide context and cite sources appropriately.
              </p>
            </div>
            <div className="p-6 bg-card rounded-xl border border-border">
              <h3 className="font-semibold text-foreground mb-2">Career & Professional Development</h3>
              <p className="text-muted-foreground text-sm">
                Share opportunities, career advice, and professional insights. Support colleagues at all career stages.
              </p>
            </div>
          </div>
        </div>

        {/* Enforcement */}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            Enforcement
          </h2>
          <p className="text-muted-foreground mb-4">
            Violations of these guidelines may result in content removal, account suspension, or permanent ban 
            depending on severity. Serious violations may be reported to relevant medical licensing boards.
          </p>
          <Link to="/contact" className="text-primary hover:underline text-sm">
            Report a violation →
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Guidelines;
