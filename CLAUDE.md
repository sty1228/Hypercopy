# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 1. Overview

Mobile-first Next.js 15 / React 19 front end for a Hyperliquid copy-trading product. Users connect a wallet, follow KOL traders, and the app mirrors their signals as on-chain trades via Hyperliquid using a delegated agent wallet. Deposits are USDC, direct on Arbitrum or bridged from other chains via Stargate V2.

## 2. Architecture

Provider stack (`src/app/layout.tsx`, order is load-bearing):

- `Providers` (`src/providers/providers.tsx`) — `PrivyProvider`. Embedded wallet auto-created for users without one; curated external wallet list (Rabby, MetaMask, Phantom, Coinbase, Rainbow, WalletConnect).
- `HyperLiquidProvider` (`src/providers/hyperliquid.tsx`) — owns `infoClient`, `mainExchClient` (user-signed, approval-only), `exchClient` (agent-signed, trading), `assetsInfoMap`, `placeOrderAssets`.
- `RewardsProvider` (`src/providers/RewardsContext.tsx`) — KOL rewards UX: full screen, in-place congrats prompt, dashboard banner. Driven by `RewardsTrigger` events.
- `AppLayout` (`src/components/AppLayout.tsx`) — registers token-refresh handler, polls every 5 min, refreshes on focus, renders fixed bottom `Navbar`.

Data flow:

- Components → `@/service` (typed functions) → `@/lib/axios` (interceptors) → backend (`NEXT_PUBLIC_API_URL`).
- Components → `HyperLiquidContext` → `@nktkas/hyperliquid` SDK → Hyperliquid HTTP transport.
- Wallet/auth state → `usePrivy` / `useWallets` (`src/hooks/usePrivyData.ts`) → providers and AppLayout.

Key boundaries:

- Backend issues a JWT in exchange for the wallet address. The address itself is the credential — no signature challenge in the front end.
- The user's wallet only signs once (agent approval); all orders are signed by an agent wallet stored in `localStorage`.
- Viewport is capped at 600px wide and centered (`MAX_WIDTH = "600px"` in `src/app/layout.tsx`). Navbar is hidden on `/onboarding` only.

## 3. Routing & pages

App Router under `src/app/`. `/` redirects to `/onboarding`.

- `/onboarding` — entry point; navbar hidden.
- `/dashboard` — portfolio summary, balance chart, deposit/withdraw, KOL rewards, transaction history.
- `/copyTrading` — KOL list + signal feed with detail sheets.
- `/explore` — token sentiment, rising traders, search, style filters, token detail.
- `/profile` — current user profile, followers, traders copying, share sheet.
- `/tradeHistory` — closed/open trade list with filters.
- `/notification` — alerts.
- `/settings` — default follow settings + per-trader overrides.
- `/demo`, `/join` — auxiliary entry surfaces.

## 4. Auth & token refresh

Wallet-as-credential: `connectWalletApi(walletAddress, twitterUsername?)` → `POST /api/auth/connect-wallet` returns `access_token`. No EIP-191 challenge in the FE.

Token storage (`src/lib/token.ts`):

- Tries `localStorage`, falls back to a `Secure; SameSite=Lax` cookie. iOS Safari in-app browsers and private mode block `localStorage`.
- Cookie max-age = 72h to match `JWT_EXPIRE_HOURS`.
- `isTokenExpired` uses a 10-min buffer.

Two refresh paths — must stay in sync:

- **Reactive** (axios 401 interceptor, `src/lib/axios.ts`): on 401, calls `refreshTokenSilently()` which delegates to a handler registered by `AppLayout` via `setRefreshHandler`. Concurrent 401s share one in-flight refresh. If the handler isn't registered yet (mount race), `waitForHandler` polls up to 5s. The `/auth/connect-wallet` call itself is excluded from retry.
- **Proactive** (`AppLayout`): registers `doRefresh`, runs on mount, every 5 min, and on `window` focus. After 3 consecutive failures the token is cleared but Privy is **not** logged out (user can stay on public pages).

Successful proactive refresh fires a `token-refreshed` window event (`emitTokenRefreshed`). Subscribe with `onTokenRefreshed(cb)` to re-fetch screen data.

## 5. Trading

**Agent wallet pattern** (`src/providers/hyperliquid.tsx`):

