import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "@/components/ui/sonner";
import actionsService from "@/services/actions";

export function useEvidenceList(dealId?: string) {
  return useQuery({
    queryKey: ["evidence", dealId],
    queryFn: () => actionsService.fetchEvidence(dealId!),
    enabled: Boolean(dealId),
    staleTime: 30_000,
  });
}

export function useSubmitEvidence(dealId?: string) {
  const { publicKey } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { description: string; type?: string }) => {
      if (!dealId) throw new Error("Deal ID is required");
      if (!publicKey) throw new Error("Connect wallet first");
      return actionsService.submitEvidence(
        dealId,
        data.description,
        publicKey.toBase58(),
        data.type ?? "text/plain"
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evidence", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deal", dealId] });
      toast.success("Evidence submitted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit evidence");
    },
  });
}
