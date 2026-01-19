import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Shield, FileText, Scale, Cookie, Building2 } from "lucide-react";

const Legal = () => {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "terms";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">Legal Information</h1>
            <p className="text-muted-foreground text-lg">
              Our commitment to transparency and your rights
            </p>
          </div>

          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-8">
              <TabsTrigger value="terms" className="flex items-center gap-2">
                <FileText className="w-4 h-4 hidden sm:block" />
                Terms
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2">
                <Shield className="w-4 h-4 hidden sm:block" />
                Privacy
              </TabsTrigger>
              <TabsTrigger value="hipaa" className="flex items-center gap-2">
                <Building2 className="w-4 h-4 hidden sm:block" />
                HIPAA
              </TabsTrigger>
              <TabsTrigger value="compliance" className="flex items-center gap-2">
                <Scale className="w-4 h-4 hidden sm:block" />
                Compliance
              </TabsTrigger>
              <TabsTrigger value="cookies" className="flex items-center gap-2">
                <Cookie className="w-4 h-4 hidden sm:block" />
                Cookies
              </TabsTrigger>
            </TabsList>

            <TabsContent value="terms" className="space-y-6">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <h2 className="text-2xl font-semibold text-foreground">Terms of Service</h2>
                <p className="text-muted-foreground">Last updated: January 2026</p>
                
                <h3 className="text-xl font-medium text-foreground mt-8">1. Acceptance of Terms</h3>
                <p className="text-muted-foreground">
                  By accessing or using MedNet's services, you agree to be bound by these Terms of Service. 
                  If you do not agree to these terms, please do not use our services.
                </p>

                <h3 className="text-xl font-medium text-foreground mt-6">2. Eligibility</h3>
                <p className="text-muted-foreground">
                  MedNet is designed for verified medical professionals, researchers, and healthcare industry personnel. 
                  Users must complete our verification process to access full platform features.
                </p>

                <h3 className="text-xl font-medium text-foreground mt-6">3. User Accounts</h3>
                <p className="text-muted-foreground">
                  You are responsible for maintaining the confidentiality of your account credentials and for all 
                  activities that occur under your account. You must notify us immediately of any unauthorized use.
                </p>

                <h3 className="text-xl font-medium text-foreground mt-6">4. Professional Conduct</h3>
                <p className="text-muted-foreground">
                  Users must conduct themselves in accordance with applicable professional standards and ethics. 
                  Sharing of patient information or protected health information (PHI) is strictly prohibited.
                </p>

                <h3 className="text-xl font-medium text-foreground mt-6">5. Content Guidelines</h3>
                <p className="text-muted-foreground">
                  All content shared on MedNet must be professional, accurate, and compliant with medical ethics. 
                  Users retain ownership of their content but grant MedNet a license to display and distribute it.
                </p>

                <h3 className="text-xl font-medium text-foreground mt-6">6. Limitation of Liability</h3>
                <p className="text-muted-foreground">
                  MedNet is not liable for any medical decisions made based on information shared on the platform. 
                  The platform is for professional networking and education, not clinical decision-making.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-6">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <h2 className="text-2xl font-semibold text-foreground">Privacy Policy</h2>
                <p className="text-muted-foreground">Last updated: January 2026</p>

                <h3 className="text-xl font-medium text-foreground mt-8">Information We Collect</h3>
                <p className="text-muted-foreground">
                  We collect information you provide directly, including your name, email, professional credentials, 
                  institution affiliation, and verification documents.
                </p>

                <h3 className="text-xl font-medium text-foreground mt-6">How We Use Your Information</h3>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>To verify your professional credentials</li>
                  <li>To provide and improve our services</li>
                  <li>To communicate with you about your account</li>
                  <li>To ensure platform security and prevent fraud</li>
                  <li>To comply with legal obligations</li>
                </ul>

                <h3 className="text-xl font-medium text-foreground mt-6">Data Protection</h3>
                <p className="text-muted-foreground">
                  We implement industry-standard security measures including encryption, secure data centers, 
                  and regular security audits to protect your personal information.
                </p>

                <h3 className="text-xl font-medium text-foreground mt-6">Your Rights</h3>
                <p className="text-muted-foreground">
                  You have the right to access, correct, or delete your personal data. You may also request 
                  a copy of your data or restrict certain processing activities.
                </p>

                <h3 className="text-xl font-medium text-foreground mt-6">Data Retention</h3>
                <p className="text-muted-foreground">
                  We retain your data for as long as your account is active or as needed to provide services. 
                  Verification documents are securely stored and may be retained for compliance purposes.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="hipaa" className="space-y-6">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <h2 className="text-2xl font-semibold text-foreground">HIPAA Compliance</h2>
                <p className="text-muted-foreground">Last updated: January 2026</p>

                <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 mt-8">
                  <h3 className="text-xl font-medium text-foreground flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Important Notice
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    MedNet is designed as a professional networking platform, not a clinical communication tool. 
                    Users must NOT share Protected Health Information (PHI) on this platform.
                  </p>
                </div>

                <h3 className="text-xl font-medium text-foreground mt-8">Our Commitment</h3>
                <p className="text-muted-foreground">
                  While MedNet is not intended for PHI transmission, we maintain HIPAA-compliant infrastructure 
                  and security practices as an additional safeguard for our users.
                </p>

                <h3 className="text-xl font-medium text-foreground mt-6">Security Measures</h3>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>End-to-end encryption for all communications</li>
                  <li>SOC 2 Type II certified data centers</li>
                  <li>Regular third-party security audits</li>
                  <li>Employee HIPAA training and compliance</li>
                  <li>Incident response procedures</li>
                </ul>

                <h3 className="text-xl font-medium text-foreground mt-6">User Responsibilities</h3>
                <p className="text-muted-foreground">
                  Users are responsible for ensuring they do not share any patient information or PHI on the platform. 
                  Violations may result in account termination and reporting to relevant authorities.
                </p>

                <h3 className="text-xl font-medium text-foreground mt-6">Business Associate Agreements</h3>
                <p className="text-muted-foreground">
                  For institutional accounts requiring BAAs, please contact our compliance team at 
                  compliance@mednet.com.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-6">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <h2 className="text-2xl font-semibold text-foreground">Compliance & Certifications</h2>
                <p className="text-muted-foreground">Last updated: January 2026</p>

                <h3 className="text-xl font-medium text-foreground mt-8">Regulatory Compliance</h3>
                <p className="text-muted-foreground">
                  MedNet maintains compliance with applicable regulations including GDPR, CCPA, and healthcare-specific 
                  requirements in jurisdictions where we operate.
                </p>

                <h3 className="text-xl font-medium text-foreground mt-6">Security Certifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="border border-border rounded-lg p-4">
                    <h4 className="font-medium text-foreground">SOC 2 Type II</h4>
                    <p className="text-sm text-muted-foreground">Annual certification for security, availability, and confidentiality</p>
                  </div>
                  <div className="border border-border rounded-lg p-4">
                    <h4 className="font-medium text-foreground">ISO 27001</h4>
                    <p className="text-sm text-muted-foreground">Information security management certification</p>
                  </div>
                  <div className="border border-border rounded-lg p-4">
                    <h4 className="font-medium text-foreground">HITRUST CSF</h4>
                    <p className="text-sm text-muted-foreground">Healthcare information trust alliance certification</p>
                  </div>
                  <div className="border border-border rounded-lg p-4">
                    <h4 className="font-medium text-foreground">GDPR Ready</h4>
                    <p className="text-sm text-muted-foreground">Full compliance with EU data protection regulations</p>
                  </div>
                </div>

                <h3 className="text-xl font-medium text-foreground mt-8">Verification Standards</h3>
                <p className="text-muted-foreground">
                  Our credential verification process adheres to industry best practices and includes verification 
                  against official medical licensing databases where available.
                </p>

                <h3 className="text-xl font-medium text-foreground mt-6">Audit Reports</h3>
                <p className="text-muted-foreground">
                  Enterprise customers may request copies of our audit reports and compliance documentation. 
                  Contact enterprise@mednet.com for more information.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="cookies" className="space-y-6">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <h2 className="text-2xl font-semibold text-foreground">Cookie Policy</h2>
                <p className="text-muted-foreground">Last updated: January 2026</p>

                <h3 className="text-xl font-medium text-foreground mt-8">What Are Cookies?</h3>
                <p className="text-muted-foreground">
                  Cookies are small text files stored on your device when you visit our website. They help us 
                  provide a better user experience and understand how our platform is used.
                </p>

                <h3 className="text-xl font-medium text-foreground mt-6">Types of Cookies We Use</h3>
                <div className="space-y-4 mt-4">
                  <div className="border border-border rounded-lg p-4">
                    <h4 className="font-medium text-foreground">Essential Cookies</h4>
                    <p className="text-sm text-muted-foreground">
                      Required for basic platform functionality, including authentication and security features.
                    </p>
                  </div>
                  <div className="border border-border rounded-lg p-4">
                    <h4 className="font-medium text-foreground">Functional Cookies</h4>
                    <p className="text-sm text-muted-foreground">
                      Remember your preferences and settings to provide a personalized experience.
                    </p>
                  </div>
                  <div className="border border-border rounded-lg p-4">
                    <h4 className="font-medium text-foreground">Analytics Cookies</h4>
                    <p className="text-sm text-muted-foreground">
                      Help us understand how users interact with our platform to improve our services.
                    </p>
                  </div>
                </div>

                <h3 className="text-xl font-medium text-foreground mt-8">Managing Cookies</h3>
                <p className="text-muted-foreground">
                  You can control cookies through your browser settings. Note that disabling certain cookies 
                  may affect platform functionality. Essential cookies cannot be disabled.
                </p>

                <h3 className="text-xl font-medium text-foreground mt-6">Third-Party Cookies</h3>
                <p className="text-muted-foreground">
                  We use limited third-party services that may set their own cookies. These include analytics 
                  providers and security services. All third parties are bound by data processing agreements.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Legal;
