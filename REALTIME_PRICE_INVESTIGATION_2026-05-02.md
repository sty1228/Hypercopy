# Real-Time Price Update Investigation — 2026-05-02

> Read-only investigation requested by boss after feedback that signal cards
> show stale `current_price`. Goal: pick an approach for delivering
> near-real-time prices to the FE before shipping any code.
>
> **Backend reference (trusted, not re-verified here):** `trading_engine`
> refreshes `signals.current_price` + `signals.pct_change` every ~15s for
> last-30-day signals. Server-side data is fresh; the freshness gap is on the
> FE — most surfaces fetch once on mount and never refresh.

---

## Where `current_price` comes from today (per surface)

| # | File / surface | Field consumed | Source endpoint | FE refresh cadence |
| - | --- | --- | --- | --- |
| 1 | `src/app/profile/page.tsx` → **`SignalCard`** (~line 662, render at 1500) | **Back-solved**: `entry_price * (1 + priceChangePct/100)` where `priceChangePct = isShort ? -pct : pct` and `pct = sig.pct_change ?? ±sig.change_since_tweet` | `GET /api/user/<handle>/signals` (`userSignals`) | **Mount-only**. `useEffect` at line 870-873 fires once when `handle` changes. No focus-refresh, no interval. Stalest of all surfaces. |
| 2 | `src/app/profile/page.tsx` → **`PositionsTabContent`** (line 645) | `p.current_price` direct | `GET /api/portfolio/positions` (`getOpenPositions`) | **Mount-only**. Single `useEffect` (line 601) per `handle` change. |
| 3 | `src/app/copyTrading/components/signalItem.tsx` | **No current-price line rendered.** Only the % chip (now-PnL after the recent fix). | — | The chip's `pct_change` comes from `userSignals` parent fetch, mount-only. |
| 4 | `src/app/copyTrading/components/signalDetailSheet.tsx` | **No current-price line.** Shows `entry_price` and `pct_change` only. | — | Inherits parent fetch (mount-only). |
| 5 | `src/app/explore/page.tsx` → token detail (line 422-424) | `sig.current_price` direct | `GET /api/explore/tokens/<ticker>` (returns `TokenSignalRow[]` with `current_price`) | **Mount-only** when the token sheet opens. |
| 6 | `src/app/dashboard/components/PositionCard.tsx` (line 103) | `position.current_price ?? null` direct | `GET /api/portfolio/positions` | Refreshed via `fetchDashboard()` on: mount, sheet close, deposit/withdraw success, `token-refreshed` event. **No interval poll.** Wallet balance polls every 10s but positions do not. |
| 7 | `src/app/tradeHistory/page.tsx` Active tab (line 225) | `p.current_price` via the `CardItem.ref_price` mapping | `getOpenPositions()` | Re-fetched on each tab change to "active" (post-initial-probe), and on the initial mount probe. No interval poll. |
| 8 | `src/app/dashboard/page.tsx` (lines 256, 562) | Hard-coded `positionExtendedData` map keyed by ticker, **with a stale fallback** of `pos.entry * (1 + pnlPercent/100)` | Static fixture in `PositionDetail.tsx:75-110` for BTC/ETH/SOL/HYPE | Static. Pure leftover from legacy mock data. |

**The "stale" complaint maps most directly to surface #1** (profile signal cards) — that one is back-solved from a pct that itself comes from a single mount fetch. Surfaces #2, #5, #6, #7 are also stale-on-mount but at least carry a BE-fresh value at fetch time. Surfaces #3, #4 don't show a current price at all. Surface #8 is technically wrong (static fixture) and unrelated to the boss's request.

### What the BE provides for direct read

- `PositionItem.current_price` (`/api/portfolio/positions`) ✅ — used by surfaces 2, 6, 7.
- `TokenSignalRow.current_price` (`/api/explore/tokens/<ticker>`) ✅ — used by surface 5.
- `UserSignalItem` (`/api/user/<handle>/signals`) ❌ — **does not** include `current_price`. Only `entry_price` + `pct_change` / `change_since_tweet`. Surface 1 has to back-solve.

