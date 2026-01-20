import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const links = {
    Product: [
      { label: "Features", href: "/features" },
      { label: "Blog", href: "/blog" },
      { label: "Documentation", href: "/documentation" },
      { label: "API", href: "/api" },
      { label: "Status", href: "/status" },
    ],
    Company: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Press", href: "/press" },
      { label: "Security", href: "/security" },
    ],
    Resources: [
      { label: "Guidelines", href: "/guidelines" },
      { label: "Support", href: "/support" },
    ],
    Legal: [
      { label: "Terms of Service", href: "/legal?tab=terms" },
      { label: "Privacy Policy", href: "/legal?tab=privacy" },
      { label: "HIPAA", href: "/legal?tab=hipaa" },
      { label: "Compliance", href: "/legal?tab=compliance" },
      { label: "Cookies", href: "/legal?tab=cookies" },
    ],
  };

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="relative flex items-center justify-center w-10 h-10">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent via-trust to-accent opacity-50 blur-md" />
                <div className="relative flex items-center justify-center w-full h-full rounded-xl bg-gradient-to-br from-accent to-trust shadow-lg">
                  <ShieldCheck className="w-5 h-5 text-white drop-shadow-md" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold">MedNet</span>
                <span className="text-[10px] font-medium tracking-widest text-primary-foreground/60 uppercase -mt-0.5">
                  Verified Network
                </span>
              </div>
            </div>
            <p className="text-sm text-primary-foreground/60 mb-6">
              The verification-first professional network for modern medicine.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-semibold mb-4">{category}</h4>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link 
                      to={item.href}
                      className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/10 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-primary-foreground/60">
            © 2026 MedNet. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/status" className="flex items-center gap-2 text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
              <span className="w-2 h-2 rounded-full bg-trust animate-pulse-soft" />
              All systems operational
            </Link>
            <span className="text-sm text-primary-foreground/60">
              HIPAA Compliant
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
