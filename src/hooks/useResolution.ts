import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/sonner";
import actionsService from "@/services/actions";

export function useResolution(dealId?: string) {
  return useQuery({
    queryKey: ["resolution", dealId],
    queryFn: () => actionsService.fetchResolution(dealId!),
    enabled: Boolean(dealId),
    retry: false, // 404 is expected when no verdict yet
    staleTime: 60_000,
  });
}

export function useTriggerArbitration(dealId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!dealId) throw new Error("Deal ID is required");
      return actionsService.triggerArbitration(dealId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resolution", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deal", dealId] });
      queryClient.invalidateQueries({ queryKey: ["my-deals"] });
      toast.success("AI arbitration complete — verdict is ready");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Arbitration failed. Please try again.");
    },
  });
}
