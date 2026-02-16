import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateOrderRequest } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export function useOrder(id: number) {
  const queryClient = useQueryClient();

  // Setup WebSocket for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "orderUpdate" && data.order.id === id) {
          // Update the cache with the new order data
          queryClient.setQueryData([api.orders.get.path, id], data.order);
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, [id, queryClient]);

  return useQuery({
    queryKey: [api.orders.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.orders.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch order");
      return api.orders.get.responses[200].parse(await res.json());
    },
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
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const errorData = await res.json();
          // Handle detailed validation errors
          if (errorData.errors && Array.isArray(errorData.errors)) {
            const firstError = errorData.errors[0];
            throw new Error(firstError.message || errorData.message || "Validation failed");
          }
          throw new Error(errorData.message || "Invalid order data");
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

export function useCancelOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (orderId: number) => {
      const url = buildUrl(api.orders.cancel.path, { id: orderId });
      const res = await fetch(url, {
        method: api.orders.cancel.method,
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Please login to cancel order");
        }
        if (res.status === 400) {
          const error = api.orders.cancel.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to cancel order");
      }
      return api.orders.cancel.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      // Update the cache with the cancelled order
      queryClient.setQueryData([api.orders.get.path, data.id], data);
      toast({
        title: "Order Cancelled",
        description: "Your order has been cancelled successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Cancellation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useMyOrders() {
  return useQuery({
    queryKey: [api.orders.myOrders.path],
    queryFn: async () => {
      const res = await fetch(api.orders.myOrders.path, {
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Please login to view orders");
        }
        throw new Error("Failed to fetch orders");
      }
      return api.orders.myOrders.responses[200].parse(await res.json());
    },
  });
}
