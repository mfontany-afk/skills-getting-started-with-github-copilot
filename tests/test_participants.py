from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


def test_unregister_existing_participant():
    # Ensure participant present
    assert "michael@mergington.edu" in activities["Chess Club"]["participants"]

    resp = client.delete(
        "/activities/Chess%20Club/participants?email=michael@mergington.edu"
    )
    assert resp.status_code == 200
    assert "Unregistered michael@mergington.edu" in resp.json()["message"]

    # put participant back for test isolation
    activities["Chess Club"]["participants"].append("michael@mergington.edu")


def test_unregister_nonexistent_activity():
    resp = client.delete("/activities/Nope/participants?email=foo@bar")
    assert resp.status_code == 404


def test_unregister_nonexistent_participant():
    resp = client.delete(
        "/activities/Chess%20Club/participants?email=nonexistent@mergington.edu"
    )
    assert resp.status_code == 404
