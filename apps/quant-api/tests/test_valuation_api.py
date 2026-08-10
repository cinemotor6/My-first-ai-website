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


def test_monte_carlo_endpoint_is_a_documented_stub():
    payload = {
        "symbol": "AAPL",
        "baseCase": VALID_DCF_PAYLOAD,
        "iterations": 1000,
        "revenueGrowthStdDev": 0.05,
        "discountRateStdDev": 0.02,
    }
    response = client.post("/api/v1/valuation/monte-carlo", json=payload)
    assert response.status_code == 501


def test_scenarios_endpoint_is_a_documented_stub():
    payload = {
        "symbol": "AAPL",
        "baseCase": VALID_DCF_PAYLOAD,
        "scenarios": [{"name": "Bull", "overrides": {"revenueGrowthRate": 0.12}}],
    }
    response = client.post("/api/v1/valuation/scenarios", json=payload)
    assert response.status_code == 501
