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
    userFirstName: str  # Resolved User's first name
    userLastName: str  # Resolved User's last name
    company: Optional[str]  # Resolved Company name (Admins only, so Optional)

    class Config:
        from_attributes = True