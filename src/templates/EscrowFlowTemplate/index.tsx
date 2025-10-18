import { FC, PropsWithChildren } from "react";
import HeaderBar from "@/components/organisms/HeaderBar";

export interface EscrowFlowTemplateProps extends PropsWithChildren {
  readonly userName?: string;
}

/**
 * EscrowFlowTemplate
 * Page-level shell: header + constrained content area for the multi-step flow.
 */
export const EscrowFlowTemplate: FC<EscrowFlowTemplateProps> = ({
  userName = "User",
  children,
}) => {
  return (
    <div
      className="relative flex h-auto min-h-screen w-full flex-col bg-gray-50 dark:bg-gray-900 group/design-root overflow-x-hidden"
      style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}
    >
      <div className="layout-container flex h-full grow flex-col">
        <HeaderBar userName={userName} />
        <main className="flex-1 px-4 sm:px-6 py-10">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h1 className="text-gray-900 dark:text-gray-100 tracking-tight text-4xl font-bold leading-tight">
                Create a New Escrow
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                Securely transact with anyone on the Solana blockchain.
              </p>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default EscrowFlowTemplate;

