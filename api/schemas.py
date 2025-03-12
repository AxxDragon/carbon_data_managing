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
    averageCO2Emission: float

class UnitSchema(BaseModel):
    name: str

class ProjectSchema(BaseModel):
    id: int
    name: str
    startDate: date
    endDate: Optional[date] = None
    status: str  # Computed field
    company: str  # Resolved Company name

    class Config:
        from_attributes = True

class ProjectSubmitSchema(BaseModel):
    id: Optional[int] = None
    name: str
    startDate: date
    endDate: Optional[date] = None
    companyId: int  # Admins choose, companyadmins have fixed value

class UserSchema(BaseModel):
    id: int
    firstName: str
    lastName: str
    email: str
    role: str
    companyId: int
    company: str  # Resolved Company name

    class Config:
        from_attributes = True


class UserSubmitSchema(BaseModel):
    firstName: str
    lastName: str
    email: str
    passwordhash: str  # Hashed before storing
    role: str
    companyId: int  # Admins assign, companyadmins have fixed value
