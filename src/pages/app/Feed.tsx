import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import CreatePost from '@/components/feed/CreatePost';
import FeedPost from '@/components/feed/FeedPost';
import PeopleSearch from '@/components/feed/PeopleSearch';
import SubscriptionCTA from '@/components/feed/SubscriptionCTA';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Shield, TrendingUp, Users, MessageSquare } from 'lucide-react';

interface Post {
  id: string;
  author_id: string;
  title: string | null;
  content: string;
  category: string;
  post_type: string;
  created_at: string;
  is_anonymous: boolean;
  view_count: number;
  author?: {
    full_name: string | null;
    headline: string | null;
    avatar_url: string | null;
    primary_specialty: string | null;
  };
  reactions_count: number;
  comments_count: number;
}

const TRENDING_TOPICS = [
  { tag: '#AIinMedicine', posts: 2450 },
  { tag: '#ResidentLife', posts: 1823 },
  { tag: '#ClinicalTrials', posts: 1456 },
  { tag: '#MedTwitter', posts: 1234 },
  { tag: '#HealthPolicy', posts: 987 },
];

export default function Feed() {
  const { profile, verificationStatus } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        author_id,
        title,
        content,
        category,
        post_type,
        created_at,
        is_anonymous,
        view_count
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching posts:', error);
      setIsLoading(false);
      return;
    }

    const authorIds = data
      .filter((post) => !post.is_anonymous)
      .map((post) => post.author_id);

    let profiles: Record<string, any> = {};
    if (authorIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, headline, avatar_url, primary_specialty')
        .in('user_id', authorIds);

      if (profilesData) {
        profiles = profilesData.reduce((acc, p) => {
          acc[p.user_id] = p;
          return acc;
        }, {} as Record<string, any>);
      }
    }

    const postIds = data.map((p) => p.id);
    const { data: reactionsData } = await supabase
      .from('post_reactions')
      .select('post_id')
      .in('post_id', postIds);

    const reactionCounts = reactionsData?.reduce((acc, r) => {
      acc[r.post_id] = (acc[r.post_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const { data: commentsData } = await supabase
      .from('comments')
      .select('post_id')
      .in('post_id', postIds);

    const commentCounts = commentsData?.reduce((acc, c) => {
      acc[c.post_id] = (acc[c.post_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const postsWithDetails = data.map((post) => ({
      ...post,
      author: post.is_anonymous ? null : profiles[post.author_id] || null,
      reactions_count: reactionCounts[post.id] || 0,
      comments_count: commentCounts[post.id] || 0,
    }));

    setPosts(postsWithDetails);
    setIsLoading(false);
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <AppLayout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar - Profile Card */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 mb-4">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-accent text-accent-foreground text-xl">
                    {getInitials(profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-lg">{profile?.full_name || 'User'}</h3>
                <p className="text-sm text-muted-foreground">{profile?.headline || 'Medical Professional'}</p>
                
                {verificationStatus.isVerified && (
                  <Badge variant="outline" className="mt-2 border-trust text-trust">
                    <Shield className="h-3 w-3 mr-1" /> Verified
                  </Badge>
                )}
              </div>
              <Separator className="my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Connections</span>
                  <span className="font-medium">127</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Profile views</span>
                  <span className="font-medium">342</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {!profile?.is_premium && <SubscriptionCTA />}
        </div>

        {/* Main Feed */}
        <div className="lg:col-span-6 space-y-4">
          {/* Search Bar */}
          <PeopleSearch />
          
          <CreatePost onPostCreated={fetchPosts} />

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold text-lg mb-2">No posts yet</h3>
                <p className="text-muted-foreground">Be the first to share something with the community!</p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <FeedPost key={post.id} post={post} />
            ))
          )}
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" />
                Trending Topics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {TRENDING_TOPICS.map((topic) => (
                <div key={topic.tag} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-accent hover:underline cursor-pointer">
                    {topic.tag}
                  </span>
                  <span className="text-xs text-muted-foreground">{topic.posts} posts</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-accent" />
                Grow Your Network
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Connect with verified medical professionals in your specialty.
              </p>
              <Button variant="outline" className="w-full">
                Find Connections
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
