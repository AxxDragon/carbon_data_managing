from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import User, Company, Project, User_Project, Invite
from schemas import UserSchema, UserSubmitSchema
from security import get_current_user, hash_password
from typing import List
from pydantic import BaseModel

router = APIRouter()


@router.get("/", response_model=List[UserSchema])
def get_users(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Admins get all users, company admins only see users from their company."""

    # Build the initial query to fetch users and their company names
    query = (
        db.query(User, Company.name.label("company"))
        .join(Company, User.companyId == Company.id)
        .options(joinedload(User.projects).joinedload(User_Project.project))
    )

    # Restrict to company-specific users if requester is a company admin
    if user.role == "companyadmin":
        query = query.filter(User.companyId == user.companyId)

    users = query.all()

    # Construct the list of serialized UserSchema responses
    return [
        UserSchema(
            id=user.id,
            firstName=user.firstName,
            lastName=user.lastName,
            email=user.email,
            role=user.role,
            companyId=user.companyId,
            company=company_name,
            projects=[up.project.id for up in user.projects],
        )
        for user, company_name in users
    ]


@router.get("/me", response_model=UserSchema)
def get_current_user_details(user: User = Depends(get_current_user)):
    """Return the details of the logged-in user."""
    return UserSchema(
        id=user.id,
        firstName=user.firstName,
        lastName=user.lastName,
        email=user.email,
        role=user.role,
        companyId=user.companyId,
        company=user.company.name if user.company else None,
    )


@router.get("/{user_id}", response_model=UserSchema)
def get_user(
    user_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    """Get a user by ID. CompanyAdmins can only access users from their company."""

    # Retrieve the target user by ID
    fetched_user = db.query(User).filter(User.id == user_id).first()
    if not fetched_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check company-level access control for company admins
    if user.role == "companyadmin" and fetched_user.companyId != user.companyId:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Return serialized user object
    return UserSchema(
        id=fetched_user.id,
        firstName=fetched_user.firstName,
        lastName=fetched_user.lastName,
        email=fetched_user.email,
        role=fetched_user.role,
        companyId=fetched_user.companyId,
        company=db.query(Company.name)
        .filter(Company.id == fetched_user.companyId)
        .scalar(),
    )


@router.post("/", response_model=UserSchema)
def create_user(confirm_data: UserSubmitSchema, db: Session = Depends(get_db)):
    """Convert an invite into a confirmed user account."""

    # Validate the invite token
    invite = (
        db.query(Invite).filter(Invite.inviteToken == confirm_data.inviteToken).first()
    )
    if not invite:
        raise HTTPException(status_code=404, detail="Invalid or expired invite")

    # Create the new user based on the invite details
    new_user = User(
        firstName=invite.firstName,
        lastName=invite.lastName,
        email=invite.email,  # Use the email from the invite (pre-validated)
        passwordhash=hash_password(confirm_data.password),  # Hash the password
        role=invite.role,  # Role is already set in the invite
        companyId=invite.companyId,  # Company is already set in the invite
    )

    db.add(new_user)

    # Delete the invite since it's now used
    db.delete(invite)
    db.commit()

    return UserSchema(
        id=new_user.id,
        firstName=new_user.firstName,
        lastName=new_user.lastName,
        email=new_user.email,
        role=new_user.role,
        companyId=new_user.companyId,
        company=db.query(Company.name)
        .filter(Company.id == new_user.companyId)
        .scalar(),
    )


# Schema to receive a list of project IDs to assign to a user
class UserProjectUpdateSchema(BaseModel):
    projectIds: List[int]


@router.put("/{user_id}", response_model=UserSchema)
def update_user(
    user_id: int,
    user_data: UserSchema,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Admins can update any user, companyadmins can only update users from their company."""

    # Retrieve user to update
    fetched_user = db.query(User).filter(User.id == user_id).first()
    if not fetched_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Company admins cannot update users from other companies
    if user.role == "companyadmin" and fetched_user.companyId != user.companyId:
        raise HTTPException(status_code=403, detail="Not authorized")

    print("Received user update:", user_data.model_dump())  # Debug log

    # Update user attributes excluding project assignments
    for key, value in user_data.model_dump(exclude_unset=True).items():
        if key != "projects":
            setattr(fetched_user, key, value)

    # Handle project assignments if present
    if "projects" in user_data.model_dump():
        db.query(User_Project).filter(
            User_Project.userId == user_id
        ).delete()  # Clear old assignments

        for project_id in user_data.projects:
            db.add(
                User_Project(userId=user_id, projectId=project_id)
            )  # Assign new projects

    db.commit()
    db.refresh(fetched_user)

    return UserSchema(
        id=fetched_user.id,
        firstName=fetched_user.firstName,
        lastName=fetched_user.lastName,
        email=fetched_user.email,
        role=fetched_user.role,
        companyId=fetched_user.companyId,
        company=db.query(Company.name)
        .filter(Company.id == fetched_user.companyId)
        .scalar(),
        projects=user_data.projects,
    )


@router.delete("/{user_id}")
def delete_user(
    user_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    """Admins can delete any user, companyadmins can only delete users from their company."""

    # Retrieve user to delete
    fetched_user = db.query(User).filter(User.id == user_id).first()
    if not fetched_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Company admins can only delete users within their own company
    if user.role == "companyadmin" and fetched_user.companyId != user.companyId:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(fetched_user)
    db.commit()
    return {"detail": "User deleted"}


@router.get("/{user_id}/projects", response_model=List[dict])
def get_user_projects(
    user_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    """Return a list of projects (ID and Name) assigned to the user."""

    # Retrieve user whose projects are being queried
    fetched_user = db.query(User).filter(User.id == user_id).first()
    if not fetched_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Company admins cannot access users outside their company
    if user.role == "companyadmin" and fetched_user.companyId != user.companyId:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get all projects linked to the user via the join table
    projects = (
        db.query(Project.id, Project.name)
        .join(User_Project, User_Project.projectId == Project.id)
        .filter(User_Project.userId == user_id)
        .all()
    )

    return [{"id": project.id, "name": project.name} for project in projects]
