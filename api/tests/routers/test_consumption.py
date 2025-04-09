import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock
from app import app
import models
from security import create_access_token, get_current_user
from database import get_db
from datetime import date

client = TestClient(app)


# Fixtures to create user, company, and the necessary project data
@pytest.fixture
def db_session(test_db):
    yield test_db


@pytest.fixture
def authorized_user(db_session):
    company = models.Company(name="Test Company")
    db_session.add(company)
    db_session.flush()

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

    token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return user, token


@pytest.fixture
def consumption_dependencies(db_session, authorized_user):
    user, _ = authorized_user

    project = models.Project(
        name="Solar Installation",
        startDate=date(2023, 1, 1),
        endDate=date(2025, 1, 1),
        companyId=user.companyId,
    )
    db_session.add(project)
    db_session.flush()

    link = models.User_Project(userId=user.id, projectId=project.id)
    db_session.add(link)

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


# Mocking the DB session and project query to avoid real database calls
@pytest.fixture
def override_db(consumption_dependencies):
    mock_session = MagicMock()

    # Mock the db.query(Project).filter(Project.id == ...) to return the project
    mock_session.query().filter().first.return_value = models.Project(
        id=consumption_dependencies["project_id"],
        name="Solar Installation",
        startDate=date(2023, 1, 1),
        endDate=date(2025, 1, 1),
        companyId=1,
    )

    # Use this mock session to override the `get_db` dependency
    def _override_db():
        yield mock_session

    app.dependency_overrides[get_db] = _override_db
    yield
    app.dependency_overrides.clear()


# Test function for submitting consumption
def test_submit_consumption(db_session, authorized_user, consumption_dependencies, override_db):
    user, token = authorized_user

    # Print to ensure the route is set up
    print("Testing consumption route...")

    # Inject dependency override
    def override_get_current_user():
        print(f"Overriding get_current_user with user {user.id}")
        return user

    app.dependency_overrides[get_current_user] = override_get_current_user

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

    # Print response details to understand more about the 404 error
    print(f"Response status code: {response.status_code}")
    print(f"Response content: {response.text}")

    # Clean up the override
    app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()

    assert data["amount"] == payload["amount"]
    assert data["description"] == payload["description"]
    assert data["projectId"] == payload["projectId"]
    assert data["activityTypeId"] == payload["activityTypeId"]
    assert data["fuelTypeId"] == payload["fuelTypeId"]
    assert data["unitId"] == payload["unitId"]
    assert data["userId"] == payload["userId"]
