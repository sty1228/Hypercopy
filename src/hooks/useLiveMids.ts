"use client";

import * as hl from "@nktkas/hyperliquid";
import { useCallback, useEffect, useRef, useState } from "react";

const POLL_INTERVAL_MS = 5000;

// One-time dev visibility into HL's universe naming so any mismatch
// (e.g. kPEPE vs PEPE) shows up in practice without a pre-merge spot check.
let _loggedFirstSnapshot = false;

/**
 * Polls Hyperliquid `infoClient.allMids()` every 5s and exposes a stable
 * `getMid(ticker)` lookup. Pauses while the tab is hidden; resumes with an
 * immediate poll when it returns to the foreground.
 *
 * `getMid` tries the literal ticker first, then falls back to `k${ticker}`
 * to cover HL's k-prefix convention (e.g. `kPEPE` for the prescaled PEPE
 * perp). Returns `null` if neither is present.
 *
 * The hook builds its own `InfoClient` so it works for unauthenticated
 * visitors (HL `/info` is public, no wallet needed). Each hook instance is
 * its own poller — call at the page/sheet level, drill `getMid` down,
 * don't call inside list-item components.
 */
export function useLiveMids(): { getMid: (ticker: string) => number | null } {
  const [mids, setMids] = useState<Record<string, number>>({});
  const infoRef = useRef<hl.InfoClient | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!infoRef.current) {
      infoRef.current = new hl.InfoClient({ transport: new hl.HttpTransport() });
    }
    const info = infoRef.current;

    const poll = async () => {
      try {
        const raw = await info.allMids();
        if (cancelled) return;
        const parsed: Record<string, number> = {};
        for (const [k, v] of Object.entries(raw)) {
          const n = typeof v === "number" ? v : Number(v);
          if (Number.isFinite(n)) parsed[k] = n;
        }
        if (!_loggedFirstSnapshot && Object.keys(parsed).length > 0) {
          _loggedFirstSnapshot = true;
          // eslint-disable-next-line no-console
          console.info("[useLiveMids] first allMids snapshot keys:", Object.keys(parsed));
        }
        setMids(parsed);
      } catch {
        // swallow — next tick retries
      }
    };

    const start = () => {
      if (intervalRef.current != null) return;
      poll();
      intervalRef.current = window.setInterval(poll, POLL_INTERVAL_MS);
    };
    const stop = () => {
      if (intervalRef.current != null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const getMid = useCallback(
    (ticker: string): number | null => {
      if (!ticker) return null;
      if (mids[ticker] != null) return mids[ticker];
      const kKey = `k${ticker}`;
      if (mids[kKey] != null) return mids[kKey];
      return null;
    },
    [mids],
  );

  return { getMid };
}
