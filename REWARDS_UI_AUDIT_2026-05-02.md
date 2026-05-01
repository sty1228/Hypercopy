# Rewards UI Audit — 2026-05-02

> **Read-only audit before implementing UI for Points Program v1.0.** The spec
> file (`hyper-copy-points-program-spec.md`) lives in the boss's knowledge
> base and is **not** in this repo, so the gap table below is written from the
> task brief's three pillars (points / referral / leaderboards) plus what is
> already implemented. Confirm the gap table against the actual spec before
> sequencing work.

---

## Current State (what's actually in the code)

### 1. `src/providers/RewardsContext.tsx` — orchestration

The context is mounted at the root (`src/app/layout.tsx:51`, inside
`HyperLiquidProvider`, outside `AppLayout`).

**State held:**

| Slice | Type | Purpose |
| --- | --- | --- |
| `showRewards` | `boolean` | Full-screen `KOLRewardsScreen` modal visibility |
| `lastTrigger` | `RewardsTrigger \| null` | Which event opened the modal (used for analytics / focus, not currently read by the screen) |
| `showCongrats` | `boolean` | In-place "first copy trade" confetti sheet visibility |
| `congratsTrigger` | `RewardsTrigger \| null` | Which trigger fired the congrats |
| `showBanner` | `boolean` | Dashboard top-banner visibility |
| `bannerTrigger` | `RewardsTrigger \| null` | Which trigger fired the banner |

**Triggers (`RewardsTrigger` union):**

| Trigger | Caller (today) | UI it routes to | One-shot? |
| --- | --- | --- | --- |
| `first_copy_trade` | `kolDetailSheet.tsx:709`, `profile/page.tsx:1007` | `CopyCongratsSheet` (in-place sheet, see ⚠ below) | Yes — `localStorage.hc_rewards_first_copy_trade_shown` |
| `first_time_copied` | (no caller in repo) | `RewardsBanner` | Yes — `localStorage.hc_rewards_first_time_copied_shown` |
| `weekly_summary` | (no caller) | `RewardsBanner` | No |
| `smart_follower_milestone` | (no caller, takes a `count`) | `RewardsBanner`, fires only on threshold crossings `[25, 50, 100, 250, 500]` (last seen in `localStorage.hc_rewards_sf_milestone`) | Per-threshold |
| `phase_transition` | (no caller) | `RewardsBanner` | Yes — `localStorage.hc_rewards_phase_transition_seen` |
| `referral_share` | (no caller) | Direct `openRewards()` → full screen | No |

The `triggerFirstTimeCopied / triggerWeeklySummary / triggerSmartFollowerMilestone /
triggerPhaseTransition` paths are wired in the context but never invoked from
any feature today — they were defined ahead of the back-end signals.

**UI states the context drives:**

1. **Full screen** — `showRewards` toggles `KOLRewardsScreen` (Earn / Multiply / Distributions tabs, Phase selector, ~1000 lines of UI).
2. **In-place congrats prompt** — `showCongrats` toggles `CopyCongratsSheet`. ⚠ The component definition exists at `src/components/CopyCongratsSheet.tsx` but **no parent imports or renders it** — `grep -rln CopyCongratsSheet src` returns only the definition file. So `triggerFirstCopyTrade` flips state nobody is listening for. **Dead code on the FE side** (the underlying gating logic still works; the visual just never appears).
3. **Dashboard banner** — `showBanner` toggles `RewardsBanner`, mounted at `dashboard/page.tsx:377`. Copy is keyed off `bannerTrigger`. Since none of the banner triggers have callers today, this banner only renders in dev when manually invoked.

`viewRewardsFromPrompt()` is the bridge from intermediate UI → full screen: clears
the banner/congrats and pops `KOLRewardsScreen` open.

### 2. Dashboard KOL rewards section

**Surfaces:**

