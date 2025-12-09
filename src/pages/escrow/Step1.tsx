import { FC, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EscrowFlowTemplate from "@/templates/EscrowFlowTemplate";
import EscrowStepLayout from "@/components/organisms/EscrowStepLayout";
import StepIndicator from "@/components/molecules/StepIndicator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowRight, WalletMinimal, DollarSign, AlertTriangle, Info, User, Mail } from "lucide-react";
import { useEscrowFlow } from "@/hooks/useEscrowFlow";
import { useEvent } from "@/hooks/useEvent";
import { useWallet } from "@solana/wallet-adapter-react";
import { isValidSolanaAddress } from "@/utils/solana";
import { API_BASE } from "@/lib/config";

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
  const { data, setField, next } = useEscrowFlow();
  const { trackEvent, trackDealEvent } = useEvent();
  const navigate = useNavigate();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userProfile, setUserProfile] = useState<{ emailAddress?: string; displayName?: string } | null>(null);

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

  // Track page view on mount
  useEffect(() => {
    trackEvent('deal_draft_started');
  }, [trackEvent]);

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
              Counterparty Email (Optional)
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
              Optional: Email address of the counterparty for notifications. Your email ({userEmail}) will be used automatically based on your role.
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

