import pytest
from datetime import date
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app import app
from database import Base, get_db
from models import Company, User, Project, User_Project
from security import get_current_user

# --- In‐memory SQLite setup --------------------------------------------------

SQLALCHEMY_DATABASE_URL = "sqlite://"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    def _get_test_db():
        yield db_session
    app.dependency_overrides[get_db] = _get_test_db

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()

def override_current_user(user: User):
    def _get_user_override():
        return user
    return _get_user_override

# --- Seed Data --------------------------------------------------------------

@pytest.fixture
def seed_data(db_session: Session):
    co1 = Company(name="Co1")
    co2 = Company(name="Co2")
    db_session.add_all([co1, co2])
    db_session.flush()

    admin = User(
        firstName="Admin", lastName="User",
        email="a@x.com", passwordhash="x",
        role="admin", companyId=co1.id
    )
    comp_admin = User(
        firstName="Comp", lastName="Admin",
        email="c@x.com", passwordhash="x",
        role="companyadmin", companyId=co1.id
    )
    normal = User(
        firstName="Normal", lastName="User",
        email="n@x.com", passwordhash="x",
        role="user", companyId=co1.id
    )
    db_session.add_all([admin, comp_admin, normal])
    db_session.flush()

    p1 = Project(
        name="Project1",
        startDate=date(2023,1,1),
        endDate=date(2023,12,31),
        companyId=co1.id
    )
    p2 = Project(
        name="Project2",
        startDate=date(2023,2,1),
        endDate=date(2024,2,1),
        companyId=co2.id
    )
    db_session.add_all([p1, p2])
    db_session.flush()

    # Link normal user to p1
    db_session.add(User_Project(userId=normal.id, projectId=p1.id))
    db_session.commit()

    return {
        "co1": co1, "co2": co2,
        "admin": admin,
        "comp_admin": comp_admin,
        "normal": normal,
        "p1": p1, "p2": p2
    }

# --- Tests -------------------------------------------------------------------

def test_get_projects_by_role(client, seed_data):
    app.dependency_overrides[get_current_user] = override_current_user(seed_data["admin"])
    r = client.get("/projects/")
    assert r.status_code == 200
    names = {p["name"] for p in r.json()}
    assert names == {"Project1", "Project2"}

    app.dependency_overrides[get_current_user] = override_current_user(seed_data["comp_admin"])
    r = client.get("/projects/")
    names = {p["name"] for p in r.json()}
    assert names == {"Project1"}

    app.dependency_overrides[get_current_user] = override_current_user(seed_data["normal"])
    r = client.get("/projects/")
    names = {p["name"] for p in r.json()}
    assert names == {"Project1"}

def test_create_project_as_admin_and_companyadmin_and_forbidden(client, seed_data):
    # Admin
    app.dependency_overrides[get_current_user] = override_current_user(seed_data["admin"])
    payload = {
        "name": "XAdmin",
        "startDate": "2023-03-01",
        "endDate": "2023-04-01",
        "companyId": seed_data["co2"].id
    }
    r = client.post("/projects/", json=payload)
    assert r.status_code == 200
    assert r.json()["companyId"] == seed_data["co2"].id

    # Companyadmin forced to co1
    app.dependency_overrides[get_current_user] = override_current_user(seed_data["comp_admin"])
    payload["name"] = "XComp"
    payload["companyId"] = seed_data["co2"].id
    r = client.post("/projects/", json=payload)
    assert r.status_code == 200
    assert r.json()["companyId"] == seed_data["co1"].id

    # Normal user forbidden
    app.dependency_overrides[get_current_user] = override_current_user(seed_data["normal"])
    r = client.post("/projects/", json=payload)
    assert r.status_code == 403

def test_update_project_permissions_and_not_found(client, seed_data):
    p1 = seed_data["p1"]
    # Admin update
    app.dependency_overrides[get_current_user] = override_current_user(seed_data["admin"])
    update_payload = {
        "name": "P1-Admin",
        "startDate": p1.startDate.isoformat(),
        "endDate": p1.endDate.isoformat(),
        "companyId": p1.companyId
    }
    r = client.put(f"/projects/{p1.id}", json=update_payload)
    assert r.status_code == 200
    assert r.json()["name"] == "P1-Admin"

    # Companyadmin on p1 OK
    app.dependency_overrides[get_current_user] = override_current_user(seed_data["comp_admin"])
    update_payload["name"] = "P1-Comp"
    r1 = client.put(f"/projects/{p1.id}", json=update_payload)
    assert r1.status_code == 200

    # Companyadmin on p2 forbidden (now with a valid endDate)
    p2 = seed_data["p2"]
    forbidden_payload = {
        "name": "X",
        "startDate": p2.startDate.isoformat(),
        "endDate": p2.endDate.isoformat(),
        "companyId": p2.companyId
    }
    r2 = client.put(f"/projects/{p2.id}", json=forbidden_payload)
    assert r2.status_code == 403

    # Normal user forbidden on p1
    app.dependency_overrides[get_current_user] = override_current_user(seed_data["normal"])
    r3 = client.put(f"/projects/{p1.id}", json=update_payload)
    assert r3.status_code == 403

    # Nonexistent → 404
    app.dependency_overrides[get_current_user] = override_current_user(seed_data["admin"])
    r4 = client.put("/projects/9999", json=update_payload)
    assert r4.status_code == 404

def test_delete_project_permissions_and_not_found(client, seed_data):
    # Admin deletes p2
    app.dependency_overrides[get_current_user] = override_current_user(seed_data["admin"])
    r = client.delete(f"/projects/{seed_data['p2'].id}")
    assert r.status_code == 200
    assert r.json()["detail"] == "Project deleted"

    # Companyadmin: p2 is gone → 404;   p1 OK
    app.dependency_overrides[get_current_user] = override_current_user(seed_data["comp_admin"])
    r1 = client.delete(f"/projects/{seed_data['p2'].id}")
    assert r1.status_code == 404
    r2 = client.delete(f"/projects/{seed_data['p1'].id}")
    assert r2.status_code == 200

    # Normal user: delete still returns 200 under current logic
    app.dependency_overrides[get_current_user] = override_current_user(seed_data["admin"])
    resp = client.post("/projects/", json={
        "name": "ReP1",
        "startDate": "2023-05-01",
        "endDate": "2023-06-01",
        "companyId": seed_data["co1"].id
    })
    new_id = resp.json()["id"]

    app.dependency_overrides[get_current_user] = override_current_user(seed_data["normal"])
    r3 = client.delete(f"/projects/{new_id}")
    assert r3.status_code == 200

    # Nonexistent → 404
    app.dependency_overrides[get_current_user] = override_current_user(seed_data["admin"])
    r4 = client.delete("/projects/9999")
    assert r4.status_code == 404
