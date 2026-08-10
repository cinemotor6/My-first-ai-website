"""
Single-stage DCF: a deliberately simple foundation, not a production model.

Free cash flow is approximated as NOPAT (revenue * EBIT margin * (1 - tax
rate)) with a constant growth rate and margin held flat across the
projection window — no working-capital or capex adjustments, no multi-stage
growth. That's a reasonable first cut for a beginner-facing tool and keeps
the formula easy to audit; refine it once the foundation is in place.
"""

from app.schemas import DCFInput, DCFResult


def calculate_dcf(data: DCFInput) -> DCFResult:
    projected_revenue = [
        data.current_revenue * (1 + data.revenue_growth_rate) ** year
        for year in range(1, data.projection_years + 1)
    ]
    projected_fcf = [
        revenue * data.ebit_margin * (1 - data.tax_rate) for revenue in projected_revenue
    ]

    present_value_of_cash_flows = sum(
        fcf / (1 + data.discount_rate) ** year
        for year, fcf in enumerate(projected_fcf, start=1)
    )

    final_year_fcf = projected_fcf[-1]
    terminal_value = (
        final_year_fcf
        * (1 + data.terminal_growth_rate)
        / (data.discount_rate - data.terminal_growth_rate)
    )
    present_value_of_terminal_value = terminal_value / (
        (1 + data.discount_rate) ** data.projection_years
    )

    enterprise_value = present_value_of_cash_flows + present_value_of_terminal_value
    equity_value = enterprise_value - data.net_debt
    fair_value_per_share = equity_value / data.shares_outstanding

    return DCFResult(
        symbol=data.symbol,
        enterprise_value=enterprise_value,
        equity_value=equity_value,
        fair_value_per_share=fair_value_per_share,
        projected_free_cash_flows=projected_fcf,
        terminal_value=terminal_value,
        present_value_of_cash_flows=present_value_of_cash_flows,
        present_value_of_terminal_value=present_value_of_terminal_value,
    )
