import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, Crown, Bell, Lock, User, CreditCard, LogOut, ChevronRight } from 'lucide-react';

export default function Settings() {
  const { user, profile, verificationStatus, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5" /> Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{profile?.full_name}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <Button variant="outline" size="sm">Edit</Button>
            </div>
          </CardContent>
        </Card>

        {/* Verification */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5" /> Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Verification Status</p>
                <p className="text-sm text-muted-foreground">Your medical credentials</p>
              </div>
              {verificationStatus.isVerified ? (
                <Badge className="bg-trust text-trust-foreground">Verified</Badge>
              ) : verificationStatus.isPending ? (
                <Badge variant="outline" className="border-premium text-premium">Pending</Badge>
              ) : (
                <Button size="sm" onClick={() => navigate('/app/onboarding')}>Verify Now</Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Crown className="h-5 w-5" /> Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{profile?.is_premium ? 'Premium Plan' : 'Free Plan'}</p>
                <p className="text-sm text-muted-foreground">
                  {profile?.is_premium ? '30 messages/day, advanced features' : '5 messages/day'}
                </p>
              </div>
              {!profile?.is_premium && (
                <Button className="bg-premium text-premium-foreground hover:bg-premium/90">
                  Upgrade $9.99/mo
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Bell className="h-5 w-5" /> Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <Label htmlFor="email-notif">Email notifications</Label>
              <Switch id="email-notif" defaultChecked />
            </div>
            <div className="flex justify-between items-center">
              <Label htmlFor="msg-notif">Message notifications</Label>
              <Switch id="msg-notif" defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Lock className="h-5 w-5" /> Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <Label htmlFor="profile-visible">Profile visible to all</Label>
              <Switch id="profile-visible" defaultChecked />
            </div>
            <div className="flex justify-between items-center">
              <Label htmlFor="activity-visible">Show activity status</Label>
              <Switch id="activity-visible" />
            </div>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Button variant="destructive" className="w-full" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" /> Sign Out
        </Button>
      </div>
    </AppLayout>
  );
}
