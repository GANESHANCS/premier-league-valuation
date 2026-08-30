import time
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_endpoint():
    start = time.time()
    response = client.get("/api/health")
    duration_ms = (time.time() - start) * 1000
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["online", "healthy"]
    assert data["database"] == "healthy"
    assert data["model"]["status"] == "loaded"
    assert "xgboost-v1" in data["model_version"]
    print(f"\n[TEST PASS] GET /api/health - {duration_ms:.2f} ms")


def test_dashboard_summary_endpoint():
    start = time.time()
    response = client.get("/api/dashboard/summary")
    duration_ms = (time.time() - start) * 1000

    assert response.status_code == 200
    data = response.json()
    assert "total_players" in data
    assert "top_undervalued" in data
    assert "top_overvalued" in data
    assert data["total_players"] > 0
    print(f"[TEST PASS] GET /api/dashboard/summary - {duration_ms:.2f} ms ({data['total_players']} players tracked)")

def test_global_transfers_endpoint():
    start = time.time()
    response = client.get("/api/transfers?scope=historical&page=1&page_size=10")
    duration_ms = (time.time() - start) * 1000

    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "meta" in data
    assert len(data["items"]) <= 10
    if len(data["items"]) > 0:
        assert data["items"][0]["transfer_date"] <= "2026-08-29"

    fut_res = client.get("/api/transfers?scope=future&page=1&page_size=5")
    assert fut_res.status_code == 200
    fut_items = fut_res.json()["items"]
    if len(fut_items) > 0:
        assert fut_items[0]["transfer_date"] > "2026-08-29"

    print(f"[TEST PASS] GET /api/transfers (Historical & Future Scopes) - {duration_ms:.2f} ms")

def test_model_analytics_endpoint():
    start = time.time()
    response = client.get("/api/model/analytics")
    duration_ms = (time.time() - start) * 1000

    assert response.status_code == 200
    data = response.json()
    assert "out_of_time_test_metrics" in data
    assert "feature_importances" in data
    assert isinstance(data["feature_importances"], list)
    assert len(data["feature_importances"]) > 0, "feature_importances array must not be empty!"
    first_feat = data["feature_importances"][0]
    assert "feature" in first_feat
    assert "importance_mean" in first_feat

    test_metrics = data["out_of_time_test_metrics"]
    assert round(test_metrics["WAPE"], 4) == 0.1289
    assert round(test_metrics["R2"], 4) == 0.9457
    assert round(test_metrics["MAE_EUR"], 2) == 2255249.92
    print(f"[TEST PASS] GET /api/model/analytics - {duration_ms:.2f} ms (Feature Importances Count: {len(data['feature_importances'])}, Top Feature: '{first_feat['feature']}')")

def test_list_players_endpoint():
    start = time.time()
    response = client.get("/api/players?league=GB1&page=1&page_size=10")
    duration_ms = (time.time() - start) * 1000

    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "meta" in data
    assert len(data["items"]) <= 10
    assert data["meta"]["total"] == 2259

    global_res = client.get("/api/players?league=all&page=1&page_size=10")
    assert global_res.status_code == 200
    assert global_res.json()["meta"]["total"] == 50149

    print(f"[TEST PASS] GET /api/players (PL Domain: 2,259 players | Global Domain: 50,149 players) - {duration_ms:.2f} ms")

def test_player_search_endpoint():
    start = time.time()
    response = client.get("/api/players?search=Haaland")
    duration_ms = (time.time() - start) * 1000

    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) >= 1
    assert "Haaland" in data["items"][0]["name"]
    print(f"[TEST PASS] GET /api/players?search=Haaland - {duration_ms:.2f} ms")

def test_player_detail_endpoint():
    search_res = client.get("/api/players?page=1&page_size=1")
    p_id = search_res.json()["items"][0]["player_id"]

    start = time.time()
    response = client.get(f"/api/players/{p_id}")
    duration_ms = (time.time() - start) * 1000

    assert response.status_code == 200
    data = response.json()
    assert data["player_id"] == p_id
    assert "valuation_history" in data
    assert "prediction" in data
    assert "predicted_fair_value_eur" in data["prediction"]
    print(f"[TEST PASS] GET /api/players/{p_id} - {duration_ms:.2f} ms")

def test_player_valuation_prediction_endpoint():
    search_res = client.get("/api/players?page=1&page_size=1")
    p_id = search_res.json()["items"][0]["player_id"]

    start = time.time()
    response = client.get(f"/api/players/{p_id}/valuation")
    duration_ms = (time.time() - start) * 1000

    assert response.status_code == 200
    data = response.json()
    assert "predicted_fair_value_eur" in data
    assert "lower_bound_eur" in data
    assert "upper_bound_eur" in data
    assert "valuation_gap_eur" in data
    assert data["lower_bound_eur"] <= data["predicted_fair_value_eur"] <= data["upper_bound_eur"]
    print(f"[TEST PASS] GET /api/players/{p_id}/valuation - {duration_ms:.2f} ms")

def test_player_comparison_endpoint():
    search_res = client.get("/api/players?page=1&page_size=2")
    items = search_res.json()["items"]
    if len(items) >= 2:
        p1, p2 = items[0]["player_id"], items[1]["player_id"]
        
        start = time.time()
        response = client.get(f"/api/players/compare?player_ids={p1},{p2}")
        duration_ms = (time.time() - start) * 1000

        assert response.status_code == 200
        data = response.json()
        assert len(data["players"]) == 2
        print(f"[TEST PASS] GET /api/players/compare - {duration_ms:.2f} ms")

def test_invalid_player_id():
    response = client.get("/api/players/99999999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
    print("[TEST PASS] Invalid Player ID Returns 404 Not Found")