- **`KOLRewardsCard.tsx`** — small dashboard tile. Visual only; no API. Two
  hard-coded phases (BETA / S1) with multiplier + fee-share teasers.
  ⚠ This file is **not currently rendered** by `dashboard/page.tsx` — the
  only entry into the full screen from the dashboard is the coin pill in
  `TopBar` (which calls `viewRewardsFromPrompt()` via `dashboard/page.tsx:378`).
  `KOLRewardsCard` looks orphaned post-redesign.
- **`KOLRewardsScreen.tsx`** — full-screen modal. Tabs: Earn / Multiply /
  Distributions. Fetches `getRewards()` + `getDistributions(6)` on mount
  (`Promise.allSettled`, falls back to zeros on failure). Phase selector
  (BETA live / S1 SOON) toggles purely visual config; the live data comes
  from `rewards.phaseConfig`.
  - **Fields displayed:** total points, current-week points, rank, total fee
    share (USDC), claimable fee share, smart-follower count, boost multiplier,
    X-account-linked flag, weekly progress (current week / total weeks),
    `phaseConfig` (`feeShare`, `twapShare`, `airdropPool`, `copyShare`,
    `multiplierRange`, `kolRefBonus`).
  - **Actions:** `claimFeeShare(claimable)` (Claim button, optimistic zero-out),
    `logShare("pnl_card" | "leaderboard")` (opens `x.com/intent/tweet`), Link X
    button (UI only — no handler wired; just shows "LINKED" if `xAccountLinked`).
  - **Distributions tab:** week-by-week list of `DistributionItem` with
    breakdown (`copyVolumePoints`, `ownTradingPoints`, `signalQualityBonus`,
    `xAccountBoost`, `smartFollowerBoost`, `feeShareEarned`).
- **`RewardsBanner.tsx`** — top-of-dashboard banner, content keyed by trigger.
- **`TopBar.tsx`** (left coin pill) — fetches `getRewards()` directly on mount
  for `totalPoints` + `rank`, displays as `<count> coins` in an amber pill.
  Tapping it calls the page's `onCoinClick` (dashboard → opens rewards screen).

**Points-balance UI elements that already exist:**

| Where | What | Source |
| --- | --- | --- |
| `TopBar` | Coin pill: `<totalPoints>` (amber) | `getRewards().totalPoints` |
| `TopBar` | (rank also fetched, currently unused in render — `setFetchedRank` writes but the right side renders `activeTrades`, not rank) | `getRewards().rank` |
| `KOLRewardsScreen` header card | Total Points (huge), `+<currentWeekPoints> this week`, `#<rank>` Trophy | `getRewards()` |
| `KOLRewardsScreen` distributions list | Per-week `+<points> pts` / `+$<feeShareUsdc>` USDC | `getDistributions()` |
| Dashboard page itself | **No points balance** outside the TopBar pill |

### 3. Service endpoints (`src/service/index.ts`)

#### Rewards block (`§ KOL Rewards`, lines 622-706)

```
GET  /api/kol/rewards          → RewardsData
GET  /api/kol/distributions?limit=N → DistributionsResponse
POST /api/kol/share            → ShareResponse   (logShare)
POST /api/kol/claim-fee-share  → ClaimResponse   (claimFeeShare)
```

`RewardsData` shape (the canonical "my rewards" envelope):

```ts
phase: string
currentWeek: number
totalWeeks: number
totalPoints: number          // ← canonical "my points balance"
currentWeekPoints: number
rank: number | null
totalFeeShare: number        // lifetime $
claimableFeeShare: number    // pending $
smartFollowerCount: number
boostMultiplier: number
xAccountLinked: boolean
phaseConfig: PhaseConfig
```

#### Referral block (`§ Referral`, lines 739-752)

```
GET  /api/referral/info        → ReferralInfo
POST /api/referral/apply-code  → applyReferralCode(code)
POST /api/referral/affiliate-apply → applyAffiliateProgram()
```

Plus the public-slot probe used by `/join` directly via `axiosInstance.get`:

```
GET  /referral/public-slots?code=<ref>
```

`ReferralInfo` shape:

