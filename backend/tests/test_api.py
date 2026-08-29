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
    assert data["status"] == "online"
    assert "xgboost-v1" in data["model_version"]
    print(f"\n[TEST PASS] GET /api/health - {duration_ms:.2f} ms")

def test_list_players_endpoint():
    start = time.time()
    response = client.get("/api/players?page=1&page_size=10")
    duration_ms = (time.time() - start) * 1000

    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "meta" in data
    assert len(data["items"]) <= 10
    assert data["meta"]["page"] == 1
    print(f"[TEST PASS] GET /api/players (Pagination) - {duration_ms:.2f} ms ({data['meta']['total']} total players)")

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
