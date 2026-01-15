import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Search,
  Plus,
  Lock,
  Globe,
  MessageSquare,
  Calendar,
  Shield,
} from 'lucide-react';

const SAMPLE_GROUPS = [
  {
    id: '1',
    name: 'Internal Medicine Journal Club',
    description: 'Weekly discussions of recent IM publications',
    members: 234,
    isPrivate: false,
    category: 'Clinical',
  },
  {
    id: '2',
    name: 'Women in Surgery',
    description: 'Support and networking for female surgeons',
    members: 1520,
    isPrivate: true,
    category: 'Networking',
  },
  {
    id: '3',
    name: 'AI in Radiology',
    description: 'Exploring machine learning applications in imaging',
    members: 876,
    isPrivate: false,
    category: 'Research',
  },
  {
    id: '4',
    name: 'Residency Match 2026',
    description: 'Tips, advice, and support for match applicants',
    members: 3421,
    isPrivate: false,
    category: 'Education',
  },
];

const MY_GROUPS = [
  {
    id: '1',
    name: 'Internal Medicine Journal Club',
    unread: 12,
    lastActivity: '2 hours ago',
  },
];

export default function Groups() {
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Groups</h1>
            <p className="text-muted-foreground">Connect with medical professionals in specialized communities</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Create Group
          </Button>
        </div>

        <Tabs defaultValue="discover">
          <TabsList>
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="my-groups">My Groups</TabsTrigger>
            <TabsTrigger value="invites">Invites</TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="mt-6">
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SAMPLE_GROUPS.filter((g) =>
                g.name.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((group) => (
                <Card key={group.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                        <Users className="h-6 w-6 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{group.name}</h3>
                          {group.isPrivate ? (
                            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {group.description}
                        </p>
                        <div className="flex items-center gap-3 mt-3">
                          <Badge variant="secondary">{group.category}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {group.members.toLocaleString()} members
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        View
                      </Button>
                      <Button size="sm" className="flex-1">
                        {group.isPrivate ? 'Request to Join' : 'Join'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="my-groups" className="mt-6">
            {MY_GROUPS.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold text-lg mb-2">No groups yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Join groups to connect with like-minded professionals
                  </p>
                  <Button>Discover Groups</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {MY_GROUPS.map((group) => (
                  <Card key={group.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-accent" />
                          </div>
                          <div>
                            <h3 className="font-medium">{group.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Last activity: {group.lastActivity}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {group.unread > 0 && (
                            <Badge variant="default">{group.unread} new</Badge>
                          )}
                          <Button variant="outline" size="sm">
                            <MessageSquare className="h-4 w-4 mr-1" /> Open
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="invites" className="mt-6">
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold text-lg mb-2">No pending invites</h3>
                <p className="text-muted-foreground">
                  You'll see group invitations here
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