```ts
code: string
link: string
invited_count: number
active_count: number
earned_usd: number
affiliate_applied: boolean
invited_by: { username, display_name, avatar_url } | null
global_slots: { total_slots, slots_used, free_tier_total, free_tier_full }
```

#### Leaderboard block (`§ Leaderboard`, lines 292-328)

```
GET  /api/leaderboard?window=&sort_by=&registered_only= → LeaderboardItem[]
```

`LeaderboardItem` is the **KOL trader leaderboard** (rank, x_handle, win_rate,
avg_return, points, profit_grade, copy/counter buttons, etc.). It's keyed off
`x_handle`, not the current user's identity — so it does not currently
function as a "users by points earned" leaderboard.

#### Specifically the four boss flagged

| Spec ask | Endpoint | Status |
| --- | --- | --- |
| My points balance | `GET /api/kol/rewards` (`totalPoints`) | ✅ exists |
| My referral code | `GET /api/referral/info` (`code`, `link`) | ✅ exists |
| My referees | `GET /api/referral/info` (`invited_count`, `active_count`, `earned_usd`) | ✅ aggregates only — **no per-referee list endpoint** |
| Leaderboard | `GET /api/leaderboard` | ⚠ exists but is **trader-focused**, not points-program-focused (sorts by `total_profit_usd` / `win_rate`, returns `LeaderboardItem` keyed by `x_handle`) |

### 4. Existing referral / invite UI

**`src/app/dashboard/components/InviteSheet.tsx`** — bottom sheet (modal),
referral hub. Mounted from `UserMenu.tsx:332-333` ("Invite Friends" link in
the dropdown). Renders:

- "FRIENDS GET" benefits row: `+15%` points, `10` free trades, `20%` fee share.
- User's `code` + copy button.
- User's `link` + copy button.
- "Post on X" intent (pre-filled tweet copy).
- Stats grid: Invited / Active / Earned.
- Affiliate Program apply button (calls `applyAffiliateProgram()`).

⚠ The "FRIENDS GET" numbers in `InviteSheet` (15% / 10 / 20%) are **hard-coded
strings** in JSX, not from `ReferralInfo` or `phaseConfig`. If the spec wants
those tunable per phase, this is a retrofit.

**`src/app/join/page.tsx`** — public landing for `/join?ref=<code>`.
- Fetches `/referral/public-slots?code=<ref>` (slots used, inviter info, code
  validity).
- After Privy login, calls `applyReferralCode(ref)` exactly once
  (`hasApplied` ref guard), then redirects to `/dashboard`.
- Tolerates `"already"` / `"own"` errors silently.

**Where the user is shown their own referral link:** `InviteSheet` (via
`UserMenu`'s "Invite Friends" item) is the **only** entry point. There's no
dashboard tile, no profile-page block, no rewards-screen referral panel
linking back to the InviteSheet.

**Referee-tracking UI:** `InviteSheet`'s 3-stat row (`Invited`, `Active`,
`Earned`). No drill-down list — there's no UI showing *who* the referees are.

### 5. Leaderboard

**Today there is one leaderboard endpoint and it is the KOL trader leaderboard.**
Consumers:

- `src/app/copyTrading/page.tsx:63` — main "Find traders" page.
- `src/app/explore/page.tsx:574` — "Top Traders" rail (limit 30d).
- `src/app/onboarding/page.tsx:50` — public landing teaser (top 5).

There is **no** points-based leaderboard, no referrer leaderboard, no
weekly-leaderboard, no "people who copy you" leaderboard. The
`KOLRewardsScreen.handleShare("leaderboard")` button just opens an X-intent
tweet — it does not navigate to a leaderboard view.

### 6. Cross-cutting orphans found in audit

- `CopyCongratsSheet.tsx` is defined but never imported. `triggerFirstCopyTrade()`
  flips `showCongrats=true` but no parent renders the sheet.
- `KOLRewardsCard.tsx` is defined but the dashboard never renders it (entry
  point is the TopBar coin pill instead).
