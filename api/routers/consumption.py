from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Consumption, User, Project, ActivityType, FuelType, Unit, Company
from schemas import ConsumptionSchema, ConsumptionSubmitSchema
from security import get_current_user
from typing import List
from datetime import date

router = APIRouter()

@router.get("/", response_model=List[ConsumptionSchema])
def get_consumptions(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    query = (
        db.query(
            Consumption.id,
            Consumption.amount,
            Consumption.startDate,
            Consumption.endDate,
            Consumption.reportDate,
            Consumption.description,
            Consumption.userId,
            Consumption.fuelTypeId,
            Project.name.label("project"),
            Project.companyId,
            ActivityType.name.label("activityType"),
            FuelType.name.label("fuelType"),
            Unit.name.label("unit"),
            User.firstName.label("user_first_name"),
            User.lastName.label("user_last_name"),
            Company.name.label("company")
        )
        .join(Project, Project.id == Consumption.projectId)
        .join(ActivityType, ActivityType.id == Consumption.activityTypeId)
        .join(FuelType, FuelType.id == Consumption.fuelTypeId)
        .join(Unit, Unit.id == Consumption.unitId)
        .join(User, User.id == Consumption.userId)
        .join(Company, Company.id == Project.companyId)
    )

    # Role-based filtering
    if current_user.role == "admin":
        consumptions = query.all()
    elif current_user.role == "companyadmin":
        consumptions = query.filter(Project.companyId == current_user.companyId).all()
    else:
        consumptions = query.filter(Project.id.in_([p.id for p in current_user.projects])).all()

    return [ConsumptionSchema(**row._asdict()) for row in consumptions]

@router.get("/projects")
def get_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Fetch all projects available to the user."""
    if current_user.role == "admin":
        projects = db.query(Project).all()
    elif current_user.role == "companyadmin":
        projects = db.query(Project).filter(Project.companyId == current_user.companyId).all()
    else:
        projects = db.query(Project).filter(Project.id.in_([p.id for p in current_user.projects])).all()

    return [{"id": p.id, "name": p.name} for p in projects]


@router.get("/activity-types")
def get_activity_types(db: Session = Depends(get_db)):
    """Fetch all activity types."""
    return [{"id": a.id, "name": a.name} for a in db.query(ActivityType).all()]


@router.get("/fuel-types")
def get_fuel_types(db: Session = Depends(get_db)):
    """Fetch all fuel types."""
    return [{"id": f.id, "name": f.name} for f in db.query(FuelType).all()]


@router.get("/units")
def get_units(db: Session = Depends(get_db)):
    """Fetch all units."""
    return [{"id": u.id, "name": u.name} for u in db.query(Unit).all()]


@router.get("/{id}")
def get_consumption(id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    consumption = (
        db.query(Consumption)
        .filter(Consumption.id == id)
        .first()
    )
    
    if not consumption:
        raise HTTPException(status_code=404, detail="Consumption entry not found")

    return consumption

@router.post("/")
def create_consumption(data: ConsumptionSubmitSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Users can only create consumptions for projects they are part of.
       Company admins can create entries for any project in their company.
    """
    project = db.query(Project).filter(Project.id == data.projectId).first()

    # If project doesn't exist, deny the request
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Users can only create entries for projects they are part of
    if current_user.role == "user" and project.id not in [p.id for p in current_user.projects]:
        raise HTTPException(status_code=403, detail="Not allowed to add to this project")

    # Company admins can create entries for any project within their company
    if current_user.role == "companyadmin" and project.companyId != current_user.companyId:
        raise HTTPException(status_code=403, detail="Not allowed to add to projects outside your company")

    # Assign the current user ID and set report date to today
    data.userId = current_user.id

    new_consumption = Consumption(**data.model_dump())
    db.add(new_consumption)
    db.commit()
    db.refresh(new_consumption)
    return new_consumption

@router.put("/{id}")
def edit_consumption(id: int, data: ConsumptionSubmitSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Only allow admins or the correct company/user to edit."""
    consumption = db.query(Consumption).filter(Consumption.id == id).first()
    
    if not consumption:
        raise HTTPException(status_code=404, detail="Consumption entry not found")
    
    if current_user.role == "admin" or (
        current_user.role == "companyadmin" and consumption.project.companyId == current_user.companyId
    ) or (current_user.role == "user" and consumption.user_id == current_user.id):
        for key, value in data.model_dump().items():
            setattr(consumption, key, value)
        db.commit()
        return consumption
    else:
        raise HTTPException(status_code=403, detail="Not allowed to edit this entry")

@router.delete("/{id}")
def delete_consumption(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Only allow deletion based on role restrictions."""
    consumption = db.query(Consumption).filter(Consumption.id == id).first()
    
    if not consumption:
        raise HTTPException(status_code=404, detail="Consumption entry not found")

    if current_user.role == "admin" or (
        current_user.role == "companyadmin" and consumption.project.companyId == current_user.companyId
    ) or (current_user.role == "user" and consumption.user_id == current_user.id):
        db.delete(consumption)
        db.commit()
        return {"message": "Consumption entry deleted"}
    
    raise HTTPException(status_code=403, detail="Not allowed to delete this entry")
