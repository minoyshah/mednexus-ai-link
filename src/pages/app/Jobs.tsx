import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Briefcase,
  Search,
  MapPin,
  Building2,
  Clock,
  DollarSign,
  Bookmark,
  ExternalLink,
  Filter,
  Shield,
  Eye,
} from 'lucide-react';

const SAMPLE_JOBS = [
  {
    id: '1',
    title: 'Attending Physician - Internal Medicine',
    organization: 'Massachusetts General Hospital',
    location: 'Boston, MA',
    type: 'Full-time',
    salary: '$280,000 - $350,000',
    posted: '2 days ago',
    isConfidential: false,
    specialty: 'Internal Medicine',
    views: 342,
  },
  {
    id: '2',
    title: 'Clinical Research Director',
    organization: 'Confidential',
    location: 'San Francisco, CA',
    type: 'Full-time',
    salary: '$200,000 - $250,000',
    posted: '1 week ago',
    isConfidential: true,
    specialty: 'Research',
    views: 521,
  },
  {
    id: '3',
    title: 'Pediatric Cardiologist',
    organization: 'Children\'s Hospital of Philadelphia',
    location: 'Philadelphia, PA',
    type: 'Full-time',
    salary: '$350,000 - $450,000',
    posted: '3 days ago',
    isConfidential: false,
    specialty: 'Pediatrics',
    views: 189,
  },
  {
    id: '4',
    title: 'Medical Science Liaison',
    organization: 'Pfizer',
    location: 'Remote',
    type: 'Full-time',
    salary: '$180,000 - $220,000',
    posted: '5 days ago',
    isConfidential: false,
    specialty: 'Pharma',
    views: 456,
  },
];

const SAVED_JOBS = [
  {
    id: '1',
    title: 'Attending Physician - Internal Medicine',
    organization: 'Massachusetts General Hospital',
    location: 'Boston, MA',
    savedAt: '1 day ago',
  },
];

export default function Jobs() {
  const { profile, verificationStatus } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');

  const filteredJobs = SAMPLE_JOBS.filter((job) => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.organization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = locationFilter === 'all' || job.location.includes(locationFilter);
    const matchesSpecialty = specialtyFilter === 'all' || job.specialty === specialtyFilter;
    return matchesSearch && matchesLocation && matchesSpecialty;
  });

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Jobs & Opportunities</h1>
            <p className="text-muted-foreground">
              Exclusive positions for verified medical professionals
            </p>
          </div>
          {verificationStatus.isVerified && (
            <Badge variant="outline" className="border-trust text-trust">
              <Shield className="h-3 w-3 mr-1" /> Verified Access
            </Badge>
          )}
        </div>

        <Tabs defaultValue="browse">
          <TabsList>
            <TabsTrigger value="browse">Browse Jobs</TabsTrigger>
            <TabsTrigger value="saved">Saved Jobs</TabsTrigger>
            <TabsTrigger value="applied">Applied</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-6">
            {/* Search & Filters */}
            <Card className="mb-6">
              <CardContent className="py-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search jobs by title, organization..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="w-[180px]">
                      <MapPin className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="Boston">Boston, MA</SelectItem>
                      <SelectItem value="San Francisco">San Francisco, CA</SelectItem>
                      <SelectItem value="Remote">Remote</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Specialties</SelectItem>
                      <SelectItem value="Internal Medicine">Internal Medicine</SelectItem>
                      <SelectItem value="Research">Research</SelectItem>
                      <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                      <SelectItem value="Pharma">Pharma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Job Listings */}
            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{job.title}</h3>
                            {job.isConfidential && (
                              <Badge variant="secondary">Confidential</Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground">
                            {job.organization}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" /> {job.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" /> {job.type}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3.5 w-3.5" /> {job.salary}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3.5 w-3.5" /> {job.views} views
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-sm text-muted-foreground">{job.posted}</span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Bookmark className="h-4 w-4" />
                          </Button>
                          <Button size="sm">
                            Apply <ExternalLink className="h-3.5 w-3.5 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="saved" className="mt-6">
            {SAVED_JOBS.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold text-lg mb-2">No saved jobs</h3>
                  <p className="text-muted-foreground">
                    Jobs you save will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {SAVED_JOBS.map((job) => (
                  <Card key={job.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{job.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {job.organization} • {job.location}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Saved {job.savedAt}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">View</Button>
                          <Button size="sm">Apply</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="applied" className="mt-6">
            <Card>
              <CardContent className="py-12 text-center">
                <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold text-lg mb-2">No applications</h3>
                <p className="text-muted-foreground">
                  Jobs you apply to will appear here
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
