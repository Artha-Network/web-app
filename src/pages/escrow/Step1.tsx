import { FC, useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import PageLayout from "@/components/layouts/PageLayout";
import StepIndicator from "@/components/molecules/StepIndicator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ArrowRight,
  WalletMinimal,
  AlertTriangle,
  Info,
  Mail,
  Car,
  Shield,
  Loader,
  Sparkles,
  FileSignature,
  CalendarClock,
} from "lucide-react";
import { useEscrowFlow } from "@/hooks/useEscrowFlow";
import type { CarMetadata } from "@/hooks/useEscrowFlow";
import { useEvent } from "@/hooks/useEvent";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuth } from "@/context/AuthContext";
import { isValidSolanaAddress } from "@/utils/solana";
import { API_BASE } from "@/lib/config";
import { fetchCarEscrowPlan } from "@/services/actions";
import type { CarEscrowPlan } from "@/services/actions";

const Shell: FC<{ children: React.ReactNode }> = ({ children }) => (
  <PageLayout>
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="orb bg-primary/20 h-72 w-72 -top-20 -left-20" />
      <div className="orb bg-secondary/15 h-96 w-96 top-1/3 -right-32" style={{ animationDelay: "1s" }} />
      <div className="orb bg-accent/15 h-80 w-80 bottom-0 left-1/2" style={{ animationDelay: "2s" }} />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 py-10">{children}</div>
    </div>
  </PageLayout>
);