- `RewardsBanner` is mounted on dashboard, but four of its five copy keys have
  no triggering caller (`first_time_copied`, `weekly_summary`,
  `smart_follower_milestone`, `phase_transition`).
- `triggerReferralShare` exists in the context but no caller invokes it.

These aren't bugs — they're the residue of a design that's mostly stubbed —
but they bear on retrofit-vs-rewrite for the next iteration.

---

## Spec Requirements vs Current UI (gap table)

> Mapped against the boss-stated three pillars: **points / referral / leaderboards**.
> Read this with the actual spec next to it.

| Capability (inferred) | API today | UI today | Gap |
| --- | --- | --- | --- |
| **Points** | | | |
| Show total points balance | ✅ `getRewards().totalPoints` | ✅ TopBar coin pill, ✅ Rewards screen | — |
| Show this-week points | ✅ `getRewards().currentWeekPoints` | ✅ Rewards screen | Not surfaced outside the screen |
| Show rank | ✅ `getRewards().rank` | ✅ Rewards screen (Trophy badge); ⚠ TopBar fetches it but doesn't render it | TopBar render gap; no points-rank shown on profile/dashboard outside the modal |
| Per-week breakdown | ✅ `getDistributions().breakdown` | ✅ Rewards screen Distributions tab | — |
| Claim fee share | ✅ `claimFeeShare()` | ✅ Rewards screen Claim button | Optimistic UI only — no toast / tx hash / status polling on success |
| Phase config display | ✅ `phaseConfig` | ✅ Rewards screen | `KOLRewardsCard.tsx` has hard-coded phase data; if rendered, it'll diverge from BE |
| **Referral** | | | |
| Show my referral code | ✅ `getReferralInfo().code` | ✅ InviteSheet | Single entry point (UserMenu only) |
| Show my referral link | ✅ `getReferralInfo().link` | ✅ InviteSheet | Same |
| Apply someone's code | ✅ `applyReferralCode(code)` | ✅ /join page (auto-apply on URL) | No in-app "I have a code" form. Code can only be applied via the `/join?ref=` URL — a user who logs in normally and *then* receives a code has no way to attach it |
| Show my referees aggregate | ✅ `getReferralInfo()` (counts, $) | ✅ InviteSheet stats row | — |
| Show my referees list | ❌ no endpoint | ❌ no UI | **BE + FE work** if spec needs it |
| Affiliate apply | ✅ `applyAffiliateProgram()` | ✅ InviteSheet | Returns nothing useful — UI just optimistically marks "Submitted"; no review/approval status surfaced |
| Inviter attribution | ✅ `getReferralInfo().invited_by` | ❌ not displayed anywhere | Show "Invited by @x" somewhere (profile? rewards? settings?) |
| Slot-scarcity messaging (free-tier full) | ✅ `global_slots.free_tier_full` | ⚠ /join page only — not surfaced in InviteSheet | If spec wants in-app FOMO, retrofit InviteSheet |
| **Leaderboards** | | | |
| KOL trader leaderboard | ✅ `/api/leaderboard` | ✅ /copyTrading, /explore, /onboarding | Existing — not a points leaderboard |
| Points leaderboard (users ranked by points) | ❌ no endpoint exposes a points-ranked list of users — `/api/leaderboard` is keyed by `x_handle` (KOLs), not by current users | ❌ no UI | **Likely BE ask**: either extend `/api/leaderboard` with a `sort_by=points` and a "current user" mode, or add `GET /api/rewards/leaderboard` returning users with `totalPoints`, `currentWeekPoints`, `rank` |
| Referrer leaderboard | ❌ | ❌ | BE + FE if spec asks |
| Weekly winners / top-N this week | ❌ (distributions are per-user only) | ❌ | BE + FE |
| **Notifications / nudges** | | | |
| First-copy congrats | ✅ trigger wired | ⚠ CopyCongratsSheet is unmounted dead code | Mount it (one line in AppLayout) |
| First-time-copied banner | ✅ banner UI | ❌ no caller invokes the trigger | Wire from BE event (SSE / poll) |
| Weekly summary banner | ✅ banner UI | ❌ no caller | Same |
| SF milestone | ✅ banner UI + threshold logic | ❌ no caller | Same; needs a place that knows the SF count to call `triggerSmartFollowerMilestone(count)` |
| Phase transition | ✅ banner UI | ❌ no caller | BE has to expose phase change (e.g. via `RewardsData.phase` watcher) |

