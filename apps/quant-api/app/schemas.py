"""
Request/response models for the valuation API.

Field names are declared in snake_case (idiomatic Python) but serialize to
and from camelCase over the wire via `alias_generator`, so they line up
field-for-field with packages/shared-types/index.ts on the Next.js side.
"""

from pydantic import BaseModel, ConfigDict, Field, model_validator
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class DCFInput(CamelModel):
    symbol: str = Field(min_length=1, max_length=20)
    current_revenue: float = Field(gt=0)
    revenue_growth_rate: float = Field(ge=-0.5, le=1)
    ebit_margin: float = Field(ge=-1, le=1)
    tax_rate: float = Field(ge=0, le=0.6)
    discount_rate: float = Field(ge=0.01, le=0.5)
    terminal_growth_rate: float = Field(ge=-0.05, le=0.1)
    projection_years: int = Field(ge=1, le=15)
    shares_outstanding: float = Field(gt=0)
    net_debt: float

    @model_validator(mode="after")
    def discount_rate_must_exceed_terminal_growth(self) -> "DCFInput":
        if self.discount_rate <= self.terminal_growth_rate:
            raise ValueError(
                "discount_rate must be greater than terminal_growth_rate, "
                "otherwise the terminal value formula diverges."
            )
        return self


class DCFResult(CamelModel):
    symbol: str
    enterprise_value: float
    equity_value: float
    fair_value_per_share: float
    projected_free_cash_flows: list[float]
    terminal_value: float
    present_value_of_cash_flows: float
    present_value_of_terminal_value: float


class MonteCarloInput(CamelModel):
    symbol: str = Field(min_length=1, max_length=20)
    base_case: DCFInput
    iterations: int = Field(ge=100, le=100_000)
    revenue_growth_std_dev: float = Field(ge=0, le=1)
    discount_rate_std_dev: float = Field(ge=0, le=1)


class HistogramBucket(CamelModel):
    range_start: float
    range_end: float
    count: int


class MonteCarloResult(CamelModel):
    symbol: str
    iterations: int
    mean_fair_value: float
    median_fair_value: float
    std_dev: float
    percentile_5: float
    percentile_25: float
    percentile_75: float
    percentile_95: float
    min_value: float
    max_value: float
    histogram: list[HistogramBucket]


class ScenarioOverride(CamelModel):
    name: str
    overrides: dict = Field(default_factory=dict)


class ScenarioInput(CamelModel):
    symbol: str = Field(min_length=1, max_length=20)
    base_case: DCFInput
    scenarios: list[ScenarioOverride]


class ScenarioResult(CamelModel):
    name: str
    result: DCFResult | None = None
    error: str | None = None


class ScenarioAnalysisResult(CamelModel):
    symbol: str
    base_case: DCFResult
    scenarios: list[ScenarioResult]
