import pytest
import bcrypt
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app import app
from models import User
from database import get_db

client = TestClient(app)


@pytest.fixture
def mock_user():
    pw = "secret"
    hashed = bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    return User(
        id=1,
        firstName="Test",
        lastName="User",
        email="test@example.com",
        role="admin",
        passwordhash=hashed,
        companyId=123,
    )


@pytest.fixture
def override_db(mock_user):
    mock_session = MagicMock()
    # any .query().filter().first() should return our mock_user
    mock_session.query().filter().first.return_value = mock_user

    def _override_db():
        yield mock_session

    app.dependency_overrides[get_db] = _override_db
    yield
    app.dependency_overrides.clear()


@patch("routers.auth.verify_password", return_value=True)
@patch("routers.auth.create_access_token", return_value="mock-access-token")
@patch("routers.auth.create_refresh_token", return_value="mock-refresh-token")
def test_login_success(
    mock_create_refresh, mock_create_access, mock_verify, override_db, mock_user
):
    response = client.post(
        "/auth/login",
        json={"email": "test@example.com", "password": "secret"},
    )
    assert response.status_code == 200

    data = response.json()
    # now returns our stubbed access token
    assert data["token"] == "mock-access-token"
    assert data["user"]["id"] == mock_user.id
    assert data["user"]["email"] == mock_user.email

    # also should have set the refresh_token cookie
    assert "refresh_token" in response.cookies
    assert response.cookies.get("refresh_token") == "mock-refresh-token"


@patch("routers.auth.get_db")
@patch("routers.auth.verify_password", return_value=False)
def test_login_invalid_credentials(mock_verify, mock_db, override_db):
    mock_session = MagicMock()
    mock_session.query().filter().first.return_value = None
    mock_db.return_value = mock_session

    response = client.post(
        "/auth/login",
        json={"email": "wrong@example.com", "password": "wrongpass"},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid credentials"


def test_logout():
    response = client.post("/auth/logout")
    assert response.status_code == 200
    assert response.json()["message"] == "Successfully logged out"


@patch("routers.auth.refresh_access_token", return_value=("new-access", "new-refresh"))
def test_refresh_token_success(mock_refresh):
    # simulate an existing refresh_token cookie
    response = client.post(
        "/auth/refresh",
        cookies={"refresh_token": "valid-refresh-token"},
    )
    assert response.status_code == 200

    data = response.json()
    assert data["token"] == "new-access"
    # and a new cookie was set
    assert "refresh_token" in response.cookies
    assert response.cookies.get("refresh_token") == "new-refresh"


@patch("routers.auth.refresh_access_token", side_effect=Exception("Invalid"))
def test_refresh_token_invalid(mock_refresh):
    response = client.post(
        "/auth/refresh",
        cookies={"refresh_token": "bad-token"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid refresh token!"


def test_refresh_token_missing():
    response = client.post("/auth/refresh")  # no cookies
    assert response.status_code == 401
    assert response.json()["detail"] == "No refresh token found"
