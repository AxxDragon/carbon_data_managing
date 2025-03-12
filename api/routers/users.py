from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Company
from schemas import UserSchema, UserSubmitSchema
from security import get_current_user
from typing import List

router = APIRouter()


@router.get("/", response_model=List[UserSchema])
def get_users(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Admins get all users, company admins only see users from their company."""
    query = db.query(User, Company.name.label("company")).join(Company, User.companyId == Company.id)

    if user.role == "companyadmin":
        query = query.filter(User.companyId == user.companyId)

    users = query.all()

    return [
        UserSchema(
            id=user.id,
            firstName=user.firstName,
            lastName=user.lastName,
            email=user.email,
            role=user.role,
            companyId=user.companyId,
            company=company_name
        ) for user, company_name in users
    ]


@router.get("/{user_id}", response_model=UserSchema)
def get_user(user_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Get a user by ID. CompanyAdmins can only access users from their company."""
    fetched_user = db.query(User).filter(User.id == user_id).first()
    if not fetched_user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role == "companyadmin" and fetched_user.companyId != user.companyId:
        raise HTTPException(status_code=403, detail="Not authorized")

    return UserSchema(
        id=fetched_user.id,
        firstName=fetched_user.firstName,
        lastName=fetched_user.lastName,
        email=fetched_user.email,
        role=fetched_user.role,
        companyId=fetched_user.companyId,
        company=db.query(Company.name).filter(Company.id == fetched_user.companyId).scalar()
    )


@router.post("/", response_model=UserSchema)
def create_user(user_data: UserSubmitSchema, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Admins assign company, companyadmins create users in their own company."""
    if user.role == "companyadmin":
        user_data.companyId = user.companyId
    elif user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    new_user = User(
        firstName=user_data.firstName,
        lastName=user_data.lastName,
        email=user_data.email,
        passwordhash=user_data.passwordhash,  # Should be hashed before storing
        role=user_data.role,
        companyId=user_data.companyId
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return UserSchema(
        id=new_user.id,
        firstName=new_user.firstName,
        lastName=new_user.lastName,
        email=new_user.email,
        role=new_user.role,
        companyId=new_user.companyId,
        company=db.query(Company.name).filter(Company.id == new_user.companyId).scalar()
    )


@router.put("/{user_id}", response_model=UserSchema)
def update_user(user_id: int, user_data: UserSubmitSchema, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Admins can update any user, companyadmins can only update users from their company."""
    fetched_user = db.query(User).filter(User.id == user_id).first()
    if not fetched_user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role == "companyadmin" and fetched_user.companyId != user.companyId:
        raise HTTPException(status_code=403, detail="Not authorized")

    for key, value in user_data.dict(exclude_unset=True).items():
        setattr(fetched_user, key, value)

    db.commit()
    db.refresh(fetched_user)

    return UserSchema(
        id=fetched_user.id,
        firstName=fetched_user.firstName,
        lastName=fetched_user.lastName,
        email=fetched_user.email,
        role=fetched_user.role,
        companyId=fetched_user.companyId,
        company=db.query(Company.name).filter(Company.id == fetched_user.companyId).scalar()
    )


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Admins can delete any user, companyadmins can only delete users from their company."""
    fetched_user = db.query(User).filter(User.id == user_id).first()
    if not fetched_user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role == "companyadmin" and fetched_user.companyId != user.companyId:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(fetched_user)
    db.commit()
    return {"detail": "User deleted"}


@router.get("/me", response_model=UserSchema)
def get_current_user_details(user: User = Depends(get_current_user)):
    """Return the details of the logged-in user, including companyId if applicable."""
    return UserSchema(
        id=user.id,
        firstName=user.firstName,
        lastName=user.lastName,
        email=user.email,
        role=user.role,
        companyId=user.companyId,
        company=user.company.name if user.company else None
    )
