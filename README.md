# Global Finance App

A global financial dashboard: market data, company financials, charts,
valuation tools (DCF, Monte Carlo, scenario analysis), portfolio tracking,
news, and macroeconomic indicators.

Every feature above is functional end-to-end on mock/sample data — no
paid APIs or signups required. Market data, news, macro indicators, and
FX rates are served by pluggable mock adapters (swap in a real provider by
implementing one interface, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)).
Portfolio holdings can be added and removed through the UI, backed by an
in-memory store (not persisted across restarts — a real database is the
next step, not yet wired up). DCF, Monte Carlo, and scenario analysis all
run real calculations in the Python quant service; the DCF model itself is
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

Then open http://localhost:3000. No API keys or signups are required — the
app runs entirely on mock/sample data out of the box.

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
