import { Check, ShieldCheck, Crown, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Pricing = () => {
  const plans = [
    {
      name: "Verified",
      price: "Free",
      period: "",
      description: "Essential access for all verified medical professionals",
      icon: ShieldCheck,
      features: [
        "Full credential verification",
        "Professional profile",
        "Specialty feed access",
        "5 messages per day",
        "Join discussions & groups",
        "Basic AI Q&A access",
      ],
      cta: "Get Verified",
      variant: "outline" as const,
      highlight: false,
    },
    {
      name: "Premium",
      price: "$9.99",
      period: "/month",
      description: "Enhanced networking and study tools for serious professionals",
      icon: Crown,
      features: [
        "Everything in Verified",
        "30 messages per day",
        "Profile analytics & views",
        "Advanced search filters",
        "Priority visibility",
        "Full AI study engine",
        "Early job listings access",
        "Create private groups",
      ],
      cta: "Upgrade to Premium",
      variant: "default" as const,
      highlight: true,
    },
    {
      name: "Institution",
      price: "Custom",
      period: "",
      description: "Deploy MedNet across your hospital, university, or organization",
      icon: Building2,
      features: [
        "Bulk verified accounts",
        "Internal announcement feeds",
        "Institution-branded pages",
        "Admin dashboard",
        "Custom integrations",
        "Dedicated support",
        "Compliance & audit logs",
        "SSO integration",
      ],
      cta: "Contact Sales",
      variant: "secondary" as const,
      highlight: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-secondary/30 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-muted-foreground text-lg">
            Free for verified users. Premium adds friction to reduce spam while unlocking 
            advanced features for those who need them.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-8 rounded-2xl bg-card border transition-all duration-300 ${
                plan.highlight 
                  ? 'border-accent shadow-lg shadow-accent/10 scale-105 z-10' 
                  : 'border-border hover:border-accent/30'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full bg-accent text-accent-foreground text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  plan.highlight ? 'bg-accent text-accent-foreground' : 'bg-secondary text-foreground'
                }`}>
                  <plan.icon className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
              </div>

              <div className="mb-4">
                <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>

              <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      plan.highlight ? 'text-accent' : 'text-trust'
                    }`} />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                variant={plan.variant} 
                size="lg" 
                className="w-full"
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        {/* Bottom Note */}
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            All plans include mandatory credential verification. 
            Institution pricing based on seat count.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