---

## What HL APIs the FE can already reach

`@nktkas/hyperliquid@0.25.0` is the SDK. Top-level exports include:

```
HttpTransport
WebSocketTransport         ← already in the SDK; reconnecting WS built in
InfoClient                 ← used today (HTTP)
ExchangeClient             ← used today (HTTP, signed)
SubscriptionClient         ← NOT used anywhere in the FE today
```

`HyperLiquidContext` (`src/providers/hyperliquid.tsx`) currently exposes only `infoClient` (HTTP), `mainExchClient`, `exchClient`, `assetsInfoMap`, `placeOrderAssets`. It uses `hl.HttpTransport` only — no `WebSocketTransport`, no `SubscriptionClient`.

### `infoClient.allMids()` (HTTP)
- Returns `Record<ticker, midPriceString>` for every actively-traded perp.
- **Already used in production**: `src/app/trade/components/MarketPanel.tsx:115` polls it every **2000ms** (`window.setInterval(poll, 2000)` at line 140). Same panel polls `l2Book` and `metaAndAssetCtxs` on the same cadence; candles refresh every 60s.
- This is the proven path — the codebase already has prior art for client-side HL polling.

### WebSocket subscription (SDK-supported, FE-unused)
- `subscribeAllMids` / `allMids(config, listener)` from `@nktkas/hyperliquid/api/subscription` pushes an `AllMidsEvent` (`{ mids: { [ticker]: string } }`) on each HL update.
- Transport is `WebSocketTransport` from the SDK, with a built-in reconnecting client (`esm/src/transport/websocket/_reconnecting_websocket.js`).
- HL pushes `allMids` updates roughly every ~250-500ms (varies with market activity).
- **Not wired in our app today** — no FE file imports `WebSocketTransport` or `SubscriptionClient`. Adding it is greenfield.

### Other relevant SDK subscriptions (not strictly required, but available)
- `subscribeBbo({ coin })` — best-bid/offer per ticker
- `subscribeTrades({ coin })` — fills as they happen
- `subscribeActiveAssetCtx({ coin })` — funding, open interest, mark, oracle, etc.

For "current price on a signal card", `allMids` is the right primitive — one stream covers every ticker the user might be looking at.

### Existing FE patterns for live data
- `src/hooks/useNetworkStream.ts` — wraps an SSE connection to **our backend** (`/api/events/stream`), with auth-token mint via `/api/auth/stream-token` and reconnect on disconnect. Used by `/network` page for trade pulses. This is the closest analog to Option C below; it's not for prices.

---

## Option A / B / C analysis

| | **A: HTTP poll allMids ~5s** | **B: SDK WS subscribeAllMids** | **C: BE SSE fan-out** |
| --- | --- | --- | --- |
| Effort (FE) | ~2-4h | ~6-10h | ~3-5h |
| Effort (BE) | 0 | 0 | ~16-24h |
| Complexity | Low — same pattern as `MarketPanel` | Medium — WS lifecycle, render throttling, tab-suspend handling | Medium FE / High overall (BE owns the WS) |
| Update latency | ≤5s | <1s (push every ~250-500ms) | <1s (BE-throttled) |
| Smoothness | Stepped (visible jumps every 5s) | Constant flicker unless FE throttles renders | BE controls cadence — can choose |
| Scaling at 1k concurrent users | 1k × 12 req/min = 12 000 req/min to HL public, but each from a distinct IP. HL `/info` is per-IP rate-limited (~1200 req/min/IP); 12 req/min per IP is well within budget. | 1k persistent WS connections to HL. HL recommends 1 WS per user, with multiple subs multiplexed — fine. Each WS pushes the full mids payload (~1500 tickers) per tick — meaningful **client** bandwidth + render cost. | **1** WS connection from BE to HL. 1k SSE connections from FE to BE. BE bandwidth to HL = constant; FE↔BE is a familiar SSE workload (we already do it for `/api/events/stream`). |
| Failure modes | Burst-401 if user's session lapses (unrelated; HL `/info` is auth-less). 5s blackout on transient HL outage. | Reconnect built into SDK. Tab background may stall WS in some browsers. Out-of-band reconnects can race with our React state. | One BE outage takes everyone offline. SSE is well-supported but adds another runtime dep on BE infra. |
| Visible to product later | Easy upgrade to B or C — keep the consumer hook (`useLiveMids`), swap implementation. | Hook stays; transport change is contained. | Same. |
| Server-side fan-in benefit | None — every client hits HL directly. | None. | **Yes** — single HL connection regardless of client count, BE can filter / decorate (e.g. only send mids for tickers the user holds). |
| Cost / billing | Free (HL `/info` is free). | Free. | BE compute cost (modest — one WS + N SSE). |

