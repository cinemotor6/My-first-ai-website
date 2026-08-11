"""
Scenario analysis: apply named overrides on top of the base DCF case and
run the same single-stage DCF model for each. A scenario with invalid
overrides (e.g. discount_rate <= terminal_growth_rate) doesn't fail the
whole request — it comes back with an `error` instead, so one bad scenario
doesn't hide the results of the others.
"""

from pydantic import ValidationError

from app.schemas import DCFInput, ScenarioInput, ScenarioAnalysisResult, ScenarioResult
from app.services.dcf import calculate_dcf


def run_scenarios(data: ScenarioInput) -> ScenarioAnalysisResult:
    base_result = calculate_dcf(data.base_case)

    scenario_results: list[ScenarioResult] = []
    for scenario in data.scenarios:
        merged = data.base_case.model_dump(by_alias=True)
        merged.update(scenario.overrides)

        try:
            scenario_input = DCFInput(**merged)
            result = calculate_dcf(scenario_input)
            scenario_results.append(ScenarioResult(name=scenario.name, result=result))
        except ValidationError as exc:
            scenario_results.append(
                ScenarioResult(name=scenario.name, error=_summarize_validation_error(exc))
            )

    return ScenarioAnalysisResult(
        symbol=data.symbol, base_case=base_result, scenarios=scenario_results
    )


def _summarize_validation_error(exc: ValidationError) -> str:
    first = exc.errors()[0]
    field = ".".join(str(loc) for loc in first["loc"])
    return f"{field}: {first['msg']}"
