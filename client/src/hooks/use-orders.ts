import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateOrderRequest } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useOrder(id: number) {
  return useQuery({
    queryKey: [api.orders.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.orders.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch order");
      return api.orders.get.responses[200].parse(await res.json());
    },
    // Poll every 5 seconds to update status
    refetchInterval: 5000,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateOrderRequest) => {
      const res = await fetch(api.orders.create.path, {
        method: api.orders.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.orders.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to place order");
      }
      return api.orders.create.responses[201].parse(await res.json());
    },
    onError: (error) => {
      toast({
        title: "Order Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
