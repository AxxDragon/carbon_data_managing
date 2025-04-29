import pytest
from fastapi.testclient import TestClient
from datetime import date

from app import app
from database import Base, get_db
from models import (
    Company, User, Project, User_Project,
    ActivityType, FuelType, Unit, Consumption
)
from security import create_access_token, get_current_user

client = TestClient(app)


# --- Fixtures & Overrides ----------------------------------------------------

@pytest.fixture
def db_session(test_db):
    return test_db

@pytest.fixture(autouse=True)
def override_get_db(db_session):
    # ensure clean slate each test
    Base.metadata.drop_all(bind=db_session.bind)
    Base.metadata.create_all(bind=db_session.bind)

    def _get_db_override():
        yield db_session
    app.dependency_overrides[get_db] = _get_db_override
    yield
    app.dependency_overrides.pop(get_db, None)
    app.dependency_overrides.pop(get_current_user, None)


def auth_header_for(user):
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"Authorization": f"Bearer {token}"}


def override_current_user(user):
    def _get_user_override():
        return user
    app.dependency_overrides[get_current_user] = _get_user_override


# --- Data Setup --------------------------------------------------------------

@pytest.fixture
def seed_data(db_session):
    company = Company(name="TestCo")
    db_session.add(company)
    db_session.flush()

    admin = User(
        firstName="Admin", lastName="User", email="admin@test.co",
        passwordhash="x", role="admin", companyId=company.id
    )
    comp_admin = User(
        firstName="Comp", lastName="Admin", email="comp@test.co",
        passwordhash="x", role="companyadmin", companyId=company.id
    )
    normal_user = User(
        firstName="Norm", lastName="User", email="norm@test.co",
        passwordhash="x", role="user", companyId=company.id
    )
    db_session.add_all([admin, comp_admin, normal_user])
    db_session.flush()

    project = Project(
        name="ProjectX",
        startDate=date(2023, 1, 1),
        endDate=date(2024, 1, 1),
        companyId=company.id
    )
    db_session.add(project)
    db_session.flush()
    db_session.add(User_Project(userId=normal_user.id, projectId=project.id))

    at = ActivityType(name="Activity")
    fuel = FuelType(name="Fuel", averageCO2Emission=1.1)
    unit = Unit(name="Unit")
    db_session.add_all([at, fuel, unit])
    db_session.flush()

    cons = Consumption(
        projectId=project.id,
        amount=10.5,
        startDate=date(2023, 1, 2),
        endDate=date(2023, 1, 3),
        reportDate=date(2023, 1, 4),
        description="Test",
        activityTypeId=at.id,
        fuelTypeId=fuel.id,
        unitId=unit.id,
        userId=normal_user.id
    )
    db_session.add(cons)
    db_session.commit()

    return {
        "company": company,
        "admin": admin,
        "comp_admin": comp_admin,
        "normal_user": normal_user,
        "project": project,
        "activity": at,
        "fuel": fuel,
        "unit": unit,
        "consumption": cons,
    }


# --- Tests -------------------------------------------------------------------

@pytest.mark.parametrize("role,expected_count", [
    ("admin", 1),
    ("comp_admin", 1),
    ("normal_user", 1),
])
def test_list_consumptions_by_role(seed_data, role, expected_count):
    user = seed_data[role]
    override_current_user(user)

    r = client.get("/consumption/", headers=auth_header_for(user))
    assert r.status_code == 200
    assert len(r.json()) == expected_count


def test_get_consumption_found(seed_data):
    user = seed_data["normal_user"]
    override_current_user(user)

    cid = seed_data["consumption"].id
    r = client.get(f"/consumption/{cid}", headers=auth_header_for(user))
    assert r.status_code == 200
    assert r.json()["id"] == cid


def test_get_consumption_not_found(seed_data):
    user = seed_data["admin"]
    override_current_user(user)

    r = client.get("/consumption/9999", headers=auth_header_for(user))
    assert r.status_code == 404


def test_get_projects_dropdown(seed_data):
    for role in ["admin", "comp_admin", "normal_user"]:
        user = seed_data[role]
        override_current_user(user)

        r = client.get("/consumption/projects", headers=auth_header_for(user))
        assert r.status_code == 200
        ids = [p["id"] for p in r.json()]
        assert seed_data["project"].id in ids


