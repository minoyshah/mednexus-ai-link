import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  Check, 
  Zap, 
  MessageSquare, 
  Brain, 
  BarChart3,
  Sparkles,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const PLANS = [
  {
    name: 'Premium',
    price: '$9.99',
    period: '/month',
    description: 'For active professionals',
    color: 'premium',
    popular: true,
    features: [
      { icon: MessageSquare, text: '30 messages per day' },
      { icon: Brain, text: '15 AI questions per day' },
      { icon: BarChart3, text: 'Profile analytics' },
      { icon: Sparkles, text: 'Priority support' },
    ],
  },
  {
    name: 'Pro',
    price: '$29.99',
    period: '/month',
    description: 'For power users',
    color: 'accent',
    popular: false,
    features: [
      { icon: MessageSquare, text: 'Unlimited messages' },
      { icon: Brain, text: 'Unlimited AI questions' },
      { icon: BarChart3, text: 'Advanced analytics' },
      { icon: Sparkles, text: 'Priority support' },
      { icon: Zap, text: 'Early access features' },
    ],
  },
];

export default function SubscriptionCTA() {
  const [showPlans, setShowPlans] = useState(false);

  return (
    <>
      <Card className="bg-gradient-to-br from-premium/10 via-accent/5 to-premium/10 border-premium/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-premium/20 to-transparent rounded-bl-full" />
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-5 w-5 text-premium" />
            <span className="font-semibold">Go Premium</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Unlock more messages, AI tools, and advanced features.
          </p>
          <Button 
            onClick={() => setShowPlans(true)}
            className="w-full bg-gradient-to-r from-premium to-accent text-white hover:opacity-90"
          >
            Compare Plans
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showPlans} onOpenChange={setShowPlans}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              Choose Your Plan
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            {PLANS.map((plan) => (
              <Card 
                key={plan.name}
                className={`relative overflow-hidden ${
                  plan.popular 
                    ? 'border-premium shadow-lg' 
                    : 'border-border'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0">
                    <Badge className="rounded-none rounded-bl-lg bg-premium text-premium-foreground">
                      Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Crown className={`h-5 w-5 ${plan.popular ? 'text-premium' : 'text-accent'}`} />
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  
                  <ul className="space-y-2">
                    {plan.features.map((feature, idx) => {
                      const Icon = feature.icon;
                      return (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <div className={`flex items-center justify-center h-5 w-5 rounded-full ${
                            plan.popular ? 'bg-premium/10 text-premium' : 'bg-accent/10 text-accent'
                          }`}>
                            <Check className="h-3 w-3" />
                          </div>
                          {feature.text}
                        </li>
                      );
                    })}
                  </ul>

                  <Button 
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-premium text-premium-foreground hover:bg-premium/90' 
                        : 'bg-accent text-accent-foreground hover:bg-accent/90'
                    }`}
                  >
                    Get {plan.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Cancel anytime. All plans include verification-first access.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
