import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AvatarUpload from '@/components/profile/AvatarUpload';
import EditableSection from '@/components/profile/EditableSection';
import ConnectionsList from '@/components/profile/ConnectionsList';
import PublicationsSection from '@/components/profile/PublicationsSection';
import InterestsEditor from '@/components/profile/InterestsEditor';
import {
  Shield,
  Edit2,
  Building2,
  GraduationCap,
  Briefcase,
  Award,
  Eye,
  Save,
  X,
  Loader2,
} from 'lucide-react';

interface Education {
  id: string;
  institution_name: string;
  degree: string;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean | null;
  description: string | null;
}

interface Experience {
  id: string;
  organization: string;
  title: string;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean | null;
  description: string | null;
}

interface Certification {
  id: string;
  name: string;
  issuing_organization: string;
  issue_date: string | null;
  expiry_date: string | null;
  credential_id: string | null;
  credential_url: string | null;
}

const educationFields = [
  { name: 'institution_name', label: 'Institution', type: 'text' as const, required: true },
  { name: 'degree', label: 'Degree', type: 'text' as const, required: true },
  { name: 'field_of_study', label: 'Field of Study', type: 'text' as const },
  { name: 'start_date', label: 'Start Date', type: 'date' as const },
  { name: 'end_date', label: 'End Date', type: 'date' as const },
  { name: 'is_current', label: 'Currently studying here', type: 'checkbox' as const },
  { name: 'description', label: 'Description', type: 'textarea' as const },
];

const experienceFields = [
  { name: 'title', label: 'Title', type: 'text' as const, required: true },
  { name: 'organization', label: 'Organization', type: 'text' as const, required: true },
  { name: 'location', label: 'Location', type: 'text' as const },
  { name: 'start_date', label: 'Start Date', type: 'date' as const },
  { name: 'end_date', label: 'End Date', type: 'date' as const },
  { name: 'is_current', label: 'Currently working here', type: 'checkbox' as const },
  { name: 'description', label: 'Description', type: 'textarea' as const },
];

const certificationFields = [
  { name: 'name', label: 'Certification Name', type: 'text' as const, required: true },
  { name: 'issuing_organization', label: 'Issuing Organization', type: 'text' as const, required: true },
  { name: 'issue_date', label: 'Issue Date', type: 'date' as const },
  { name: 'expiry_date', label: 'Expiry Date', type: 'date' as const },
  { name: 'credential_id', label: 'Credential ID', type: 'text' as const },
  { name: 'credential_url', label: 'Credential URL', type: 'text' as const },
];

