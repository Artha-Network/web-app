import { FC, useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import EscrowFlowTemplate from "@/templates/EscrowFlowTemplate";
import EscrowStepLayout from "@/components/organisms/EscrowStepLayout";
import StepIndicator from "@/components/molecules/StepIndicator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowRight, WalletMinimal, DollarSign, AlertTriangle, Info, User, Mail, Car, Shield, Loader } from "lucide-react";
import { useEscrowFlow } from "@/hooks/useEscrowFlow";
import type { CarMetadata } from "@/hooks/useEscrowFlow";
import { useEvent } from "@/hooks/useEvent";
import { useWallet } from "@solana/wallet-adapter-react";
import { isValidSolanaAddress } from "@/utils/solana";
import { API_BASE } from "@/lib/config";
import { fetchCarEscrowPlan } from "@/services/actions";
import type { CarEscrowPlan } from "@/services/actions";

/**
 * Step1 - Create deal draft (NewDeal.tsx)
 * 
 * Purpose: create deal draft
 * Route: /escrow/new
 * Emits: deal_draft_started, deal_draft_submitted
 * Storage: deals, deal_terms, participants (status INIT)
 * AI: optional "terms completeness" check only if it helps; not required
 * Solana: none yet (create PDA on first on-chain call in overview or fund step)
 * Links: /deal/:id
 */

const Step1: FC = () => {
  const { publicKey } = useWallet();
  const { data, setField, next, updateData } = useEscrowFlow();
  const { trackEvent, trackDealEvent } = useEvent();
  const navigate = useNavigate();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userProfile, setUserProfile] = useState<{ emailAddress?: string; displayName?: string } | null>(null);
  const [carPlan, setCarPlan] = useState<CarEscrowPlan | null>(null);
  const [carPlanLoading, setCarPlanLoading] = useState(false);
  const [carPlanError, setCarPlanError] = useState<string | null>(null);

  const updateCarField = useCallback(<K extends keyof CarMetadata>(key: K, value: CarMetadata[K]) => {
    updateData({
      carMetadata: { ...data.carMetadata, [key]: value },
    });
  }, [data.carMetadata, updateData]);

  // Fetch car escrow plan when enough fields are filled
  useEffect(() => {
    if (!data.isCarSale) return;
    const cm = data.carMetadata;
    if (!cm?.year || !cm?.deliveryType || cm?.odometerMiles === undefined || cm?.odometerMiles === "" || !data.amount || data.amount === "") return;
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
          // Auto-populate deadlines from plan
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
    }, 800); // debounce

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [data.isCarSale, data.carMetadata?.year, data.carMetadata?.deliveryType, data.carMetadata?.odometerMiles, data.carMetadata?.hasTitleInHand, data.carMetadata?.isSalvageTitle, data.amount]);

  // Load user email from profile on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/users/me`, {
          credentials: 'include',
        });
        if (response.ok) {
          const profile = await response.json();
          setUserProfile(profile);
          if (profile.emailAddress) {
            setUserEmail(profile.emailAddress);
            setField("userEmail", profile.emailAddress);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    };
    fetchUserProfile();
  }, [setField]);

  // Track page view on mount and clear any stale AI contract from a previous flow
  useEffect(() => {
    trackEvent('deal_draft_started');
    // Clear cached contract so Step2 always generates a fresh contract for this deal
    updateData({ contract: "", questions: [] });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Validation logic
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
    } else {
      const fundingDate = new Date(data.initiatorDeadline);
      const now = new Date();
      const minDate = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

      if (fundingDate <= minDate) {
        newErrors.initiatorDeadline = "Funding deadline must be at least 1 hour from now";
      }
    }

    if (!data.completionDeadline) {
      newErrors.completionDeadline = "Completion deadline is required";
    } else if (data.initiatorDeadline) {
      const fundingDate = new Date(data.initiatorDeadline);
      const completionDate = new Date(data.completionDeadline);

      if (completionDate <= fundingDate) {
        newErrors.completionDeadline = "Completion deadline must be after funding deadline";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    setIsValidating(true);

    // Check if user exists in database and has completed profile setup
    // Users must have email address to create deals (for notifications)
    if (!userEmail || !userEmail.trim()) {
      setErrors({ profileSetup: "Please set up your email address in your profile before creating an escrow deal." });
      setIsValidating(false);
      return;
    }

    if (!validateForm()) {
      setIsValidating(false);
      return;
    }

    // Track successful form submission
    trackEvent('deal_draft_submitted', {
      amount: data.amount,
      has_description: !!data.description,
      funding_deadline_hours: data.initiatorDeadline ?
        Math.round((new Date(data.initiatorDeadline).getTime() - Date.now()) / (1000 * 60 * 60)) : undefined,
      completion_deadline_hours: data.completionDeadline ?
        Math.round((new Date(data.completionDeadline).getTime() - Date.now()) / (1000 * 60 * 60)) : undefined,
    });

    setIsValidating(false);
    next(1);
  };

  // Show wallet connection requirement
  if (!publicKey) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-card p-8 rounded-lg border">
            <WalletMinimal className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Wallet Required</h2>
            <p className="text-muted-foreground mb-4">
              Please connect your wallet to create an escrow deal.
            </p>
            <Button onClick={() => navigate('/wallet-connect')}>
              Connect Wallet
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <EscrowFlowTemplate userName={publicKey.toBase58().slice(0, 8) + "..."}>
      <EscrowStepLayout progress={<StepIndicator current={1} />}>

        {/* Info Alert */}
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Create a new escrow deal by providing the counterparty's wallet address, amount, and terms.
            The deal will be created on-chain after funding in the next step.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div className="md:col-span-2">
            <Label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Deal Title *
            </Label>
            <Input
              id="title"
              value={data.title}
              onChange={(e) => {
                setField("title", e.target.value);
                if (errors.title) {
                  setErrors(prev => ({ ...prev, title: "" }));
                }
              }}
              placeholder="e.g., Web Design Project, Car Sale, etc."
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${errors.title ? 'border-red-500' : ''
                }`}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {errors.title}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              I am the...
            </Label>
            <RadioGroup
              defaultValue={data.role}
              onValueChange={(val) => setField("role", val as "buyer" | "seller")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50 flex-1">
                <RadioGroupItem value="buyer" id="role-buyer" />
                <Label htmlFor="role-buyer" className="cursor-pointer flex-1">
                  <span className="font-semibold">Buyer</span>
                  <p className="text-xs text-muted-foreground">I am paying for goods/services</p>
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50 flex-1">
                <RadioGroupItem value="seller" id="role-seller" />
                <Label htmlFor="role-seller" className="cursor-pointer flex-1">
                  <span className="font-semibold">Seller</span>
                  <p className="text-xs text-muted-foreground">I am providing goods/services</p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="counterparty-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Counterparty Solana Address *
            </Label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                <WalletMinimal className="text-gray-400 w-5 h-5" />
              </div>
              <Input
                id="counterparty-address"
                value={data.counterpartyAddress}
                onChange={(e) => {
                  setField("counterpartyAddress", e.target.value);
                  if (errors.counterpartyAddress) {
                    setErrors(prev => ({ ...prev, counterpartyAddress: "" }));
                  }
                }}
                placeholder="Enter Solana address..."
                className={`block w-full rounded-md pl-10 sm:text-sm ${errors.counterpartyAddress ? 'border-red-500' : ''
                  }`}
              />
            </div>
            {errors.counterpartyAddress && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {errors.counterpartyAddress}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              The wallet address of the person you're trading with
            </p>
          </div>

          <div>
            <Label htmlFor="counterparty-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Counterparty Email *
            </Label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                <Mail className="text-gray-400 w-5 h-5" />
              </div>
              <Input
                id="counterparty-email"
                type="email"
                value={data.counterpartyEmail || ""}
                onChange={(e) => {
                  setField("counterpartyEmail", e.target.value);
                  if (errors.counterpartyEmail) {
                    setErrors(prev => ({ ...prev, counterpartyEmail: "" }));
                  }
                }}
                placeholder="counterparty@example.com"
                className={`block w-full rounded-md pl-10 sm:text-sm ${errors.counterpartyEmail ? 'border-red-500' : ''
                  }`}
              />
            </div>
            {errors.counterpartyEmail && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {errors.counterpartyEmail}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Email address of the counterparty — they will receive a notification about this deal. Your email ({userEmail || "not set"}) is used automatically.
            </p>
          </div>

          {errors.profileSetup && (
            <div className="md:col-span-2">
              <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800 dark:text-orange-200">
                  <div className="space-y-2">
                    <p>{errors.profileSetup}</p>
                    <Button onClick={() => navigate('/profile')} variant="outline" size="sm">
                      Go to Profile Settings
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div>
            <Label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Amount (USDC) *
            </Label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                <span className="text-gray-400">$</span>
              </div>
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
                  if (errors.amount) {
                    setErrors(prev => ({ ...prev, amount: "" }));
                  }
                }}
                placeholder="0.00"
                className={`block w-full rounded-md pl-7 pr-12 sm:text-sm ${errors.amount ? 'border-red-500' : ''
                  }`}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm" id="price-currency">
                  USDC
                </span>
              </div>
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {errors.amount}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Minimum: $10 USDC • Maximum: $1,000,000 USDC
            </p>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description *
            </Label>
            <div className="mt-1">
              <Textarea
                id="description"
                rows={4}
                value={data.description}
                onChange={(e) => {
                  setField("description", e.target.value);
                  if (errors.description) {
                    setErrors(prev => ({ ...prev, description: "" }));
                  }
                }}
                placeholder="Describe the terms of the transaction, what goods/services are being exchanged, delivery conditions, etc..."
                className={`block w-full rounded-md shadow-sm sm:text-sm ${errors.description ? 'border-red-500' : ''
                  }`}
                maxLength={1000}
              />
            </div>
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {errors.description}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {data.description.length}/1000 characters • Be specific about terms and conditions
            </p>
          </div>

          {/* Car Sale Toggle */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
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
              <Label htmlFor="is-car-sale" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 cursor-pointer">
                <Car className="w-4 h-4" />
                Is this a car sale?
              </Label>
            </div>
            <p className="mt-1 text-xs text-gray-500 ml-14">
              Enable to add vehicle details, risk assessment, and recommended deadlines
            </p>
          </div>

          {/* Vehicle Details Section */}
          {data.isCarSale && (
            <>
              <div className="md:col-span-2 border-t pt-4">
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-4">
                  <Car className="w-5 h-5" />
                  Vehicle Details
                </h3>
              </div>

              <div>
                <Label htmlFor="car-year" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                  className="mt-1 block w-full rounded-md shadow-sm sm:text-sm"
                />
              </div>

              <div>
                <Label htmlFor="car-make" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Make
                </Label>
                <Input
                  id="car-make"
                  value={data.carMetadata?.make ?? ""}
                  onChange={(e) => updateCarField("make", e.target.value)}
                  placeholder="e.g., Honda"
                  className="mt-1 block w-full rounded-md shadow-sm sm:text-sm"
                />
              </div>

              <div>
                <Label htmlFor="car-model" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Model
                </Label>
                <Input
                  id="car-model"
                  value={data.carMetadata?.model ?? ""}
                  onChange={(e) => updateCarField("model", e.target.value)}
                  placeholder="e.g., Civic"
                  className="mt-1 block w-full rounded-md shadow-sm sm:text-sm"
                />
              </div>

              <div>
                <Label htmlFor="vin" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  VIN
                </Label>
                <Input
                  id="vin"
                  value={data.vin || ""}
                  onChange={(e) => {
                    setField("vin", e.target.value.toUpperCase());
                    if (errors.vin) setErrors(prev => ({ ...prev, vin: "" }));
                  }}
                  placeholder="17-character VIN"
                  maxLength={17}
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${errors.vin ? 'border-red-500' : ''}`}
                />
                {errors.vin && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {errors.vin}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="car-odometer" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Odometer (miles) *
                </Label>
                <Input
                  id="car-odometer"
                  type="number"
                  min={0}
                  value={data.carMetadata?.odometerMiles === "" ? "" : data.carMetadata?.odometerMiles ?? ""}
                  onChange={(e) => updateCarField("odometerMiles", e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="e.g., 45000"
                  className="mt-1 block w-full rounded-md shadow-sm sm:text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Delivery Type *
                </Label>
                <RadioGroup
                  value={data.carMetadata?.deliveryType ?? ""}
                  onValueChange={(val) => updateCarField("deliveryType", val as CarMetadata["deliveryType"])}
                  className="flex flex-wrap gap-3"
                >
                  <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                    <RadioGroupItem value="local_pickup" id="dt-local" />
                    <Label htmlFor="dt-local" className="cursor-pointer text-sm">Local Pickup</Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                    <RadioGroupItem value="same_city_carrier" id="dt-same-city" />
                    <Label htmlFor="dt-same-city" className="cursor-pointer text-sm">Same City Carrier</Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                    <RadioGroupItem value="cross_country_carrier" id="dt-cross" />
                    <Label htmlFor="dt-cross" className="cursor-pointer text-sm">Cross Country Carrier</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="title-in-hand"
                    checked={data.carMetadata?.hasTitleInHand ?? false}
                    onCheckedChange={(checked) => {
                      updateCarField("hasTitleInHand", !!checked);
                      if (!checked) updateCarField("isSalvageTitle", false);
                    }}
                  />
                  <Label htmlFor="title-in-hand" className="text-sm cursor-pointer">Title in hand</Label>
                </div>

                {data.carMetadata?.hasTitleInHand && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="salvage-title"
                      checked={data.carMetadata?.isSalvageTitle ?? false}
                      onCheckedChange={(checked) => updateCarField("isSalvageTitle", !!checked)}
                    />
                    <Label htmlFor="salvage-title" className="text-sm cursor-pointer">Salvage title</Label>
                  </div>
                )}
              </div>

              {/* Risk Score Badge */}
              {carPlanLoading && (
                <div className="md:col-span-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader className="w-4 h-4 animate-spin" />
                  Calculating risk assessment...
                </div>
              )}

              {carPlanError && (
                <div className="md:col-span-2">
                  <p className="text-sm text-red-600">{carPlanError}</p>
                </div>
              )}

              {carPlan && !carPlanLoading && (
                <div className="md:col-span-2 border rounded-lg p-4 space-y-3 bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Risk Assessment</span>
                    <Badge className={
                      carPlan.riskLevel === "low" ? "bg-green-600 text-white" :
                      carPlan.riskLevel === "medium" ? "bg-yellow-500 text-white" :
                      "bg-red-600 text-white"
                    }>
                      {carPlan.riskLevel.toUpperCase()} ({carPlan.riskScore}/100)
                    </Badge>
                  </div>
                  {carPlan.reasons.length > 0 && (
                    <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                      {carPlan.reasons.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Suggested delivery deadline: {new Date(carPlan.deliveryDeadlineAtIso).toLocaleDateString()} |
                    Dispute window: {carPlan.disputeWindowHours}h
                  </p>
                </div>
              )}
            </>
          )}

          <div>
            <Label htmlFor="initiator-deadline" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Funding Deadline *
            </Label>
            <Input
              id="initiator-deadline"
              type="datetime-local"
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${errors.initiatorDeadline ? 'border-red-500' : ''
                }`}
              value={data.initiatorDeadline}
              onChange={(e) => {
                setField("initiatorDeadline", e.target.value);
                if (errors.initiatorDeadline) {
                  setErrors(prev => ({ ...prev, initiatorDeadline: "" }));
                }
              }}
              min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)}
            />
            {errors.initiatorDeadline && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {errors.initiatorDeadline}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              When the buyer must fund the escrow
            </p>
          </div>

          <div>
            <Label htmlFor="completion-deadline" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Completion Deadline *
            </Label>
            <Input
              id="completion-deadline"
              type="datetime-local"
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${errors.completionDeadline ? 'border-red-500' : ''
                }`}
              value={data.completionDeadline}
              onChange={(e) => {
                setField("completionDeadline", e.target.value);
                if (errors.completionDeadline) {
                  setErrors(prev => ({ ...prev, completionDeadline: "" }));
                }
              }}
              min={data.initiatorDeadline || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16)}
            />
            {errors.completionDeadline && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {errors.completionDeadline}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              When the seller must deliver goods/services
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 px-0 pt-6 mt-6 bg-transparent flex justify-end">
          <Button
            className="flex min-w-[84px] max-w-[480px] items-center gap-2 h-10 px-6 text-white text-sm font-semibold tracking-[0.015em] shadow-sm transition-transform duration-300 transform hover:scale-105 disabled:transform-none"
            style={{ background: "linear-gradient(90deg, #6a11cb 0%, #2575fc 100%)" }}
            onClick={handleNext}
            disabled={isValidating}
            aria-label="Continue to Step 2"
          >
            {isValidating ? "Validating..." : "Continue to Step 2"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </EscrowStepLayout>
    </EscrowFlowTemplate>
  );
};

export default Step1;

