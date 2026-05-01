# SETTINGS_DISPLAY_BUG — `/api/settings/default` returning fallback values

**Filed:** 2026-05-01
**Reporter:** FE agent during Bug-1 triage
**Symptom:** Dashboard COPYING section shows `Size $200 / Lev 5x / TP 100% / SL 10%` for MomentumKevin, when the user's actual default `copy_settings` row has `leverage=10, sl_value=50`.
**Severity:** P1 — incorrect numbers shown to user, but no incorrect orders are placed (engine reads from DB directly, not from this endpoint).

## Diagnosis (this is a BE bug, not FE)

### FE render path is clean

`src/app/dashboard/page.tsx:262-277` (TraderRow):

```tsx
const sizeDisplay = fmtSetting(defaultSettings?.tradeSize, defaultSettings?.tradeSizeType, "—");
const levDisplay  = defaultSettings?.leverage ? `${defaultSettings.leverage}x` : "—";
const tpDisplay   = defaultSettings?.tp ? fmtSetting(defaultSettings.tp.value, defaultSettings.tp.type, "—") : "—";
const slDisplay   = defaultSettings?.sl ? fmtSetting(defaultSettings.sl.value, defaultSettings.sl.type, "—") : "—";
```

`defaultSettings` is set once at mount from `getDefaultSettings()` (line 174):

```tsx
if (defs.status === "fulfilled") setDefaultSettings(defs.value);
```

`getDefaultSettings()` (`src/service/index.ts:404-406`) is a pure axios passthrough to `GET /api/settings/default` — no transformation, no fallback. **There is no FE-side hardcoded `5` or `10`** anywhere in the render chain (`grep -rn "leverage.*5\b\|sl.*10\b"` over `src/app/dashboard/` and `src/service/` returned zero hits in the rendering path).

### Smoking gun: displayed numbers === BE fallback constants

`backend/api/settings.py:79-87`:

```python
_DEFAULT_RESPONSE = CopySettingsResponse(
    tradeSizeType="PCT",
    tradeSize=10.0,
    leverage=5.0,                                  # ← matches the "Lev 5x" displayed
    leverageType="cross",
    tp=TPOrSL(type="PCT", value=15.0),
    sl=TPOrSL(type="PCT", value=10.0),             # ← matches the "SL 10%" displayed
    orderType="market",
)
```

Note `tradeSize=200`/`tp_value=100` happen to match the user's real settings, masking the bug for those two fields. Only `leverage` and `sl_value` differ from the user's row, exposing the issue.

The probability of FE silently coercing only those two fields to those two specific values is essentially zero. The BE response itself is wrong.

### Likely root cause (BE-side)

`backend/api/settings.py:92-120`:

```python
@router.get("/settings/default", response_model=CopySettingsResponse)
def get_default_settings(db, current_user):
    setting = (
        db.query(CopySetting)
        .filter(CopySetting.user_id == current_user.id, CopySetting.trader_id.is_(None))
        .first()
    )
    if not setting:
        # creates a new row with leverage=5.0, sl_value=10.0, etc.
        setting = CopySetting(user_id=current_user.id, trader_id=None)
        setting.leverage = 5.0
        setting.sl_value = 10.0
        ...
        db.add(setting); db.commit(); db.refresh(setting)
    return _setting_to_response(setting)
```

For MomentumKevin to be receiving the fallback row's values, **one of these must be true on prod**:

1. **Dual-account artifact.** The JWT resolves to a different `user_id` than the one whose `copy_settings` row has `leverage=10/sl_value=50`. The bug from the previous task (`merged-into-{...}` 96-byte sentinel + VARCHAR(42) truncation) means MomentumKevin may have multiple `users` rows; `current_user.id` here might be the orphan with auto-created fallback settings.
2. **Multiple `copy_settings` rows for the same `(user_id, NULL)` pair.** `.first()` is deterministic only with an `ORDER BY`; without one, Postgres can return either. If the auto-create path (line 105) ran for this user before they saved their real settings, both rows now coexist and the wrong one wins.
3. **Stale index / wrong DB.** Less likely but worth ruling out.

### Verification queries (to run on prod DB)

```sql
-- 1. how many users rows match this twitter handle? (>1 means dual-account artifact)
SELECT id, wallet_address, twitter_username, is_active, created_at
FROM users
WHERE twitter_username = 'MomentumKevin';

-- 2. how many default copy_settings rows exist per user_id?
SELECT user_id, count(*) AS n_rows,
       array_agg(leverage ORDER BY id) AS leverages,
       array_agg(sl_value ORDER BY id) AS sl_values
FROM copy_settings
WHERE trader_id IS NULL
  AND user_id IN (
    SELECT id FROM users WHERE twitter_username = 'MomentumKevin'
  )
GROUP BY user_id;

-- 3. which user_id is the JWT pointing at? Compare to (1):
--    decode the JWT.sub claim from the user's session and match against users.id
```

If query (1) returns >1 row → fix is the dual-account merge cleanup (separate ticket).
If query (2) returns `n_rows > 1` for the active user → BE needs a UNIQUE index + dedupe migration.

## Recommended BE fix

Two layers — both should land:

### a) Defensive: add UNIQUE index on `(user_id, trader_id)`

Schema currently allows multiple default-settings rows per user. Add a partial unique index:

```python
# alembic migration upgrade()
op.create_index(
    "uq_copy_settings_user_trader",
    "copy_settings",
    ["user_id", "trader_id"],
    unique=True,
    postgresql_nulls_not_distinct=True,  # treats NULL trader_id as a single bucket
)
# downgrade(): op.drop_index("uq_copy_settings_user_trader", table_name="copy_settings")
```

Before applying, dedupe existing rows:

```sql
DELETE FROM copy_settings a
USING copy_settings b
WHERE a.id < b.id
  AND a.user_id = b.user_id
  AND a.trader_id IS NOT DISTINCT FROM b.trader_id;
```

### b) `.first()` → `.order_by(CopySetting.updated_at.desc()).first()`

Until (a) is enforced, prefer the most recently updated row (which is the one the user actually saved):

```python
# backend/api/settings.py:98-102
setting = (
    db.query(CopySetting)
    .filter(CopySetting.user_id == current_user.id, CopySetting.trader_id.is_(None))
    .order_by(CopySetting.updated_at.desc().nulls_last())
    .first()
)
```

(Same change in `update_default_settings` at line 130-134, `get_trader_settings` at line 156-160, `update_trader_settings` similarly.)

### c) Out of scope but worth noting

The dashboard's TraderRow currently uses **only** `defaultSettings` for every follow card — it never calls `getTraderSettings(handle)` to fetch per-trader overrides. For MomentumKevin (no overrides), this happens to coincide with "effective settings", so the symptom in this bug is purely the BE issue above. But if any user *does* set per-trader overrides, the dashboard will silently ignore them. Separate FE ticket; not fixing here per the Step-0-outcome-B instructions.

## Where the BE fix needs to land

- **File:** `backend/api/settings.py`
- **Lines:** 98-102 (and 130-134, 156-160, plus the symmetric `update_trader_settings` block) — add `.order_by(...).first()`.
- **Migration:** new alembic file adding `unique=True` partial index on `(user_id, trader_id)`, with a dedupe SQL prelude.

## FE follow-up (after BE deploys)

Nothing required — `getDefaultSettings()` and the render path are correct. Once BE returns the user's actual row, the chips will display the right numbers automatically. If/when the per-trader-override FE ticket is taken up, that's a separate component-level change.
