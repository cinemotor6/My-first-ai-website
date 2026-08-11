# Global Finance App

A global financial dashboard: market data, company financials, charts,
valuation tools (DCF, Monte Carlo, scenario analysis), portfolio tracking,
news, and macroeconomic indicators.

Every feature above is functional end-to-end — no paid APIs, no signups,
no exposed API keys, ever. Market data, financials, news, FX rates, and
macro indicators try **live, free, keyless sources first** (Yahoo Finance,
Frankfurter/ECB, World Bank) and automatically fall back to realistic mock
data if a live call fails for any reason (network down, rate limited,
offline). Every data source sits behind a swappable adapter interface —
see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Portfolio holdings and
watchlist symbols can be added and removed through the UI, **persisted to
a local SQLite file** (via Node's built-in `node:sqlite` — no external
database service, no ORM, no signup). DCF, Monte Carlo, and scenario analysis all run real
calculations in the Python quant service; the DCF model itself is
intentionally a simple single-stage model, not investment-grade.

## Quick start

See **[docs/RUNNING.md](docs/RUNNING.md)** for full setup instructions.

```bash
# 1. Install JS dependencies (root workspace)
npm install

# 2. Set up the Python quant service
cd apps/quant-api
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000 &

# 3. Run the web app (new terminal)
cd apps/web
cp .env.example .env.local
npm run dev
```

Then open http://localhost:3000. No API keys or signups are required —
market data, financials, news, and FX rates load live where possible and
fall back to sample data automatically otherwise.

## Structure

```
apps/
  web/          Next.js (TypeScript) — dashboard UI, API routes, auth
  quant-api/    Python (FastAPI) — valuation engine (DCF, Monte Carlo, scenarios)
packages/
  shared-types/ TypeScript types shared by apps/web and mirrored in quant-api's schemas
docs/
  ARCHITECTURE.md   How the pieces fit together, and what's mock vs. real
  RUNNING.md        Full setup and environment variable reference
```

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — system design, data flow, what's implemented vs. mock/simplified
- [docs/RUNNING.md](docs/RUNNING.md) — running locally, environment variables, tests
