import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "@/components/ui/sonner";
import { useWalletTransactions } from "./useWalletTransactions";
import actionsService from "@/services/actions";

type ActionKey = "initiate" | "fund" | "release" | "refund";

interface InitiateVariables {
  counterparty: string;
  amount: number;
  description?: string;
  deliverBy?: number;
  disputeDeadline?: number;
  feeBps?: number;
  title?: string;
  role?: "buyer" | "seller";
}

interface ActionVariablesMap {
  initiate: InitiateVariables;
  fund: { dealId: string };
  release: { dealId: string };
  refund: { dealId: string };
}

type MutationVariables<T extends ActionKey> = ActionVariablesMap[T];

export function useAction<T extends ActionKey>(action: T) {
  const { publicKey } = useWallet();
  const viewerWallet = publicKey?.toBase58();
  const queryClient = useQueryClient();
  const { signAndSendBase64Tx } = useWalletTransactions();

  const mutationFn = useCallback(
    async (variables: MutationVariables<T>) => {
      if (!viewerWallet) throw new Error("Connect wallet first");

      let response: Awaited<ReturnType<typeof actionsService.initiate>>;
      let dealId: string;
      let actorWallet = viewerWallet;
      let actionVerb: "INITIATE" | "FUND" | "RELEASE" | "REFUND";

      switch (action) {
        case "initiate": {
          const payload = variables as InitiateVariables;
          if (!payload.counterparty) throw new Error("Counterparty wallet required");

          const isBuyer = payload.role === "buyer";
          // If I am buyer, counterparty is seller. If I am seller, counterparty is buyer.
          const buyerWallet = isBuyer ? viewerWallet : payload.counterparty;
          const sellerWallet = isBuyer ? payload.counterparty : viewerWallet;

          response = await actionsService.initiate({
            sellerWallet,
            buyerWallet,
            amount: payload.amount.toString(),
            feeBps: payload.feeBps ?? 0,
            deliverBy: payload.deliverBy,
            disputeDeadline: payload.disputeDeadline,
            description: payload.description,
            title: payload.title,
            payer: viewerWallet,
          });
          actionVerb = "INITIATE";
          dealId = response.dealId;
          actorWallet = viewerWallet;
          break;
        }
        case "fund": {
          const { dealId: id } = variables as { dealId: string };
          response = await actionsService.fund(id, viewerWallet);
          actionVerb = "FUND";
          dealId = response.dealId;
          actorWallet = viewerWallet;
          break;
        }
        case "release": {
          const { dealId: id } = variables as { dealId: string };
          response = await actionsService.release(id, viewerWallet);
          actionVerb = "RELEASE";
          dealId = response.dealId;
          actorWallet = viewerWallet;
          break;
        }
        case "refund": {
          const { dealId: id } = variables as { dealId: string };
          response = await actionsService.refund(id, viewerWallet);
          actionVerb = "REFUND";
          dealId = response.dealId;
          actorWallet = viewerWallet;
          break;
        }
        default:
          throw new Error("Unsupported action");
      }

      const pendingId = toast.loading("Awaiting wallet signature…");
      try {
        const txSig = await signAndSendBase64Tx(response.txMessageBase64);
        toast.loading("Confirming on-chain event…", { id: pendingId });
        await actionsService.confirm({ dealId, txSig, action: actionVerb, actorWallet });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["my-deals"] }),
          queryClient.invalidateQueries({ queryKey: ["deal", dealId] }),
        ]);
        toast.success("Action confirmed on chain", { id: pendingId });
        return { dealId, txSig };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Action failed";
        toast.error(message, { id: pendingId });
        throw error;
      }
    },
    [action, queryClient, signAndSendBase64Tx, viewerWallet]
  );

  return useMutation({ mutationFn });
}

export default useAction;
