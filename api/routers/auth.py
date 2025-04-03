from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import LoginSchema
from security import (
    verify_password, 
    create_access_token, 
    create_refresh_token, 
    refresh_access_token
)
from fastapi.security import OAuth2PasswordBearer
from logging_config import logger

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

@router.post("/login")
def login(login_data: LoginSchema, response: Response, db: Session = Depends(get_db)):
    """Authenticate user, issue access and refresh tokens."""
    user = db.query(User).filter(User.email == login_data.email).first()

    if not user or not verify_password(login_data.password, user.passwordhash):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    # Create both access and refresh tokens
    access_token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "role": user.role
    })

    refresh_token = create_refresh_token({"sub": str(user.id)})

    # Set refresh token in HttpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="Lax"
    )

    return {
        "token": access_token,
        "user": {"id": user.id, "email": user.email, "role": user.role}
    }

@router.post("/refresh")
def refresh_token(request: Request, response: Response):
    """Refreshes access token using refresh token from cookies."""
    refresh_token = request.cookies.get("refresh_token")
    logger.debug(f"Received refresh request. Cookie: {refresh_token}")

    if not refresh_token:
        logger.warning("No refresh token found in cookies")
        raise HTTPException(status_code=401, detail="No refresh token found")

    try:
        new_access_token, new_refresh_token = refresh_access_token(refresh_token)
        logger.info(f"New access token generated: {new_access_token}")
        logger.info(f"New refresh token generated: {new_refresh_token}")
    except Exception as e:
        logger.error(f"Refresh failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid refresh token!")

    # Set new refresh token in cookie
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=True,
        samesite="Lax"
    )

    return {"token": new_access_token}
