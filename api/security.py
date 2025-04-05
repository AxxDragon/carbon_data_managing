from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
from models import User
import secrets

# Password hashing settings
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Settings
SECRET_KEY = "42"  # Key for signing access tokens
REFRESH_SECRET_KEY = "23"  # Different key for refresh tokens to enhance security
ALGORITHM = "HS256"  # Algorithm used for encoding the JWT
ACCESS_TOKEN_EXPIRE_MINUTES = 15  # Access token expiration time (in minutes)
REFRESH_TOKEN_EXPIRE_DAYS = 7  # Refresh token expiration time (in days)

# OAuth2PasswordBearer is used to extract the token from the request's Authorization header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def create_access_token(data: dict, expires_delta: timedelta = None):
    """
    Generates a short-lived access token.

    :param data: A dictionary of claims to encode in the token.
    :param expires_delta: The expiration time for the token. If None, the default expiration time is used.
    :return: A JWT access token as a string.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})  # Add expiration claim to the payload
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict, expires_delta: timedelta = None):
    """
    Generates a long-lived refresh token.

    :param data: A dictionary of claims to encode in the token.
    :param expires_delta: The expiration time for the token. If None, the default expiration time is used.
    :return: A JWT refresh token as a string.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )
    to_encode.update({"exp": expire})  # Add expiration claim to the payload
    return jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)


def verify_password(plain_password, hashed_password):
    """
    Verifies if the plain password matches the hashed password.

    :param plain_password: The plain text password to verify.
    :param hashed_password: The hashed password stored in the database.
    :return: True if the password is correct, False otherwise.
    """
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password):
    """
    Hashes the password using bcrypt hashing algorithm.

    :param password: The password to hash.
    :return: The hashed password.
    """
    return pwd_context.hash(password)


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    """
    Extracts and verifies the current user from the JWT token.

    :param token: The JWT token provided by the user in the Authorization header.
    :param db: The database session, used to retrieve user information.
    :return: The user object if the token is valid.
    :raises HTTPException: If the token is expired or invalid.
    """
    try:
        # Decode the JWT token to extract the payload
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = int(payload.get("sub"))  # Extract the user ID from the token

        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
            )

        user = (
            db.query(User).filter(User.id == user_id).first()
        )  # Fetch the user from the database
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
            )

        return user

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired"
        )
    except jwt.JWTClaimsError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token claims"
        )
    except JWTError:  # Generic catch-all for other JWT errors
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )


def refresh_access_token(refresh_token: str):
    """
    Refreshes an expired access token using a valid refresh token.

    :param refresh_token: The refresh token provided by the user.
    :return: A new access token and refresh token.
    :raises HTTPException: If the refresh token is invalid or expired.
    """
    try:
        # Decode the refresh token to extract the payload
        payload = jwt.decode(refresh_token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))  # Extract the user ID from the token

        # Generate a new access token
        new_access_token = create_access_token({"sub": str(user_id)})

        # Generate a new refresh token
        new_refresh_token = create_refresh_token({"sub": str(user_id)})

        return new_access_token, new_refresh_token

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired, please log in again",
        )
    except jwt.JWTClaimsError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token given",
        )
    except JWTError:  # Generic catch-all for other JWT errors
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )


# Function to generate a secure invite token
def generate_invite_token() -> str:
    """
    Generates a unique and secure invite token.

    :return: A URL-safe, secure token that can be used as an invite token.
    """
    return secrets.token_urlsafe(
        32
    )  # Generate a 32-byte secure random token, encoded as URL-safe base64
