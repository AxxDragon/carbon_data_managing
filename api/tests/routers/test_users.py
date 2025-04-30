import pytest
from datetime import date, datetime, timezone

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app import app
from database import Base, get_db
from models import Company, User, Project, User_Project, Invite
from security import get_current_user, hash_password

# --- Test DB Setup ----------------------------------------------------------

SQLALCHEMY_DATABASE_URL = "sqlite://"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

def override_current_user(user: User):
    def _get_user():
        return user
    return _get_user

# --- Seed Data --------------------------------------------------------------

@pytest.fixture
def seed_data(db_session: Session):
    co1 = Company(name="Alpha")
    co2 = Company(name="Beta")
    db_session.add_all([co1, co2])
    db_session.flush()

    admin = User(
        firstName="Admin", lastName="One",
        email="admin@a.com", passwordhash=hash_password("x"),
        role="admin", companyId=co1.id
    )
    comp_admin = User(
        firstName="Comp", lastName="One",
        email="comp@a.com", passwordhash=hash_password("x"),
        role="companyadmin", companyId=co1.id
    )
    normal = User(
        firstName="Norm", lastName="One",
        email="norm@a.com", passwordhash=hash_password("x"),
        role="user", companyId=co2.id
    )
    db_session.add_all([admin, comp_admin, normal])
    db_session.flush()

    p1 = Project(
        name="Proj1",
        startDate=date(2023, 1, 1),
        endDate=date(2023, 12, 31),
        companyId=co1.id
    )
    p2 = Project(
        name="Proj2",
        startDate=date(2023, 2, 1),
        endDate=date(2023, 11, 30),
        companyId=co2.id
    )
    db_session.add_all([p1, p2])
    db_session.flush()

    db_session.add(User_Project(userId=normal.id, projectId=p2.id))
    db_session.commit()

    return {
        "co1": co1, "co2": co2,
        "admin": admin, "comp_admin": comp_admin, "normal": normal,
        "p1": p1, "p2": p2
    }

# --- Tests ------------------------------------------------------------------

def test_get_users_list_roles(client, seed_data):
    app.dependency_overrides[get_current_user] = override_current_user(seed_data["admin"])
    r = client.get("/users/")
    assert r.status_code == 200
    assert len(r.json()) == 3

    app.dependency_overrides[get_current_user] = override_current_user(seed_data["comp_admin"])
    r = client.get("/users/")
    assert {u["email"] for u in r.json()} == {"admin@a.com", "comp@a.com"}

    app.dependency_overrides[get_current_user] = override_current_user(seed_data["normal"])
    r = client.get("/users/")
    assert len(r.json()) == 3

def test_get_me_and_get_user_by_id(client, seed_data):
    app.dependency_overrides[get_current_user] = override_current_user(seed_data["normal"])
    r = client.get("/users/me")
    assert r.status_code == 200
    assert r.json()["email"] == "norm@a.com"

    app.dependency_overrides[get_current_user] = override_current_user(seed_data["comp_admin"])
    r = client.get(f"/users/{seed_data['normal'].id}")
    assert r.status_code == 403

    app.dependency_overrides[get_current_user] = override_current_user(seed_data["admin"])
    r = client.get(f"/users/{seed_data['normal'].id}")
    assert r.status_code == 200
    assert r.json()["email"] == "norm@a.com"

    r = client.get("/users/9999")
    assert r.status_code == 404

def test_create_user_via_invite(client, db_session):
    inv = Invite(
        email="new@a.co", firstName="New", lastName="User",
        role="user", companyId=1,
        inviteToken="TOK", createdAt=datetime.now(timezone.utc)
    )
    db_session.add(inv)
    db_session.commit()

    r = client.post("/users/", json={"inviteToken":"BAD","password":"pw"})
    assert r.status_code == 404

    r = client.post("/users/", json={"inviteToken":"TOK","password":"pw"})
    assert r.status_code == 200
    j = r.json()
    assert j["email"] == "new@a.co"
    assert db_session.query(Invite).filter_by(inviteToken="TOK").first() is None

def test_update_user_and_projects(client, seed_data):
    # include "id" in the payload so UserSchema validation passes
    app.dependency_overrides[get_current_user] = override_current_user(seed_data["admin"])
    comp = seed_data["comp_admin"]
    upd = {
        "id": comp.id,
        "firstName": "CA",
        "lastName": "Dmin",
        "email": comp.email,
        "role": comp.role,
        "companyId": comp.companyId,
        "projects": [seed_data["p1"].id],
    }
    r = client.put(f"/users/{comp.id}", json=upd)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["firstName"] == "CA"
    assert seed_data["p1"].id in data["projects"]

    app.dependency_overrides[get_current_user] = override_current_user(seed_data["comp_admin"])
    r2 = client.put(f"/users/{seed_data['normal'].id}", json=upd)
    assert r2.status_code == 403

    app.dependency_overrides[get_current_user] = override_current_user(seed_data["admin"])
    r3 = client.put("/users/9999", json=upd)
    assert r3.status_code == 404

def test_delete_user_and_get_projects(client, seed_data):
    app.dependency_overrides[get_current_user] = override_current_user(seed_data["admin"])
    r = client.delete(f"/users/{seed_data['normal'].id}")
    assert r.status_code == 200

    r2 = client.get(f"/users/{seed_data['normal'].id}")
    assert r2.status_code == 404

    db: Session = TestingSessionLocal()
    db.add(User_Project(userId=seed_data["comp_admin"].id, projectId=seed_data["p1"].id))
    db.commit()

    app.dependency_overrides[get_current_user] = override_current_user(seed_data["comp_admin"])
    r3 = client.get(f"/users/{seed_data['comp_admin'].id}/projects")
    assert r3.status_code == 200
    assert any(p["id"] == seed_data["p1"].id for p in r3.json())

    r4 = client.get("/users/9999/projects")
    assert r4.status_code == 404