### Detail: why B is more complex than it looks at first glance

`subscribeAllMids` pushes the **entire mids dictionary** (~1500 entries) every tick. Naively storing it in React state and consuming via `useContext` would re-render every signal card on every tick (~250ms = 4× per second). Mitigations needed:
- Hold mids in a ref + force a publish via a small subscriber hook (per-ticker selector pattern).
- Or: throttle the publish (e.g. flush at most once per 1s).
- Or: use an external store (zustand / `useSyncExternalStore`).

A is naive-safe — 5s cadence + a single setState rebroadcast = at most one card-tree re-render per 5s.

### Detail: why C is the architecturally-correct end state

At 1k users, A makes 720 000 HL `/info` calls per hour (1k × 12 × 60). Each is independent, but it's a lot of duplicated work — the same `allMids` snapshot fetched 1000× a tick. C collapses that to one HL connection with BE doing the fan-out. C also unlocks per-user filtering ("only the tickers in your followed signals + open positions") which is what we'd actually want at scale.

But C is the most expensive to ship and depends on BE bandwidth.

---

## Recommendation

**Ship A now (HTTP poll `allMids` every 5s). Plan C as the v2.**

Rationale:
1. The freshness target is *signal cards*, not a trading terminal. 5s is plenty — humans don't perceive sub-5s lag for "is this signal still in the money".
2. A reuses an established pattern in this codebase (`MarketPanel.tsx` already polls `allMids` at 2s). No new transport, no new dependency, no schema change. Low review surface, low rollback risk.
3. Scales acceptably to the boss's stated 1k-user threshold — HL's per-IP rate limit is the binding constraint, and 12 req/min/IP is ~1% of budget.
4. The consumer API (`useLiveMids().getMid(ticker)`) is the same shape as B and C. When/if we go to 10k users or want sub-second updates on a "live trading" screen, swapping the implementation does not touch any signal card code.
5. B's WebSocket complexity (per-ticker selector pattern, render throttling) buys us latency we don't need for this surface and adds maintenance.
6. C is correct architecturally but BE-blocked. Don't make the FE wait.

Skip B unless boss specifically wants the live-trading-terminal-grade experience on signal cards.

---

## Concrete steps to ship the recommended option (A)

### 1. New hook — `src/hooks/useLiveMids.ts`

```ts
// Pseudocode — investigation only.
export function useLiveMids(intervalMs = 5000): {
  getMid: (ticker: string) => number | null;
} {
  const { infoClient } = useContext(HyperLiquidContext);
  const [mids, setMids] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!infoClient) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const raw = await infoClient.allMids();
        if (cancelled) return;
        const parsed: Record<string, number> = {};
        for (const [k, v] of Object.entries(raw)) {
          const n = Number(v);
          if (!Number.isNaN(n)) parsed[k] = n;
        }
        setMids(parsed);
      } catch {
        // swallow — next tick will retry
      }
    };

    poll();
    const id = window.setInterval(poll, intervalMs);
    return () => { cancelled = true; window.clearInterval(id); };
  }, [infoClient, intervalMs]);

  return {
    getMid: (ticker: string) => mids[ticker] ?? null,
  };
}
```

