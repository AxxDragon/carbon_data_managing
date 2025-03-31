from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from typing import Optional, List

class LoginSchema(BaseModel):
    email: EmailStr
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
    fuelTypeId: int
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
    companyId: int
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
    email: EmailStr
    role: str
    companyId: int
    company: Optional[str] = None  # Resolved Company name
    projects: List[int] = []

    class Config:
        from_attributes = True

class UserSubmitSchema(BaseModel):
    inviteToken: str
    password: str

class InviteSchema(BaseModel):
    id: int
    email: EmailStr
    firstName: str
    lastName: str
    role: str
    companyId: int
    inviteToken: str
    createdAt: datetime

    class Config:
        from_attributes = True

class InviteSubmitSchema(BaseModel):
    email: EmailStr
    firstName: str
    lastName: str
    role: str
    companyId: int
