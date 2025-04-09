import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app import app
from models import User
from database import get_db

client = TestClient(app)


@pytest.fixture
def mock_user():
    return User(
        id=1,
        firstName="Test",
        lastName="User",
        email="test@example.com",
        role="admin",
        passwordhash="$2b$12$fakehashedpassword",
        companyId=123,
    )


@pytest.fixture
def override_db(mock_user):
    mock_session = MagicMock()
    mock_session.query().filter().first.return_value = mock_user

    def _override_db():
        yield mock_session

    app.dependency_overrides[get_db] = _override_db
    yield
    app.dependency_overrides.clear()


@patch("api.routers.auth.verify_password", return_value=True)
@patch("api.routers.auth.create_access_token", return_value="mock-access-token")
@patch("api.routers.auth.create_refresh_token", return_value="mock-refresh-token")
def test_login_success(
    mock_create_refresh, mock_create_access, mock_verify, override_db, mock_user
):
    response = client.post(
        "/auth/login",
        json={"email": "test@example.com", "password": "secret"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["token"] == "mock-access-token"
    assert data["user"]["id"] == mock_user.id
    assert data["user"]["email"] == mock_user.email


@patch("api.routers.auth.get_db")
@patch("api.routers.auth.verify_password", return_value=False)
def test_login_invalid_credentials(mock_verify, mock_db):
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


@patch(
    "api.routers.auth.refresh_access_token", return_value=("new-access", "new-refresh")
)
def test_refresh_token_success(mock_refresh):
    # Simulate a cookie with a valid refresh token
    response = client.post(
        "/auth/refresh",
        cookies={"refresh_token": "valid-refresh-token"},
    )

    assert response.status_code == 200
    assert response.json()["token"] == "new-access"


@patch("api.routers.auth.refresh_access_token", side_effect=Exception("Invalid"))
def test_refresh_token_invalid(mock_refresh):
    response = client.post(
        "/auth/refresh",
        cookies={"refresh_token": "bad-token"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid refresh token!"


def test_refresh_token_missing():
    response = client.post("/auth/refresh")  # No cookies

    assert response.status_code == 401
    assert response.json()["detail"] == "No refresh token found"