- `mainExchClient` — signed by the user's connected wallet via `ethers.providers.Web3Provider`. Used **only** for `approveAgent` (one-time onboarding).
- `exchClient` — signed by a random agent wallet whose private key is in `localStorage` under `agentWalletPrivateKey`. Every routine order goes through this; users never sign per-trade.
- `tradingEnabled` flips true after `infoClient.extraAgents({ user })` confirms the agent is whitelisted, or after `enableTrading()` succeeds.
- `placeOrderAssets` and `assetsInfoMap` come from `infoClient.meta()`; needed to translate coin name → asset index + `szDecimals` + `maxLeverage`.

**Builder fee**: auto-approved by the backend on first deposit. In context, `builderFeeApproved` is hard-coded to `true` and `approveBuilderFee` is a no-op — kept for backward compat with consumer components. Do not reintroduce a FE builder-fee approval flow. `placeOrder` still requires `NEXT_PUBLIC_HL_BUILDER_ADDRESS` and `NEXT_PUBLIC_HL_DEFAULT_BUILDER_BPS` to be set.

**Deposits** (`src/config/chains.ts`):

- **Arbitrum** (special-cased, `stargatePool: null`): USDC sent directly to Hyperliquid Bridge2 `0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7` (see `src/helpers/arbitrum.ts`). **Hard floor 5 USDC** — smaller amounts are lost.
- **Other chains**: Stargate V2 (`quoteSend` + `sendToken`, ABI in `chains.ts`). LayerZero EIDs and pool addresses baked in. Supported: Avalanche, Base, Ethereum, Mantle, Optimism, Polygon, Scroll.

## 6. API surface

- All HTTP helpers (`get`/`post`/`put`/`del`/`patch`) live in `src/lib/axios.ts`. The response interceptor returns `response.data`, so handler return types are body shapes.
- All backend endpoints are centralized in `src/service/index.ts`. Components import from `@/service`, **never** from `@/lib/axios` directly.
- When adding a new endpoint: add the function and its TS request/response types to `src/service/index.ts`. Group under the existing `// ─── <Section> ───` headers.

## 7. Commands & env

Package manager is **pnpm** (lockfile committed, `pnpm-workspace.yaml` present).

- `pnpm dev` — dev server on port 3000 with Turbopack.
- `pnpm build` — production build. ESLint is ignored during builds (`next.config.ts`).
- `pnpm start` — run production build.
- `pnpm lint` — ESLint (`next/core-web-vitals` + `next/typescript`).

No test runner is configured.

Required env (`.env.local`):

- `NEXT_PUBLIC_API_URL` — backend base URL (default `https://api.hypercopy.io`).
- `NEXT_PUBLIC_HL_BUILDER_ADDRESS` — Hyperliquid builder address; required by `placeOrder`.
- `NEXT_PUBLIC_HL_DEFAULT_BUILDER_BPS` — builder fee in bps; required by `placeOrder`.
- `NEXT_PUBLIC_SENTRY_DSN` — optional.

Privy credentials live in `account/privy.json` (committed) and are read by `src/providers/providers.tsx`.

## 8. Conventions

- Path alias: `@/*` → `./src/*`.
- UI: shadcn/ui (`new-york` style, `neutral` base, CSS variables) in `src/components/ui/*`. Tailwind v4, Radix primitives, `lucide-react` icons, `recharts` charts.
- Toasts: prefer `sonner` (mounted in `RootLayout`). `react-toastify` is present but legacy — don't add new usage.
- Page-scoped components live in `src/app/<route>/components/`, not in `src/components/`. The global `src/components/` is for cross-route widgets (`AppLayout`, `Navbar`, `TopBar`, `UserMenu`, etc.).
- Helpers split by domain: `src/helpers/hyperliquid.ts` (orders, leverage, TPSL), `src/helpers/arbitrum.ts` (USDC + Bridge2).
- Hooks in `src/hooks/` are React hooks only; non-React utilities go in `src/lib/`.
- `process.md` is product/architecture notes in Chinese — read for context, don't treat as code spec.

## 9. Changelog

