"use client";

import { useEffect, useRef } from "react";
import { getStreamToken } from "@/service";

export type StreamEventType =
  | "trade_opened"
  | "trade_closed"
  | "tp_hit"
  | "sl_hit"
  | "equity_protect";

export interface StreamEvent {
  v: number;
  id: number;
  type: StreamEventType;
  ts: string;
  user_id: string;
  trader_username: string | null;
  ticker: string;
  direction: "long" | "short";
  source: "copy" | "counter" | "manual";
  size_usd: number;
  pnl_usd: number | null;
  reason: string | null;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.hypercopy.io";

/**
 * Subscribe to the realtime trade-event SSE stream.
 *
 * Mints a short-lived stream token via POST /api/auth/stream-token, opens
 * EventSource at `/api/events/stream?token=...&last_id=...`, and reconnects
 * with exponential backoff. Calls onEvent for each parsed message.
 */
export function useNetworkStream(
  onEvent: (e: StreamEvent) => void,
  enabled = true,
) {
  const cbRef = useRef(onEvent);
  cbRef.current = onEvent;

  useEffect(() => {
    if (!enabled) return;
    let es: EventSource | null = null;
    let cancelled = false;
    let lastId = 0;
    let backoff = 1000;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = async () => {
      if (cancelled) return;
      try {
        const { token } = await getStreamToken();
        if (cancelled) return;

        // Token MUST be a URL query parameter — the native EventSource API
        // does not allow custom Authorization headers. Path is /api/events/stream.
        let url = `${API_BASE}/api/events/stream?token=${encodeURIComponent(token)}`;
        if (lastId > 0) {
          url += `&last_id=${encodeURIComponent(String(lastId))}`;
        }

        const eventSource = new EventSource(url);
        es = eventSource;

        eventSource.onmessage = (msg) => {
          try {
            const data: StreamEvent = JSON.parse(msg.data);
            if (typeof data.id === "number" && data.id > lastId) lastId = data.id;
            cbRef.current(data);
            backoff = 1000;
          } catch {
            // ignore malformed lines (incl. heartbeat comments)
          }
        };

        eventSource.onerror = () => {
          eventSource.close();
          if (es === eventSource) es = null;
          if (cancelled) return;
          reconnectTimer = setTimeout(connect, backoff);
          backoff = Math.min(backoff * 2, 30_000);
        };
      } catch {
        if (cancelled) return;
        reconnectTimer = setTimeout(connect, backoff);
        backoff = Math.min(backoff * 2, 30_000);
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (es) {
        es.close();
        es = null;
      }
    };
  }, [enabled]);
}
