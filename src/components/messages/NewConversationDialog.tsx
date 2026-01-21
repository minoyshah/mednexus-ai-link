import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PenSquare, Search, Loader2, Send } from 'lucide-react';

interface UserResult {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
}

interface NewConversationDialogProps {
  userId: string;
  dailyCount: number;
  dailyLimit: number;
  onMessageSent: (recipientId: string) => void;
}

export default function NewConversationDialog({
  userId,
  dailyCount,
  dailyLimit,
  onMessageSent,
}: NewConversationDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [message, setMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url, headline')
      .neq('user_id', userId)
      .or(`full_name.ilike.%${query}%,headline.ilike.%${query}%`)
      .limit(10);

    setSearchResults(data || []);
    setIsSearching(false);
  };

  const handleSelectUser = (user: UserResult) => {
    setSelectedUser(user);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSend = async () => {
    if (!selectedUser || !message.trim()) return;

    if (dailyCount >= dailyLimit) {
      toast({
        title: 'Daily limit reached',
        description: 'Upgrade to Premium for more messages.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);

    const { error } = await supabase.from('messages').insert({
      sender_id: userId,
      recipient_id: selectedUser.user_id,
      content: message.trim(),
    });

    setIsSending(false);

    if (error) {
      toast({ title: 'Failed to send message', variant: 'destructive' });
    } else {
      toast({ title: 'Message sent' });
      setIsOpen(false);
      setSelectedUser(null);
      setMessage('');
      onMessageSent(selectedUser.user_id);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const remainingMessages = dailyLimit - dailyCount;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <PenSquare className="h-4 w-4" /> New Message
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User selection */}
          {!selectedUser ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for a colleague..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {isSearching && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {searchResults.length > 0 && (
                <ScrollArea className="max-h-48">
                  <div className="space-y-1">
                    {searchResults.map((user) => (
                      <button
                        key={user.user_id}
                        onClick={() => handleSelectUser(user)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{user.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.headline}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected user display */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedUser.avatar_url || undefined} />
                  <AvatarFallback>{getInitials(selectedUser.full_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{selectedUser.full_name}</p>
                  <p className="text-sm text-muted-foreground truncate">{selectedUser.headline}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                  Change
                </Button>
              </div>

              {/* Message input */}
              <Textarea
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {remainingMessages} messages remaining today
                </p>
                <Button onClick={handleSend} disabled={isSending || !message.trim() || remainingMessages <= 0}>
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
