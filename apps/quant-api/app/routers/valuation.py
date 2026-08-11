from fastapi import APIRouter

from app.schemas import (
    DCFInput,
    DCFResult,
    MonteCarloInput,
    MonteCarloResult,
    ScenarioAnalysisResult,
    ScenarioInput,
)
from app.services.dcf import calculate_dcf
from app.services.monte_carlo import run_monte_carlo
from app.services.scenarios import run_scenarios

router = APIRouter(prefix="/api/v1/valuation", tags=["valuation"])


@router.post("/dcf", response_model=DCFResult)
def run_dcf(payload: DCFInput) -> DCFResult:
    # discount_rate > terminal_growth_rate is already enforced by DCFInput's
    # validator, so the terminal value formula can't divide by zero here.
    return calculate_dcf(payload)


@router.post("/monte-carlo", response_model=MonteCarloResult)
def monte_carlo(payload: MonteCarloInput) -> MonteCarloResult:
    return run_monte_carlo(payload)


@router.post("/scenarios", response_model=ScenarioAnalysisResult)
def scenarios(payload: ScenarioInput) -> ScenarioAnalysisResult:
    return run_scenarios(payload)
