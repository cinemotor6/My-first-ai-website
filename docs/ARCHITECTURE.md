# Architecture

## Overview

Two services, kept deliberately separate:

```
┌─────────────────────────┐        ┌──────────────────────────┐
│   apps/web (Next.js)     │        │  apps/quant-api (FastAPI) │
│                          │  HTTP  │                            │
│  Dashboard UI            │───────▶│  DCF / Monte Carlo /       │
│  API routes (validation, │        │  Scenario analysis         │
│  auth, proxying)         │        │  (pure number-crunching)   │
└──────────┬───────────────┘        └────────────────────────────┘
           │
           ▼
  Market data / news / FX / macro
  providers: live (Yahoo Finance /
  Frankfurter / World Bank, all
  keyless) with automatic mock
  fallback. Portfolio and watchlist
  data persist to a local SQLite
  file.
```

**Why two services?** The UI and the request/response plumbing (auth,
validation, routing) belong in Next.js. The valuation math (DCF, and later
Monte Carlo simulation, scenario analysis) is numerical work that's more
natural, more testable, and easier to extend in Python with its
scientific-computing ecosystem (numpy/pandas/scipy come later without
touching the web app). Next.js never computes a valuation itself — it
validates input and forwards to the quant service.

## Data flow: the DCF calculator, end to end

This is the one fully-wired example; every other feature follows the same
shape.

1. `apps/web/src/app/(dashboard)/valuation/dcf/dcf-form.tsx` (client component)
   collects inputs and `POST`s them to `/api/valuation/dcf`.
2. `apps/web/src/app/api/valuation/dcf/route.ts` (Next.js Route Handler)
   validates the payload with a Zod schema (`lib/valuation/schemas.ts`),
   then forwards it to `QUANT_API_URL/api/v1/valuation/dcf`.
3. `apps/quant-api/app/routers/valuation.py` receives it, Pydantic validates
   again server-side (independent of the Zod check — never trust a single
   layer), and calls `apps/quant-api/app/services/dcf.py::calculate_dcf`,
   a pure function with no I/O.
4. The result flows back through the same path to the UI.

Errors are handled at each hop: Zod/Pydantic reject invalid input (422),
the Next.js route returns a clear error if the quant service is unreachable
(502) instead of a generic crash, and the UI surfaces the message instead of
hanging.

## The adapter pattern (market data, news, macro, FX)

Every external data source is accessed through an interface, never
directly:

```
src/lib/market-data/
  types.ts                 MarketDataProvider interface
  providers/
    mock-provider.ts       MockMarketDataProvider (sample global tickers + indices)
    yahoo/                 YahooFinanceMarketDataProvider (live, keyless)
    fallback-provider.ts   FallbackMarketDataProvider — tries live, falls back to mock
    index.ts                getMarketDataProvider() factory, reads MARKET_DATA_PROVIDER
```

`src/lib/news/`, `src/lib/fx/`, and `src/lib/macro/` all follow the
identical shape (`NewsProvider` / `FxRateProvider` / `MacroProvider`, each
with a live provider + a `FallbackXProvider` wrapper). Pages and API
routes only ever import `getMarketDataProvider()` etc. — never a concrete
provider class directly.

### Live data, no API key: Yahoo Finance, Frankfurter, World Bank

- **Market data & news** (`lib/market-data/providers/yahoo/`,
  `lib/news/providers/yahoo-provider.ts`): Yahoo Finance's public
  `query1/query2.finance.yahoo.com` chart/quoteSummary/search endpoints —
  the same undocumented, keyless API the `yfinance` Python library scrapes.
  No signup, no key, no cost. It's also unofficial: Yahoo can change the
  response shape or start rate-limiting without notice, which is exactly
  why it's never called directly (see fallback section below).