Notes:
- Return a `getMid` function (not the full record) so callers don't re-render on every tick — only the ones that actually read the current ticker change.
- Optionally promote the state to `HyperLiquidProvider` so multiple consumers share one poller. **Important** if `MarketPanel` and signal-card screens are ever mounted simultaneously: today MarketPanel polls at 2s independently, fine for v1; consolidate later.
- Tickers in `allMids` use the HL universe naming (e.g. `BTC`, `ETH`, `kPEPE`). Signals already store ticker in `sig.ticker` — verify the casing matches HL's universe before shipping (spot-check 3-4 signals).

### 2. Wire into the four offending surfaces

For each, prefer the live mid; fall back to existing logic.

- **`profile/page.tsx` SignalCard caller (~line 1480)**:
  ```ts
  const { getMid } = useLiveMids();
  const liveMid = getMid(sig.ticker);
  const currentPrice = liveMid ?? (hasEntry && hasPct
    ? sig.entry_price * (1 + priceChangePct / 100)
    : null);
  ```
  Optionally also recompute a live `pct` for the chip:
  ```ts
  const livePct = (liveMid != null && hasEntry)
    ? ((liveMid - sig.entry_price) / sig.entry_price) * 100 * (isShort ? -1 : 1)
    : null;
  const pct = livePct ?? backendSignedPct;
  ```
  This gives the user a live PnL number, not just a live price.

- **`explore/page.tsx` token sheet** — `sig.current_price` → `getMid(sig.ticker) ?? sig.current_price`.

- **`dashboard/PositionCard.tsx`** — `position.current_price` → `getMid(position.ticker) ?? position.current_price`. Same idea works for `tradeHistory` Active tab.

- **`signalDetailSheet.tsx`** — currently shows no current price. Optional: add a "Mark $X" line below "Entry" using `getMid(signal.ticker)`.

### 3. Visual cue (small)

Pulse a teal dot or render a subtle "LIVE" microbadge near the price block. Pattern already exists at `network/page.tsx:242-245` (Wifi icon + `text-teal-400 Live` text). Reuse the convention.

### 4. Verification before merge

- Boot dev server, open `/profile?handle=<x>` with at least one bullish + one bearish signal whose tickers exist on HL (e.g. BTC, ETH).
- Verify the price ticks every 5s.
- Open Network tab — confirm one `POST https://api.hyperliquid.xyz/info` per 5s with `{"type":"allMids"}` body.
- Disable network — verify the card doesn't crash; price freezes; reconnects on network restore.
- Open `/trade` simultaneously — confirm both pollers run (acceptable for v1) and don't break each other.

### 5. Follow-up scheduling

After A ships and is observed in production for ~2 weeks:
- If boss is satisfied with 5s cadence, leave A in place and close out.
- If active-user count grows toward 1k *and* we want to take pressure off HL, schedule the BE work for C. The FE swap from A → C is one-file (`useLiveMids.ts` → swap poll for SSE consumer); no signal-card code changes.
- B is unlikely to be the right next step unless we add a live-trading view that genuinely needs sub-second ticks.

---

## Open questions worth flagging back

1. Does HL's universe naming match our `sig.ticker` for every coin we care about? E.g. `kPEPE` vs `PEPE`. Quick spot-check before merge — falls back gracefully if not, but live updates won't kick in.
2. The boss said "unlimited data request" — interpret literally? HL's `/info` endpoint is per-IP rate-limited (~1200 req/min). At 5s per user we use ~1% of that, which is effectively unlimited from the user's perspective. Good enough.
3. For signal cards specifically, should the *card's chip color/sign* update live (i.e. a SHORT that was profitable but flipped underwater changes red)? My recommendation says yes — recompute live `pct` when `liveMid` is available. Confirm with boss.
4. Tab-backgrounded behavior: `setInterval` in a hidden tab gets throttled to once-per-minute by Chrome. Acceptable for "stale-while-hidden", but if boss wants instant freshness on tab focus, add a `visibilitychange` listener that re-polls immediately on `visible`.
