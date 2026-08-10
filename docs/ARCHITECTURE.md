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
  Market data / news / macro
  providers (mock today,
  replaceable adapters)
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

## The adapter pattern (market data, news, macro)

Every external data source is accessed through an interface, never
directly:

```
src/lib/market-data/
  types.ts                 MarketDataProvider interface
  providers/
    mock-provider.ts       MockMarketDataProvider (sample global tickers)
    index.ts                getMarketDataProvider() factory, reads MARKET_DATA_PROVIDER
```

`src/lib/news/` and `src/lib/macro/` follow the identical shape
(`NewsProvider` / `MacroProvider`). Pages and API routes only ever import
`getMarketDataProvider()` etc. — never `MockMarketDataProvider` directly.

**To add a real provider later** (e.g. Finnhub, Twelve Data, Polygon.io for
market data; FRED/World Bank for macro): implement the interface in a new
file under `providers/`, register it in that folder's `index.ts`, and set
the corresponding env var (`MARKET_DATA_PROVIDER=finnhub`, etc.). Nothing
else in the app changes — pages, API routes, and components depend on the
interface, not the implementation.

Today only the `mock` provider exists for each, so the app runs with zero
API keys and zero cost. The mock data is clearly labeled as such in the UI
("Mock data mode").

## Portfolio storage

`src/lib/portfolio/` follows the same interface pattern
(`PortfolioRepository`), but the concrete implementation is
`MockPortfolioRepository` — an in-memory store, reset on server restart, not
a real database. It's a placeholder for a future Postgres-backed
implementation (see "Not yet built" below); the interface is already
correct so swapping the implementation won't touch calling code.

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

## What's implemented vs. stubbed

| Feature | Status |
|---|---|
| Global market quotes, search, historical prices | Mock provider, adapter-ready for a real one |
| Company financials (income statement, balance sheet, cash flow) | Mock provider |
| Charts | Basic dependency-free SVG line chart (`components/charts/line-chart.tsx`) |
| DCF calculator | **Fully implemented** — simple single-stage model, real computation in Python |
| Monte Carlo valuation | **Stub only.** `POST /api/v1/valuation/monte-carlo` validates its request schema and returns `501 Not Implemented`. The plan (see docstring in `app/routers/valuation.py`) is to resample `revenue_growth_rate` and `discount_rate` from normal distributions per iteration, rerun `calculate_dcf`, and return the resulting distribution. |
| Scenario analysis | **Stub only.** Same pattern — `POST /api/v1/valuation/scenarios` returns `501`. |
| Portfolio tracking | Mock in-memory repository, UI wired up, no persistence |
| News | Mock provider, 4 sample articles |
| Macro indicators | Mock provider, sample US/EU/Japan/China indicators |
| Auth | Clerk, conditional on env vars (see above) |
| Database | **Not wired up.** No Postgres, no ORM yet — the `PortfolioRepository` interface exists so this is a swap-in, not a rewrite |

## Deliberate simplifications (foundation phase)

- The DCF model is single-stage (constant growth/margin across the
  projection window, no working-capital or capex line items). It's a
  reasonable first cut, clearly documented as such in
  `apps/quant-api/app/services/dcf.py`, not meant to be investment-grade.
- The price chart is hand-rolled SVG, not an interactive charting library.
  Fine for a static 90-day line; swap for TradingView Lightweight Charts (or
  similar) when interactivity (zoom, crosshair, multiple series) is needed.
- Portfolio totals don't currency-convert — a USD + EUR portfolio sums raw
  numbers today. Needs an FX rate source before that's meaningful.

## Suggested next steps

1. Wire a real market-data provider (Finnhub free tier is a reasonable
   starting point) behind the existing adapter.
2. Add a Postgres-backed `PortfolioRepository` implementation (e.g. via
   Prisma) once you're ready to persist real user data.
3. Implement Monte Carlo simulation in `apps/quant-api` — the request/response
   schemas and endpoint already exist, only the simulation body is missing.
4. Same for scenario analysis.
5. Swap the SVG chart for an interactive charting library once real
   historical data is flowing.