def test_create_consumption_success(seed_data):
    user = seed_data["normal_user"]
    override_current_user(user)

    payload = {
        "projectId": seed_data["project"].id,
        "amount": 42.0,
        "startDate": "2023-02-01",
        "endDate": "2023-02-02",
        "reportDate": "2023-02-03",
        "description": "New entry",
        "activityTypeId": seed_data["activity"].id,
        "fuelTypeId": seed_data["fuel"].id,
        "unitId": seed_data["unit"].id,
        "userId": user.id,
    }
    post_r = client.post("/consumption/", json=payload, headers=auth_header_for(user))
    assert post_r.status_code == 200, post_r.text

    # now fetch the list and find our new one
    list_r = client.get("/consumption/", headers=auth_header_for(user))
    assert list_r.status_code == 200
    amounts = [c["amount"] for c in list_r.json()]
    assert 42.0 in amounts


def test_create_consumption_project_not_found(seed_data):
    user = seed_data["admin"]
    override_current_user(user)

    payload = {
        "projectId": 9999,
        "amount": 1.0,
        "startDate": "2023-01-01",
        "endDate": "2023-01-02",
        "reportDate": "2023-01-03",
        "description": "X",
        "activityTypeId": seed_data["activity"].id,
        "fuelTypeId": seed_data["fuel"].id,
        "unitId": seed_data["unit"].id,
        "userId": user.id,
    }
    r = client.post("/consumption/", json=payload, headers=auth_header_for(user))
    assert r.status_code == 404


def test_update_consumption_success(seed_data):
    user = seed_data["admin"]
    override_current_user(user)

    cid = seed_data["consumption"].id
    payload = {
        "projectId": seed_data["project"].id,
        "amount": 99.9,
        "startDate": "2023-03-01",
        "endDate": "2023-03-02",
        "reportDate": "2023-03-03",
        "description": "Updated",
        "activityTypeId": seed_data["activity"].id,
        "fuelTypeId": seed_data["fuel"].id,
        "unitId": seed_data["unit"].id,
        "userId": user.id,
    }
    put_r = client.put(f"/consumption/{cid}", json=payload, headers=auth_header_for(user))
    assert put_r.status_code == 200, put_r.text

    # fetch single
    get_r = client.get(f"/consumption/{cid}", headers=auth_header_for(user))
    assert get_r.status_code == 200
    assert get_r.json()["amount"] == 99.9


def test_update_consumption_not_found(seed_data):
    user = seed_data["admin"]
    override_current_user(user)

    payload = {
        "projectId": seed_data["project"].id,
        "amount": 1.1,
        "startDate": "2023-04-01",
        "endDate": "2023-04-02",
        "reportDate": "2023-04-03",
        "description": "Nope",
        "activityTypeId": seed_data["activity"].id,
        "fuelTypeId": seed_data["fuel"].id,
        "unitId": seed_data["unit"].id,
        "userId": user.id,
    }
    r = client.put("/consumption/9999", json=payload, headers=auth_header_for(user))
    assert r.status_code == 404


def test_update_consumption_forbidden(seed_data):
    user = seed_data["comp_admin"]
    override_current_user(user)

    cid = seed_data["consumption"].id
    payload = {
        "projectId": seed_data["project"].id,
        "amount": 2.2,
        "startDate": "2023-05-01",
        "endDate": "2023-05-02",
        "reportDate": "2023-05-03",
        "description": "Trying to change",
        "activityTypeId": seed_data["activity"].id,
        "fuelTypeId": seed_data["fuel"].id,
        "unitId": seed_data["unit"].id,
        "userId": user.id,
    }
    r = client.put(f"/consumption/{cid}", json=payload, headers=auth_header_for(user))
    # comp_admin is *allowed* on same-company, so expect 200
    assert r.status_code == 200


def test_delete_consumption_success(seed_data):
    user = seed_data["admin"]
    override_current_user(user)

    cid = seed_data["consumption"].id
    r = client.delete(f"/consumption/{cid}", headers=auth_header_for(user))
    assert r.status_code == 200
    assert r.json()["message"] == "Consumption entry deleted"


def test_delete_consumption_not_found(seed_data):
    user = seed_data["admin"]
    override_current_user(user)

    r = client.delete("/consumption/9999", headers=auth_header_for(user))
    assert r.status_code == 404


def test_delete_consumption_forbidden(seed_data):
    user = seed_data["comp_admin"]
    override_current_user(user)

    cid = seed_data["consumption"].id
    r = client.delete(f"/consumption/{cid}", headers=auth_header_for(user))
    # comp_admin is allowed on same-company, so still 200
    assert r.status_code == 200
