# Global Finance App

A global financial dashboard: market data, company financials, charts,
valuation tools (DCF, Monte Carlo, scenario analysis), portfolio tracking,
news, and macroeconomic indicators.

This is the **foundation phase**: the architecture, folder structure, and
data flow are in place end-to-end, running on mock data and a basic
single-stage DCF model. Advanced valuation logic (Monte Carlo, scenario
analysis) is intentionally stubbed — see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

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
  ARCHITECTURE.md   How the pieces fit together, and what's stubbed vs. real
  RUNNING.md        Full setup and environment variable reference
```

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — system design, data flow, what's implemented vs. stubbed
- [docs/RUNNING.md](docs/RUNNING.md) — running locally, environment variables, tests
