import { FC } from "react";
import { User, CircleDollarSign, CheckCircle2, Check } from "lucide-react";

export interface StepIndicatorProps {
  readonly current: 1 | 2 | 3;
}

/**
 * StepIndicator
 * Visual 3-step indicator with connectors; mirrors the provided HTML styles.
 */
export const StepIndicator: FC<StepIndicatorProps> = ({ current }) => {
  const isDone = (n: number) => current > n;
  const isActive = (n: number) => current === n;

  return (
    <div className="flex justify-between items-center">
      {/* Step 1 */}
      <div className={`flex items-center gap-4 ${isActive(1) ? "text-indigo-600" : isDone(1) ? "text-green-600" : "text-gray-400"}`}>
        <div
          className={`flex items-center justify-center size-10 rounded-full ${
            isActive(1)
              ? "bg-indigo-600 text-white"
              : isDone(1)
              ? "bg-green-100 text-green-600"
              : "bg-gray-200"
          }`}
        >
          {isDone(1) ? <Check className="w-5 h-5" /> : <User className="w-5 h-5" />}
        </div>
        <div>
          <h3 className={`text-lg font-${isActive(1) ? "bold" : isDone(1) ? "medium" : "bold"}`}>Step 1</h3>
          <p className={`${isActive(1) ? "text-gray-600" : isDone(1) ? "text-gray-500" : ""}`}>Counterparty Info</p>
        </div>
      </div>

      <div className="flex-1 h-0.5 bg-gray-200 mx-6">
        <div
          className={`${current === 1 ? "w-1/3" : current === 2 ? "w-2/3" : "w-full"} bg-indigo-600 h-full`}
        />
      </div>

      {/* Step 2 */}
      <div className={`flex items-center gap-4 ${isActive(2) ? "text-violet-600" : isDone(2) ? "text-green-600" : "text-gray-400"}`}>
        <div
          className={`flex items-center justify-center size-10 rounded-full ${
            isActive(2)
              ? "bg-violet-600 text-white"
              : isDone(2)
              ? "bg-green-100 text-green-600"
              : "bg-gray-200"
          }`}
        >
          {isDone(2) ? <Check className="w-5 h-5" /> : <CircleDollarSign className="w-5 h-5" />}
        </div>
        <div>
          <h3 className="text-lg font-bold">Step 2</h3>
          <p className={`${isActive(2) ? "text-gray-600" : isDone(2) ? "text-gray-500" : ""}`}>Amount & Terms</p>
        </div>
      </div>

      <div className="flex-1 h-0.5 bg-gray-200 mx-6" />

      {/* Step 3 */}
      <div className={`flex items-center gap-4 ${isActive(3) ? "text-violet-600" : "text-gray-400"}`}>
        <div
          className={`flex items-center justify-center size-10 rounded-full ${
            isActive(3) ? "bg-violet-600 text-white" : "bg-gray-200"
          }`}
        >
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold">Step 3</h3>
          <p>Confirmation</p>
        </div>
      </div>
    </div>
  );
};

export default StepIndicator;

