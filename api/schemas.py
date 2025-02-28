from pydantic import BaseModel
from datetime import date
from typing import Optional

class LoginSchema(BaseModel):
    email: str
    password: str

class ConsumptionSchema(BaseModel):
    id: int
    amount: float
    startDate: date
    endDate: date
    reportDate: date
    description: Optional[str]
    userId: int
    project: str  # Resolved name
    activityType: str  # Resolved name
    fuelType: str  # Resolved name
    unit: str  # Resolved name
    user_first_name: str  # Resolved User's first name
    user_last_name: str  # Resolved User's last name
    company: str  # Resolved Company name

    class Config:
        from_attributes = True
        
class ConsumptionSubmitSchema(BaseModel):
    projectId: int
    amount: float
    startDate: date
    endDate: date
    reportDate: date
    description: str
    activityTypeId: int
    fuelTypeId: int
    unitId: int
    userId: int


class CompanySchema(BaseModel):
    name: str

class ActivityTypeSchema(BaseModel):
    name: str

class FuelTypeSchema(BaseModel):
    name: str
    averageCO2Emmission: float

class UnitSchema(BaseModel):
    name: str