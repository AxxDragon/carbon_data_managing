import pytest
from datetime import timedelta, datetime, timezone
from jose import jwt
from fastapi import HTTPException, status
from unittest.mock import MagicMock, patch

import security
from models import User

# -------------------- Fixtures --------------------


@pytest.fixture
def test_user():
    return User(
        id=1, email="user@example.com", passwordhash=security.hash_password("secret")
    )


@pytest.fixture
def token_data():
    return {"sub": "1"}


# -------------------- Password Tests --------------------


def test_hash_and_verify_password():
    password = "my_secure_password"
    hashed = security.hash_password(password)

    assert hashed != password  # Hash should be different
    assert security.verify_password(password, hashed) is True
    assert security.verify_password("wrong_pass", hashed) is False


# -------------------- Token Creation Tests --------------------


def test_create_access_token_payload():
    data = {"sub": "123"}
    token = security.create_access_token(data)
    decoded = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])

    assert decoded["sub"] == "123"
    assert "exp" in decoded


def test_create_refresh_token_payload():
    data = {"sub": "456"}
    token = security.create_refresh_token(data)
    decoded = jwt.decode(
        token, security.REFRESH_SECRET_KEY, algorithms=[security.ALGORITHM]
    )

    assert decoded["sub"] == "456"
    assert "exp" in decoded


# -------------------- Token Refresh Tests --------------------


def test_refresh_access_token_valid(monkeypatch):
    refresh_token = security.create_refresh_token({"sub": "1"})

    access_token, new_refresh_token = security.refresh_access_token(refresh_token)

    decoded_access = jwt.decode(
        access_token, security.SECRET_KEY, algorithms=[security.ALGORITHM]
    )
    decoded_refresh = jwt.decode(
        new_refresh_token, security.REFRESH_SECRET_KEY, algorithms=[security.ALGORITHM]
    )

    assert decoded_access["sub"] == "1"
    assert decoded_refresh["sub"] == "1"


def test_refresh_access_token_expired():
    expired_token = jwt.encode(
        {"sub": "1", "exp": datetime.now(timezone.utc) - timedelta(seconds=1)},
        security.REFRESH_SECRET_KEY,
        algorithm=security.ALGORITHM,
    )

    with pytest.raises(HTTPException) as exc_info:
        security.refresh_access_token(expired_token)

    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert "expired" in str(exc_info.value.detail)


# -------------------- Current User Tests --------------------


@patch("api.security.get_db")
def test_get_current_user_valid(mock_get_db, test_user):
    token = security.create_access_token({"sub": str(test_user.id)})

    # Mock DB call
    mock_session = MagicMock()
    mock_session.query().filter().first.return_value = test_user
    mock_get_db.return_value = mock_session

    user = security.get_current_user(token=token, db=mock_session)

    assert user.id == test_user.id
    assert user.email == test_user.email


@patch("api.security.get_db")
def test_get_current_user_invalid_token(mock_get_db):
    invalid_token = "invalid.token.here"
    mock_session = MagicMock()

    with pytest.raises(HTTPException) as exc_info:
        security.get_current_user(token=invalid_token, db=mock_session)

    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Invalid token" in str(exc_info.value.detail)


@patch("api.security.get_db")
def test_get_current_user_user_not_found(mock_get_db):
    token = security.create_access_token({"sub": "9999"})

    mock_session = MagicMock()
    mock_session.query().filter().first.return_value = None
    mock_get_db.return_value = mock_session

    with pytest.raises(HTTPException) as exc_info:
        security.get_current_user(token=token, db=mock_session)

    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert "User not found" in str(exc_info.value.detail)


# -------------------- Invite Token Tests --------------------


def test_generate_invite_token_format():
    token = security.generate_invite_token()
    assert isinstance(token, str)
    assert len(token) > 40  # 32 random bytes base64-encoded should exceed 40 chars
