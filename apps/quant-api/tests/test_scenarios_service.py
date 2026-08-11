from app.schemas import DCFInput, ScenarioInput, ScenarioOverride
from app.services.scenarios import run_scenarios


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


def test_run_scenarios_computes_base_case_and_each_scenario():
    result = run_scenarios(
        ScenarioInput(
            symbol="TEST",
            base_case=make_base_case(),
            scenarios=[
                ScenarioOverride(name="Bull", overrides={"revenueGrowthRate": 0.2}),
                ScenarioOverride(name="Bear", overrides={"revenueGrowthRate": 0.0}),
            ],
        )
    )
    assert result.base_case.fair_value_per_share > 0
    assert len(result.scenarios) == 2
    assert result.scenarios[0].result is not None
    assert result.scenarios[0].error is None


def test_run_scenarios_higher_growth_overrides_increase_fair_value():
    result = run_scenarios(
        ScenarioInput(
            symbol="TEST",
            base_case=make_base_case(),
            scenarios=[
                ScenarioOverride(name="Bull", overrides={"revenueGrowthRate": 0.3}),
                ScenarioOverride(name="Bear", overrides={"revenueGrowthRate": 0.0}),
            ],
        )
    )
    bull, bear = result.scenarios
    assert bull.result.fair_value_per_share > bear.result.fair_value_per_share


def test_run_scenarios_invalid_override_reports_error_not_exception():
    result = run_scenarios(
        ScenarioInput(
            symbol="TEST",
            base_case=make_base_case(),
            scenarios=[
                ScenarioOverride(
                    name="Broken",
                    overrides={"discountRate": 0.01, "terminalGrowthRate": 0.05},
                ),
            ],
        )
    )
    assert result.scenarios[0].result is None
    assert result.scenarios[0].error is not None


def test_run_scenarios_empty_overrides_matches_base_case():
    result = run_scenarios(
        ScenarioInput(
            symbol="TEST",
            base_case=make_base_case(),
            scenarios=[ScenarioOverride(name="Same as base", overrides={})],
        )
    )
    assert result.scenarios[0].result.fair_value_per_share == result.base_case.fair_value_per_share
