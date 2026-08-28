from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_returns_ok():
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["version"]


def test_no_payment_endpoints_exist():
    """D11 is a structural guarantee, so it gets a test rather than a comment.

    Nothing in this product may accept a payment. This asserts the surface has
    no route that even suggests one, and it will keep asserting that as the API
    grows through C7.
    """
    paths = app.openapi()["paths"].keys()
    forbidden = ("checkout", "payment", "charge", "card", "refund", "escrow")
    offenders = [p for p in paths for word in forbidden if word in p.lower()]
    assert offenders == [], f"D11 violation: {offenders}"
