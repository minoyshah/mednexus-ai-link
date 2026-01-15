import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  ShieldCheck, 
  Users, 
  MessageSquare, 
  Video, 
  Brain, 
  Briefcase,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';

const features = [
  {
    icon: ShieldCheck,
    title: 'Verification-First Identity',
    description: 'Every member is verified through medical license, NPI, or institutional credentials. No anonymous accounts.',
    benefits: ['License verification', 'NPI authentication', 'Institution confirmation', 'Specialty validation']
  },
  {
    icon: Users,
    title: 'Professional Network',
    description: 'Connect with verified physicians, researchers, and medical professionals across all specialties.',
    benefits: ['Specialty-based matching', 'Institution networks', 'Research collaboration', 'Mentorship connections']
  },
  {
    icon: MessageSquare,
    title: 'Anti-Spam Messaging',
    description: 'Daily message limits prevent spam while ensuring meaningful professional conversations.',
    benefits: ['Message request system', 'Daily caps', 'Premium unlimited messaging', 'File sharing']
  },
  {
    icon: Video,
    title: 'Secure Video Meetings',
    description: 'HIPAA-compliant video conferencing for case discussions, consultations, and collaboration.',
    benefits: ['End-to-end encryption', 'Screen sharing', 'Recording options', 'Calendar integration']
  },
  {
    icon: Brain,
    title: 'AI Study Tools',
    description: 'Medical AI assistant for board prep, practice questions, and educational support.',
    benefits: ['AAMC-style questions', 'Weakness tracking', 'Flashcards', 'Explanation breakdowns']
  },
  {
    icon: Briefcase,
    title: 'Confidential Job Board',
    description: 'Browse and apply to opportunities without alerting your current employer.',
    benefits: ['Confidential applications', 'Verified recruiters', 'Salary transparency', 'Direct messaging']
  }
];

export default function Features() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent">
                <ShieldCheck className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">MedNet</span>
            </Link>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button variant="default" size="sm" asChild>
                <Link to="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Everything You Need for{' '}
            <span className="text-accent">Professional Medicine</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            MedNet combines verification, networking, communication, and AI tools into one comprehensive platform for medical professionals.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="p-6 rounded-xl border border-border bg-card">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <Icon className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">{feature.description}</p>
                  <ul className="grid grid-cols-2 gap-2">
                    {feature.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-accent/5">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Join?</h2>
          <p className="text-muted-foreground mb-8">
            Start your verification process and join thousands of verified medical professionals.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/signup">Get Verified Now</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
