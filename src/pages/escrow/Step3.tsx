import { FC, useMemo, useState } from "react";
import EscrowFlowTemplate from "@/templates/EscrowFlowTemplate";
import StepIndicator from "@/components/molecules/StepIndicator";
import ConfirmationPanel from "@/components/organisms/ConfirmationPanel";
import { useEscrowFlow } from "@/hooks/useEscrowFlow";
import { createDeal } from "@/api/mockApi";
import { toast } from "@/components/ui/sonner";
import { useNavigate } from "react-router-dom";

const Step3: FC = () => {
  const { data, total, back, goTo } = useEscrowFlow();
  const [agree, setAgree] = useState(false);
  const navigate = useNavigate();

  const items = useMemo(() => {
    return [
      {
        label: "Counterparty",
        value: data.counterpartyAddress ? `${data.counterpartyAddress.slice(0, 3)}…${data.counterpartyAddress.slice(-4)}` : "Unknown",
        onEdit: () => goTo(1),
      },
      {
        label: "Escrow Amount",
        value: `${typeof data.amount === "number" ? data.amount.toFixed(2) : "0.00"} USDC (+ ${(Number(((typeof data.amount === "number" ? data.amount : 0) * 0.005).toFixed(2))).toFixed(2)} USDC fee)`,
        onEdit: () => goTo(2),
      },
      {
        label: "Deposit Wallet Preview",
        value: "ArthaVault-9aB…xyz",
        onEdit: () => goTo(2),
      },
      {
        label: "Funding Method",
        value: data.fundingMethod,
        onEdit: () => goTo(2),
      },
      {
        label: "Delivery Deadline & Dispute Window",
        value: `${data.deliveryDeadline || data.completionDeadline || "–"} / ${data.disputeWindowDays || 0} days`,
        onEdit: () => goTo(2),
      },
    ];
  }, [data, goTo]);

  return (
    <EscrowFlowTemplate userName="Birochan Mainali">
      <div className="mt-12">
        <div className="px-4 sm:px-8 py-6 bg-white dark:bg-gray-950 rounded-t-2xl border border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="flex items-center gap-3 sm:gap-4 text-green-600">
              <div className="flex items-center justify-center size-8 sm:size-10 rounded-full bg-green-100">
                <span className="text-base sm:text-xl">✓</span>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-medium">Step 1 Completed</h3>
              </div>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 w-full sm:w-auto sm:mx-6">
              <div className="w-full bg-violet-500 h-full" />
            </div>
            <div className="flex items-center gap-3 sm:gap-4 text-green-600">
              <div className="flex items-center justify-center size-8 sm:size-10 rounded-full bg-green-100">
                <span className="text-base sm:text-xl">✓</span>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-medium">Step 2 Completed</h3>
              </div>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 w-full sm:w-auto sm:mx-6">
              <div className="w-full bg-violet-500 h-full" />
            </div>
            <div className="flex items-center gap-3 sm:gap-4 text-violet-600">
              <div className="flex items-center justify-center size-8 sm:size-10 rounded-full bg-violet-600 text-white">
                <span className="text-base sm:text-xl">✓</span>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold">Step 3 Confirmation</h3>
              </div>
            </div>
          </div>
        </div>

        <ConfirmationPanel
          items={items}
          totalValueText={`${total.toFixed(2)} USDC`}
          deadlineText={data.deliveryDeadline || data.completionDeadline || "–"}
          agreedToTerms={agree}
          onToggleTerms={setAgree}
          onBack={() => back(3)}
          onGenerate={async () => {
            if (!agree) {
              toast("Please agree to the terms first.");
              return;
            }
            const rec = await createDeal({
              title: data.description || "New Escrow",
              counterparty: data.counterpartyAddress || "Unknown",
              amountUsd: typeof data.amount === "number" ? data.amount : 0,
              status: "INIT",
              deadline: data.completionDeadline || data.initiatorDeadline || new Date().toISOString().slice(0, 10),
            });
            toast.success(`Deal created (id: ${rec.id})`);
            navigate("/dashboard", { replace: true });
          }}
        />
      </div>
    </EscrowFlowTemplate>
  );
};

export default Step3;
