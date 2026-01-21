import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Users, UserMinus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Connection {
  id: string;
  user: {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
  };
  status: string;
  isRequester: boolean;
}

interface ConnectionsListProps {
  userId: string;
}

export default function ConnectionsList({ userId }: ConnectionsListProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const fetchConnections = async () => {
    setIsLoading(true);

    // Fetch connections where user is requester or recipient
    const { data: connectionsData, error } = await supabase
      .from('connections')
      .select('*')
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`);

    if (error) {
      console.error('Error fetching connections:', error);
      setIsLoading(false);
      return;
    }

    // Get all other user IDs
    const otherUserIds = connectionsData?.map((c) => 
      c.requester_id === userId ? c.recipient_id : c.requester_id
    ) || [];

    if (otherUserIds.length === 0) {
      setConnections([]);
      setPendingRequests([]);
      setIsLoading(false);
      return;
    }

    // Fetch profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url, headline')
      .in('user_id', otherUserIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

    const mapped: Connection[] = connectionsData?.map((c) => {
      const otherUserId = c.requester_id === userId ? c.recipient_id : c.requester_id;
      const profile = profileMap.get(otherUserId);
      return {
        id: c.id,
        user: {
          user_id: otherUserId,
          full_name: profile?.full_name || 'Unknown User',
          avatar_url: profile?.avatar_url || null,
          headline: profile?.headline || null,
        },
        status: c.status,
        isRequester: c.requester_id === userId,
      };
    }) || [];

    setConnections(mapped.filter((c) => c.status === 'accepted'));
    setPendingRequests(mapped.filter((c) => c.status === 'pending'));
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchConnections();
    }
  }, [isOpen, userId]);

  const handleAccept = async (connectionId: string) => {
    const { error } = await supabase
      .from('connections')
      .update({ status: 'accepted' })
      .eq('id', connectionId);

    if (error) {
      toast({ title: 'Failed to accept request', variant: 'destructive' });
    } else {
      toast({ title: 'Connection accepted' });
      fetchConnections();
    }
  };

  const handleDecline = async (connectionId: string) => {
    const { error } = await supabase
      .from('connections')
      .update({ status: 'rejected' as const })
      .eq('id', connectionId);

    if (error) {
      toast({ title: 'Failed to decline request', variant: 'destructive' });
    } else {
      toast({ title: 'Request declined' });
      fetchConnections();
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="gap-2">
          <Users className="h-4 w-4" />
          {connections.length > 0 ? `${connections.length} connections` : 'View Connections'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Your Connections</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Pending Requests ({pendingRequests.length})
                </h3>
                <div className="space-y-3">
                  {pendingRequests.map((conn) => (
                    <div key={conn.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conn.user.avatar_url || undefined} />
                        <AvatarFallback>{getInitials(conn.user.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{conn.user.full_name}</p>
                        <p className="text-sm text-muted-foreground truncate">{conn.user.headline}</p>
                      </div>
                      {!conn.isRequester && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleAccept(conn.id)}>Accept</Button>
                          <Button size="sm" variant="outline" onClick={() => handleDecline(conn.id)}>Decline</Button>
                        </div>
                      )}
                      {conn.isRequester && (
                        <Badge variant="secondary">Sent</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Accepted Connections */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Connections ({connections.length})
              </h3>
              {connections.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">No connections yet</p>
              ) : (
                <div className="space-y-2">
                  {connections.map((conn) => (
                    <button
                      key={conn.id}
                      onClick={() => {
                        setIsOpen(false);
                        navigate(`/app/profile/${conn.user.user_id}`);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conn.user.avatar_url || undefined} />
                        <AvatarFallback>{getInitials(conn.user.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{conn.user.full_name}</p>
                        <p className="text-sm text-muted-foreground truncate">{conn.user.headline}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
