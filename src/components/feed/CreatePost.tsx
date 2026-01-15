import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileText, FlaskConical, Scale, GraduationCap, Building2 } from 'lucide-react';

const CATEGORIES = [
  { value: 'clinical', label: 'Clinical', icon: FileText },
  { value: 'research', label: 'Research', icon: FlaskConical },
  { value: 'policy', label: 'Policy', icon: Scale },
  { value: 'education', label: 'Education', icon: GraduationCap },
  { value: 'industry', label: 'Industry', icon: Building2 },
];

interface CreatePostProps {
  onPostCreated?: () => void;
}

export default function CreatePost({ onPostCreated }: CreatePostProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSubmit = async () => {
    if (!content.trim() || !category) {
      toast({
        title: 'Missing information',
        description: 'Please add content and select a category.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from('posts').insert({
      author_id: user?.id,
      content: content.trim(),
      category: category as any,
      post_type: 'text',
    });

    setIsSubmitting(false);
    if (error) {
      toast({
        title: 'Error creating post',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Post created',
        description: 'Your post has been shared with the community.',
      });
      setContent('');
      setCategory('');
      setIsExpanded(false);
      onPostCreated?.();
    }
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-accent text-accent-foreground">
              {getInitials(profile?.full_name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3">
            {!isExpanded ? (
              <button
                onClick={() => setIsExpanded(true)}
                className="w-full text-left px-4 py-3 rounded-full border border-border text-muted-foreground hover:bg-muted transition-colors"
              >
                Share something with the community...
              </button>
            ) : (
              <>
                <Textarea
                  placeholder="Share a clinical insight, research finding, or start a discussion..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="resize-none"
                  autoFocus
                />

                <div className="flex items-center justify-between gap-4">
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        return (
                          <SelectItem key={cat.value} value={cat.value}>
                            <span className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {cat.label}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsExpanded(false);
                        setContent('');
                        setCategory('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      className="bg-accent hover:bg-accent/90"
                      disabled={!content.trim() || !category || isSubmitting}
                    >
                      {isSubmitting ? 'Posting...' : 'Post'}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
