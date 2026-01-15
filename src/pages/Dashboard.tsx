import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import FeedPost from '@/components/feed/FeedPost';
import CreatePost from '@/components/feed/CreatePost';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Shield, TrendingUp, Users, MessageSquare, Crown, ArrowRight } from 'lucide-react';

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
  reactions?: { reaction_type: string; count: number }[];
  comment_count?: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, verificationStatus, loading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (!loading && user && profile && !profile.onboarding_completed) {
      navigate('/onboarding');
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_author_id_fkey (
          full_name,
          headline,
          avatar_url,
          primary_specialty
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching posts:', error);
    } else if (data) {
      const postsWithAuthor = data.map((post: any) => ({
        ...post,
        author: post.profiles,
      }));
      setPosts(postsWithAuthor);
    }
    setLoadingPosts(false);
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Profile Card */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xl font-bold">
                  {profile.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                </div>
                <div>
                  <h3 className="font-semibold">{profile.full_name || 'Complete your profile'}</h3>
                  <p className="text-sm text-muted-foreground">{profile.headline || 'Add a headline'}</p>
                </div>
                {verificationStatus.isVerified ? (
                  <Badge className="bg-trust text-trust-foreground">
                    <Shield className="h-3 w-3 mr-1" /> Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-premium text-premium">
                    Verification Pending
                  </Badge>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate('/profile')}
                >
                  View Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Your Network</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Connections</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Profile views</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Post impressions</span>
                <span className="font-medium">0</span>
              </div>
            </CardContent>
          </Card>

          {/* Premium CTA */}
          {!profile.is_premium && (
            <Card className="bg-gradient-to-br from-premium/10 to-premium/5 border-premium/20">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Crown className="h-5 w-5 text-premium mt-0.5" />
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Upgrade to Premium</h4>
                    <p className="text-xs text-muted-foreground">
                      30 messages/day, advanced analytics, early job access.
                    </p>
                    <Button size="sm" className="bg-premium text-premium-foreground hover:bg-premium/90">
                      $9.99/month
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-4">
          <CreatePost onPostCreated={fetchPosts} />

          {loadingPosts ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted" />
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-muted rounded" />
                        <div className="h-3 w-24 bg-muted rounded" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-muted rounded" />
                      <div className="h-4 w-3/4 bg-muted rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No posts yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Be the first to share something with the medical community!
                </p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <FeedPost key={post.id} post={post} onUpdate={fetchPosts} />
            ))
          )}
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Trending Topics */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Trending in Medicine
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {['AI in Diagnostics', 'Burnout Prevention', 'Telehealth Best Practices'].map((topic, i) => (
                <button key={i} className="block text-left w-full hover:bg-muted p-2 rounded-lg transition-colors">
                  <p className="text-sm font-medium">#{topic.replace(/\s+/g, '')}</p>
                  <p className="text-xs text-muted-foreground">Trending in your specialty</p>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Suggested Connections */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" /> People You May Know
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center py-6">
              <p className="text-sm text-muted-foreground">
                Connect with colleagues to see suggestions here.
              </p>
              <Button variant="link" size="sm" className="mt-2" onClick={() => navigate('/network')}>
                Explore Network <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
