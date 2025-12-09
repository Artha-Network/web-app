import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE } from "@/lib/config";
import { toast } from "sonner";
import { Loader2, Save, User, Wallet, Mail, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/layouts/PageLayout";

interface UserProfile {
  id: string;
  walletAddress: string;
  displayName: string | null;
  emailAddress: string | null;
  reputationScore: string;
  kycLevel: number;
  createdAt: string;
  updatedAt: string;
}

const Profile: React.FC = () => {
  const { publicKey } = useWallet();
  const { refreshUser, user: authUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Check if profile setup is required (first-time user)
  const requireSetup = (location.state as any)?.requireSetup || false;
  const isProfileIncomplete = !profile?.displayName || !profile?.emailAddress;

  useEffect(() => {
    fetchProfile();
  }, [publicKey]);

  const fetchProfile = async () => {
    if (!publicKey) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/users/me`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json() as UserProfile;
      setProfile(data);
      setDisplayName(data.displayName || "");
      setEmailAddress(data.emailAddress || "");
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDisplayName = async () => {
    if (!publicKey) return;

    // Validate required fields for first-time setup
    if (requireSetup || isProfileIncomplete) {
      if (!displayName.trim()) {
        toast.error('Display name is required');
        return;
      }
      if (!emailAddress.trim()) {
        toast.error('Email address is required');
        return;
      }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailAddress.trim())) {
        toast.error('Please enter a valid email address');
        return;
      }
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE}/api/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          displayName: displayName.trim() || null,
          emailAddress: emailAddress.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updated = await response.json() as UserProfile;
      setProfile(updated);
      setDisplayName(updated.displayName || "");
      setEmailAddress(updated.emailAddress || "");
      
      toast.success('Profile updated successfully');
      
      // Refresh user data in auth context
      await refreshUser();
      
      // If this was a required setup, redirect to dashboard or original destination
      // Otherwise, stay on profile page
      if (requireSetup || isProfileIncomplete) {
        setTimeout(() => {
          const redirectTo = (location.state as any)?.from?.pathname || '/dashboard';
          navigate(redirectTo, { replace: true });
        }, 500);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const walletAddress = publicKey?.toBase58();
  const shortAddress = walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : "—";

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 space-y-6 max-w-4xl">
    <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {requireSetup || isProfileIncomplete ? "Complete Your Profile" : "Profile & Reputation"}
          </h1>
          <p className="text-muted-foreground">
            {requireSetup || isProfileIncomplete 
              ? "Please set up your display name and email address to continue."
              : "Manage your profile settings and view your reputation score."}
          </p>
        </div>

        {(requireSetup || isProfileIncomplete) && (
          <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/50">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <p className="font-semibold">Profile Setup Required</p>
              <p>Please complete your profile by setting a display name and email address before accessing the dashboard.</p>
            </AlertDescription>
          </Alert>
        )}

      {/* Profile Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Settings
          </CardTitle>
          <CardDescription>Update your display name and profile information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="wallet">Wallet Address</Label>
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-muted-foreground" />
              <Input
                id="wallet"
                value={walletAddress || ""}
                disabled
                className="font-mono"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Your wallet address cannot be changed
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">
              Display Name {(requireSetup || isProfileIncomplete) && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="displayName"
              placeholder="Enter your display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={100}
              required={requireSetup || isProfileIncomplete}
            />
            <p className="text-xs text-muted-foreground">
              {requireSetup || isProfileIncomplete 
                ? "This name will be shown in the welcome message and throughout the app."
                : "This name will be shown in the welcome message and throughout the app. Leave empty to use wallet address."}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailAddress">
              Email Address {(requireSetup || isProfileIncomplete) && <span className="text-red-500">*</span>}
            </Label>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <Input
                id="emailAddress"
                type="email"
                placeholder="Enter your email address"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                required={requireSetup || isProfileIncomplete}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Your email address for notifications and deal communications.
            </p>
    </div>

          <Button
            onClick={handleSaveDisplayName}
            disabled={isSaving || (displayName === (profile?.displayName || "") && emailAddress === (profile?.emailAddress || ""))}
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {requireSetup || isProfileIncomplete ? "Save & Continue" : "Save Profile"}
              </>
            )}
          </Button>
          
          {(requireSetup || isProfileIncomplete) && (
            <p className="text-xs text-muted-foreground">
              * Display name and email address are required to create escrow deals.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Account Overview Card */}
    <Card>
      <CardHeader>
        <CardTitle>Account Overview</CardTitle>
          <CardDescription>Your reputation score and account statistics.</CardDescription>
      </CardHeader>
        <CardContent className="space-y-4">
          {profile && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Reputation Score</Label>
                <p className="text-2xl font-bold">{profile.reputationScore}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">KYC Level</Label>
                <p className="text-2xl font-bold">{profile.kycLevel}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Member Since</Label>
                <p className="text-sm">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Last Updated</Label>
                <p className="text-sm">
                  {new Date(profile.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
        <Button asChild>
          <Link to="/notifications">Notifications</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/deals">Your Deals</Link>
        </Button>
          </div>
      </CardContent>
    </Card>
  </div>
    </PageLayout>
);
};

export default Profile;

