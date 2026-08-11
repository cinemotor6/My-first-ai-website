import pytest

from app.schemas import DCFInput, MonteCarloInput
from app.services.monte_carlo import run_monte_carlo


def make_base_case(**overrides) -> DCFInput:
    defaults = dict(
        symbol="TEST",
        current_revenue=1000.0,
        revenue_growth_rate=0.10,
        ebit_margin=0.20,
        tax_rate=0.25,
        discount_rate=0.10,
        terminal_growth_rate=0.02,
        projection_years=5,
        shares_outstanding=100.0,
        net_debt=50.0,
    )
    defaults.update(overrides)
    return DCFInput(**defaults)


def test_run_monte_carlo_returns_requested_iteration_count():
    result = run_monte_carlo(
        MonteCarloInput(
            symbol="TEST",
            base_case=make_base_case(),
            iterations=500,
            revenue_growth_std_dev=0.03,
            discount_rate_std_dev=0.01,
        )
    )
    assert result.iterations == 500


def test_run_monte_carlo_percentiles_are_ordered():
    result = run_monte_carlo(
        MonteCarloInput(
            symbol="TEST",
            base_case=make_base_case(),
            iterations=5000,
            revenue_growth_std_dev=0.05,
            discount_rate_std_dev=0.02,
        )
    )
    assert result.min_value <= result.percentile_5
    assert result.percentile_5 <= result.percentile_25
    assert result.percentile_25 <= result.median_fair_value
    assert result.median_fair_value <= result.percentile_75
    assert result.percentile_75 <= result.percentile_95
    assert result.percentile_95 <= result.max_value


def test_run_monte_carlo_zero_std_dev_collapses_to_deterministic_dcf():
    from app.services.dcf import calculate_dcf

    base = make_base_case()
    deterministic = calculate_dcf(base)

    result = run_monte_carlo(
        MonteCarloInput(
            symbol="TEST",
            base_case=base,
            iterations=1000,
            revenue_growth_std_dev=0,
            discount_rate_std_dev=0,
        )
    )
    assert result.mean_fair_value == pytest.approx(deterministic.fair_value_per_share)
    assert result.std_dev == pytest.approx(0, abs=1e-6)


def test_run_monte_carlo_histogram_buckets_sum_to_iterations():
    result = run_monte_carlo(
        MonteCarloInput(
            symbol="TEST",
            base_case=make_base_case(),
            iterations=1234,
            revenue_growth_std_dev=0.05,
            discount_rate_std_dev=0.02,
        )
    )
    assert sum(bucket.count for bucket in result.histogram) == 1234


def test_run_monte_carlo_clamps_discount_rate_above_terminal_growth():
    # A large discount_rate_std_dev could otherwise sample a discount_rate
    # at or below terminal_growth_rate, blowing up the terminal value
    # formula (division by zero or negative denominator).
    result = run_monte_carlo(
        MonteCarloInput(
            symbol="TEST",
            base_case=make_base_case(discount_rate=0.03, terminal_growth_rate=0.02),
            iterations=5000,
            revenue_growth_std_dev=0.05,
            discount_rate_std_dev=0.5,
        )
    )
    assert all(v == v for v in [result.mean_fair_value, result.std_dev])  # no NaNs
    assert result.std_dev >= 0
