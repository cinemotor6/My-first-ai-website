"""
Monte Carlo valuation: resample revenue_growth_rate and discount_rate from
normal distributions centered on the base case, rerun the single-stage DCF
formula for every draw, and summarize the resulting distribution of
fair_value_per_share.

Vectorized with numpy so even 100k iterations run in well under a second —
this intentionally bypasses per-iteration Pydantic validation (constructing
and validating 100k DCFInput objects would dominate the runtime) and
re-implements the same formula from services/dcf.py directly on arrays.
Keep the two in sync if the DCF formula changes.
"""

import numpy as np

from app.schemas import HistogramBucket, MonteCarloInput, MonteCarloResult

# Discount rate is clamped to stay comfortably above the terminal growth
# rate so the terminal value formula never divides by (near) zero for an
# unlucky sample.
_MIN_SPREAD_OVER_TERMINAL_GROWTH = 0.005


def run_monte_carlo(data: MonteCarloInput) -> MonteCarloResult:
    base = data.base_case
    rng = np.random.default_rng()

    revenue_growth = rng.normal(
        base.revenue_growth_rate, data.revenue_growth_std_dev, data.iterations
    )
    discount_rate = rng.normal(
        base.discount_rate, data.discount_rate_std_dev, data.iterations
    )
    discount_rate = np.clip(
        discount_rate,
        base.terminal_growth_rate + _MIN_SPREAD_OVER_TERMINAL_GROWTH,
        None,
    )

    years = np.arange(1, base.projection_years + 1)
    # revenue[i, t] = current_revenue * (1 + revenue_growth[i]) ** years[t]
    revenue = base.current_revenue * (1 + revenue_growth[:, None]) ** years[None, :]
    fcf = revenue * base.ebit_margin * (1 - base.tax_rate)

    discount_factors = (1 + discount_rate[:, None]) ** years[None, :]
    present_value_of_cash_flows = np.sum(fcf / discount_factors, axis=1)

    final_year_fcf = fcf[:, -1]
    terminal_value = (
        final_year_fcf * (1 + base.terminal_growth_rate) / (discount_rate - base.terminal_growth_rate)
    )
    present_value_of_terminal_value = terminal_value / (
        (1 + discount_rate) ** base.projection_years
    )

    enterprise_value = present_value_of_cash_flows + present_value_of_terminal_value
    equity_value = enterprise_value - base.net_debt
    fair_value_per_share = equity_value / base.shares_outstanding

    counts, edges = np.histogram(fair_value_per_share, bins=20)
    histogram = [
        HistogramBucket(range_start=float(edges[i]), range_end=float(edges[i + 1]), count=int(counts[i]))
        for i in range(len(counts))
    ]

    return MonteCarloResult(
        symbol=data.symbol,
        iterations=data.iterations,
        mean_fair_value=float(np.mean(fair_value_per_share)),
        median_fair_value=float(np.median(fair_value_per_share)),
        std_dev=float(np.std(fair_value_per_share)),
        percentile_5=float(np.percentile(fair_value_per_share, 5)),
        percentile_25=float(np.percentile(fair_value_per_share, 25)),
        percentile_75=float(np.percentile(fair_value_per_share, 75)),
        percentile_95=float(np.percentile(fair_value_per_share, 95)),
        min_value=float(np.min(fair_value_per_share)),
        max_value=float(np.max(fair_value_per_share)),
        histogram=histogram,
    )
