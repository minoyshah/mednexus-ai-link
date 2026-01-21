import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import NewConversationDialog from '@/components/messages/NewConversationDialog';
import {
  MessageSquare,
  Send,
  Search,
  Crown,
  Loader2,
  Inbox,
  CheckCheck,
} from 'lucide-react';

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
  };
  lastMessage: {
    content: string;
    created_at: string;
    is_mine: boolean;
    read: boolean;
  };
  unreadCount: number;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  recipient_id: string;
  read_at: string | null;
}

export default function MessagesPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchDailyCount();
      setDailyLimit(profile?.is_premium ? 30 : 5);

      // Subscribe to new messages
      const channel = supabase
        .channel('messages_realtime')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`,
        }, () => {
          fetchConversations();
          if (selectedConversation) {
            fetchMessages(selectedConversation.otherUser.id);
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, profile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    if (!user) return;
    setIsLoading(true);

    const { data: messagesData, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching messages:', error);
      setIsLoading(false);
      return;
    }

    const convMap = new Map<string, { messages: any[]; otherUserId: string }>();

    messagesData?.forEach((msg) => {
      const otherUserId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
      if (!convMap.has(otherUserId)) {
        convMap.set(otherUserId, { messages: [], otherUserId });
      }
      convMap.get(otherUserId)!.messages.push(msg);
    });

    const otherUserIds = Array.from(convMap.keys());
    if (otherUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, headline')
        .in('user_id', otherUserIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      const convs: Conversation[] = Array.from(convMap.entries()).map(([otherUserId, data]) => {
        const lastMsg = data.messages[0];
        const profile = profileMap.get(otherUserId);
        const unread = data.messages.filter(
          (m) => m.recipient_id === user.id && !m.read_at
        ).length;

        return {
          id: otherUserId,
          otherUser: {
            id: otherUserId,
            full_name: profile?.full_name || 'Unknown User',
            avatar_url: profile?.avatar_url || null,
            headline: profile?.headline || null,
          },
          lastMessage: {
            content: lastMsg.content,
            created_at: lastMsg.created_at,
            is_mine: lastMsg.sender_id === user.id,
            read: !!lastMsg.read_at,
          },
          unreadCount: unread,
        };
      });

      setConversations(convs);
    }

    setIsLoading(false);
  };

  const fetchDailyCount = async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];

    const { data } = await supabase
      .from('daily_message_counts')
      .select('count')
      .eq('user_id', user.id)
      .eq('message_date', today)
      .maybeSingle();

    setDailyCount(data?.count || 0);
  };

  const fetchMessages = async (otherUserId: string) => {
    if (!user) return;

    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data);

      const unreadIds = data
        .filter((m) => m.recipient_id === user.id && !m.read_at)
        .map((m) => m.id);

      if (unreadIds.length > 0) {
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .in('id', unreadIds);
        fetchConversations();
      }
    }
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    fetchMessages(conv.otherUser.id);
  };

  const handleSendMessage = async () => {
    if (!user || !selectedConversation || !newMessage.trim()) return;

    if (dailyCount >= dailyLimit) {
      toast({
        title: 'Daily limit reached',
        description: profile?.is_premium
          ? 'You have reached your daily limit of 30 messages.'
          : 'Upgrade to Premium for 30 messages per day.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);

    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      recipient_id: selectedConversation.otherUser.id,
      content: newMessage.trim(),
    });

    setIsSending(false);

    if (error) {
      toast({ title: 'Failed to send message', variant: 'destructive' });
    } else {
      setNewMessage('');
      setDailyCount((prev) => prev + 1);
      fetchMessages(selectedConversation.otherUser.id);
      fetchConversations();
    }
  };

  const handleNewMessageSent = (recipientId: string) => {
    fetchConversations();
    fetchDailyCount();
    // Find and select the new conversation
    setTimeout(() => {
      const newConv = conversations.find((c) => c.otherUser.id === recipientId);
      if (newConv) {
        handleSelectConversation(newConv);
      } else {
        fetchConversations();
      }
    }, 500);
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const remainingMessages = dailyLimit - dailyCount;

  return (
    <AppLayout>
      <div className="h-[calc(100vh-8rem)]">
        <Card className="h-full flex flex-col">
          <CardHeader className="border-b shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" /> Messages
                </CardTitle>
                <CardDescription>
                  {remainingMessages} messages remaining today
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <NewConversationDialog
                  userId={user?.id || ''}
                  dailyCount={dailyCount}
                  dailyLimit={dailyLimit}
                  onMessageSent={handleNewMessageSent}
                />
                <Badge variant={remainingMessages > 0 ? 'outline' : 'destructive'}>
                  {dailyCount}/{dailyLimit}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <div className="flex flex-1 overflow-hidden">
            {/* Conversation List */}
            <div className="w-80 border-r flex flex-col">
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <Inbox className="h-8 w-8 mx-auto mb-2" />
                    <p>No conversations yet</p>
                    <p className="text-sm mt-2">Start a new conversation to connect with colleagues</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {conversations
                      .filter((c) =>
                        c.otherUser.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        c.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => handleSelectConversation(conv)}
                          className={`w-full p-3 text-left hover:bg-muted transition-colors ${selectedConversation?.id === conv.id ? 'bg-muted' : ''
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={conv.otherUser.avatar_url || undefined} />
                              <AvatarFallback>{getInitials(conv.otherUser.full_name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-medium truncate">{conv.otherUser.full_name}</span>
                                {conv.unreadCount > 0 && (
                                  <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                                    {conv.unreadCount}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {conv.lastMessage.is_mine && 'You: '}{conv.lastMessage.content}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Message View */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={selectedConversation.otherUser.avatar_url || undefined} />
                      <AvatarFallback>{getInitials(selectedConversation.otherUser.full_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{selectedConversation.otherUser.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedConversation.otherUser.headline}</p>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((msg) => {
                        const isMine = msg.sender_id === user?.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMine
                                  ? 'bg-accent text-accent-foreground rounded-br-md'
                                  : 'bg-muted rounded-bl-md'
                                }`}
                            >
                              <p>{msg.content}</p>
                              <div className={`text-xs mt-1 flex items-center gap-1 ${isMine ? 'text-accent-foreground/70' : 'text-muted-foreground'}`}>
                                {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                {isMine && msg.read_at && <CheckCheck className="h-3 w-3" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Input */}
                  <div className="p-4 border-t">
                    {remainingMessages <= 0 && !profile?.is_premium ? (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground mb-2">Daily message limit reached</p>
                        <Button className="bg-premium text-premium-foreground hover:bg-premium/90">
                          <Crown className="h-4 w-4 mr-2" /> Upgrade to Premium
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          rows={1}
                          className="resize-none"
                        />
                        <Button onClick={handleSendMessage} disabled={isSending || !newMessage.trim()}>
                          {isSending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                    <p>Select a conversation or start a new one</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
