import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageSquare, Clock, Crown } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  status: string;
  sender?: { full_name: string | null };
}

export default function Messages() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [dailyCount, setDailyCount] = useState(0);
  const dailyLimit = profile?.is_premium ? 30 : 5;

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchMessages();
      fetchDailyCount();
      
      const channel = supabase
        .channel('messages')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
          fetchMessages();
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [user]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user?.id},recipient_id.eq.${user?.id}`)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setMessages(data);
  };

  const fetchDailyCount = async () => {
    const { data } = await supabase
      .from('daily_message_counts')
      .select('count')
      .eq('user_id', user?.id)
      .eq('message_date', new Date().toISOString().split('T')[0])
      .maybeSingle();
    setDailyCount(data?.count || 0);
  };

  const remainingMessages = dailyLimit - dailyCount;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Messages</h1>
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {remainingMessages}/{dailyLimit} messages today
          </Badge>
        </div>

        {remainingMessages <= 0 && !profile?.is_premium && (
          <Card className="mb-6 bg-premium/5 border-premium/20">
            <CardContent className="pt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-premium" />
                <p className="text-sm">You've reached your daily message limit.</p>
              </div>
              <Button size="sm" className="bg-premium text-premium-foreground">
                Upgrade to Premium
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No messages yet. Connect with colleagues to start a conversation.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.slice(0, 10).map((msg) => (
                  <div key={msg.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{msg.content}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