- **FX rates** (`lib/fx/providers/frankfurter/`): [Frankfurter](https://frankfurter.dev),
  a free, keyless, open-source API backed by European Central Bank
  reference rates.
- **Macro indicators** (`lib/macro/providers/worldbank/`): the
  [World Bank's public API](https://api.worldbank.org), free and keyless.
  Scoped to GDP growth and CPI inflation for US/Euro area/Japan/China —
  the indicators actually available on this source without a key. Data is
  **annual with a reporting lag** (typically 1-2 years behind "today"),
  unlike the mock provider's illustrative current-month figures — that's
  an inherent property of this free source, not a bug. A single region can
  partially fail (e.g. GDP succeeds, CPI doesn't) without losing the
  region entirely — `WorldBankMacroProvider.getIndicators()` uses
  `Promise.allSettled` internally and returns whatever succeeded, only
  deferring to the mock fallback if *everything* failed.

Response parsing for all three is factored into pure functions
(`yahoo/parse.ts`, `frankfurter/parse.ts`, `worldbank/parse.ts`) unit-tested
against fixture JSON matching each API's real shape (`npm run test` in
`apps/web`) — the network call itself isn't mocked, the *parsing/mapping
logic* is what's tested, independent of network access.

### The fallback layer

`FallbackMarketDataProvider`, `FallbackNewsProvider`, `FallbackFxRateProvider`,
and `FallbackMacroProvider` each wrap a primary (live) and a fallback (mock)
provider behind the shared `withFallback()` helper
(`lib/provider-fallback.ts`): try the primary, and on *any* failure —
network error, timeout, non-2xx response, unexpected payload shape, rate
limit — log a warning and transparently return the fallback's result
instead. This is per-method, not all-or-nothing: `getQuote` can succeed
live while `searchSymbols` falls back, independently, on the same request.
This is the default (`MARKET_DATA_PROVIDER=live`, etc.) — the app always
tries for real data first and only shows sample data when it genuinely
can't reach the live source, with no visible error to the user either way.

**To add another real provider**: implement the interface in a new file
under `providers/`, register it in that folder's `index.ts`, and set the
corresponding env var. Nothing else in the app changes — pages, API
routes, and components depend on the interface, not the implementation.

### In-memory caching for market data

`CachedMarketDataProvider` (`lib/market-data/providers/cached-provider.ts`)
is another decorator in the same chain, wrapping the live Yahoo provider
with a short-lived, per-process, in-memory cache keyed by method +
arguments. It exists because several pages can request the *same* symbol
within the *same* few seconds — a watchlist symbol shows up on both
Overview and Markets, and a stock detail page re-renders on client
navigation — and without a cache, each of those is an independent live
request against Yahoo Finance's free, unofficial, keyless API, needlessly
increasing rate-limit risk for no benefit (the data hasn't meaningfully
changed in that window anyway).

- TTLs are per-method, not uniform: quotes (15s) and search results (30s)
  are short-lived since they're time-sensitive; historical bars (5min),
  company profiles (15min), and financial statements (60min) are cached
  longer because that data barely changes within a session.
- Only successful results are cached. A failure is never stored, so the
  wrapped provider is retried on every subsequent call until it succeeds —
  and `FallbackMarketDataProvider`, which wraps the cache (not the other
  way around), still sees a fresh failure on every call to react to, so a
  live outage still falls back to mock immediately rather than being
  masked by a stale cache entry.
- It's part of both the `live` and `yahoo` provider modes in
  `providers/index.ts` — `mock` mode has no cache, since generating mock
  data is already cheap and deterministic per day.
- This is a plain in-memory `Map`, not a distributed cache — fine for this
  app's single-process deployment target (see "Portfolio storage" below
  for the same caveat applied to persistence); a multi-instance deployment
  would want a shared cache (Redis, etc.) instead, but that's out of scope
  while everything else in the app is intentionally zero-external-services.

## Portfolio storage

`src/lib/portfolio/` follows the same interface pattern
(`PortfolioRepository`). The default implementation,
`SqlitePortfolioRepository` (`lib/portfolio/providers/sqlite-repository.ts`),
persists holdings to a local SQLite file via Node's **built-in**
`node:sqlite` module — no external database service, no ORM, no signup, no
paid tier, and critically no npm package or native-binary download either
(unlike better-sqlite3 or Prisma's query-engine binaries), which matters
in network-restricted environments. It's marked experimental by Node
(stable-ish since Node 22.5, unflagged) and requires **Node 22+** — see
`lib/db/sqlite.ts`.

- **Where the file lives**: `DATABASE_PATH`, default `./.data/app.db`
  (created automatically). `:memory:` is valid too (used by every unit
  test — see `vitest.config.mts`'s `test.env`).
- **Fallback behavior differs from the market-data providers on purpose.**
  Market data is read-only display data, so falling back *per call* is
  safe — a stale/mock quote next to a live one is harmless. Portfolio data
  is mutable and user-owned: a write landing in SQLite while a later read
  silently falls back to the (empty) in-memory store would look exactly
  like data loss. So instead of a per-call `FallbackPortfolioRepository`,
  the fallback happens **once, at construction time**
  (`providers/index.ts::createRepository()`): if `SqlitePortfolioRepository`
  can't even initialize (no write access to `DATABASE_PATH`, disk full),
  the *whole process* uses `MockPortfolioRepository` instead, consistently,
  for its entire lifetime — never a mix of the two.
- **Deployment caveat**: SQLite-on-local-disk works great for local dev, a
  VPS, or any single-process deployment with persistent disk. It does
  **not** work as real persistence on serverless platforms with ephemeral
  or read-only filesystems (e.g. Vercel's default deployment) — each
  invocation could get a fresh, empty file. For that target, swap
  `SqlitePortfolioRepository` for a hosted Postgres implementation behind
  the same `PortfolioRepository` interface; nothing else changes.
- Set `PORTFOLIO_STORAGE=mock` to force the old in-memory-only behavior
  explicitly (e.g. for a demo where persistence isn't wanted).

## Watchlist storage

`src/lib/watchlist/` is the same interface pattern applied to a second,
independent kind of user data: symbols someone wants to track on the
Markets and Overview pages, as distinct from portfolio holdings (no
quantity/cost basis, just a symbol). It's a deliberate copy of the
`PortfolioRepository` design, not a variant of it — same `WatchlistRepository`
interface (`listItems`/`addItem`/`removeItem`), same `SqliteWatchlistRepository`
default backed by the **same** SQLite file and connection as portfolio data
(a second table, `watchlist_items`, added to the schema in
`lib/db/sqlite.ts`), same `MockWatchlistRepository` in-memory fallback, same
`globalThis`-cached singleton in `lib/watchlist/providers/index.ts`, and the
same construction-time (not per-call) fallback reasoning: a watchlist add/remove
is a write, so a silent per-call fallback to an empty in-memory store would
look like data loss.

- **Env var**: `WATCHLIST_STORAGE`, default `sqlite`; set to `mock` for the
  old in-memory-only behavior. Independent of `PORTFOLIO_STORAGE` — you can
  mix, though there's no real reason to.
- **Duplicate symbols**: `addItem` is idempotent per user — adding a symbol
  already on the list returns the existing item instead of creating a
  second row (enforced with a `UNIQUE(user_id, symbol)` constraint at the
  SQLite layer, and checked explicitly first so the behavior is identical
  under `MockWatchlistRepository`).
- **No seed data for the SQLite path**, matching the portfolio repository's
  behavior: a fresh database starts with an empty watchlist per user, and
  the UI (Markets page) shows "No symbols yet. Add one above." until
  someone adds their first symbol. Only `MockWatchlistRepository` seeds
  sample symbols, for demoing the UI without a database.
- Wired into two pages: `markets/page.tsx` renders the watchlist with
  add/remove controls (`add-symbol-form.tsx`, `remove-symbol-button.tsx`)
  alongside the (untouched, always-on, non-editable) Indices section; the
  Overview page's ticker cards read from the same repository so both pages
  show one consistent, persisted list.
- Same deployment caveat as portfolio storage applies (see above):
  SQLite-on-local-disk doesn't persist on serverless/ephemeral-filesystem
  deployments — swap in a Postgres-backed implementation there.

## Authentication

Auth uses [Clerk](https://clerk.com), but is **conditional on environment
variables**: `authEnabled` in `src/lib/auth.ts` checks
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`. If it's unset:

- `apps/web/src/proxy.ts` (Next.js 16 renamed "Middleware" to "Proxy") skips
  auth entirely and lets every request through.
- `getCurrentUserId()` (`src/lib/auth-server.ts`) returns a fixed
  `"demo-user"` id, so portfolio data still has an owner to scope by.
- The root layout doesn't mount `<ClerkProvider>`.

This means the app is fully usable immediately after `npm install` — no
Clerk account required — while the auth *architecture* (protected routes,
per-user data scoping, sign-in/sign-up pages) is already in place. Set both
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in `.env.local`
to turn on real sign-in.

Note: `lib/auth.ts` (the `authEnabled` flag, safe to import from client
components) and `lib/auth-server.ts` (`getCurrentUserId`, imports Clerk's
server SDK) are deliberately separate files. Next.js's client/server
bundling boundary would otherwise pull server-only Clerk code into the
browser bundle if they were combined.

## Monte Carlo & scenario analysis

Both are fully implemented, not stubs:

- **Monte Carlo** (`apps/quant-api/app/services/monte_carlo.py`): resamples
  `revenue_growth_rate` and `discount_rate` from normal distributions
  centered on the base case, for as many iterations as requested (up to
  100k), and reruns the DCF formula for every draw — vectorized with numpy
  rather than looping (constructing/validating 100k Pydantic models would
  dominate the runtime, so this reimplements the same formula from
  `services/dcf.py` directly on arrays; keep the two in sync if the DCF
  formula changes). `discount_rate` draws are clamped above
  `terminal_growth_rate` so an unlucky sample can't blow up the terminal
  value formula. Returns mean/median/std dev, percentiles, and a 20-bucket
  histogram. UI: `valuation/monte-carlo/monte-carlo-form.tsx`, rendered with
  a dependency-free bar-chart histogram (`components/charts/histogram.tsx`).
- **Scenario analysis** (`apps/quant-api/app/services/scenarios.py`):
  applies named overrides on top of the base case and reruns the DCF model
  for each. A scenario with invalid overrides (e.g. a discount rate at or
  below the terminal growth rate) reports an `error` field instead of
  failing the whole request — one bad scenario doesn't hide the others. UI:
  `valuation/scenarios/scenario-form.tsx`, with an editable base case and a
  dynamic list of scenario rows.

## Symbol search

`components/layout/symbol-search.tsx` debounces input (200ms) and calls
`GET /api/market/search?q=`, which goes through `MarketDataProvider.searchSymbols()`
— the same adapter used everywhere else, so a real provider gets search for
free. Results render as a keyboard-navigable dropdown (arrow keys, Enter,
Escape); Enter with nothing selected falls back to navigating straight to
the typed symbol.

## Portfolio mutations

`portfolio/add-holding-form.tsx` and `remove-holding-button.tsx` call
`POST /api/portfolio` and `DELETE /api/portfolio/[id]`, then
`router.refresh()` to re-fetch the Server Component. Two things had to be
true for this to actually work — both were real bugs caught during
end-to-end browser testing, not just theoretical:

1. **The portfolio page must be dynamically rendered.** Next.js will
   statically prerender a page at build time if nothing in it uses a
   dynamic API — which was happening here, freezing the page to whatever
   the mock data looked like at build time. `export const dynamic =
   "force-dynamic"` on `portfolio/page.tsx` (and on every other page that
   reads from a provider: overview, markets, news, macro) fixes this.
2. **The repository singleton must live on `globalThis`, not a
   module-level variable.** Next.js dev server (Fast Refresh / Turbopack)
   can re-evaluate a module, and Route Handlers vs. Server Components can
   even sit in separate module graphs — either would silently fork a
   module-level `let cached = ...` into multiple independent in-memory
   stores, so a POST via the Route Handler would land in a different
   instance than the one the page reads from. See
   `lib/portfolio/providers/index.ts` — same pattern the Prisma docs
   recommend for Next.js client singletons, for the same reason.

## Currency conversion

Portfolio holdings can be in different currencies (the seed data mixes USD
and EUR). Summing raw numbers across currencies would be meaningless, so
`lib/fx/` follows the same adapter pattern as the other data sources and
the portfolio page converts every holding to USD before totaling (live
rate via Frankfurter, falling back to static illustrative cross-rates in
`MockFxRateProvider` if unreachable). Per-row values still show in their
native currency.

## Mobile navigation

The sidebar is `hidden md:flex` — below the `md` breakpoint there's no
sidebar at all, so `components/layout/mobile-nav.tsx` provides a hamburger
button + slide-over drawer using the same nav list
(`components/layout/nav-links.tsx`, shared between both so they can't drift
apart). The drawer closes via `onClick` on each `Link` — not via a
`useEffect` watching `pathname` — because closing state from an effect in
response to a route change is exactly the kind of synchronous
effect-driven `setState` React's newer lint rules (and the render-time
alternative using a ref) both flag; tying the close to the actual user
action (clicking a link) sidesteps the problem entirely and is arguably more
correct anyway.

## What's implemented vs. mock/simplified

| Feature | Status |
|---|---|
| Global market quotes, historical prices, symbol search | **Live** via Yahoo Finance, falls back to mock automatically, short-lived in-memory cache reduces redundant calls |
| Market indices (S&P 500, Dow, Nasdaq, FTSE 100, Nikkei 225, DAX) | **Live**, same path as above — see Markets page |
| Company profile & financial statements | **Live** via Yahoo Finance quoteSummary, falls back to mock |
| News (general + per-symbol) | **Live** via Yahoo Finance search endpoint, falls back to mock |
| FX rates (portfolio currency conversion) | **Live** via Frankfurter/ECB, falls back to static mock rates |
| Charts | Dependency-free SVG line chart + histogram (`components/charts/`) |
| DCF calculator | **Fully implemented** — simple single-stage model, real computation in Python |
| Monte Carlo valuation | **Fully implemented** — see above |
| Scenario analysis | **Fully implemented** — see above |
| Portfolio tracking | **Fully implemented** — add/remove holdings, USD-converted total, **persisted to a local SQLite file** across restarts |
| Watchlist | **Fully implemented** — add/remove tracked symbols on the Markets page, **persisted to the same local SQLite file**, shared with the Overview page |
| Mobile navigation | **Fully implemented** — drawer + hamburger below `md` |
| Macro indicators (GDP growth, CPI inflation) | **Live** via World Bank, falls back to mock automatically. Annual data with a reporting lag — see above |
| Auth | Clerk, conditional on env vars (see above) |
| Database | **Wired up** — SQLite via `node:sqlite`, zero external dependencies, two tables (`holdings`, `watchlist_items`). Not a fit for serverless/ephemeral-filesystem deployments (see above); swap for Postgres there |

## Deliberate simplifications

- The DCF model (and the Monte Carlo/scenario models built on it) is
  single-stage — constant growth/margin across the projection window, no
  working-capital or capex line items. A reasonable first cut, documented
  as such in `apps/quant-api/app/services/dcf.py`, not investment-grade.
- The charts are hand-rolled SVG, not an interactive charting library.
  Fine for a static line/histogram; swap for TradingView Lightweight Charts
  (or similar) when interactivity (zoom, crosshair, multiple series) is
  needed.
- The Yahoo Finance, Frankfurter, and World Bank integrations are
  unofficial/free-tier data sources meant for a demo/personal-project
  scale — not a substitute for a licensed real-time data vendor if you're
  building something that needs guaranteed uptime, SLAs, or redistribution
  rights.
- Yahoo Finance's `marketCap` field isn't fetched in `getQuote` (it lives
  in a separate quoteSummary module, and skipping it keeps quotes to one
  request) — the field is optional on `Quote` for exactly this reason.
- SQLite-via-`node:sqlite` is a single-file, single-process store. Fine
  for this app's scale and for local/VPS deployment; not a fit for
  multi-instance horizontal scaling or serverless — see "Portfolio
  storage" above.

## What can't be live-verified in a network-restricted environment

If you're reading this from a sandboxed/offline dev environment (no
outbound access to `query1/query2.finance.yahoo.com`, `api.frankfurter.dev`,
or `api.worldbank.org`): every live provider will fail its network call and
fall back to mock data on every request. That's the fallback working
exactly as designed, not a bug — but it does mean the **live-success path**
for these three integrations can only be verified by response-parsing unit
tests against fixture JSON (`npm run test`), not by an actual end-to-end
request against the real API from inside that environment. If you can run
this somewhere with normal internet access, `MARKET_DATA_PROVIDER=yahoo`
(or `=frankfurter`, `=worldbank`) forces the live-only path with no
fallback, so a failure is loud instead of silently masked — useful for
confirming the real APIs still respond the way the parsers expect.

## Suggested next steps

1. Add Postgres-backed `PortfolioRepository` and `WatchlistRepository`
   implementations once you're ready to deploy somewhere with an
   ephemeral/read-only filesystem (serverless) or need multi-instance
   scaling — both interfaces are already correct, so this is a swap-in,
   not a rewrite.
2. Swap the SVG charts for an interactive charting library once you want
   zoom/crosshair/multi-series on real historical data.
3. If you outgrow Yahoo Finance's unofficial API (rate limits, reliability
   for production traffic), swap in a licensed provider (Finnhub, Twelve
   Data, Polygon.io, ...) behind the same `MarketDataProvider` interface —
   the fallback wrapper pattern still applies unchanged. Same idea for
   World Bank → FRED if you want higher-frequency macro data and are okay
   requiring an API key for that one source.
