import { Button } from "@/components/ui/button";
import { ShieldCheck, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent">
              <ShieldCheck className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">MedNet</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <a href="#verification" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Verification
            </a>
            <a href="#ai-tools" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              AI Tools
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
            <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button variant="default" size="sm" asChild>
              <Link to="/signup">Get Verified</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in">
            <nav className="flex flex-col gap-4">
              <Link to="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <a href="#verification" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Verification
              </a>
              <a href="#ai-tools" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                AI Tools
              </a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </a>
              <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </Link>
              <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
                <Button variant="ghost" size="sm" className="justify-start" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button variant="default" size="sm" asChild>
                  <Link to="/signup">Get Verified</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
