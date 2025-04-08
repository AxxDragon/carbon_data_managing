from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Consumption, User, Project, ActivityType, FuelType, Unit, Company
from schemas import ConsumptionSchema, ConsumptionSubmitSchema
from security import get_current_user
from typing import List

router = APIRouter()


@router.get("/", response_model=List[ConsumptionSchema])
def get_consumptions(
    db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    # Construct a query joining related tables to enrich the consumption data with
    # related entity details (project, company, fuel type, etc.)
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
            Company.name.label("company"),
        )
        .join(Project, Project.id == Consumption.projectId)
        .join(ActivityType, ActivityType.id == Consumption.activityTypeId)
        .join(FuelType, FuelType.id == Consumption.fuelTypeId)
        .join(Unit, Unit.id == Consumption.unitId)
        .join(User, User.id == Consumption.userId)
        .join(Company, Company.id == Project.companyId)
    )

    # Role-based access control to determine what data the user can retrieve
    if current_user.role == "admin":
        consumptions = query.all()
    elif current_user.role == "companyadmin":
        consumptions = query.filter(Project.companyId == current_user.companyId).all()
    else:
        # Normal users can only access entries from their assigned projects
        consumptions = query.filter(
            Project.id.in_([p.projectId for p in current_user.projects])
        ).all()

    # Convert SQLAlchemy row results to Pydantic response models
    return [ConsumptionSchema(**row._asdict()) for row in consumptions]


@router.get("/projects")
def get_projects(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Fetch all projects available to the user."""
    if current_user.role == "admin":
        projects = db.query(Project).all()
    elif current_user.role == "companyadmin":
        projects = (
            db.query(Project).filter(Project.companyId == current_user.companyId).all()
        )
    else:
        projects = (
            db.query(Project)
            .filter(Project.id.in_([p.projectId for p in current_user.projects]))
            .all()
        )

    # Return minimal project info to populate dropdowns, etc.
    return [{"id": p.id, "name": p.name} for p in projects]


@router.get("/{id}")
def get_consumption(
    id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    # Fetch a single consumption record by its ID
    consumption = db.query(Consumption).filter(Consumption.id == id).first()

    if not consumption:
        raise HTTPException(status_code=404, detail="Consumption entry not found")

    return consumption


@router.post("/")
def create_consumption(
    data: ConsumptionSubmitSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Users can only create consumptions for projects they are part of.
    Company admins can create entries for any project in their company.
    """
    project = db.query(Project).filter(Project.id == data.projectId).first()

    # If project doesn't exist, deny the request
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Users can only create entries for projects they are part of
    if current_user.role == "user" and project.id not in [
        p.projectId for p in current_user.projects
    ]:
        raise HTTPException(
            status_code=403, detail="Not allowed to add to this project"
        )

    # Company admins can create entries for any project within their company
    if (
        current_user.role == "companyadmin"
        and project.companyId != current_user.companyId
    ):
        raise HTTPException(
            status_code=403,
            detail="Not allowed to add to projects outside your company",
        )

    # Assign the current user ID and set report date to today
    data.userId = current_user.id

    # Create and persist the new Consumption record
    new_consumption = Consumption(**data.model_dump())
    db.add(new_consumption)
    db.commit()
    db.refresh(new_consumption)
    return new_consumption


@router.put("/{id}")
def edit_consumption(
    id: int,
    data: ConsumptionSubmitSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Only allow admins or the correct company/user to edit."""
    consumption = db.query(Consumption).filter(Consumption.id == id).first()

    if not consumption:
        raise HTTPException(status_code=404, detail="Consumption entry not found")

    # Determine if the user has permission to update the entry
    if (
        current_user.role == "admin"
        or (
            current_user.role == "companyadmin"
            and consumption.project.companyId == current_user.companyId
        )
        or (current_user.role == "user" and consumption.user_id == current_user.id)
    ):
        # Update fields with provided data
        for key, value in data.model_dump().items():
            setattr(consumption, key, value)
        db.commit()
        return consumption
    else:
        raise HTTPException(status_code=403, detail="Not allowed to edit this entry")


@router.delete("/{id}")
def delete_consumption(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Only allow deletion based on role restrictions."""
    consumption = db.query(Consumption).filter(Consumption.id == id).first()

    if not consumption:
        raise HTTPException(status_code=404, detail="Consumption entry not found")

    # Check role-based permission to delete the record
    if (
        current_user.role == "admin"
        or (
            current_user.role == "companyadmin"
            and consumption.project.companyId == current_user.companyId
        )
        or (current_user.role == "user" and consumption.user_id == current_user.id)
    ):
        db.delete(consumption)
        db.commit()
        return {"message": "Consumption entry deleted"}

    raise HTTPException(status_code=403, detail="Not allowed to delete this entry")
