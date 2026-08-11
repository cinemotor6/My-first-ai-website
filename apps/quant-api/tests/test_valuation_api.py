from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

VALID_DCF_PAYLOAD = {
    "symbol": "AAPL",
    "currentRevenue": 400_000_000_000,
    "revenueGrowthRate": 0.08,
    "ebitMargin": 0.30,
    "taxRate": 0.21,
    "discountRate": 0.09,
    "terminalGrowthRate": 0.025,
    "projectionYears": 5,
    "sharesOutstanding": 15_000_000_000,
    "netDebt": 50_000_000_000,
}


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_dcf_endpoint_accepts_camel_case_payload():
    response = client.post("/api/v1/valuation/dcf", json=VALID_DCF_PAYLOAD)
    assert response.status_code == 200
    body = response.json()
    assert body["symbol"] == "AAPL"
    assert "fairValuePerShare" in body
    assert len(body["projectedFreeCashFlows"]) == 5


def test_dcf_endpoint_rejects_missing_fields():
    response = client.post("/api/v1/valuation/dcf", json={"symbol": "AAPL"})
    assert response.status_code == 422


def test_dcf_endpoint_rejects_negative_revenue():
    payload = {**VALID_DCF_PAYLOAD, "currentRevenue": -1}
    response = client.post("/api/v1/valuation/dcf", json=payload)
    assert response.status_code == 422


def test_dcf_endpoint_rejects_discount_rate_below_terminal_growth():
    payload = {**VALID_DCF_PAYLOAD, "discountRate": 0.01, "terminalGrowthRate": 0.025}
    response = client.post("/api/v1/valuation/dcf", json=payload)
    assert response.status_code == 422


def test_monte_carlo_endpoint_returns_distribution():
    payload = {
        "symbol": "AAPL",
        "baseCase": VALID_DCF_PAYLOAD,
        "iterations": 2000,
        "revenueGrowthStdDev": 0.05,
        "discountRateStdDev": 0.02,
    }
    response = client.post("/api/v1/valuation/monte-carlo", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["iterations"] == 2000
    assert body["percentile5"] <= body["medianFairValue"] <= body["percentile95"]
    assert len(body["histogram"]) == 20


def test_monte_carlo_endpoint_rejects_too_few_iterations():
    payload = {
        "symbol": "AAPL",
        "baseCase": VALID_DCF_PAYLOAD,
        "iterations": 1,
        "revenueGrowthStdDev": 0.05,
        "discountRateStdDev": 0.02,
    }
    response = client.post("/api/v1/valuation/monte-carlo", json=payload)
    assert response.status_code == 422


def test_scenarios_endpoint_returns_comparison():
    payload = {
        "symbol": "AAPL",
        "baseCase": VALID_DCF_PAYLOAD,
        "scenarios": [
            {"name": "Bull", "overrides": {"revenueGrowthRate": 0.12}},
            {"name": "Bear", "overrides": {"revenueGrowthRate": 0.02, "ebitMargin": 0.2}},
        ],
    }
    response = client.post("/api/v1/valuation/scenarios", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["baseCase"]["fairValuePerShare"] > 0
    assert len(body["scenarios"]) == 2
    assert body["scenarios"][0]["name"] == "Bull"
    assert body["scenarios"][0]["result"]["fairValuePerShare"] > 0
    # Higher growth should produce a higher fair value than the lower-growth scenario.
    assert (
        body["scenarios"][0]["result"]["fairValuePerShare"]
        > body["scenarios"][1]["result"]["fairValuePerShare"]
    )


def test_scenarios_endpoint_reports_per_scenario_errors_without_failing_the_request():
    payload = {
        "symbol": "AAPL",
        "baseCase": VALID_DCF_PAYLOAD,
        "scenarios": [
            {"name": "Invalid", "overrides": {"discountRate": 0.01, "terminalGrowthRate": 0.025}},
            {"name": "Bull", "overrides": {"revenueGrowthRate": 0.12}},
        ],
    }
    response = client.post("/api/v1/valuation/scenarios", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["scenarios"][0]["error"] is not None
    assert body["scenarios"][0]["result"] is None
    assert body["scenarios"][1]["error"] is None
    assert body["scenarios"][1]["result"]["fairValuePerShare"] > 0
