def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "HealFlow AI" in data["app"]


def test_dashboard_summary_empty(client):
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_incidents"] == 0
    assert data["recovery_success_rate"] == 0.0


def test_get_available_workflows(client):
    response = client.get("/api/workflows")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 4
    scenarios = [w["scenario"] for w in data]
    assert "timeout" in scenarios
    assert "rate_limit" in scenarios
    assert "invalid_input" in scenarios
    assert "unrecoverable" in scenarios


def test_run_workflow_and_retrieve_incident(client):
    # Execute timeout scenario
    run_resp = client.post("/api/workflows/run", json={"scenario": "timeout"})
    assert run_resp.status_code == 200
    run_data = run_resp.json()
    assert run_data["status"] == "RECOVERED"
    assert len(run_data["incidents"]) == 1

    incident_id = run_data["incidents"][0]["id"]

    # Verify incident endpoint
    inc_resp = client.get(f"/api/incidents/{incident_id}")
    assert inc_resp.status_code == 200
    inc_data = inc_resp.json()
    assert inc_data["status"] == "RECOVERED"
    assert inc_data["verification_status"] == "PASSED"
    assert len(inc_data["recovery_attempts"]) >= 1

    # Verify dashboard summary now updates
    dash_resp = client.get("/api/dashboard/summary")
    assert dash_resp.status_code == 200
    dash_data = dash_resp.json()
    assert dash_data["total_incidents"] == 1
    assert dash_data["recovered_incidents"] == 1
    assert dash_data["recovery_success_rate"] == 100.0


def test_settings_status_masks_secrets(client):
    response = client.get("/api/settings/status")
    assert response.status_code == 200
    data = response.json()
    assert "safety_limits" in data
    assert data["safety_limits"]["max_recovery_retries"] == 3
    # Ensure no secret key fields are exposed
    assert "API_KEY" not in str(data)


def test_demo_reset(client):
    # Run a workflow
    client.post("/api/workflows/run", json={"scenario": "timeout"})

    # Reset
    reset_resp = client.post("/api/demo/reset", json={"confirm": True})
    assert reset_resp.status_code == 200

    # Verify summary is zero
    dash_resp = client.get("/api/dashboard/summary")
    assert dash_resp.json()["total_incidents"] == 0
