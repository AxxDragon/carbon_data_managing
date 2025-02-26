from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Consumption, User, Project, ActivityType, FuelType, Unit, Company
from schemas import ConsumptionSchema
from security import get_current_user
from typing import List

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
            Project.name.label("project"),
            ActivityType.name.label("activityType"),
            FuelType.name.label("fuelType"),
            Unit.name.label("unit"),
            User.firstName.label("user_first_name"),
            User.lastName.label("user_last_name"),
        )
        .join(Project, Project.id == Consumption.projectId)
        .join(ActivityType, ActivityType.id == Consumption.activityTypeId)
        .join(FuelType, FuelType.id == Consumption.fuelTypeId)
        .join(Unit, Unit.id == Consumption.unitId)
        .join(User, User.id == Consumption.userId)
    )

    # If the user is an admin, include the company name
    if current_user.role == "admin":
        query = query.join(Company, Project.companyId == Company.id).add_columns(Company.name.label("company"))

    # Role-based filtering
    if current_user.role == "admin":
        consumptions = query.all()
    elif current_user.role == "companyadmin":
        consumptions = query.filter(Project.companyId == current_user.companyId).all()
    else:
        consumptions = query.filter(Project.id.in_([p.id for p in current_user.projects])).all()

    return [ConsumptionSchema(**row._asdict()) for row in consumptions]


@router.post("/consumption")
def create_consumption(data: ConsumptionSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Users can only create consumptions for projects they are part of."""
    project = db.query(Project).filter(Project.id == data.project_id).first()
    
    if not project or (current_user.role != "admin" and project.id not in [p.id for p in current_user.projects]):
        raise HTTPException(status_code=403, detail="Not allowed to add to this project")

    new_consumption = Consumption(**data.dict(), user_id=current_user.id)
    db.add(new_consumption)
    db.commit()
    db.refresh(new_consumption)
    return new_consumption

@router.put("/consumption/{id}")
def edit_consumption(id: int, data: ConsumptionSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Only allow admins or the correct company/user to edit."""
    consumption = db.query(Consumption).filter(Consumption.id == id).first()
    
    if not consumption:
        raise HTTPException(status_code=404, detail="Consumption entry not found")
    
    if current_user.role == "admin" or (
        current_user.role == "companyadmin" and consumption.project.companyId == current_user.companyId
    ) or (current_user.role == "user" and consumption.user_id == current_user.id):
        for key, value in data.dict().items():
            setattr(consumption, key, value)
        db.commit()
        return consumption
    else:
        raise HTTPException(status_code=403, detail="Not allowed to edit this entry")

@router.delete("/consumption/{id}")
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