---

## Reusable Components / Patterns

These are the existing pieces that points-program v1 should reuse before any
new component is built.

### Components

1. **`KOLRewardsScreen`** — full-screen modal pattern.
   - 393px-wide centered viewport, candlestick canvas BG, fade-in animation.
   - Phase selector (segmented control with live-pulsing dot).
   - Header card with progress bar + rank trophy.
   - Tab navigation (`Earn / Multiply / Distributions`) — 3-tab pattern is
     ready to extend (e.g. add `Referrals` or `Leaderboard` as a 4th tab).
   - `Skeleton` loader inline component.
   - Phase-aware accent colors (`PHASES[phase]`).
2. **`RewardsBanner`** — top-of-page transient banner with action button. Already keyed off
   trigger names → adding a new banner copy is one entry in `BANNER_CONTENT`.
3. **`InviteSheet`** — bottom-sheet modal with header, body, action button,
   close handle. Good template for a similar "Apply Code" sheet or
   "Referees List" sheet.
4. **`CopyCongratsSheet`** — confetti + bottom-sheet. Reusable for any "you
   just earned X" moment if we mount it (currently dead code).
5. **`TopBar` coin pill** — already shows points; only needs a click target
   review (defaults to `/dashboard` but can pass `onCoinClick` per page).

### Patterns

- **`Promise.allSettled` + zero fallback** in `KOLRewardsScreen.useEffect` —
  the canonical "show stale-but-safe data" pattern. Reuse for any new
  multi-endpoint screen.
- **Trigger gating with `localStorage`** keys (`KEYS` in `RewardsContext`) —
  the way one-shot UI is dedup'd. New triggers should follow the same
  prefix `hc_rewards_*`.
- **Phase config from BE**, with hard-coded fallback string for UI-only
  phases (Beta vs S1) — mirrored in `KOLRewardsScreen` and `KOLRewardsCard`.
- **`getReferralInfo` return shape** — single envelope for all referral state.
  When extending (e.g. add `referees: ReferreeItem[]`), keep it in this
  envelope rather than forking a new endpoint.
- **`/api/leaderboard` query pattern** (`window`, `sort_by`, `registered_only`) —
  if a points leaderboard ships, mirror the same shape (e.g.
  `sort_by=total_points|weekly_points`).

---

## Suggested Implementation Order (UI-only perspective)

> Sequenced by frontend-only risk and dependency. Anything tagged **BE** is
> blocked on backend work. Re-sort once the actual spec is in hand.

### Phase 0 — cheap cleanup, no spec dependency

1. Mount `CopyCongratsSheet` (in `AppLayout.tsx`, since `RewardsProvider`
   is already a parent there). Single import + one render line. Without this,
   the only first-copy-trade trigger that has callers (kolDetailSheet,
   profile) flips state nobody sees.
2. Either render `KOLRewardsCard` on the dashboard (replace TopBar coin
   pill as the primary entry) **or** delete it. Don't leave it as dead
   code that can drift from the live `phaseConfig`.
3. TopBar: render the `fetchedRank` value somewhere, or remove the unused
   `setFetchedRank` write — currently `getRewards()` runs on every TopBar
   mount but the rank is only stored, never displayed.

### Phase 1 — points balance surfaces (no BE blocker)

All data already comes from `getRewards()`.

4. Add a **points balance card** on `/dashboard` (between Portfolio and the
   followed/positions tabs). Pattern: lift the "POINTS BALANCE" block from
   `KOLRewardsScreen.tsx:362-405` into a standalone component, render
   inline on dashboard. Tap → opens `KOLRewardsScreen` (same as TopBar pill).
