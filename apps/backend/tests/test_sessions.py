from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from apps.backend.app.db import get_session
from apps.backend.app.main import app


def _build_client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    def _override_get_session():
        with Session(engine) as s:
            yield s

    app.dependency_overrides[get_session] = _override_get_session
    return TestClient(app)


def test_store_and_retrieve_session():
    client = _build_client()
    payload = {
        "session_id": "abc123",
        "agent": "claude",
        "started_at": 1742891234,
        "ended_at": 1742891834,
        "drift_score": 0.73,
        "threshold_crossings": [
            {
                "timestamp": 1742891434,
                "signal": "test_regression",
                "value": 0.41,
                "label": "A previously passing test began failing",
            }
        ],
    }

    created = client.post("/sessions", json=payload)
    assert created.status_code == 200

    fetched = client.get("/sessions/abc123")
    assert fetched.status_code == 200
    data = fetched.json()
    assert data["session_id"] == "abc123"
    assert len(data["threshold_crossings"]) == 1


def test_list_filtering_works():
    client = _build_client()
    sessions = [
        {
            "session_id": "s1",
            "agent": "claude",
            "started_at": 10,
            "ended_at": 20,
            "drift_score": 0.35,
            "threshold_crossings": [],
        },
        {
            "session_id": "s2",
            "agent": "claude",
            "started_at": 30,
            "ended_at": 40,
            "drift_score": 0.85,
            "threshold_crossings": [],
        },
        {
            "session_id": "s3",
            "agent": "gpt",
            "started_at": 50,
            "ended_at": 60,
            "drift_score": 0.90,
            "threshold_crossings": [],
        },
    ]
    for item in sessions:
        resp = client.post("/sessions", json=item)
        assert resp.status_code == 200

    filtered = client.get("/sessions", params={"agent": "claude", "min_drift": 0.7, "limit": 5})
    assert filtered.status_code == 200
    rows = filtered.json()
    assert len(rows) == 1
    assert rows[0]["session_id"] == "s2"


def test_missing_session_404():
    client = _build_client()
    resp = client.get("/sessions/does-not-exist")
    assert resp.status_code == 404
    assert resp.json()["detail"] == "session not found"
