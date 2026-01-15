import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, ArrowLeft, Mail, MessageSquare, Building2 } from 'lucide-react';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Invalid email address').max(255),
  subject: z.string().min(1, 'Please select a subject'),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(1000),
});

export default function Contact() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      toast({
        title: 'Validation Error',
        description: result.error.errors[0].message,
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    
    toast({
      title: 'Message Sent',
      description: 'Thank you for contacting us. We\'ll respond within 1-2 business days.'
    });
    
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

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

      {/* Content */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Have questions about MedNet? We're here to help.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card>
              <CardContent className="pt-6 text-center">
                <Mail className="w-8 h-8 text-accent mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Email Support</h3>
                <p className="text-sm text-muted-foreground">support@mednet.com</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <MessageSquare className="w-8 h-8 text-accent mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Live Chat</h3>
                <p className="text-sm text-muted-foreground">Available 9am-6pm EST</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Building2 className="w-8 h-8 text-accent mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Enterprise</h3>
                <p className="text-sm text-muted-foreground">enterprise@mednet.com</p>
              </CardContent>
            </Card>
          </div>

          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Send us a Message</CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you within 1-2 business days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Select value={formData.subject} onValueChange={(value) => setFormData({ ...formData, subject: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="verification">Verification Questions</SelectItem>
                      <SelectItem value="technical">Technical Support</SelectItem>
                      <SelectItem value="enterprise">Enterprise Solutions</SelectItem>
                      <SelectItem value="feedback">Feedback</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="How can we help you?"
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
