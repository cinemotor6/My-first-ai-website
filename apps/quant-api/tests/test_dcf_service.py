import pytest
from pydantic import ValidationError

from app.schemas import DCFInput
from app.services.dcf import calculate_dcf


def make_input(**overrides) -> DCFInput:
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


def test_calculate_dcf_produces_five_years_of_cash_flows():
    result = calculate_dcf(make_input())
    assert len(result.projected_free_cash_flows) == 5


def test_calculate_dcf_growing_revenue_grows_cash_flows():
    result = calculate_dcf(make_input())
    fcfs = result.projected_free_cash_flows
    assert all(fcfs[i] < fcfs[i + 1] for i in range(len(fcfs) - 1))


def test_calculate_dcf_matches_manual_first_year_fcf():
    result = calculate_dcf(make_input())
    # Year 1 revenue = 1000 * 1.10, FCF = revenue * margin * (1 - tax)
    expected_year1_fcf = 1000.0 * 1.10 * 0.20 * (1 - 0.25)
    assert result.projected_free_cash_flows[0] == pytest.approx(expected_year1_fcf)


def test_calculate_dcf_equity_value_subtracts_net_debt():
    result = calculate_dcf(make_input(net_debt=0))
    result_with_debt = calculate_dcf(make_input(net_debt=200))
    assert result_with_debt.equity_value == pytest.approx(result.equity_value - 200)


def test_calculate_dcf_fair_value_per_share_is_equity_over_shares():
    result = calculate_dcf(make_input())
    assert result.fair_value_per_share == pytest.approx(
        result.equity_value / 100.0
    )


def test_discount_rate_must_exceed_terminal_growth_rate():
    with pytest.raises(ValidationError):
        make_input(discount_rate=0.02, terminal_growth_rate=0.05)


def test_discount_rate_equal_to_terminal_growth_rate_is_rejected():
    with pytest.raises(ValidationError):
        make_input(discount_rate=0.03, terminal_growth_rate=0.03)


@pytest.mark.parametrize(
    "field,value",
    [
        ("current_revenue", -100),
        ("current_revenue", 0),
        ("shares_outstanding", 0),
        ("projection_years", 0),
        ("projection_years", 20),
        ("tax_rate", 0.9),
    ],
)
def test_out_of_range_inputs_are_rejected(field, value):
    with pytest.raises(ValidationError):
        make_input(**{field: value})
