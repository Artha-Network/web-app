import { FC } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Pencil } from "lucide-react";

export interface ConfirmationItem {
  readonly label: string;
  readonly value: string;
  readonly onEdit?: () => void;
}

export interface ConfirmationPanelProps {
  readonly items: ReadonlyArray<ConfirmationItem>;
  readonly totalValueText: string;
  readonly deadlineText: string;
  readonly agreedToTerms: boolean;
  readonly onToggleTerms: (v: boolean) => void;
  readonly onBack: () => void;
  readonly onGenerate: () => void;
}

/**
 * ConfirmationPanel
 * Review details list, total panel, and action buttons.
 */
export const ConfirmationPanel: FC<ConfirmationPanelProps> = ({
  items,
  totalValueText,
  deadlineText,
  agreedToTerms,
  onToggleTerms,
  onBack,
  onGenerate,
}) => {
  return (
    <div className="mt-12 bg-white dark:bg-gray-950 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
      <div className="px-4 sm:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
          <div className="space-y-6">
            {items.map((it) => (
              <div key={it.label} className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">{it.label}</h4>
                  <p className="text-base font-medium text-gray-800 dark:text-gray-100">{it.value}</p>
                </div>
                {it.onEdit && (
                  <Button variant="ghost" size="icon" aria-label={`Edit ${it.label}`} onClick={it.onEdit}>
                    <Pencil className="w-5 h-5 text-gray-400 hover:text-violet-600" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 self-start">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Total Escrow Value</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{totalValueText}</p>
            <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>
                <span className="font-medium">Deadline:</span> {deadlineText}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
          <div className="space-y-4">
            <div className="flex items-start">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded mt-1"
                checked={agreedToTerms}
                onChange={(e) => onToggleTerms(e.target.checked)}
                aria-describedby="terms-help"
              />
              <label htmlFor="terms" className="ml-3 block text-sm text-gray-700 dark:text-gray-300">
                I have reviewed all details and agree to Artha Network escrow terms.
              </label>
            </div>
            <p id="terms-help" className="text-xs text-gray-500 dark:text-gray-400 pl-7">
              Once created, funds will be locked on-chain until release or dispute resolution.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 px-4 sm:px-8 py-6 bg-gray-50 dark:bg-gray-900 rounded-b-2xl flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="w-full sm:w-auto flex items-center justify-center gap-2"
          aria-label="Back to Step 2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Step 2
        </Button>
        <Button
          onClick={onGenerate}
          className="w-full sm:w-auto flex items-center justify-center gap-2"
          aria-label="Generate Deal"
          style={{ backgroundColor: "#635bff" }}
        >
          Generate Deal
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ConfirmationPanel;

