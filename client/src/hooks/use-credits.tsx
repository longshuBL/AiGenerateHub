import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation, UseMutationResult } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type CreditsContextType = {
  credits: number | null;
  isLoading: boolean;
  error: Error | null;
  purchaseCreditsMutation: UseMutationResult<{ credits: number }, Error, PurchaseCreditsData>;
  consumeCreditsMutation: UseMutationResult<{ credits: number }, Error, ConsumeCreditsData>;
  watchAdForCreditsMutation: UseMutationResult<{ credits: number }, Error, void>;
  refetchCredits: () => void;
};

type PurchaseCreditsData = {
  amount: number;
  package: string;
};

type ConsumeCreditsData = {
  amount: number;
  service: string;
};

const CreditsContext = createContext<CreditsContextType | null>(null);

export function CreditsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const {
    data: creditsData,
    error,
    isLoading,
    refetch: refetchCredits,
  } = useQuery<{ credits: number }, Error>({
    queryKey: ["/api/credits"],
  });
  
  const purchaseCreditsMutation = useMutation({
    mutationFn: async (data: PurchaseCreditsData) => {
      const res = await apiRequest("POST", "/api/credits/purchase", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/credits"], data);
      toast({
        title: "Credits purchased",
        description: `Your account has been credited with ${data.credits} credits.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Purchase failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const consumeCreditsMutation = useMutation({
    mutationFn: async (data: ConsumeCreditsData) => {
      const res = await apiRequest("POST", "/api/credits/consume", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/credits"], data);
    },
    onError: (error) => {
      toast({
        title: "Operation failed",
        description: error.message || "Not enough credits for this operation.",
        variant: "destructive",
      });
    },
  });
  
  const watchAdForCreditsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/credits/reward", {});
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/credits"], data);
      toast({
        title: "Credits earned!",
        description: "Thank you for watching the ad. Credits have been added to your account.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to earn credits",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  return (
    <CreditsContext.Provider
      value={{
        credits: creditsData?.credits ?? null,
        isLoading,
        error,
        purchaseCreditsMutation,
        consumeCreditsMutation,
        watchAdForCreditsMutation,
        refetchCredits,
      }}
    >
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditsContext);
  if (!context) {
    throw new Error("useCredits must be used within a CreditsProvider");
  }
  return context;
}