export default function Profile() {
  const { user, profile, verificationStatus, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Profile data
  const [headline, setHeadline] = useState('');
  const [about, setAbout] = useState('');
  const [institution, setInstitution] = useState('');
  const [medicalRole, setMedicalRole] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Related data
  const [education, setEducation] = useState<Education[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);

  useEffect(() => {
    if (profile) {
      setHeadline(profile.headline || '');
      setAbout(profile.about || '');
      setInstitution(profile.institution || '');
      setMedicalRole(profile.medical_role || '');
      setAvatarUrl(profile.avatar_url);
    }
    fetchRelatedData();
  }, [profile]);

  const fetchRelatedData = async () => {
    if (!user) return;

    const [eduResult, expResult, certResult] = await Promise.all([
      supabase.from('education').select('*').eq('user_id', user.id).order('start_date', { ascending: false }),
      supabase.from('experience').select('*').eq('user_id', user.id).order('start_date', { ascending: false }),
      supabase.from('certifications').select('*').eq('user_id', user.id).order('issue_date', { ascending: false }),
    ]);

    if (eduResult.data) setEducation(eduResult.data);
    if (expResult.data) setExperience(expResult.data);
    if (certResult.data) setCertifications(certResult.data);
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        headline,
        about,
        institution,
      })
      .eq('user_id', user.id);

    setIsSaving(false);

    if (error) {
      toast({ title: 'Error saving profile', variant: 'destructive' });
    } else {
      toast({ title: 'Profile updated' });
      setIsEditing(false);
      refreshProfile();
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-6">
              <AvatarUpload
                userId={user?.id || ''}
                currentUrl={avatarUrl}
                fullName={profile?.full_name}
                onUpload={(url) => {
                  setAvatarUrl(url);
                  refreshProfile();
                }}
              />

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">{profile?.full_name}</h1>
                    {isEditing ? (
                      <div className="space-y-2 mt-2">
                        <Input
                          value={headline}
                          onChange={(e) => setHeadline(e.target.value)}
                          placeholder="Your professional headline"
                          className="max-w-md"
                        />
                        <Input
                          value={institution}
                          onChange={(e) => setInstitution(e.target.value)}
                          placeholder="Current institution"
                          className="max-w-md"
                        />
                      </div>
                    ) : (
                      <>
                        <p className="text-muted-foreground">{profile?.headline || 'Add a headline'}</p>
                        {medicalRole && (
                          <p className="text-sm text-accent capitalize mt-1">{medicalRole.replace('_', ' ')}</p>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                          <X className="h-4 w-4 mr-1" /> Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={isSaving}>
                          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                          Save
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit2 className="h-4 w-4 mr-1" /> Edit Profile
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-4">
                  {verificationStatus.isVerified && (
                    <Badge variant="outline" className="border-trust text-trust">
                      <Shield className="h-3 w-3 mr-1" /> Verified
                    </Badge>
                  )}
                  {profile?.primary_specialty && (
                    <Badge variant="secondary">{profile.primary_specialty}</Badge>
                  )}
                  {profile?.institution && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" /> {profile.institution}
                    </span>
                  )}
                </div>

                <div className="flex gap-6 mt-4 text-sm text-muted-foreground">
                  <ConnectionsList userId={user?.id || ''} />
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" /> Profile views
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="about">
          <TabsList>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="certifications">Certifications</TabsTrigger>
            <TabsTrigger value="publications">Publications</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">About</CardTitle>
                {!isEditing && (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    placeholder="Tell colleagues about yourself..."
                    rows={6}
                  />
                ) : (
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {profile?.about || 'No bio added yet.'}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Interests */}
            <InterestsEditor
              userId={user?.id || ''}
              clinicalInterests={profile?.clinical_interests || []}
              researchInterests={profile?.research_interests || []}
              onUpdate={refreshProfile}
            />
          </TabsContent>

          <TabsContent value="experience" className="mt-4">
            <EditableSection<Experience>
              title="Experience"
              icon={<Briefcase className="h-5 w-5" />}
              items={experience}
              userId={user?.id || ''}
              tableName="experience"
              fields={experienceFields}
              onRefresh={fetchRelatedData}
              emptyMessage="No experience added yet."
              renderItem={(exp) => (
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium">{exp.title}</h4>
                    <p className="text-sm text-muted-foreground">{exp.organization}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(exp.start_date)} - {exp.is_current ? 'Present' : formatDate(exp.end_date)}
                      {exp.location && ` • ${exp.location}`}
                    </p>
                    {exp.description && <p className="text-sm mt-2">{exp.description}</p>}
                  </div>
                </div>
              )}
            />
          </TabsContent>

          <TabsContent value="education" className="mt-4">
            <EditableSection<Education>
              title="Education"
              icon={<GraduationCap className="h-5 w-5" />}
              items={education}
              userId={user?.id || ''}
              tableName="education"
              fields={educationFields}
              onRefresh={fetchRelatedData}
              emptyMessage="No education added yet."
              renderItem={(edu) => (
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <GraduationCap className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium">{edu.institution_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {edu.degree}{edu.field_of_study && `, ${edu.field_of_study}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(edu.start_date)} - {edu.is_current ? 'Present' : formatDate(edu.end_date)}
                    </p>
                  </div>
                </div>
              )}
            />
          </TabsContent>

          <TabsContent value="certifications" className="mt-4">
            <EditableSection<Certification>
              title="Certifications"
              icon={<Award className="h-5 w-5" />}
              items={certifications}
              userId={user?.id || ''}
              tableName="certifications"
              fields={certificationFields}
              onRefresh={fetchRelatedData}
              emptyMessage="No certifications added yet."
              renderItem={(cert) => (
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Award className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium">{cert.name}</h4>
                    <p className="text-sm text-muted-foreground">{cert.issuing_organization}</p>
                    <p className="text-sm text-muted-foreground">
                      Issued {formatDate(cert.issue_date)}
                      {cert.expiry_date && ` • Expires ${formatDate(cert.expiry_date)}`}
                    </p>
                    {cert.credential_id && (
                      <p className="text-xs text-muted-foreground mt-1">ID: {cert.credential_id}</p>
                    )}
                  </div>
                </div>
              )}
            />
          </TabsContent>

          <TabsContent value="publications" className="mt-4">
            <PublicationsSection userId={user?.id || ''} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
