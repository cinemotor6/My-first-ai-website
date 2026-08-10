# Running the project

Two services run side by side: the Next.js web app (`apps/web`) and the
Python quant service (`apps/quant-api`). The web app calls the quant
service over HTTP for valuation calculations, so both need to be running
for the DCF calculator to work — everything else in the dashboard (market
data, financials, portfolio, news, macro) works with just the web app.

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

Open http://localhost:3000. The dashboard runs entirely on mock data by
default — no API keys, no signups needed.

### Environment variables (`apps/web/.env.local`)

| Variable | Default | Purpose |
|---|---|---|
| `MARKET_DATA_PROVIDER` | `mock` | Which market-data adapter to use. Only `mock` exists today. |
| `NEWS_PROVIDER` | `mock` | Same idea, for news. |
| `MACRO_PROVIDER` | `mock` | Same idea, for macro indicators. |
| `QUANT_API_URL` | `http://localhost:8000` | Where the Next.js API routes reach the Python service. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | unset | Optional. Set together with `CLERK_SECRET_KEY` to enable real sign-in via Clerk. Leave both unset to run unauthenticated with a fixed demo user. |
| `CLERK_SECRET_KEY` | unset | See above. Get both from https://dashboard.clerk.com. |

## Build & lint (web)

```bash
cd apps/web
npm run lint
npm run build
```

## Project layout

See [ARCHITECTURE.md](ARCHITECTURE.md) for how the pieces connect. Quick
map:

```
apps/web/src/
  app/(dashboard)/    Dashboard pages (markets, stocks/[symbol], valuation, portfolio, news, macro)
  app/(auth)/         Sign-in / sign-up (Clerk)
  app/api/            Route handlers (market quotes, portfolio, DCF proxy)
  components/ui/      Hand-built shadcn-style primitives (Button, Card, Table, ...)
  components/layout/  Sidebar, Topbar
  components/charts/  Dependency-free SVG line chart
  lib/market-data/    MarketDataProvider interface + mock adapter
  lib/news/           NewsProvider interface + mock adapter
  lib/macro/          MacroProvider interface + mock adapter
  lib/portfolio/      PortfolioRepository interface + in-memory mock repo
  lib/valuation/      Zod schemas shared by the DCF API route

apps/quant-api/app/
  main.py             FastAPI app, CORS, health check
  schemas.py           Pydantic models (DCFInput/Result, Monte Carlo, Scenario)
  services/dcf.py      Pure DCF calculation function
  routers/valuation.py DCF endpoint (working), Monte Carlo + Scenario endpoints (501 stubs)

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
