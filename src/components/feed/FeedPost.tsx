import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  ThumbsUp,
  Lightbulb,
  AlertCircle,
  MessageSquare,
  Bookmark,
  Share2,
  MoreHorizontal,
  Shield,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Post {
  id: string;
  author_id: string;
  post_type: string;
  category: string;
  title: string | null;
  content: string;
  is_anonymous: boolean;
  view_count: number;
  created_at: string;
  author?: {
    full_name: string | null;
    headline: string | null;
    avatar_url: string | null;
    primary_specialty: string | null;
  };
}

interface FeedPostProps {
  post: Post;
  onUpdate?: () => void;
}

const REACTIONS = [
  { type: 'agree', label: 'Agree', icon: ThumbsUp },
  { type: 'insightful', label: 'Insightful', icon: Lightbulb },
  { type: 'needs_evidence', label: 'Needs Evidence', icon: AlertCircle },
];

const CATEGORY_COLORS: Record<string, string> = {
  clinical: 'bg-blue-100 text-blue-800',
  research: 'bg-purple-100 text-purple-800',
  policy: 'bg-amber-100 text-amber-800',
  education: 'bg-green-100 text-green-800',
  industry: 'bg-slate-100 text-slate-800',
};

export default function FeedPost({ post, onUpdate }: FeedPostProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [reactions, setReactions] = useState<Record<string, boolean>>({});

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleReaction = async (reactionType: string) => {
    if (!user) return;

    const isActive = reactions[reactionType];

    if (isActive) {
      await supabase
        .from('post_reactions')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .eq('reaction_type', reactionType);
    } else {
      await supabase.from('post_reactions').insert({
        post_id: post.id,
        user_id: user.id,
        reaction_type: reactionType,
      });
    }

    setReactions((prev) => ({ ...prev, [reactionType]: !isActive }));
  };

  const handleBookmark = async () => {
    if (!user) return;

    if (isBookmarked) {
      await supabase
        .from('bookmarks')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', user.id);
    } else {
      await supabase.from('bookmarks').insert({
        post_id: post.id,
        user_id: user.id,
      });
    }

    setIsBookmarked(!isBookmarked);
    toast({
      title: isBookmarked ? 'Removed from bookmarks' : 'Saved to bookmarks',
    });
  };

  const handleComment = async () => {
    if (!user || !commentText.trim()) return;

    const { error } = await supabase.from('comments').insert({
      post_id: post.id,
      author_id: user.id,
      content: commentText.trim(),
    });

    if (error) {
      toast({ title: 'Error adding comment', variant: 'destructive' });
    } else {
      setCommentText('');
      toast({ title: 'Comment added' });
    }
  };

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-4">
        {/* Author Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author?.avatar_url || undefined} />
              <AvatarFallback className="bg-muted">
                {post.is_anonymous ? '?' : getInitials(post.author?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {post.is_anonymous ? 'Anonymous' : post.author?.full_name || 'Unknown'}
                </span>
                <Shield className="h-3.5 w-3.5 text-trust" />
              </div>
              <p className="text-sm text-muted-foreground">
                {post.author?.headline || post.author?.primary_specialty || 'Medical Professional'} • {timeAgo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className={CATEGORY_COLORS[post.category] || 'bg-muted'}>
              {post.category.charAt(0).toUpperCase() + post.category.slice(1)}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Report post</DropdownMenuItem>
                <DropdownMenuItem>Hide post</DropdownMenuItem>
                {post.author_id === user?.id && (
                  <DropdownMenuItem className="text-destructive">Delete post</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Post Content */}
        {post.title && <h3 className="font-semibold text-lg mb-2">{post.title}</h3>}
        <p className="text-foreground whitespace-pre-wrap">{post.content}</p>

        {/* Engagement Stats */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border text-sm text-muted-foreground">
          <span>{post.view_count} views</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div className="flex gap-1">
            {REACTIONS.map((reaction) => {
              const Icon = reaction.icon;
              const isActive = reactions[reaction.type];
              return (
                <Button
                  key={reaction.type}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReaction(reaction.type)}
                  className={`gap-1.5 ${isActive ? 'text-accent bg-accent/10' : ''}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{reaction.label}</span>
                </Button>
              );
            })}
          </div>

          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="gap-1.5"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Comment</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBookmark}
              className={`gap-1.5 ${isBookmarked ? 'text-accent' : ''}`}
            >
              <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-border space-y-3">
            <div className="flex gap-2">
              <Textarea
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={2}
                className="resize-none"
              />
              <Button
                onClick={handleComment}
                disabled={!commentText.trim()}
                className="bg-accent hover:bg-accent/90"
              >
                Post
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
