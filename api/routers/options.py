from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api.database import get_db
from api.models import Company, ActivityType, FuelType, Unit
from api.schemas import CompanySchema, ActivityTypeSchema, FuelTypeSchema, UnitSchema

router = APIRouter()

# --- COMPANY ENDPOINTS ---


@router.get("/companies")
def get_companies(db: Session = Depends(get_db)):
    """
    Retrieve a list of all companies from the database.
    """
    return db.query(Company).all()


@router.post("/companies")
def create_company(company_data: CompanySchema, db: Session = Depends(get_db)):
    """
    Create a new company with the provided data.
    """
    new_company = Company(**company_data.model_dump())
    db.add(new_company)
    db.commit()
    db.refresh(new_company)
    return new_company


@router.put("/companies/{id}")
def update_company(id: int, company_data: CompanySchema, db: Session = Depends(get_db)):
    """
    Update the details of an existing company by ID.
    """
    company = db.query(Company).filter(Company.id == id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Update company fields dynamically
    for key, value in company_data.model_dump().items():
        setattr(company, key, value)

    db.commit()
    return company


@router.delete("/companies/{id}")
def delete_company(id: int, db: Session = Depends(get_db)):
    """
    Delete a company from the database by ID.
    """
    company = db.query(Company).filter(Company.id == id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    db.delete(company)
    db.commit()
    return {"message": "Company deleted"}


# --- ACTIVITY TYPE ENDPOINTS ---


@router.get("/activity-types")
def get_activity_types(db: Session = Depends(get_db)):
    """
    Retrieve a list of all activity types from the database.
    """
    return db.query(ActivityType).all()


@router.post("/activity-types")
def create_activity_type(data: ActivityTypeSchema, db: Session = Depends(get_db)):
    """
    Create a new activity type with the provided data.
    """
    new_activity = ActivityType(**data.model_dump())
    db.add(new_activity)
    db.commit()
    db.refresh(new_activity)
    return new_activity


@router.put("/activity-types/{id}")
def update_activity_type(
    id: int, data: ActivityTypeSchema, db: Session = Depends(get_db)
):
    """
    Update the details of an existing activity type by ID.
    """
    activity = db.query(ActivityType).filter(ActivityType.id == id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity type not found")

    # Update fields dynamically
    for key, value in data.model_dump().items():
        setattr(activity, key, value)

    db.commit()
    return activity


@router.delete("/activity-types/{id}")
def delete_activity_type(id: int, db: Session = Depends(get_db)):
    """
    Delete an activity type from the database by ID.
    """
    activity = db.query(ActivityType).filter(ActivityType.id == id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity type not found")

    db.delete(activity)
    db.commit()
    return {"message": "Activity type deleted"}


# --- FUEL TYPE ENDPOINTS ---


@router.get("/fuel-types")
def get_fuel_types(db: Session = Depends(get_db)):
    """
    Retrieve a list of all fuel types from the database.
    """
    return db.query(FuelType).all()


@router.post("/fuel-types")
def create_fuel_type(data: FuelTypeSchema, db: Session = Depends(get_db)):
    """
    Create a new fuel type with the provided data.
    """
    new_fuel_type = FuelType(**data.model_dump())
    db.add(new_fuel_type)
    db.commit()
    db.refresh(new_fuel_type)
    return new_fuel_type


@router.put("/fuel-types/{id}")
def update_fuel_type(id: int, data: FuelTypeSchema, db: Session = Depends(get_db)):
    """
    Update the details of an existing fuel type by ID.
    """
    fuel = db.query(FuelType).filter(FuelType.id == id).first()
    if not fuel:
        raise HTTPException(status_code=404, detail="Fuel type not found")

    # Update fields dynamically
    for key, value in data.model_dump().items():
        setattr(fuel, key, value)

    db.commit()
    return fuel


@router.delete("/fuel-types/{id}")
def delete_fuel_type(id: int, db: Session = Depends(get_db)):
    """
    Delete a fuel type from the database by ID.
    """
    fuel = db.query(FuelType).filter(FuelType.id == id).first()
    if not fuel:
        raise HTTPException(status_code=404, detail="Fuel type not found")

    db.delete(fuel)
    db.commit()
    return {"message": "Fuel type deleted"}


# --- UNIT ENDPOINTS ---


@router.get("/units")
def get_units(db: Session = Depends(get_db)):
    """
    Retrieve a list of all measurement units from the database.
    """
    return db.query(Unit).all()


@router.post("/units")
def create_unit(data: UnitSchema, db: Session = Depends(get_db)):
    """
    Create a new measurement unit with the provided data.
    """
    new_unit = Unit(**data.model_dump())
    db.add(new_unit)
    db.commit()
    db.refresh(new_unit)
    return new_unit


@router.put("/units/{id}")
def update_unit(id: int, data: UnitSchema, db: Session = Depends(get_db)):
    """
    Update the details of an existing unit by ID.
    """
    unit = db.query(Unit).filter(Unit.id == id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    # Update fields dynamically
    for key, value in data.model_dump().items():
        setattr(unit, key, value)

    db.commit()
    return unit


@router.delete("/units/{id}")
def delete_unit(id: int, db: Session = Depends(get_db)):
    """
    Delete a unit from the database by ID.
    """
    unit = db.query(Unit).filter(Unit.id == id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    db.delete(unit)
    db.commit()
    return {"message": "Unit deleted"}
