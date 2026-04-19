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
import {
  Loader2,
  Save,
  User,
  Wallet,
  Mail,
  AlertTriangle,
  Camera,
  Check,
  X,
  Shield,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
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

  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [avatarValid, setAvatarValid] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const requireSetup = (location.state as any)?.requireSetup || false;
  const currentDisplayName = profile?.displayName ?? authUser?.displayName ?? authUser?.name ?? null;
  const currentEmail = profile?.emailAddress ?? authUser?.emailAddress ?? null;
  const currentAvatar = profile?.avatarUrl ?? authUser?.avatarUrl ?? null;
  const isProfileIncomplete = !currentDisplayName || !currentEmail;

  useEffect(() => {
    if (authUser && !profile) {
      setDisplayName((prev) => prev || authUser.displayName || authUser.name || "");
      setEmailAddress((prev) => prev || authUser.emailAddress || "");
      setAvatarUrl((prev) => prev || authUser.avatarUrl || null);
    }
  }, [authUser, profile]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!publicKey || !isAuthenticated) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/users/me`, { credentials: "include" });
        if (!response.ok) throw new Error("Failed to fetch profile");

        const data = (await response.json()) as UserProfile;
        setProfile(data);
        setDisplayName(data.displayName || "");
        setEmailAddress(data.emailAddress || "");
        setAvatarUrl(data.avatarUrl || null);

        if (data.avatarUrl) {
          const img = new Image();
          img.onload = () => setAvatarValid(true);
          img.onerror = () => {
            setAvatarValid(false);
            setAvatarUrl(null);
          };
          img.src = data.avatarUrl;
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        if (!authUser?.displayName && !authUser?.emailAddress) {
          toast.error("Failed to load profile");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [publicKey, isAuthenticated]);

  const lookupEmail = useCallback(
    async (email: string) => {
      const trimmed = email.trim();
      if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return;

      setIsLookingUp(true);
      try {
        const res = await fetch(`${API_BASE}/api/users/email-lookup?email=${encodeURIComponent(trimmed)}`, {
          credentials: "include",
        });
        if (!res.ok) {
          setIsLookingUp(false);
          return;
        }
        const data = await res.json();

        if (!displayName && data.suggestedName) {
          setDisplayName(data.suggestedName);
        }

        const img = new Image();
        img.onload = () => {
          setAvatarUrl(data.avatarUrl);
          setAvatarValid(true);
          setIsLookingUp(false);
        };
        img.onerror = () => {
          setAvatarUrl(null);
          setAvatarValid(false);
          setIsLookingUp(false);
        };
        img.src = data.avatarUrl;
      } catch {
        setIsLookingUp(false);
      }
    },
    [displayName],
  );

  const handleEmailBlur = () => {
    const trimmed = emailAddress.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return;

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
      toast.error("Display name is required");
      return;
    }
    if (!emailAddress.trim()) {
      toast.error("Email address is required");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE}/api/users/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          displayName: displayName.trim() || null,
          emailAddress: emailAddress.trim() || null,
          avatarUrl: avatarUrl || null,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: "Failed to update profile" }));
        throw new Error(errData.error || "Failed to update profile");
      }

      const updated = (await response.json()) as UserProfile;
      setProfile(updated);
      setDisplayName(updated.displayName || "");
      setEmailAddress(updated.emailAddress || "");
      setAvatarUrl(updated.avatarUrl || null);

      toast.success("Profile updated successfully");
      await refreshUser();

      const wasSetup = requireSetup || !currentDisplayName || !currentEmail;
      const nowComplete = !!(updated.displayName && updated.emailAddress);
      if (wasSetup && nowComplete) {
        const returnTo = searchParams.get("returnTo");
        const redirectTo = returnTo || (location.state as any)?.from?.pathname || "/dashboard";
        navigate(redirectTo, { replace: true });
      }
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      toast.error(error?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const walletAddress = publicKey?.toBase58();
  const shortAddress = walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : "—";

  const initials = displayName
    ? displayName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : walletAddress
      ? walletAddress.slice(0, 2).toUpperCase()
      : "?";

  const reputationNum = Number(profile?.reputationScore ?? authUser?.reputationScore ?? 0);
  const kycLevel = profile?.kycLevel ?? authUser?.kycLevel ?? 0;
  const memberSince = profile?.createdAt ? new Date(profile.createdAt) : null;

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="relative overflow-hidden bg-background">
        <div className="orb top-16 -right-20 w-[280px] h-[280px] bg-primary/20" />
        <div className="orb top-[400px] -left-20 w-[220px] h-[220px] bg-secondary/15" style={{ animationDelay: "1.2s" }} />

        <div className="relative container mx-auto max-w-6xl px-6 py-8 space-y-6">
          {/* Identity hero */}
          <div className="gradient-hero-card p-8 md:p-10">
            <div className="absolute inset-0 grid-overlay-light" />
            <div className="relative grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 items-center">
              <div className="flex items-center gap-6">
                <div className="relative shrink-0">
                  {avatarUrl && avatarValid ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-[3px] border-white/40 bg-white/20"
                      onError={() => {
                        setAvatarValid(false);
                        setAvatarUrl(null);
                      }}
                    />
                  ) : (
                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white/20 backdrop-blur border-[3px] border-white/40 flex items-center justify-center text-white font-bold text-3xl md:text-4xl">
                      {initials}
                    </div>
                  )}
                  {isLookingUp && (
                    <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-[11px] font-semibold tracking-wider uppercase mb-3 text-white">
                    {isAuthenticated ? <CheckCircle2 className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                    {isAuthenticated
                      ? memberSince
                        ? `Verified · since ${memberSince.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
                        : "Verified"
                      : "Setting up"}
                  </span>
                  <h1 className="text-3xl md:text-4xl font-bold leading-tight text-white">
                    {currentDisplayName || "Complete your profile"}
                  </h1>
                  <p className="text-sm text-white/80 mt-1 font-mono-data">{shortAddress}</p>
                  {currentEmail && <p className="text-sm text-white/70 mt-1">{currentEmail}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 lg:pl-10 lg:border-l border-white/25">
                <div>
                  <div className="text-[10px] tracking-widest uppercase text-white/75 mb-1.5">Reputation</div>
                  <div className="text-3xl font-bold leading-none text-white">
                    {reputationNum}
                  </div>
                  <div className="text-[11px] text-white/75 mt-1">
                    {reputationNum >= 10 ? "Trusted" : reputationNum >= 0 ? "Building" : "Needs review"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] tracking-widest uppercase text-white/75 mb-1.5">KYC Level</div>
                  <div className="text-3xl font-bold leading-none text-white">
                    {kycLevel}
                  </div>
                  <div className="text-[11px] text-white/75 mt-1">
                    {kycLevel >= 2 ? "Fully verified" : kycLevel === 1 ? "Basic" : "Unverified"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] tracking-widest uppercase text-white/75 mb-1.5">Wallet</div>
                  <div className="text-xl font-bold leading-none text-white font-mono-data">
                    Solana
                  </div>
                  <div className="text-[11px] text-white/75 mt-1">
                    {isAuthenticated ? "Signed" : "Unverified"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] tracking-widest uppercase text-white/75 mb-1.5">Status</div>
                  <div className="text-xl font-bold leading-none text-white">
                    {isProfileIncomplete ? "Setup" : "Active"}
                  </div>
                  <div className="text-[11px] text-white/75 mt-1">
                    {isProfileIncomplete ? "Fill required fields" : "Ready to trade"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {(requireSetup || isProfileIncomplete) && (
            <Alert className="border-primary/50 bg-primary/5">
              <AlertTriangle className="h-4 w-4 text-primary" />
              <AlertDescription>
                <p className="font-semibold">Profile setup required</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your email address and we'll help fill in the rest.
                </p>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5">
            {/* Left: Profile settings */}
            <div className="glass-card p-7">
              <div className="flex items-center gap-3 mb-6">
                <div className="icon-tile">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Profile settings</h3>
                  <p className="text-sm text-muted-foreground">Your identity on Artha Network.</p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Wallet (read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="wallet">Wallet address</Label>
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-muted-foreground shrink-0" />
                    <Input id="wallet" value={walletAddress || ""} disabled className="font-mono-data" />
                  </div>
                  <p className="text-xs text-muted-foreground">Your wallet address cannot be changed.</p>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="emailAddress">
                    Email address {(requireSetup || isProfileIncomplete) && <span className="text-destructive">*</span>}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
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

                {showPermissionPrompt && (
                  <Alert className="border-primary/50 bg-primary/5">
                    <Camera className="h-4 w-4 text-primary" />
                    <AlertDescription>
                      <p className="font-medium text-sm mb-2">
                        Can we use your email to fetch your profile name and photo?
                      </p>
                      <p className="text-xs text-muted-foreground mb-3">
                        We'll look up your public profile photo (via Gravatar) and suggest a display name.
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

                {/* Display name */}
                <div className="space-y-2">
                  <Label htmlFor="displayName">
                    Display name {(requireSetup || isProfileIncomplete) && <span className="text-destructive">*</span>}
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
                    Shown throughout the app. Counterparties will see this name on deals.
                  </p>
                </div>

                <Button
                  onClick={handleSave}
                  disabled={
                    isSaving ||
                    (displayName === (currentDisplayName || "") &&
                      emailAddress === (currentEmail || "") &&
                      avatarUrl === (currentAvatar || null))
                  }
                  className="w-full sm:w-auto rounded-full px-6"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {requireSetup || isProfileIncomplete ? "Save & continue" : "Save profile"}
                    </>
                  )}
                </Button>

                {(requireSetup || isProfileIncomplete) && (
                  <p className="text-xs text-muted-foreground">
                    * Email and display name are required to create escrow deals.
                  </p>
                )}
              </div>
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-5">
              {/* Verification card */}
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="icon-tile icon-tile-secondary">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold">Verification</h3>
                    <p className="text-xs text-muted-foreground">Unlock bigger deals and lower fees.</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {[
                    { t: "Wallet ownership", done: isAuthenticated },
                    { t: "Email address", done: !!currentEmail },
                    { t: "Display name", done: !!currentDisplayName },
                    { t: "Government ID (optional)", done: kycLevel >= 2 },
                  ].map((r) => (
                    <div
                      key={r.t}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        r.done
                          ? "border-[hsl(var(--success)/0.3)] bg-[hsl(var(--success)/0.05)]"
                          : "border-border bg-background"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center ${
                          r.done ? "bg-[hsl(var(--success))] text-white" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {r.done ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </div>
                      <div className="text-sm font-medium flex-1">{r.t}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick links */}
              <div className="glass-card p-6">
                <h3 className="font-bold mb-4">Shortcuts</h3>
                <div className="grid gap-2">
                  <Link
                    to="/notifications"
                    className="flex items-center justify-between px-4 py-3 rounded-lg border border-border hover:bg-muted/40 transition-colors text-sm font-medium"
                  >
                    Notifications
                    <span className="text-muted-foreground">→</span>
                  </Link>
                  <Link
                    to="/deals"
                    className="flex items-center justify-between px-4 py-3 rounded-lg border border-border hover:bg-muted/40 transition-colors text-sm font-medium"
                  >
                    Your deals
                    <span className="text-muted-foreground">→</span>
                  </Link>
                  <Link
                    to="/docs"
                    className="flex items-center justify-between px-4 py-3 rounded-lg border border-border hover:bg-muted/40 transition-colors text-sm font-medium"
                  >
                    Documentation
                    <span className="text-muted-foreground">→</span>
                  </Link>
                </div>
              </div>

              {/* Meta */}
              {profile && (
                <div className="glass-card p-6">
                  <h3 className="font-bold mb-3">Account info</h3>
                  <div className="space-y-2.5 text-sm">
                    {profile.createdAt && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Member since</span>
                        <span className="font-mono-data text-xs">
                          {new Date(profile.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {profile.updatedAt && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last updated</span>
                        <span className="font-mono-data text-xs">
                          {new Date(profile.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Profile;
