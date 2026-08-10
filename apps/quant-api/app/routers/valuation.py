from fastapi import APIRouter, HTTPException

from app.schemas import DCFInput, DCFResult, MonteCarloInput, ScenarioInput
from app.services.dcf import calculate_dcf

router = APIRouter(prefix="/api/v1/valuation", tags=["valuation"])


@router.post("/dcf", response_model=DCFResult)
def run_dcf(payload: DCFInput) -> DCFResult:
    # discount_rate > terminal_growth_rate is already enforced by DCFInput's
    # validator, so the terminal value formula can't divide by zero here.
    return calculate_dcf(payload)


@router.post("/monte-carlo", status_code=501)
def run_monte_carlo(payload: MonteCarloInput) -> dict:
    """
    Contract-only stub: request validation works end-to-end, but the
    simulation itself is intentionally not implemented yet. This is the
    foundation phase — see docs/ARCHITECTURE.md for the planned approach
    (resample revenue_growth_rate and discount_rate from normal
    distributions per iteration, run calculate_dcf, collect the
    distribution of fair_value_per_share).
    """
    raise HTTPException(
        status_code=501,
        detail=f"Monte Carlo valuation for {payload.symbol} is not implemented yet.",
    )


@router.post("/scenarios", status_code=501)
def run_scenarios(payload: ScenarioInput) -> dict:
    """Contract-only stub. See run_monte_carlo docstring — same phase, same reasoning."""
    raise HTTPException(
        status_code=501,
        detail=f"Scenario analysis for {payload.symbol} is not implemented yet.",
    )
