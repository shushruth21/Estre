/**
 * useRealtimeOrders Hook
 * 
 * Provides realtime subscriptions for order status changes and job card updates.
 * Automatically updates UI when changes occur in the database.
 * 
 * Usage:
 * ```tsx
 * const { orders, jobCards } = useRealtimeOrders(orderIds);
 * ```
 */

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

interface UseRealtimeOrdersOptions {
  orderIds?: string[];
  enabled?: boolean;
}

export function useRealtimeOrders({ orderIds = [], enabled = true }: UseRealtimeOrdersOptions = {}) {
  const queryClient = useQueryClient();
  const [channels, setChannels] = useState<RealtimeChannel[]>([]);

  useEffect(() => {
    if (!enabled || orderIds.length === 0) return;

    // Subscribe to order changes
    const orderChannel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `id=in.(${orderIds.join(",")})`,
        },
        (payload) => {
          if (import.meta.env.DEV) {
            console.log("Order change detected:", payload);
          }
          // Invalidate orders query to refetch (debounced)
          queryClient.invalidateQueries({ queryKey: ["orders"] });
          queryClient.invalidateQueries({ queryKey: ["order", payload.new.id] });
        }
      )
      .subscribe();

    // Subscribe to job card changes
    const jobCardsChannel = supabase
      .channel("job-cards-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "job_cards",
          filter: `order_id=in.(${orderIds.join(",")})`,
        },
        (payload) => {
          if (import.meta.env.DEV) {
            console.log("Job card change detected:", payload);
          }
          // Invalidate job cards query to refetch
          queryClient.invalidateQueries({ queryKey: ["job-cards"] });
          queryClient.invalidateQueries({ queryKey: ["order", payload.new.order_id] });
        }
      )
      .subscribe();

    // Subscribe to order timeline changes
    const timelineChannel = supabase
      .channel("order-timeline-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_timeline",
          filter: `order_id=in.(${orderIds.join(",")})`,
        },
        (payload) => {
          if (import.meta.env.DEV) {
            console.log("Timeline entry added:", payload);
          }
          // Invalidate timeline query to refetch
          queryClient.invalidateQueries({ queryKey: ["order-timeline"] });
          queryClient.invalidateQueries({ queryKey: ["order", payload.new.order_id] });
        }
      )
      .subscribe();

    setChannels([orderChannel, jobCardsChannel, timelineChannel]);

    // Cleanup subscriptions on unmount
    return () => {
      orderChannel.unsubscribe();
      jobCardsChannel.unsubscribe();
      timelineChannel.unsubscribe();
    };
  }, [orderIds, enabled, queryClient]);

  return { channels };
}

