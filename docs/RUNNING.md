# Running the project

Two services run side by side: the Next.js web app (`apps/web`) and the
Python quant service (`apps/quant-api`). The web app calls the quant
service over HTTP for valuation calculations, so both need to be running
for the DCF calculator, Monte Carlo simulation, and scenario analysis to
work — everything else in the dashboard (market data, financials,
portfolio, search, news, macro) works with just the web app.

## Prerequisites

- Node.js 20+ and npm
- Python 3.11+

## 1. Install JavaScript dependencies

From the **repo root** (this is an npm workspace covering `apps/web` and
`packages/shared-types`):

```bash
npm install
```

## 2. Set up the quant service

```bash
cd apps/quant-api
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # defaults are fine for local dev
uvicorn app.main:app --reload --port 8000
```

Leave this running. Verify it's up: `curl http://localhost:8000/health`
should return `{"status":"ok",...}`.

### Run the quant service's tests

```bash
cd apps/quant-api
source .venv/bin/activate
pytest -v
```

## 3. Run the web app

In a new terminal, from the repo root:

```bash
cd apps/web
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. By default the app tries **live data first**
(Yahoo Finance for quotes/financials/news, Frankfurter for FX) and falls
back to mock/sample data automatically if a live call fails — no API keys
or signups needed either way. If your network blocks those domains (some
corporate networks, sandboxes, CI), the app still works correctly: every
page just renders on the mock fallback instead, transparently.

### Environment variables (`apps/web/.env.local`)

| Variable | Default | Purpose |
|---|---|---|
| `MARKET_DATA_PROVIDER` | `live` | `mock` (never touches network), `yahoo` (live only, no fallback), or `live` (live with mock fallback — default). |
| `NEWS_PROVIDER` | `live` | Same three options, for news. |
| `MACRO_PROVIDER` | `mock` | Only `mock` exists today — no free/keyless macro API is wired in yet. |
| `FX_RATE_PROVIDER` | `live` | `mock`, `frankfurter` (live only), or `live` (live with mock fallback — default). Used to total a multi-currency portfolio. |
| `QUANT_API_URL` | `http://localhost:8000` | Where the Next.js API routes reach the Python service. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | unset | Optional. Set together with `CLERK_SECRET_KEY` to enable real sign-in via Clerk. Leave both unset to run unauthenticated with a fixed demo user. |
| `CLERK_SECRET_KEY` | unset | See above. Get both from https://dashboard.clerk.com. |

## Build, lint & test (web)

```bash
cd apps/web
npm run lint
npm run test    # vitest — unit tests for provider parsing/fallback logic
npm run build
```

## Project layout

See [ARCHITECTURE.md](ARCHITECTURE.md) for how the pieces connect. Quick
map:

```
apps/web/src/
  app/(dashboard)/    Dashboard pages (markets, stocks/[symbol], valuation, portfolio, news, macro)
  app/(auth)/         Sign-in / sign-up (Clerk)
  app/api/            Route handlers (market quotes + search, portfolio CRUD, valuation proxies)
  components/ui/      Hand-built shadcn-style primitives (Button, Card, Table, ...)
  components/layout/  Sidebar, Topbar, mobile nav drawer, symbol search
  components/charts/  Dependency-free SVG line chart + histogram
  components/valuation/ Shared DCF input field grid (used by DCF/Monte Carlo/Scenario forms)
  lib/market-data/    MarketDataProvider interface; mock, Yahoo Finance (live), and fallback-wrapped adapters
  lib/news/           NewsProvider interface; mock, Yahoo Finance (live), and fallback-wrapped adapters
  lib/macro/          MacroProvider interface + mock adapter (no live source wired in yet)
  lib/fx/             FxRateProvider interface; mock, Frankfurter (live), and fallback-wrapped adapters
  lib/provider-fallback.ts  Shared "try live, log + fall back to mock" helper
  lib/portfolio/      PortfolioRepository interface + in-memory mock repo (globalThis-cached)
  lib/valuation/      Zod schemas + shared quant-API proxy helper

apps/quant-api/app/
  main.py             FastAPI app, CORS, health check
  schemas.py           Pydantic models (DCF, Monte Carlo, Scenario — all camelCase-aliased)
  services/dcf.py      Pure DCF calculation function
  services/monte_carlo.py  Vectorized (numpy) Monte Carlo simulation
  services/scenarios.py    Scenario comparison against the base case
  routers/valuation.py DCF, Monte Carlo, and Scenario endpoints — all fully implemented

apps/quant-api/tests/  pytest suite for the service layer and the HTTP API
```

## A note on the shadcn/ui components

`components/ui/*` were hand-written (Button, Card, Table, Badge, Input,
Label, Separator) rather than pulled from the shadcn CLI, because that CLI
fetches its registry from `ui.shadcn.com` over the network. If your
environment can reach that domain, you can use `npx shadcn@latest add
<component>` from here on to add more components in the same style — it
will detect the existing `components.json`-less setup and may ask you to
initialize; point it at `src/components/ui` and `src/lib/utils.ts` (already
present) when prompted.
