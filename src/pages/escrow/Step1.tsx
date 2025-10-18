import { FC } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import EscrowFlowTemplate from "@/templates/EscrowFlowTemplate";
import EscrowStepLayout from "@/components/organisms/EscrowStepLayout";
import StepIndicator from "@/components/molecules/StepIndicator";
import { ArrowRight, WalletMinimal, DollarSign } from "lucide-react";
import { useEscrowFlow } from "@/hooks/useEscrowFlow";

const Step1: FC = () => {
  const { data, setField, next } = useEscrowFlow();

  return (
    <EscrowFlowTemplate userName="Birochan Mainali">
      <EscrowStepLayout progress={<StepIndicator current={1} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <Label htmlFor="counterparty-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Counterparty Solana Address
            </Label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                <WalletMinimal className="text-gray-400 w-5 h-5" />
              </div>
              <Input
                id="counterparty-address"
                value={data.counterpartyAddress}
                onChange={(e) => setField("counterpartyAddress", e.target.value)}
                placeholder="Enter Solana address..."
                className="block w-full rounded-md pl-10 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Amount (USDC)
            </Label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                <span className="text-gray-400">$</span>
              </div>
              <Input
                id="amount"
                type="number"
                value={data.amount as number | ""}
                onChange={(e) => setField("amount", e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="0.00"
                className="block w-full rounded-md pl-7 pr-12 sm:text-sm"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm" id="price-currency">
                  USDC
                </span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </Label>
            <div className="mt-1">
              <Textarea
                id="description"
                rows={4}
                value={data.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Describe the terms of the transaction..."
                className="block w-full rounded-md shadow-sm sm:text-sm"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="initiator-deadline" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Funding Deadline
            </Label>
            <Input
              id="initiator-deadline"
              type="datetime-local"
              className="mt-1 block w-full rounded-md shadow-sm sm:text-sm"
              value={data.initiatorDeadline}
              onChange={(e) => setField("initiatorDeadline", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="completion-deadline" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Completion Deadline
            </Label>
            <Input
              id="completion-deadline"
              type="datetime-local"
              className="mt-1 block w-full rounded-md shadow-sm sm:text-sm"
              value={data.completionDeadline}
              onChange={(e) => setField("completionDeadline", e.target.value)}
            />
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 px-0 pt-6 mt-6 bg-transparent flex justify-end">
          <Button
            className="flex min-w-[84px] max-w-[480px] items-center gap-2 h-10 px-6 text-white text-sm font-semibold tracking-[0.015em] shadow-sm transition-transform duration-300 transform hover:scale-105"
            style={{ background: "linear-gradient(90deg, #6a11cb 0%, #2575fc 100%)" }}
            onClick={() => next(1)}
            aria-label="Step 2"
          >
            Step 2
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </EscrowStepLayout>
    </EscrowFlowTemplate>
  );
};

export default Step1;