const Step1: FC = () => {
  const { publicKey } = useWallet();
  const { user: authUser } = useAuth();
  const { data, setField, next, updateData } = useEscrowFlow();
  const { trackEvent } = useEvent();
  const navigate = useNavigate();

  const lastAutoTitle = useRef<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [, setUserProfile] = useState<{ emailAddress?: string; displayName?: string } | null>(null);
  const [carPlan, setCarPlan] = useState<CarEscrowPlan | null>(null);
  const [carPlanLoading, setCarPlanLoading] = useState(false);
  const [carPlanError, setCarPlanError] = useState<string | null>(null);
  const [vinLookup, setVinLookup] = useState<{
    loading: boolean;
    result: { year: string; make: string; model: string; valid: boolean; errorCode: string } | null;
  }>({ loading: false, result: null });

  const updateCarField = useCallback(
    <K extends keyof CarMetadata>(key: K, value: CarMetadata[K]) => {
      updateData({ carMetadata: { ...data.carMetadata, [key]: value } });
    },
    [data.carMetadata, updateData]
  );

  const [lastLookedUpVin, setLastLookedUpVin] = useState<string>("");

  const lookupVin = useCallback(
    async (vin: string) => {
      const trimmed = vin.trim();
      if (!trimmed || trimmed.length !== 17 || trimmed === lastLookedUpVin) return;

      setLastLookedUpVin(trimmed);
      setVinLookup({ loading: true, result: null });
      try {
        const res = await fetch(`${API_BASE}/api/vin/${trimmed}`);
        if (!res.ok) {
          setVinLookup({ loading: false, result: { year: "", make: "", model: "", valid: false, errorCode: "FETCH_ERROR" } });
          return;
        }
        const result = await res.json();
        setVinLookup({ loading: false, result });
        const updates: Partial<typeof data> = {};
        const carUpdates: Partial<CarMetadata> = { ...data.carMetadata, vin: trimmed };
        if (result.year) carUpdates.year = Number(result.year);
        if (result.make) carUpdates.make = result.make;
        if (result.model) carUpdates.model = result.model;
        updates.carMetadata = carUpdates as CarMetadata;
        if (result.make && result.model) {
          const autoTitle = `${result.year || ""} ${result.make} ${result.model}`.trim();
          if (!data.title || data.title === lastAutoTitle.current) {
            updates.title = autoTitle;
            lastAutoTitle.current = autoTitle;
          }
        }
        updateData(updates);
      } catch {
        setVinLookup({ loading: false, result: { year: "", make: "", model: "", valid: false, errorCode: "FETCH_ERROR" } });
      }
    },
    [lastLookedUpVin, data.carMetadata, data.title, updateData]
  );

  const handleVinBlur = useCallback(() => {
    if (data.vin) lookupVin(data.vin);
  }, [data.vin, lookupVin]);

  useEffect(() => {
    if (!data.isCarSale) return;
    const cm = data.carMetadata;
    if (!cm?.year || !cm?.deliveryType || (!cm?.odometerMiles && cm?.odometerMiles !== 0) || !data.amount) return;
    if (cm.hasTitleInHand === undefined) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setCarPlanLoading(true);
      setCarPlanError(null);
      try {
        const plan = await fetchCarEscrowPlan({
          priceUsd: typeof data.amount === "number" ? data.amount : 0,
          deliveryType: cm.deliveryType!,
          hasTitleInHand: cm.hasTitleInHand!,
          odometerMiles: typeof cm.odometerMiles === "number" ? cm.odometerMiles : 0,
          year: typeof cm.year === "number" ? cm.year : 0,
          isSalvageTitle: cm.isSalvageTitle,
        });
        if (!controller.signal.aborted) {
          setCarPlan(plan);
          if (plan.deliveryDeadlineAtIso) {
            setField("completionDeadline", plan.deliveryDeadlineAtIso.slice(0, 16));
          }
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setCarPlanError(err instanceof Error ? err.message : "Failed to fetch car plan");
        }
      } finally {
        if (!controller.signal.aborted) setCarPlanLoading(false);
      }
    }, 800);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [
    data.isCarSale,
    data.carMetadata?.year,
    data.carMetadata?.deliveryType,
    data.carMetadata?.odometerMiles,
    data.carMetadata?.hasTitleInHand,
    data.carMetadata?.isSalvageTitle,
    data.amount,
  ]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/users/me`, { credentials: "include" });
        if (response.ok) {
          const profile = await response.json();
          setUserProfile(profile);
          if (profile.emailAddress) {
            setUserEmail(profile.emailAddress);
            setField("userEmail", profile.emailAddress);
            return;
          }
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
      if (authUser?.emailAddress) {
        setUserEmail(authUser.emailAddress);
        setField("userEmail", authUser.emailAddress);
        setUserProfile({ emailAddress: authUser.emailAddress, displayName: authUser.displayName || authUser.name });
      }
    };
    fetchUserProfile();
  }, [setField, authUser]);

  useEffect(() => {
    trackEvent("deal_draft_started");
    updateData({ contract: "", questions: [] });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!data.title.trim()) {
      newErrors.title = "Deal title is required";
    } else if (data.title.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    }

    if (!data.counterpartyAddress.trim()) {
      newErrors.counterpartyAddress = "Counterparty address is required";
    } else if (!isValidSolanaAddress(data.counterpartyAddress)) {
      newErrors.counterpartyAddress = "Please enter a valid Solana address";
    } else if (data.counterpartyAddress === publicKey?.toBase58()) {
      newErrors.counterpartyAddress = "Cannot create escrow with yourself";
    }

    if (!data.counterpartyEmail?.trim()) {
      newErrors.counterpartyEmail = "Counterparty email is required for deal notifications";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.counterpartyEmail.trim())) {
      newErrors.counterpartyEmail = "Please enter a valid email address";
    }

    if (!data.amount || data.amount <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    } else if (data.amount < 10) {
      newErrors.amount = "Minimum escrow amount is $10 USDC";
    } else if (data.amount > 1000000) {
      newErrors.amount = "Maximum escrow amount is $1,000,000 USDC";
    }

    if (!data.description.trim()) {
      newErrors.description = "Description is required";
    } else if (data.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    } else if (data.description.length > 1000) {
      newErrors.description = "Description must be less than 1000 characters";
    }

    if (data.vin && data.vin.trim().length > 0 && data.vin.trim().length !== 17) {
      newErrors.vin = "VIN must be exactly 17 characters";
    }

    if (!data.initiatorDeadline) {
      newErrors.initiatorDeadline = "Funding deadline is required";
    }

    if (!data.completionDeadline) {
      newErrors.completionDeadline = "Completion deadline is required";
    } else if (data.initiatorDeadline) {
      const fundingDate = new Date(data.initiatorDeadline);
      const completionDate = new Date(data.completionDeadline);
      if (completionDate < fundingDate) {
        newErrors.completionDeadline = "Completion deadline must be on or after funding deadline";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    setIsValidating(true);
    if (!userEmail || !userEmail.trim()) {
      setErrors({ profileSetup: "Please set up your email address in your profile before creating an escrow deal." });
      setIsValidating(false);
      return;
    }
    if (!validateForm()) {
      setIsValidating(false);
      return;
    }
    trackEvent("deal_draft_submitted", {
      amount: data.amount,
      has_description: !!data.description,
      funding_deadline_hours: data.initiatorDeadline
        ? Math.round((new Date(data.initiatorDeadline).getTime() - Date.now()) / (1000 * 60 * 60))
        : undefined,
      completion_deadline_hours: data.completionDeadline
        ? Math.round((new Date(data.completionDeadline).getTime() - Date.now()) / (1000 * 60 * 60))
        : undefined,
    });
    setIsValidating(false);
    next(1);
  };

  if (!publicKey) {
    return (
      <Shell>
        <div className="mx-auto max-w-xl">
          <Card className="glass-card">
            <CardContent className="p-10 text-center">
              <div className="icon-tile mx-auto mb-5">
                <WalletMinimal className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Wallet required</h2>
              <p className="text-muted-foreground mb-6">Connect your wallet to create an escrow deal.</p>
              <Button className="bg-gradient-primary text-white rounded-full" onClick={() => navigate("/wallet-connect")}>
                Connect wallet
              </Button>
            </CardContent>
          </Card>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      {/* Hero */}
      <div className="text-center mb-8">
        <span className="artha-pill-secondary">
          <Sparkles className="w-3.5 h-3.5" />
          Step 1 · Counterparty & terms
        </span>
        <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight">
          Create a new <span className="gradient-text-two">escrow</span>
        </h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
          Securely transact with anyone on the Solana blockchain.
        </p>
      </div>

      {/* Progress */}
      <Card className="glass-card mb-6">
        <CardContent className="px-6 py-5">
          <StepIndicator current={1} />
        </CardContent>
      </Card>

      {/* Info alert */}
      <Alert className="glass-card mb-6 border-primary/30">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription>
          Create a new escrow deal by providing the counterparty's wallet address, amount, and terms. The deal will be created on-chain
          after funding in the next step.
        </AlertDescription>
      </Alert>

      {/* Deal basics */}
      <Card className="glass-card mb-6">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="icon-tile h-10 w-10 rounded-xl">
              <FileSignature className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Deal basics</h2>
              <p className="text-sm text-muted-foreground">Title, role, and counterparty contact.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            <div className="md:col-span-2">
              <Label htmlFor="title" className="block text-sm font-medium">
                Deal title *
              </Label>
              <Input
                id="title"
                value={data.title}
                onChange={(e) => {
                  setField("title", e.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: "" }));
                }}
                placeholder="e.g., Web Design Project, Car Sale, etc."
                className={`mt-1 ${errors.title ? "border-destructive" : ""}`}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {errors.title}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label className="block text-sm font-medium mb-2">I am the...</Label>
              <RadioGroup
                defaultValue={data.role}
                onValueChange={(val) => setField("role", val as "buyer" | "seller")}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                <label
                  htmlFor="role-buyer"
                  className="flex items-center gap-3 border border-border/60 rounded-xl p-4 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
                >
                  <RadioGroupItem value="buyer" id="role-buyer" />
                  <div className="flex-1">
                    <div className="font-semibold">Buyer</div>
                    <p className="text-xs text-muted-foreground">I am paying for goods/services</p>
                  </div>
                </label>
                <label
                  htmlFor="role-seller"
                  className="flex items-center gap-3 border border-border/60 rounded-xl p-4 cursor-pointer hover:border-secondary/40 hover:bg-secondary/5 transition-all"
                >
                  <RadioGroupItem value="seller" id="role-seller" />
                  <div className="flex-1">
                    <div className="font-semibold">Seller</div>
                    <p className="text-xs text-muted-foreground">I am providing goods/services</p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="counterparty-address" className="block text-sm font-medium">
                Counterparty Solana address *
              </Label>
              <div className="mt-1 relative">
                <WalletMinimal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="counterparty-address"
                  value={data.counterpartyAddress}
                  onChange={(e) => {
                    setField("counterpartyAddress", e.target.value);
                    if (errors.counterpartyAddress) setErrors((prev) => ({ ...prev, counterpartyAddress: "" }));
                  }}
                  placeholder="Enter Solana address..."
                  className={`pl-9 font-mono-data text-sm ${errors.counterpartyAddress ? "border-destructive" : ""}`}
                />
              </div>
              {errors.counterpartyAddress && (
                <p className="mt-1 text-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {errors.counterpartyAddress}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">The wallet address of the person you're trading with</p>
            </div>

            <div>
              <Label htmlFor="counterparty-email" className="block text-sm font-medium">
                Counterparty email *
              </Label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="counterparty-email"
                  type="email"
                  value={data.counterpartyEmail || ""}
                  onChange={(e) => {
                    setField("counterpartyEmail", e.target.value);
                    if (errors.counterpartyEmail) setErrors((prev) => ({ ...prev, counterpartyEmail: "" }));
                  }}
                  placeholder="counterparty@example.com"
                  className={`pl-9 ${errors.counterpartyEmail ? "border-destructive" : ""}`}
                />
              </div>
              {errors.counterpartyEmail && (
                <p className="mt-1 text-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {errors.counterpartyEmail}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                They'll receive a notification about this deal. Your email ({userEmail || "not set"}) is used automatically.
              </p>
            </div>

            {errors.profileSetup && (
              <div className="md:col-span-2">
                <Alert className="border-amber-500/50 bg-amber-500/10">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-900 dark:text-amber-200">
                    <div className="space-y-2">
                      <p>{errors.profileSetup}</p>
                      <Button onClick={() => navigate("/profile")} variant="outline" size="sm">
                        Go to profile settings
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div>
              <Label htmlFor="amount" className="block text-sm font-medium">
                Amount (USDC) *
              </Label>
              <div className="mt-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="amount"
                  type="number"
                  min="10"
                  max="1000000"
                  step="0.01"
                  value={data.amount === "" ? "" : data.amount}
                  onChange={(e) => {
                    const value = e.target.value === "" ? "" : Number(e.target.value);
                    setField("amount", value);
                    if (errors.amount) setErrors((prev) => ({ ...prev, amount: "" }));
                  }}
                  placeholder="0.00"
                  className={`pl-7 pr-14 font-mono-data ${errors.amount ? "border-destructive" : ""}`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">USDC</span>
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {errors.amount}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">Minimum: $10 USDC • Maximum: $1,000,000 USDC</p>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description" className="block text-sm font-medium">
                Description *
              </Label>
              <Textarea
                id="description"
                rows={4}
                value={data.description}
                onChange={(e) => {
                  setField("description", e.target.value);
                  if (errors.description) setErrors((prev) => ({ ...prev, description: "" }));
                }}
                placeholder="Describe the terms of the transaction, what goods/services are being exchanged, delivery conditions, etc..."
                className={`mt-1 ${errors.description ? "border-destructive" : ""}`}
                maxLength={1000}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {errors.description}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {data.description.length}/1000 characters • Be specific about terms and conditions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Car sale toggle + details */}
      <Card className="glass-card mb-6">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="icon-tile icon-tile-secondary h-10 w-10 rounded-xl">
                <Car className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Vehicle sale</h2>
                <p className="text-sm text-muted-foreground">
                  Toggle on to add VIN lookup, risk assessment, and recommended deadlines.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="is-car-sale" className="text-sm font-medium cursor-pointer">
                {data.isCarSale ? "Enabled" : "Disabled"}
              </Label>
              <Switch
                id="is-car-sale"
                checked={data.isCarSale ?? false}
                onCheckedChange={(checked) => {
                  updateData({ isCarSale: checked });
                  if (!checked) {
                    setCarPlan(null);
                    setCarPlanError(null);
                  }
                }}
              />
            </div>
          </div>

          {data.isCarSale && (
            <div className="mt-6 border-t border-border/60 pt-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              <div>
                <Label htmlFor="car-year" className="block text-sm font-medium">
                  Year *
                </Label>
                <Input
                  id="car-year"
                  type="number"
                  min={1900}
                  max={2027}
                  value={data.carMetadata?.year === "" ? "" : data.carMetadata?.year ?? ""}
                  onChange={(e) => updateCarField("year", e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="e.g., 2020"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="car-make" className="block text-sm font-medium">
                  Make
                </Label>
                <Input
                  id="car-make"
                  value={data.carMetadata?.make ?? ""}
                  onChange={(e) => updateCarField("make", e.target.value)}
                  placeholder="e.g., Honda"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="car-model" className="block text-sm font-medium">
                  Model
                </Label>
                <Input
                  id="car-model"
                  value={data.carMetadata?.model ?? ""}
                  onChange={(e) => updateCarField("model", e.target.value)}
                  placeholder="e.g., Civic"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="vin" className="block text-sm font-medium">
                  VIN
                </Label>
                <Input
                  id="vin"
                  value={data.vin || ""}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setField("vin", val);
                    if (errors.vin) setErrors((prev) => ({ ...prev, vin: "" }));
                    if (val.trim().length === 17) lookupVin(val);
                  }}
                  onBlur={handleVinBlur}
                  placeholder="17-character VIN"
                  maxLength={17}
                  className={`mt-1 font-mono-data ${errors.vin ? "border-destructive" : ""}`}
                />
                {vinLookup.loading && (
                  <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1">
                    <Loader className="w-3 h-3 animate-spin" />
                    Looking up VIN...
                  </p>
                )}
                {vinLookup.result && vinLookup.result.valid && (
                  <p className="mt-1 text-sm text-[hsl(var(--success))] flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    {vinLookup.result.year} {vinLookup.result.make} {vinLookup.result.model}
                  </p>
                )}
                {vinLookup.result && !vinLookup.result.valid && vinLookup.result.make && (
                  <p className="mt-1 text-sm text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {vinLookup.result.year} {vinLookup.result.make} {vinLookup.result.model} (partial match)
                  </p>
                )}
                {vinLookup.result && !vinLookup.result.valid && !vinLookup.result.make && (
                  <p className="mt-1 text-sm text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Could not verify VIN — you can still proceed
                  </p>
                )}
                {errors.vin && (
                  <p className="mt-1 text-sm text-destructive flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {errors.vin}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="car-odometer" className="block text-sm font-medium">
                  Odometer (miles) *
                </Label>
                <Input
                  id="car-odometer"
                  type="number"
                  min={0}
                  value={data.carMetadata?.odometerMiles === "" ? "" : data.carMetadata?.odometerMiles ?? ""}
                  onChange={(e) => updateCarField("odometerMiles", e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="e.g., 45000"
                  className="mt-1"
                />
              </div>

              <div className="md:col-span-2">
                <Label className="block text-sm font-medium mb-2">Delivery type *</Label>
                <RadioGroup
                  value={data.carMetadata?.deliveryType ?? ""}
                  onValueChange={(val) => updateCarField("deliveryType", val as CarMetadata["deliveryType"])}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                >
                  {[
                    { value: "local_pickup", label: "Local pickup" },
                    { value: "same_city_carrier", label: "Same city carrier" },
                    { value: "cross_country_carrier", label: "Cross country carrier" },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      htmlFor={`dt-${opt.value}`}
                      className="flex items-center gap-2 border border-border/60 rounded-xl p-3 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
                    >
                      <RadioGroupItem value={opt.value} id={`dt-${opt.value}`} />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="md:col-span-2 flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="title-in-hand"
                    checked={data.carMetadata?.hasTitleInHand ?? false}
                    onCheckedChange={(checked) => {
                      updateCarField("hasTitleInHand", !!checked);
                      if (!checked) updateCarField("isSalvageTitle", false);
                    }}
                  />
                  <Label htmlFor="title-in-hand" className="text-sm cursor-pointer">
                    Title in hand
                  </Label>
                </div>

                {data.carMetadata?.hasTitleInHand && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="salvage-title"
                      checked={data.carMetadata?.isSalvageTitle ?? false}
                      onCheckedChange={(checked) => updateCarField("isSalvageTitle", !!checked)}
                    />
                    <Label htmlFor="salvage-title" className="text-sm cursor-pointer">
                      Salvage title
                    </Label>
                  </div>
                )}
              </div>

              {carPlanLoading && (
                <div className="md:col-span-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader className="w-4 h-4 animate-spin" />
                  Calculating risk assessment...
                </div>
              )}

              {carPlanError && (
                <div className="md:col-span-2">
                  <p className="text-sm text-destructive">{carPlanError}</p>
                </div>
              )}

              {carPlan && !carPlanLoading && (
                <div className="md:col-span-2 rounded-xl border border-border/60 bg-muted/40 p-4 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Risk assessment</span>
                    <Badge
                      className={
                        carPlan.riskLevel === "low"
                          ? "bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]"
                          : carPlan.riskLevel === "medium"
                          ? "bg-amber-500 text-white"
                          : "bg-destructive text-destructive-foreground"
                      }
                    >
                      {carPlan.riskLevel.toUpperCase()} ({carPlan.riskScore}/100)
                    </Badge>
                  </div>
                  {carPlan.reasons.length > 0 && (
                    <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                      {carPlan.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Suggested delivery deadline: {new Date(carPlan.deliveryDeadlineAtIso).toLocaleDateString()} · Dispute window:{" "}
                    {carPlan.disputeWindowHours}h
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deadlines */}
      <Card className="glass-card mb-6">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="icon-tile h-10 w-10 rounded-xl">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Deadlines</h2>
              <p className="text-sm text-muted-foreground">Funding and delivery windows.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            <div>
              <Label htmlFor="initiator-deadline" className="block text-sm font-medium">
                Funding deadline *
              </Label>
              <Input
                id="initiator-deadline"
                type="datetime-local"
                className={`mt-1 ${errors.initiatorDeadline ? "border-destructive" : ""}`}
                value={data.initiatorDeadline}
                onChange={(e) => {
                  setField("initiatorDeadline", e.target.value);
                  if (errors.initiatorDeadline) setErrors((prev) => ({ ...prev, initiatorDeadline: "" }));
                }}
              />
              {errors.initiatorDeadline && (
                <p className="mt-1 text-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {errors.initiatorDeadline}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">When the buyer must fund the escrow</p>
            </div>

            <div>
              <Label htmlFor="completion-deadline" className="block text-sm font-medium">
                Completion deadline *
              </Label>
              <Input
                id="completion-deadline"
                type="datetime-local"
                className={`mt-1 ${errors.completionDeadline ? "border-destructive" : ""}`}
                value={data.completionDeadline}
                onChange={(e) => {
                  setField("completionDeadline", e.target.value);
                  if (errors.completionDeadline) setErrors((prev) => ({ ...prev, completionDeadline: "" }));
                }}
              />
              {errors.completionDeadline && (
                <p className="mt-1 text-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {errors.completionDeadline}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">When the seller must deliver goods/services</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer CTA */}
      <div className="flex justify-end">
        <Button
          className="bg-gradient-primary text-white rounded-full px-8 h-11 shadow-primary-custom hover:opacity-95 transition-all"
          onClick={handleNext}
          disabled={isValidating}
          aria-label="Continue to Step 2"
        >
          {isValidating ? "Validating..." : "Continue to Step 2"}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </Shell>
  );
};

export default Step1;
