from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Invite, User
from schemas import InviteSchema, InviteSubmitSchema
from security import generate_invite_token, get_current_user
from datetime import datetime, timedelta
from utils.email_utils import send_invite_email

router = APIRouter()

# Constants for expiration
INVITE_EXPIRATION_DAYS = 30
CONFERMATION_LINK = "http://localhost:3000/complete-account-setup/"

@router.post("/", response_model=InviteSchema)
def create_invite(
    invite_data: InviteSubmitSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Admins can invite users to any company; companyadmins can only invite users to their own company."""
    
    if current_user.role == "companyadmin":
        invite_data.companyId = current_user.companyId  # Restrict companyadmins
        invite_data.role = "user"  # Restrict them to inviting normal users
    
    elif current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    # Check if email is already used
    existing_user = db.query(User).filter(User.email == invite_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email is already in use")

    # Create new invite
    invite = Invite(
        email=invite_data.email,
        firstName=invite_data.firstName,
        lastName=invite_data.lastName,
        role=invite_data.role,
        companyId=invite_data.companyId,
        inviteToken=generate_invite_token(),
        createdAt=datetime.now(),
    )

    db.add(invite)
    db.commit()
    db.refresh(invite)

    # Send email with invite link
    send_invite_email(invite.email, invite.firstName, invite.lastName, CONFERMATION_LINK + invite.inviteToken)

    return invite

@router.get("/token/{invite_token}")
def get_invite_by_token(invite_token: str, db: Session = Depends(get_db)):
    # Delete expired invites before processing
    now = datetime.now()
    db.query(Invite).filter(Invite.createdAt < now - timedelta(days=INVITE_EXPIRATION_DAYS)).delete()
    db.commit()

    # Fetch the invite with the given token
    invite = db.query(Invite).filter_by(inviteToken=invite_token).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found or expired")

    return invite

@router.get("/", response_model=list[InviteSchema])
def get_pending_invites(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List all pending invites. Companyadmins only see invites from their own company."""
    
    # First, delete expired invites
    expiration_threshold = datetime.now() - timedelta(days=INVITE_EXPIRATION_DAYS)
    db.query(Invite).filter(Invite.createdAt < expiration_threshold).delete()
    db.commit()
    
    if current_user.role == "admin":
        invites = db.query(Invite).all()  # Admins see all invites
    elif current_user.role == "companyadmin":
        invites = db.query(Invite).filter(Invite.companyId == current_user.companyId).all()
    else:
        raise HTTPException(status_code=403, detail="Not authorized")

    return invites

@router.delete("/{invite_id}")
def delete_invite(invite_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Cancel an invite (delete it)."""
    
    invite = db.query(Invite).filter(Invite.id == invite_id).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")

    # Only allow deletion if the user is authorized
    if current_user.role == "companyadmin" and invite.companyId != current_user.companyId:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(invite)
    db.commit()
    return {"detail": "Invite deleted"}

@router.post("/{invite_id}/resend")
def resend_invite(invite_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Resend an invite by generating a new token and sending an email."""
    invite = db.query(Invite).filter(Invite.id == invite_id).first()
    
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    
    if user.role == "companyadmin" and invite.companyId != user.companyId:
        raise HTTPException(status_code=403, detail="Not authorized")

    invite.inviteToken = generate_invite_token()
    invite.createdAt = datetime.now()

    db.commit()

    send_invite_email(invite.email, invite.firstName, invite.lastName, CONFERMATION_LINK + invite.inviteToken)

    return {"detail": "Invite resent successfully"}
