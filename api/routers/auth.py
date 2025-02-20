from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import LoginSchema
from security import verify_password, create_access_token

router = APIRouter()

@router.post("/login")
def login(login_data: LoginSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()

    if not user or not verify_password(login_data.password, user.passwordhash):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_access_token({"sub": user.email})

    return {"token": token, "user": {"id": user.id, "email": user.email, "role": user.role}}
