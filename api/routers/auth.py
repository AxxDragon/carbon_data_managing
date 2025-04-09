from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import LoginSchema
from security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    refresh_access_token,
)
from fastapi.security import OAuth2PasswordBearer
from logging_config import logger

# Create a new API router instance for handling authentication-related routes
router = APIRouter()

# Define the OAuth2 password flow, specifying the token URL endpoint
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


@router.post("/login")
def login(login_data: LoginSchema, response: Response, db: Session = Depends(get_db)):
    """
    Authenticate user, issue access and refresh tokens.

    - Verifies user credentials.
    - Generates JWT access and refresh tokens if authentication is successful.
    - Stores the refresh token in a secure, HttpOnly cookie.
    - Returns the access token and basic user information in the response body.
    """
    # Fetch the user from the database by email
    user = db.query(User).filter(User.email == login_data.email).first()

    # Check if user exists and password is valid
    if not user or not verify_password(login_data.password, user.passwordhash):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    # Create both access and refresh tokens with relevant user information
    access_token = create_access_token(
        {
            "sub": str(user.id),  # Subject (user ID) as string
            "email": user.email,  # User email
            "role": user.role,  # User role for authorization
            "companyId": user.companyId,  # Company affiliation
        }
    )

    print("access_token: ", access_token)

    refresh_token = create_refresh_token({"sub": str(user.id)})

    # Set refresh token in secure, HttpOnly cookie to mitigate XSS attacks
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,  # Prevent JavaScript access
        secure=True,  # Only transmit over HTTPS
        samesite="Lax",  # Restrict cross-site cookie sharing
    )

    return {
        "token": access_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "companyId": user.companyId,
        },
    }


@router.post("/logout")
def logout(response: Response):
    """
    Log out the user and clear the refresh token cookie.
    """
    # Clear the refresh token cookie
    response.delete_cookie("refresh_token", httponly=True, secure=True, samesite="Lax")

    return {"message": "Successfully logged out"}


@router.post("/refresh")
def refresh_token(request: Request, response: Response):
    """
    Refreshes access token using refresh token from cookies.

    - Reads the refresh token from HttpOnly cookie.
    - Validates and decodes it to issue a new access and refresh token pair.
    - Sets a new refresh token in a secure cookie.
    - Returns the new access token in the response body.
    """
    refresh_token = request.cookies.get("refresh_token")

    print("refresh_token: ", refresh_token)

    if not refresh_token:
        logger.warning("No refresh token found in cookies")
        raise HTTPException(status_code=401, detail="No refresh token found")

    try:
        new_access_token, new_refresh_token = refresh_access_token(refresh_token)
    except Exception as e:
        logger.error(f"Refresh failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid refresh token!")

    # Replace the existing refresh token with a new one in the cookie
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=True,
        samesite="Lax",
    )

    return {"token": new_access_token}
