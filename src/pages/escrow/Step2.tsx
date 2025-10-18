import { FC, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EscrowFlowTemplate from "@/templates/EscrowFlowTemplate";
import EscrowStepLayout from "@/components/organisms/EscrowStepLayout";
import StepIndicator from "@/components/molecules/StepIndicator";
import SummaryCard from "@/components/molecules/SummaryCard";
import { ArrowLeft, ArrowRight, Calendar } from "lucide-react";
import { useEscrowFlow } from "@/hooks/useEscrowFlow";

const Step2: FC = () => {
  const { data, setField, fee, total, back, next } = useEscrowFlow();

  const maskedSeller = useMemo(() => {
    const a = data.counterpartyAddress;
    if (!a) return "Unknown";
    return a.length > 8 ? `${a.slice(0, 4)}...${a.slice(-4)}` : a;
  }, [data.counterpartyAddress]);

  return (
    <EscrowFlowTemplate userName="Birochan Mainali">
      <EscrowStepLayout progress={<StepIndicator current={2} />}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-12 gap-y-6">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <Label htmlFor="escrow-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Escrow Amount
              </Label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <span className="text-gray-500">$</span>
                </div>
                <Input
                  id="escrow-amount"
                  readOnly
                  value={
                    typeof data.amount === "number"
                      ? data.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : "0.00"
                  }
                  className="block w-full rounded-md pl-7 pr-12 bg-gray-100 dark:bg-gray-900 sm:text-sm"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">USDC</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Artha Fee (0.5%): {fee.toFixed(2)} USDC</p>
            </div>

            <div>
              <Label htmlFor="deposit-wallet" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Deposit Wallet Preview
              </Label>
              <Input
                id="deposit-wallet"
                readOnly
                value="ArthaVault-9aB...xyz"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 sm:text-sm"
              />
            </div>

            <div>
              <Label htmlFor="funding-method" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Funding Method
              </Label>
              <Select value={data.fundingMethod} onValueChange={(v) => setField("fundingMethod", v as any)}>
                <SelectTrigger id="funding-method" className="mt-1">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Wallet">Wallet</SelectItem>
                  <SelectItem value="Sponsored">Sponsored</SelectItem>
                  <SelectItem value="Manual Transfer">Manual Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="delivery-deadline" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Delivery Deadline
              </Label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <Input
                  id="delivery-deadline"
                  type="datetime-local"
                  value={data.deliveryDeadline}
                  onChange={(e) => setField("deliveryDeadline", e.target.value)}
                  className="block w-full rounded-md pr-10 sm:text-sm"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Calendar className="text-gray-400 w-4 h-4" />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="dispute-window" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Dispute Window (days after delivery)
              </Label>
              <Input
                id="dispute-window"
                type="number"
                value={data.disputeWindowDays as number | ""}
                onChange={(e) =>
                  setField("disputeWindowDays", e.target.value === "" ? "" : Number(e.target.value))
                }
                className="mt-1 block w-full rounded-md sm:text-sm"
                placeholder="e.g., 7"
              />
            </div>
          </div>

          <div className="lg:col-span-1">
            <SummaryCard
              buyerLabel="You"
              sellerLabel={maskedSeller}
              totalValueText={`${total.toFixed(2)} USDC`}
              deadlineText={data.deliveryDeadline || data.completionDeadline || "–"}
            />
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 px-0 pt-6 mt-6 bg-transparent flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => back(2)}
            className="flex items-center gap-2"
            aria-label="Back to Step 1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Step 1
          </Button>
          <Button
            onClick={() => next(2)}
            className="flex items-center gap-2"
            aria-label="Review & Confirm"
            style={{ backgroundColor: "#635bff" }}
          >
            Review & Confirm
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </EscrowStepLayout>
    </EscrowFlowTemplate>
  );
};

export default Step2;
