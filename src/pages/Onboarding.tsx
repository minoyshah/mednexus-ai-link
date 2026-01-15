import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  GraduationCap, 
  Stethoscope, 
  FlaskConical, 
  Building2, 
  UserCog, 
  Shield,
  CheckCircle2,
  Upload,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

const MEDICAL_ROLES = [
  { value: 'medical_student', label: 'Medical Student', icon: GraduationCap, description: 'Currently enrolled in medical school' },
  { value: 'resident', label: 'Resident / Fellow', icon: Stethoscope, description: 'In residency or fellowship training' },
  { value: 'attending', label: 'Attending Physician', icon: UserCog, description: 'Board-certified practicing physician' },
  { value: 'researcher', label: 'Researcher', icon: FlaskConical, description: 'Academic or clinical researcher' },
  { value: 'pharma_industry', label: 'Pharma / Industry', icon: Building2, description: 'Healthcare industry professional' },
  { value: 'admin_institution', label: 'Admin / Institution', icon: Shield, description: 'Healthcare administrator' },
];

const STEPS = ['Role Selection', 'Credential Verification', 'Specialty & Interests', 'Profile Completion'];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile, loading } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [specialties, setSpecialties] = useState<{ id: string; name: string }[]>([]);

  // Form data
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [credentialType, setCredentialType] = useState('');
  const [credentialNumber, setCredentialNumber] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('');
  const [primarySpecialty, setPrimarySpecialty] = useState('');
  const [subspecialty, setSubspecialty] = useState('');
  const [clinicalInterests, setClinicalInterests] = useState('');
  const [researchInterests, setResearchInterests] = useState('');
  const [fullName, setFullName] = useState('');
  const [headline, setHeadline] = useState('');
  const [institution, setInstitution] = useState('');
  const [about, setAbout] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      if (profile.onboarding_completed) {
        navigate('/app/feed');
      }
    }
  }, [profile, navigate]);

  useEffect(() => {
    const fetchSpecialties = async () => {
      const { data } = await supabase.from('specialties').select('id, name').order('name');
      if (data) setSpecialties(data);
    };
    fetchSpecialties();
  }, []);

  const progress = ((step + 1) / STEPS.length) * 100;

  const handleRoleSelection = async () => {
    if (!selectedRole) {
      toast({ title: 'Please select a role', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase
      .from('profiles')
      .update({ medical_role: selectedRole as any })
      .eq('user_id', user?.id);

    setIsSubmitting(false);
    if (error) {
      toast({ title: 'Error saving role', description: error.message, variant: 'destructive' });
    } else {
      setStep(1);
    }
  };

  const handleCredentialSubmit = async () => {
    if (!credentialType) {
      toast({ title: 'Please select credential type', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from('credentials').insert({
      user_id: user?.id,
      credential_type: credentialType,
      credential_number: credentialNumber,
      issuing_authority: issuingAuthority,
      verification_status: 'pending',
    });

    setIsSubmitting(false);
    if (error) {
      toast({ title: 'Error submitting credentials', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Credentials submitted', description: 'Your credentials are being reviewed.' });
      setStep(2);
    }
  };

  const handleSpecialtySubmit = async () => {
    if (!primarySpecialty) {
      toast({ title: 'Please select primary specialty', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        primary_specialty: primarySpecialty,
        subspecialty: subspecialty || null,
        clinical_interests: clinicalInterests ? clinicalInterests.split(',').map(s => s.trim()) : [],
        research_interests: researchInterests ? researchInterests.split(',').map(s => s.trim()) : [],
      })
      .eq('user_id', user?.id);

    setIsSubmitting(false);
    if (error) {
      toast({ title: 'Error saving specialty', description: error.message, variant: 'destructive' });
    } else {
      setStep(3);
    }
  };

  const handleProfileComplete = async () => {
    if (!fullName || !headline) {
      toast({ title: 'Please fill in required fields', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        headline,
        institution: institution || null,
        about: about || null,
        onboarding_completed: true,
      })
      .eq('user_id', user?.id);

    setIsSubmitting(false);
    if (error) {
      toast({ title: 'Error completing profile', description: error.message, variant: 'destructive' });
    } else {
      await refreshProfile();
      toast({ title: 'Welcome to MedNet!', description: 'Your profile is now complete.' });
      navigate('/app/feed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
            <span className="text-sm font-medium">{STEPS[step]}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step 0: Role Selection */}
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>What's your role in medicine?</CardTitle>
              <CardDescription>
                Select the role that best describes your current position. This helps us personalize your experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {MEDICAL_ROLES.map((role) => {
                  const Icon = role.icon;
                  const isSelected = selectedRole === role.value;
                  return (
                    <button
                      key={role.value}
                      onClick={() => setSelectedRole(role.value)}
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all ${
                        isSelected
                          ? 'border-accent bg-accent/5'
                          : 'border-border hover:border-accent/50'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-accent text-accent-foreground' : 'bg-muted'}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{role.label}</p>
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                      </div>
                      {isSelected && <CheckCircle2 className="h-5 w-5 text-accent" />}
                    </button>
                  );
                })}
              </div>

              <Button
                onClick={handleRoleSelection}
                className="w-full bg-accent hover:bg-accent/90"
                disabled={!selectedRole || isSubmitting}
              >
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Credential Verification */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-accent" />
                Verify Your Credentials
              </CardTitle>
              <CardDescription>
                Upload your medical credentials for verification. This ensures MedNet remains a trusted network.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Credential Type *</Label>
                <Select value={credentialType} onValueChange={setCredentialType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select credential type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medical_license">Medical License</SelectItem>
                    <SelectItem value="student_id">Student Enrollment</SelectItem>
                    <SelectItem value="residency_certificate">Residency Certificate</SelectItem>
                    <SelectItem value="board_certification">Board Certification</SelectItem>
                    <SelectItem value="employee_id">Employee ID</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Credential Number</Label>
                <Input
                  placeholder="e.g., MD123456"
                  value={credentialNumber}
                  onChange={(e) => setCredentialNumber(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Issuing Authority</Label>
                <Input
                  placeholder="e.g., State Medical Board"
                  value={issuingAuthority}
                  onChange={(e) => setIssuingAuthority(e.target.value)}
                />
              </div>

              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Document upload coming soon. For now, submit your details and we'll verify manually.
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Verification typically takes 1-2 business days. You can continue using MedNet with limited features while pending.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(0)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button
                  onClick={handleCredentialSubmit}
                  className="flex-1 bg-accent hover:bg-accent/90"
                  disabled={!credentialType || isSubmitting}
                >
                  Submit for Verification <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Specialty & Interests */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Specialty & Interests</CardTitle>
              <CardDescription>
                Help us connect you with relevant content and colleagues in your field.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Primary Specialty *</Label>
                <Select value={primarySpecialty} onValueChange={setPrimarySpecialty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.map((s) => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Subspecialty (Optional)</Label>
                <Input
                  placeholder="e.g., Interventional Cardiology"
                  value={subspecialty}
                  onChange={(e) => setSubspecialty(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Clinical Interests</Label>
                <Input
                  placeholder="e.g., Heart Failure, Arrhythmia (comma-separated)"
                  value={clinicalInterests}
                  onChange={(e) => setClinicalInterests(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Research Interests</Label>
                <Input
                  placeholder="e.g., AI in Healthcare, Clinical Trials (comma-separated)"
                  value={researchInterests}
                  onChange={(e) => setResearchInterests(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button
                  onClick={handleSpecialtySubmit}
                  className="flex-1 bg-accent hover:bg-accent/90"
                  disabled={!primarySpecialty || isSubmitting}
                >
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Profile Completion */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Complete Your Profile</CardTitle>
              <CardDescription>
                Add the finishing touches to your professional profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  placeholder="Dr. Jane Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Professional Headline *</Label>
                <Input
                  placeholder="e.g., Cardiologist at Johns Hopkins | Heart Failure Specialist"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Institution</Label>
                <Input
                  placeholder="e.g., Johns Hopkins Hospital"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>About</Label>
                <Textarea
                  placeholder="Tell colleagues about your background, interests, and what you're working on..."
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button
                  onClick={handleProfileComplete}
                  className="flex-1 bg-accent hover:bg-accent/90"
                  disabled={!fullName || !headline || isSubmitting}
                >
                  Complete Setup <CheckCircle2 className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
