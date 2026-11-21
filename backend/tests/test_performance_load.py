import time
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_menu_catalog_latency():
    """Benchmark digital menu retrieval latency (target: < 250ms)."""
    start = time.perf_counter()
    res = client.get("/api/v1/menu")
    duration = time.perf_counter() - start
    
    assert res.status_code == 200
    assert duration < 0.50, f"Menu catalog latency exceeded limit: {duration:.3f}s"

def test_category_listing_latency():
    """Benchmark category listing response latency (target: < 150ms)."""
    start = time.perf_counter()
    res = client.get("/api/v1/categories")
    duration = time.perf_counter() - start
    
    assert res.status_code == 200
    assert duration < 0.30, f"Category listing latency exceeded limit: {duration:.3f}s"

def test_waiter_dashboard_latency():
    """Benchmark floor operational dashboard endpoint (target: < 200ms)."""
    start = time.perf_counter()
    res = client.get("/api/v1/waiter/dashboard")
    duration = time.perf_counter() - start
    
    assert res.status_code == 200
    assert duration < 0.35, f"Waiter dashboard latency exceeded limit: {duration:.3f}s"

def test_waiter_tables_latency():
    """Benchmark 16-table floor plan query latency (target: < 200ms)."""
    start = time.perf_counter()
    res = client.get("/api/v1/waiter/tables")
    duration = time.perf_counter() - start
    
    assert res.status_code == 200
    assert duration < 0.35, f"Waiter tables latency exceeded limit: {duration:.3f}s"

def test_burst_request_throughput():
    """Execute burst of 30 sequential requests to simulate peak diner menu lookups."""
    total_start = time.perf_counter()
    for _ in range(30):
        res = client.get("/api/v1/menu")
        assert res.status_code == 200
    total_duration = time.perf_counter() - total_start
    
    avg_per_request = total_duration / 30
    assert avg_per_request < 0.15, f"Burst average request latency exceeded limit: {avg_per_request:.3f}s"
