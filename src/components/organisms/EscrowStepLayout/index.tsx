import { FC, PropsWithChildren, ReactNode } from "react";
import { Card } from "@/components/ui/card";

export interface EscrowStepLayoutProps extends PropsWithChildren {
  readonly headerTitle?: string;
  readonly headerSubtitle?: string;
  readonly progress: ReactNode; // StepIndicator component instance
  readonly footer?: ReactNode; // buttons row
}

/**
 * EscrowStepLayout
 * Wraps a step with heading, step progress row, content area, and footer actions.
 */
export const EscrowStepLayout: FC<EscrowStepLayoutProps> = ({
  headerTitle,
  headerSubtitle,
  progress,
  children,
  footer,
}) => {
  return (
    <div className="mt-12 bg-white dark:bg-gray-950 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
      <div className="px-8 py-6">
        {headerTitle || headerSubtitle ? (
          <div className="mb-4">
            {headerTitle && (
              <h2 className="text-gray-900 dark:text-gray-100 tracking-tight text-2xl font-bold leading-tight">
                {headerTitle}
              </h2>
            )}
            {headerSubtitle && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">{headerSubtitle}</p>
            )}
          </div>
        ) : null}
        {progress}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 px-8 py-8">{children}</div>

      {footer && (
        <div className="border-t border-gray-200 dark:border-gray-800 px-8 py-6 bg-gray-50 dark:bg-gray-900 rounded-b-2xl flex flex-col sm:flex-row gap-3 sm:gap-0 justify-end sm:justify-between items-center">
          {footer}
        </div>
      )}
    </div>
  );
};

export default EscrowStepLayout;

