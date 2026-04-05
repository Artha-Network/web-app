import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE } from "@/lib/config";
import { toast } from "sonner";
import { Loader2, Save, User, Wallet, Mail, AlertTriangle, Camera, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/layouts/PageLayout";

interface UserProfile {
  id: string;
  walletAddress: string;
  displayName: string | null;
  emailAddress: string | null;
  avatarUrl: string | null;
  reputationScore: string;
  kycLevel: number;
  createdAt: string;
  updatedAt: string;
}

const Profile: React.FC = () => {
  const { publicKey } = useWallet();
  const { refreshUser, user: authUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Avatar extraction state
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [avatarValid, setAvatarValid] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const requireSetup = (location.state as any)?.requireSetup || false;
  const currentDisplayName = profile?.displayName ?? authUser?.displayName ?? authUser?.name ?? null;
  const currentEmail = profile?.emailAddress ?? authUser?.emailAddress ?? null;
  const currentAvatar = profile?.avatarUrl ?? authUser?.avatarUrl ?? null;
  const isProfileIncomplete = !currentDisplayName || !currentEmail;

  // Sync form fields from authUser when it becomes available
  useEffect(() => {
    if (authUser && !profile) {
      setDisplayName(prev => prev || authUser.displayName || authUser.name || "");
      setEmailAddress(prev => prev || authUser.emailAddress || "");
      setAvatarUrl(prev => prev || authUser.avatarUrl || null);
    }
  }, [authUser, profile]);

  // Fetch full profile from API (only when authenticated)
  useEffect(() => {
    const fetchProfile = async () => {
      if (!publicKey || !isAuthenticated) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/users/me`, {
          credentials: 'include',
        });

        if (!response.ok) throw new Error('Failed to fetch profile');

        const data = await response.json() as UserProfile;
        setProfile(data);
        setDisplayName(data.displayName || "");
        setEmailAddress(data.emailAddress || "");
        setAvatarUrl(data.avatarUrl || null);

        // Validate saved avatar URL so it actually renders
        if (data.avatarUrl) {
          const img = new Image();
          img.onload = () => setAvatarValid(true);
          img.onerror = () => { setAvatarValid(false); setAvatarUrl(null); };
          img.src = data.avatarUrl;
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        if (!authUser?.displayName && !authUser?.emailAddress) {
          toast.error('Failed to load profile');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [publicKey, isAuthenticated]);

  // Email-based avatar + name lookup
  const lookupEmail = useCallback(async (email: string) => {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return;

    setIsLookingUp(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/email-lookup?email=${encodeURIComponent(trimmed)}`);
      if (!res.ok) return;
      const data = await res.json();

      // Test if the Gravatar URL actually has an image (d=404 returns 404 if no avatar)
      const img = new Image();
      img.onload = () => {
        setAvatarUrl(data.avatarUrl);
        setAvatarValid(true);
        setIsLookingUp(false);
      };
      img.onerror = () => {
        // No Gravatar found — use initials-based fallback
        setAvatarUrl(null);
        setAvatarValid(false);
        setIsLookingUp(false);
      };
      img.src = data.avatarUrl;

      // Auto-fill name if empty
      if (!displayName && data.suggestedName) {
        setDisplayName(data.suggestedName);
      }
    } catch {
      setIsLookingUp(false);
    }
  }, [displayName]);

  // Show permission prompt when email changes and is valid
  const handleEmailBlur = () => {
    const trimmed = emailAddress.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return;

    // Show prompt if email changed from what's saved and user hasn't already granted
    const emailChanged = trimmed !== (currentEmail || "");
    if ((isProfileIncomplete || emailChanged) && !permissionGranted) {
      setShowPermissionPrompt(true);
    }
  };

  const handleGrantPermission = () => {
    setPermissionGranted(true);
    setShowPermissionPrompt(false);
    lookupEmail(emailAddress);
  };

  const handleDenyPermission = () => {
    setShowPermissionPrompt(false);
    setPermissionGranted(false);
  };

  const handleSave = async () => {
    if (!publicKey) return;

    if (!displayName.trim()) {
      toast.error('Display name is required');
      return;
    }
    if (!emailAddress.trim()) {
      toast.error('Email address is required');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE}/api/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          displayName: displayName.trim() || null,
          emailAddress: emailAddress.trim() || null,
          avatarUrl: avatarUrl || null,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Failed to update profile' }));
        throw new Error(errData.error || 'Failed to update profile');
      }

      const updated = await response.json() as UserProfile;
      setProfile(updated);
      setDisplayName(updated.displayName || "");
      setEmailAddress(updated.emailAddress || "");
      setAvatarUrl(updated.avatarUrl || null);

      toast.success('Profile updated successfully');
      await refreshUser();

      // Redirect after setup — use the actual saved data, not stale render state
      const wasSetup = requireSetup || !currentDisplayName || !currentEmail;
      const nowComplete = !!(updated.displayName && updated.emailAddress);
      if (wasSetup && nowComplete) {
        const returnTo = searchParams.get('returnTo');
        const redirectTo = returnTo || (location.state as any)?.from?.pathname || '/dashboard';
        navigate(redirectTo, { replace: true });
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

  // Generate initials for fallback avatar
  const initials = displayName
    ? displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : (walletAddress ? walletAddress.slice(0, 2).toUpperCase() : "?");

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
              ? "Set up your email and display name to get started."
              : "Manage your profile settings and view your reputation score."}
          </p>
        </div>

        {(requireSetup || isProfileIncomplete) && (
          <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/50">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <p className="font-semibold">Profile Setup Required</p>
              <p>Enter your email address and we'll help fill in the rest.</p>
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
            <CardDescription>Your identity on Artha Network.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Preview */}
            <div className="flex items-center gap-4">
              <div className="relative">
                {avatarUrl && avatarValid ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover border-2 border-border"
                    onError={() => { setAvatarValid(false); setAvatarUrl(null); }}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-border flex items-center justify-center text-primary font-semibold text-lg">
                    {initials}
                  </div>
                )}
                {isLookingUp && (
                  <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  </div>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {avatarUrl && avatarValid
                  ? "Profile photo loaded from your email"
                  : "Enter your email to load your profile photo"}
              </div>
            </div>

            {/* Wallet Address (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="wallet">Wallet Address</Label>
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-muted-foreground" />
                <Input id="wallet" value={walletAddress || ""} disabled className="font-mono" />
              </div>
              <p className="text-xs text-muted-foreground">Your wallet address cannot be changed</p>
            </div>

            {/* Email Address */}
            <div className="space-y-2">
              <Label htmlFor="emailAddress">
                Email Address {(requireSetup || isProfileIncomplete) && <span className="text-red-500">*</span>}
              </Label>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="emailAddress"
                  type="email"
                  placeholder="you@example.com"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  onBlur={handleEmailBlur}
                  required={requireSetup || isProfileIncomplete}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Used for deal notifications and profile photo lookup.
              </p>
            </div>

            {/* Permission Prompt */}
            {showPermissionPrompt && (
              <Alert className="border-primary/50 bg-primary/5">
                <Camera className="h-4 w-4 text-primary" />
                <AlertDescription>
                  <p className="font-medium text-sm mb-2">
                    Can we use your email to fetch your profile name and photo?
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    We'll look up your public profile photo associated with this email (via Gravatar) and suggest a display name.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleGrantPermission}>
                      <Check className="w-3 h-3 mr-1" /> Yes, fetch my profile
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleDenyPermission}>
                      <X className="w-3 h-3 mr-1" /> No thanks
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Display Name */}
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
                  ? "This name will be shown throughout the app."
                  : "This name will be shown throughout the app. Leave empty to use wallet address."}
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving || (
                displayName === (currentDisplayName || "") &&
                emailAddress === (currentEmail || "") &&
                avatarUrl === (currentAvatar || null)
              )}
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
                * Email and display name are required to create escrow deals.
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Reputation Score</Label>
                <p className="text-2xl font-bold">{profile?.reputationScore ?? authUser?.reputationScore ?? 0}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">KYC Level</Label>
                <p className="text-2xl font-bold">{profile?.kycLevel ?? 0}</p>
              </div>
              {profile?.createdAt && (
                <div>
                  <Label className="text-muted-foreground">Member Since</Label>
                  <p className="text-sm">{new Date(profile.createdAt).toLocaleDateString()}</p>
                </div>
              )}
              {profile?.updatedAt && (
                <div>
                  <Label className="text-muted-foreground">Last Updated</Label>
                  <p className="text-sm">{new Date(profile.updatedAt).toLocaleDateString()}</p>
                </div>
              )}
            </div>

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
