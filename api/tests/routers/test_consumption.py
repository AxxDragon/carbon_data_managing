import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import date
import jwt

from api.app import app
from api import models
from api.database import get_db
from api.security import create_access_token

client = TestClient(app)


# Override for dependency
@pytest.fixture
def db_session(test_db):
    yield test_db


@pytest.fixture
def authorized_user(db_session: Session):
    # Create company
    company = models.Company(name="Test Company")
    db_session.add(company)
    db_session.flush()  # gets company.id

    # Create user
    user = models.User(
        firstName="Alice",
        lastName="Anderson",
        email="alice@example.com",
        passwordhash="not_a_real_hash",
        role="user",
        companyId=company.id,
    )
    db_session.add(user)
    db_session.flush()

    # Create token
    token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return user, token


@pytest.fixture
def consumption_dependencies(db_session: Session, authorized_user):
    user, _ = authorized_user

    # Create a project
    project = models.Project(
        name="Solar Installation",
        startDate=date(2023, 1, 1),
        endDate=date(2025, 1, 1),
        companyId=user.companyId,
    )
    db_session.add(project)
    db_session.flush()

    # Link user to project
    link = models.User_Project(userId=user.id, projectId=project.id)
    db_session.add(link)

    # Create ActivityType, FuelType, Unit
    activity = models.ActivityType(name="Transportation")
    fuel = models.FuelType(name="Diesel", averageCO2Emission=2.7)
    unit = models.Unit(name="liters")

    db_session.add_all([activity, fuel, unit])
    db_session.flush()

    db_session.commit()

    return {
        "project_id": project.id,
        "activity_type_id": activity.id,
        "fuel_type_id": fuel.id,
        "unit_id": unit.id,
    }


def test_submit_consumption(db_session, authorized_user, consumption_dependencies):
    user, token = authorized_user
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "projectId": consumption_dependencies["project_id"],
        "amount": 100.0,
        "startDate": "2024-01-01",
        "endDate": "2024-01-31",
        "reportDate": "2024-02-01",
        "description": "Monthly diesel use",
        "activityTypeId": consumption_dependencies["activity_type_id"],
        "fuelTypeId": consumption_dependencies["fuel_type_id"],
        "unitId": consumption_dependencies["unit_id"],
        "userId": user.id,
    }

    response = client.post("/consumption/", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()

    assert data["amount"] == payload["amount"]
    assert data["description"] == payload["description"]
    assert data["project"] == "Solar Installation"
    assert data["activityType"] == "Transportation"
    assert data["fuelType"] == "Diesel"
    assert data["unit"] == "liters"
    assert data["user_first_name"] == user.firstName
    assert data["user_last_name"] == user.lastName
    assert data["company"] == "Test Company"