5. Add a **points balance row on `/profile`**. Reuse the same component.
   Profile already imports `useRewards` so the trigger pathway is consistent.
6. Surface **rank** on profile / dashboard. Re-use the Trophy badge UI from
   the rewards screen header card.

### Phase 2 — referral surfaces (small BE asks)

7. **"Apply a code" entry point** in-app. New button in InviteSheet ("Have
   a code? Apply it") → small input → `applyReferralCode(code)`. No BE
   change; the endpoint already exists. Currently codes can only be applied
   via the `/join?ref=` URL flow.
8. Show **"Invited by @x"** somewhere visible (profile or rewards screen),
   sourced from `getReferralInfo().invited_by`. No BE change.
9. Surface **slot-scarcity** in InviteSheet: add a small progress bar from
   `getReferralInfo().global_slots`. Already-rendered on /join page; just
   move that rendering into a shared component.
10. **Referees list view** — *requires BE*: new endpoint
    `GET /api/referral/referees` returning `[{username, display_name,
    avatar_url, joined_at, has_traded, contributed_usd}, ...]`. UI: lift
    the `KOLRewardsScreen` distributions-list pattern into a new tab on
    InviteSheet, or open as a separate sheet.

### Phase 3 — points leaderboard (BE blocker)

11. Confirm with BE: extend `/api/leaderboard` (`sort_by=total_points` /
    `sort_by=weekly_points` and a `me` row), or add new
    `GET /api/rewards/leaderboard`. Either is FE-feasible — leaderboard list
    UI exists in `/copyTrading` and can be templatized.
12. Add a **Leaderboard tab** to `KOLRewardsScreen` (4th tab next to
    Distributions). Re-use the existing `LeaderboardItem` row pattern from
    `/copyTrading`. The current "Share Leaderboard to X" button in the
    Multiply tab makes more sense once a leaderboard view actually exists.

### Phase 4 — notifications / nudges (BE event source)

13. Wire `triggerFirstTimeCopied` (BE needs to push an event when someone
    copies the user the first time — likely via the existing SSE channel in
    `useNetworkStream`).
14. Wire `triggerWeeklySummary` (cron-style — backend either pushes via SSE
    or sets a flag on `RewardsData`).
15. Wire `triggerSmartFollowerMilestone(count)` — every place that
    fetches `smartFollowerCount` (currently `KOLRewardsScreen` and
    `RewardsBanner`) calls the trigger after each fetch.
16. Wire `triggerPhaseTransition` — watch `getRewards().phase` for a change.

### Phase 5 — referral fee-share claim flow (if spec calls for it)

The KOL fee-share claim is built (`claimFeeShare`); a parallel flow for
referral fee-share would need either a new endpoint or a unified
`claim-fee-share` that knows what to pay out. Lifting the existing
Claim-button UI into a "Referral Earnings" card in InviteSheet is trivial
once the BE side is decided.

---

## Open questions for the spec doc

(These are the answers I need before sequencing Phase 1+ definitively.)

1. Does the spec keep BETA + S1 as the two phases, or introduce more?
   Affects whether `KOLRewardsCard.tsx` should be revived (multi-phase) or
   deleted (single-phase).
2. Does "leaderboard" mean **points-ranked users**, **referrer-ranked users**,
   or both? Determines BE asks in Phase 3.
3. Is the referee-list a v1.0 requirement or v1.1? Determines whether
   Phase 2.10 ships first round.
4. Does v1.0 keep the KOL/copier 30/70 split language ("You earn 70% of trade
   points as a copier" — `CopyCongratsSheet:148-150`), or change the
   formula? If changed, the dead-code copy in `CopyCongratsSheet` needs an
   update at the same time it gets mounted.
5. Are the "FRIENDS GET" benefit numbers (`+15%`, `10`, `20%`) per phase or
   per region? Currently hard-coded in `InviteSheet.tsx:142-156`; if dynamic,
   they should move into `phaseConfig` or `ReferralInfo`.
