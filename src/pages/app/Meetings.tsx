import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Video,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Users,
  Link2,
  Copy,
  ExternalLink,
  Shield,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const UPCOMING_MEETINGS = [
  {
    id: '1',
    title: 'Cardiology Case Conference',
    date: '2026-01-20',
    time: '2:00 PM EST',
    host: 'Dr. Sarah Chen',
    participants: 12,
    type: 'group',
  },
  {
    id: '2',
    title: 'Research Collaboration Discussion',
    date: '2026-01-22',
    time: '10:00 AM EST',
    host: 'You',
    participants: 3,
    type: '1on1',
  },
];

export default function Meetings() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingType, setMeetingType] = useState('1on1');

  const handleCreateMeeting = () => {
    toast({ title: 'Meeting scheduled', description: 'Invitations have been sent.' });
    setIsCreateOpen(false);
    setMeetingTitle('');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://mednet.app/meeting/abc123');
    toast({ title: 'Link copied to clipboard' });
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Meetings</h1>
            <p className="text-muted-foreground">Schedule and join secure video meetings</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Link2 className="h-4 w-4 mr-2" /> Join Meeting
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" /> New Meeting
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Schedule a Meeting</DialogTitle>
                  <DialogDescription>
                    Create a secure video meeting with other verified professionals
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Meeting Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Case Discussion"
                      value={meetingTitle}
                      onChange={(e) => setMeetingTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Meeting Type</Label>
                    <Select value={meetingType} onValueChange={setMeetingType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1on1">1-on-1 Meeting</SelectItem>
                        <SelectItem value="group">Group Meeting</SelectItem>
                        <SelectItem value="webinar">Webinar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Input type="time" />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateMeeting}>Schedule Meeting</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" /> Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          {/* Upcoming Meetings */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="upcoming">
              <TabsList>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="past">Past</TabsTrigger>
                <TabsTrigger value="recordings">Recordings</TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="mt-4 space-y-4">
                {UPCOMING_MEETINGS.map((meeting) => (
                  <Card key={meeting.id}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                            <Video className="h-5 w-5 text-accent" />
                          </div>
                          <div>
                            <h3 className="font-medium">{meeting.title}</h3>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="h-3.5 w-3.5" />
                                {new Date(meeting.date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {meeting.time}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                {meeting.participants} participants
                              </span>
                            </div>
                            <p className="text-sm mt-1">
                              Host: <span className="font-medium">{meeting.host}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {meeting.type === '1on1' ? '1-on-1' : 'Group'}
                          </Badge>
                          <Button size="sm">Join</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground mb-4">
                      No more upcoming meetings
                    </p>
                    <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" /> Schedule a Meeting
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="past" className="mt-4">
                <Card>
                  <CardContent className="py-12 text-center">
                    <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold text-lg mb-2">No past meetings</h3>
                    <p className="text-muted-foreground">
                      Your meeting history will appear here
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="recordings" className="mt-4">
                <Card>
                  <CardContent className="py-12 text-center">
                    <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold text-lg mb-2">No recordings</h3>
                    <p className="text-muted-foreground">
                      Recorded meetings will appear here
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="py-6 text-center">
              <Video className="h-8 w-8 mx-auto mb-2 text-accent" />
              <h3 className="font-medium">Instant Meeting</h3>
              <p className="text-sm text-muted-foreground">Start a meeting now</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleCopyLink}>
            <CardContent className="py-6 text-center">
              <Link2 className="h-8 w-8 mx-auto mb-2 text-accent" />
              <h3 className="font-medium">Copy Invite Link</h3>
              <p className="text-sm text-muted-foreground">Share your personal room</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="py-6 text-center">
              <Shield className="h-8 w-8 mx-auto mb-2 text-trust" />
              <h3 className="font-medium">Verified Only</h3>
              <p className="text-sm text-muted-foreground">All participants verified</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
