from sqlalchemy import Column, Integer, String, ForeignKey, Date, Float, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import date, datetime, timedelta, timezone
import uuid

# Company Model
class Company(Base):
    __tablename__ = "Company"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    
    users = relationship("User", back_populates="company")
    projects = relationship("Project", back_populates="company")

# Invite Model
class Invite(Base):
    __tablename__ = "Invite"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    firstName = Column(String, nullable=False)
    lastName = Column(String, nullable=False)
    role = Column(String, nullable=False)
    companyId = Column(Integer, ForeignKey("Company.id"), nullable=False)
    inviteToken = Column(String, unique=True, nullable=False)  # Secure token for setup
    createdAt = Column(DateTime, default=lambda: datetime.now(timezone.utc))  # Now timezone-aware

    company = relationship("Company")  # Link to company

    @property
    def is_expired(self):
        """Check if the invite is expired (7-day limit)."""
        return (datetime.now(timezone.utc) - self.createdAt) > timedelta(days=30)

# User Model
class User(Base):
    __tablename__ = "User"
    
    id = Column(Integer, primary_key=True, index=True)
    firstName = Column(String, index=True)
    lastName = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    passwordhash = Column(String)
    role = Column(String)
    companyId = Column(Integer, ForeignKey("Company.id"))
    
    company = relationship("Company", back_populates="users")
    projects = relationship("User_Project", back_populates="user")
    consumptions = relationship("Consumption", back_populates="user")

# Project Model
class Project(Base):
    __tablename__ = "Project"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    startDate = Column(Date)
    endDate = Column(Date)
    companyId = Column(Integer, ForeignKey("Company.id"))
    
    company = relationship("Company", back_populates="projects")
    users = relationship("User_Project", back_populates="project")
    consumptions = relationship("Consumption", back_populates="project")

    @property
    def status(self):
        """Compute if the project is ongoing or completed."""
        today = date.today()
        if self.endDate is None or self.endDate >= today:
            return "Ongoing"
        return "Completed"

# User_Project (Association Table for Many-to-Many User-Project Relationship)
class User_Project(Base):
    __tablename__ = "User_Project"
    
    id = Column(Integer, primary_key=True, index=True)
    userId = Column(Integer, ForeignKey("User.id"))
    projectId = Column(Integer, ForeignKey("Project.id"))
    
    user = relationship("User", back_populates="projects")
    project = relationship("Project", back_populates="users")

# ActivityType Model
class ActivityType(Base):
    __tablename__ = "ActivityType"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    
    consumptions = relationship("Consumption", back_populates="activity_type")

# FuelType Model
class FuelType(Base):
    __tablename__ = "FuelType"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    averageCO2Emission = Column(Float, nullable=False)
    
    consumptions = relationship("Consumption", back_populates="fuel_type")

# Unit Model
class Unit(Base):
    __tablename__ = "Unit"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    
    consumptions = relationship("Consumption", back_populates="unit")

# Consumption Model
class Consumption(Base):
    __tablename__ = "Consumption"
    
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    startDate = Column(Date, nullable=False)
    endDate = Column(Date, nullable=False)
    reportDate = Column(Date, nullable=False)
    description = Column(String, nullable=True)
    userId = Column(Integer, ForeignKey("User.id"))
    projectId = Column(Integer, ForeignKey("Project.id"))
    activityTypeId = Column(Integer, ForeignKey("ActivityType.id"))
    fuelTypeId = Column(Integer, ForeignKey("FuelType.id"), nullable=True)  # Nullable if not fuel-related
    unitId = Column(Integer, ForeignKey("Unit.id"))
    
    user = relationship("User", back_populates="consumptions")
    project = relationship("Project", back_populates="consumptions")
    activity_type = relationship("ActivityType", back_populates="consumptions")
    fuel_type = relationship("FuelType", back_populates="consumptions")
    unit = relationship("Unit", back_populates="consumptions")
