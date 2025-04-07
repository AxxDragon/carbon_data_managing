from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from unittest.mock import MagicMock
from app import app, get_db
from models import User


# Override the get_db dependency
def override_get_db():
    db = MagicMock(spec=Session)
    yield db


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


def test_get_user_found(monkeypatch):
    fake_user = User(id=1, firstName="John", lastName="Doe")

    def mock_query(*args, **kwargs):
        class Query:
            def filter(self, *args, **kwargs):
                class Filter:
                    def first(self):
                        return fake_user

                return Filter()

        return Query()

    monkeypatch.setattr("app.SessionLocal", lambda: mock_query())

    response = client.get("/users/1")
    assert response.status_code == 200
    assert response.json() == {"user": "John Doe"}


def test_get_user_not_found(monkeypatch):
    def mock_query(*args, **kwargs):
        class Query:
            def filter(self, *args, **kwargs):
                class Filter:
                    def first(self):
                        return None

                return Filter()

        return Query()

    monkeypatch.setattr("app.SessionLocal", lambda: mock_query())

    response = client.get("/users/999")
    assert response.status_code == 404
    assert response.json() == {"detail": "User not found"}
