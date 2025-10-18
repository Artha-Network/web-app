import { FC } from "react";

export interface ReputationScoreCardProps {
  readonly score: number; // 0 - 100
}

/**
 * ReputationScoreCard
 * Circular progress with conic-gradient to match provided design.
 */
export const ReputationScoreCard: FC<ReputationScoreCardProps> = ({ score }) => {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm border border-gray-200 relative overflow-hidden">
      <h3 className="text-xl font-bold text-gray-900 text-center">Reputation Score</h3>
      <div className="flex items-center justify-center relative">
        <div className="relative flex items-center justify-center w-32 h-32 rounded-full bg-blue-50 border border-blue-200">
          <div
            className="absolute inset-0 flex items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(#34D399 ${clamped}%, #E5E7EB ${clamped}% 100%)`,
            }}
            aria-hidden
          >
            <div className="bg-white rounded-full w-28 h-28 flex items-center justify-center">
              <p className="text-gray-900 tracking-light text-5xl font-extrabold leading-tight">
                {clamped}
              </p>
            </div>
          </div>
        </div>
      </div>
      <p className="text-center text-sm text-gray-600">Achieve higher scores for better deals!</p>
    </div>
  );
};

export default ReputationScoreCard;

