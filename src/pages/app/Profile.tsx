import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Shield,
  Edit2,
  MapPin,
  Building2,
  GraduationCap,
  Briefcase,
  Award,
  FileText,
  Eye,
  Users,
  Save,
  X,
  Plus,
} from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface Education {
  id: string;
  institution_name: string;
  degree: string;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean | null;
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
}

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
  
  // Related data
  const [education, setEducation] = useState<Education[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);

  useEffect(() => {
    if (profile) {
      setHeadline(profile.headline || '');
      setAbout(profile.about || '');
      setInstitution(profile.institution || '');
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

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
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
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-accent text-accent-foreground text-3xl">
                  {getInitials(profile?.full_name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">{profile?.full_name}</h1>
                    {isEditing ? (
                      <Input
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        placeholder="Your professional headline"
                        className="mt-2 max-w-md"
                      />
                    ) : (
                      <p className="text-muted-foreground">{profile?.headline || 'Add a headline'}</p>
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
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" /> 127 connections
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" /> 342 profile views
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
          </TabsList>

          <TabsContent value="about" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About</CardTitle>
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
            {(profile?.clinical_interests?.length || profile?.research_interests?.length) && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">Interests</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile?.clinical_interests?.length && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Clinical Interests</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.clinical_interests.map((interest) => (
                          <Badge key={interest} variant="secondary">{interest}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile?.research_interests?.length && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Research Interests</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.research_interests.map((interest) => (
                          <Badge key={interest} variant="outline">{interest}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="experience" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5" /> Experience
                </CardTitle>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </CardHeader>
              <CardContent>
                {experience.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No experience added yet.</p>
                ) : (
                  <div className="space-y-6">
                    {experience.map((exp) => (
                      <div key={exp.id} className="flex gap-4">
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
                          {exp.description && (
                            <p className="text-sm mt-2">{exp.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="education" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" /> Education
                </CardTitle>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </CardHeader>
              <CardContent>
                {education.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No education added yet.</p>
                ) : (
                  <div className="space-y-6">
                    {education.map((edu) => (
                      <div key={edu.id} className="flex gap-4">
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
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certifications" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5" /> Certifications
                </CardTitle>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </CardHeader>
              <CardContent>
                {certifications.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No certifications added yet.</p>
                ) : (
                  <div className="space-y-6">
                    {certifications.map((cert) => (
                      <div key={cert.id} className="flex gap-4">
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
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
