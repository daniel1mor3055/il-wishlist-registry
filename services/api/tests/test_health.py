from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_returns_ok():
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["version"]


#: D13's contact reveal. The only route allowed to say "payment", because it
#: hands over the couple's Bit handle so the guest can pay them somewhere else.
REVEAL = "/api/v1/public/registries/{slug}/payment-handle"


def test_no_payment_endpoints_exist():
    """D11 is a structural guarantee, so it gets a test rather than a comment.

    Nothing in this product may accept a payment. This asserts the surface has
    no route that even suggests one, and it will keep asserting that as the API
    grows through the last checkpoint.

    The reveal is exempt by name and read-only by assertion: a `POST` there
    would be the first step toward taking money, so the method set is part of
    the guarantee rather than an implementation detail.
    """
    paths = app.openapi()["paths"]
    forbidden = ("checkout", "payment", "charge", "card", "refund", "escrow")
    offenders = [p for p in paths if p != REVEAL and any(word in p.lower() for word in forbidden)]

    assert offenders == [], f"D11 violation: {offenders}"
    assert set(paths[REVEAL]) == {"get"}