- 2026-05-02 — Session wrap: avatar click navigates to `/profile?handle=<twitter>` when X is linked, falls back to dropdown otherwise (commits 93fadd5 + 946b351); `/profile` page gains a Disconnect button (commit 5992101); stale `SETTINGS_DISPLAY_BUG.md` removed — bug resolved by BE fix 8bc9fa8 (commit e828ae1).
- 2026-04-29 — Dashboard position rows now open a `PositionCard` (`src/app/dashboard/components/PositionCard.tsx`) — playing-card-style modal with a holographic foil stripe (animated conic gradient), 3D tilt on mousemove, KOL "stamp" at top-right (avatar + COPY/COUNTER/MAN badge), monospace stats grid (Size, Entry, Mark, Liq estimate), TP/SL target prices derived from `defaultSettings` (PCT type only — backend does not yet expose per-trade TP/SL overrides on `/api/portfolio/positions`), source line ("Copying @x" / "Counter-trading @x" / "Manual trade"), inline TP/SL editor calling `updateTradeTpSl`, and Close button calling `closePosition`. Replaces the legacy `PositionDetail` render path; `PositionDetail.tsx` left in tree for the still-used `PositionDetailData` and `positionExtendedData` named exports.
- 2026-04-29 — Onboarding tutorial popup (`src/components/OnboardingTutorialPopup.tsx`): 4-step list ("Find or search KOLs" / "Follow + auto-copy or auto-fade" / "Position sizing + exit strategy" / "Auto-generated profits"), "Don't show again" checkbox writing `localStorage.hc_onboarding_tutorial_seen`, soft session-skip via `sessionStorage.hc_onboarding_tutorial_session_skipped`. Mounted in AppLayout, gated to `/dashboard` (skipped on `/onboarding`), suppressed when WelcomeBackPopup is showing this session.
- 2026-04-28 — `/trade` upgraded toward an industry-standard layout: new `MarketPanel` component (`src/app/trade/components/MarketPanel.tsx`) renders a live price + 24h change header, a 60-bar SVG candle chart with selectable interval (5m / 15m / 1h / 4h / 1d) + volume bars + last-price line, and an L2 orderbook (8 bids / 8 asks with depth-bar visualization + spread). Data via `infoClient.candleSnapshot`, `l2Book`, `metaAndAssetCtxs`, `allMids` — book and mid poll every 2s, candles refresh every 60s. Existing order entry and open-positions UI unchanged below.
- 2026-04-28 — Token refresh cold-load race fixed (P0). `setRefreshHandler(doRefresh)` is now registered on AppLayout mount unconditionally — no more `if (!ready \|\| !authenticated) return` gate that delayed handler registration past Privy session restore (the cause of "[token] Refresh handler not available after waiting" + "[axios] 401 — token refresh failed" on iOS Safari WebView / slow networks / private mode). Cleanup-to-no-op removed (it created a brief window where 401s failed). New fallback path in `refreshTokenSilently`: when the React-context handler is absent or returns null, falls back to a raw `fetch('/api/auth/connect-wallet')` using a wallet address persisted to `localStorage["wallet_address"]` on every successful connect. `removeToken` clears the stored wallet alongside the token.
- 2026-04-28 — Welcome-back popup: AppLayout calls `POST /api/portfolio/welcome-back` once per authed session (guarded by `sessionStorage.hc_welcome_back_done`, skipped on `/onboarding`). When the backend returns a non-null summary (≥24h since last visit), `WelcomeBackPopup` renders a modal with balance delta, win/loss/realized PnL grid, TP/SL/equity-protect event counts, and best/worst/top-trader highlights. Backend's `last_seen_at` makes the call naturally idempotent within 24h.
- 2026-04-28 — Network graph center node now renders the user's identity (display name, @handle, account value via `/api/portfolio/profile`); manual-source SSE events emit a short purple self-pulse on the user node.
- 2026-04-28 — Frontend wired to four new backend features per FRONTEND_HANDOFF.md:
  - Copy Next mode in `QuickSettingsSheet` (`copy_mode` "all" | "next" + `remaining_copies` plumbed through follow service).
  - `max_gain_pct` / `max_gain_at` now rendered as PEAK badge in explore TokenSheet.
  - New `/trade` page: industry-standard manual order entry (long/short, market/limit, leverage, optional TP/SL), open positions with TP/SL edit and partial close (uses `POST /api/trades/manual`, `PATCH /api/trades/{id}/tp-sl`, `POST /api/trades/{id}/partial-close`).
  - New `/network` page: SVG hub-and-spoke graph with edge color (copy=green/counter=red), $-exposure label, open-count bars, click-through detail sheet, realtime pulses via SSE (`POST /api/auth/stream-token` + `/api/events/stream?token=&last_id=`). New hook `src/hooks/useNetworkStream.ts` handles token mint + reconnect.
  - Navbar gains `/trade` and `/network` entries (lucide icons; existing PNG-icon items unchanged).
- 2026-04-26 — Sentry orphan removed from global-error.tsx (commit 080acdd)
- 2026-04-26 — Initial spec workflow established (Claude Code + spec-keeper subagent)
- 2026-04-26 — Initial spec generated by /init.
