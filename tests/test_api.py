from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_success():
    # ensure test isolation
    activity = "Chess Club"
    email = "testuser@example.com"
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200

    # participant added
    assert email in activities[activity]["participants"]

    # cleanup
    activities[activity]["participants"].remove(email)


def test_signup_duplicate():
    activity = "Chess Club"
    email = "dup@example.com"
    # ensure present
    if email not in activities[activity]["participants"]:
        activities[activity]["participants"].append(email)

    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 400

    # cleanup
    activities[activity]["participants"].remove(email)


def test_signup_nonexistent_activity():
    resp = client.post("/activities/Nope/signup?email=foo@bar")
    assert resp.status_code == 404
