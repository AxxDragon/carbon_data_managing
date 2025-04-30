import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from app import app
from database import Base, get_db
from models import Company, User, Invite
import routers.invites as invite_router
from security import get_current_user

# --- Test Database Setup -----------------------------------------------------

SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# --- Fixtures & Overrides ----------------------------------------------------

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
    def _get_user_override():
        return user
    return _get_user_override

# --- Seed Data ----------------------------------------------------------------

@pytest.fixture
def seed_data(db_session: Session):
    company = Company(name="TestCo")
    db_session.add(company)
    db_session.flush()

    admin = User(
        firstName="A", lastName="Admin",
        email="admin@test.co", passwordhash="x",
        role="admin", companyId=company.id
    )
    comp_admin = User(
        firstName="C", lastName="Admin",
        email="comp@test.co", passwordhash="x",
        role="companyadmin", companyId=company.id
    )
    normal = User(
        firstName="N", lastName="User",
        email="user@test.co", passwordhash="x",
        role="user", companyId=company.id
    )
    db_session.add_all([admin, comp_admin, normal])
    db_session.commit()

    return {
        "company": company,
        "admin": admin,
        "comp_admin": comp_admin,
        "normal": normal,
    }

# --- Tests --------------------------------------------------------------------

def test_create_invite_as_admin(monkeypatch, client, seed_data):
    calls = []
    monkeypatch.setattr(
        invite_router,
        "send_invite_email",
        lambda email, fn, ln, link: calls.append((email, fn, ln, link))
    )

    app.dependency_overrides[get_current_user] = override_current_user(seed_data["admin"])

    payload = {
        "email": "new@test.co",
        "firstName": "New",
        "lastName": "User",
        "role": "companyadmin",
        "companyId": seed_data["company"].id,
    }
    r = client.post("/invites/", json=payload)
    assert r.status_code == 200, r.text

    data = r.json()
    assert data["email"] == "new@test.co"
    assert data["role"] == "companyadmin"
    assert len(calls) == 1
    assert data["inviteToken"] in calls[0][3]

    app.dependency_overrides.pop(get_current_user, None)

def test_create_invite_as_companyadmin_forces_user_role(monkeypatch, client, seed_data):
    calls = []
    monkeypatch.setattr(
        invite_router,
        "send_invite_email",
        lambda email, fn, ln, link: calls.append((email, fn, ln, link))
    )

    app.dependency_overrides[get_current_user] = override_current_user(seed_data["comp_admin"])

    payload = {
        "email": "force@test.co",
        "firstName": "Force",
        "lastName": "User",
        "role": "admin",
        "companyId": 999,
    }
    r = client.post("/invites/", json=payload)
    assert r.status_code == 200, r.text

    data = r.json()
    assert data["role"] == "user"
    assert data["companyId"] == seed_data["comp_admin"].companyId
    assert len(calls) == 1

    app.dependency_overrides.pop(get_current_user, None)

def test_create_invite_forbidden_for_normal_user(client, seed_data):
    app.dependency_overrides[get_current_user] = override_current_user(seed_data["normal"])

    payload = {
        "email": "x@acme.com",
        "firstName": "X",
        "lastName": "Y",
        "role": "user",
        "companyId": seed_data["company"].id,
    }
    r = client.post("/invites/", json=payload)
    assert r.status_code == 403

    app.dependency_overrides.pop(get_current_user, None)

def test_create_invite_email_in_use(client, seed_data):
    app.dependency_overrides[get_current_user] = override_current_user(seed_data["admin"])
    existing = seed_data["normal"]

    payload = {
        "email": existing.email,
        "firstName": "Dup",
        "lastName": "Licate",
        "role": "user",
        "companyId": existing.companyId,
    }
    r = client.post("/invites/", json=payload)
    assert r.status_code == 400

    app.dependency_overrides.pop(get_current_user, None)

def test_get_invite_by_token_and_expiration(client, db_session, seed_data):
    old = Invite(
        email="old@acme.com", firstName="Old", lastName="One",
        role="user", companyId=seed_data["company"].id,
        inviteToken="OLD", createdAt=datetime.now(timezone.utc) - timedelta(days=31)
    )
    fresh = Invite(
        email="new@acme.com", firstName="New", lastName="One",
        role="user", companyId=seed_data["company"].id,
        inviteToken="NEW", createdAt=datetime.now(timezone.utc)
    )
    db_session.add_all([old, fresh])
    db_session.commit()

    r1 = client.get("/invites/token/OLD")
    assert r1.status_code == 404

    r2 = client.get("/invites/token/NEW")
    assert r2.status_code == 200
    assert r2.json()["inviteToken"] == "NEW"

def test_get_pending_invites(client, db_session, seed_data):
    i1 = Invite(
        email="a@co.com", firstName="A", lastName="One",
        role="user", companyId=seed_data["company"].id,
        inviteToken="T1", createdAt=datetime.now(timezone.utc)
    )
    other_co = Company(name="OtherCo")
    db_session.add(other_co)
    db_session.flush()
    i2 = Invite(
        email="b@other.com", firstName="B", lastName="Two",
        role="user", companyId=other_co.id,
        inviteToken="T2", createdAt=datetime.now(timezone.utc)
    )
    db_session.add_all([i1, i2])
    db_session.commit()

    app.dependency_overrides[get_current_user] = override_current_user(seed_data["admin"])
    r_admin = client.get("/invites/")
    assert r_admin.status_code == 200
    tokens = {inv["inviteToken"] for inv in r_admin.json()}
    assert tokens == {"T1", "T2"}
    app.dependency_overrides.pop(get_current_user, None)

    app.dependency_overrides[get_current_user] = override_current_user(seed_data["comp_admin"])
    r_comp = client.get("/invites/")
    assert r_comp.status_code == 200
    tokens = {inv["inviteToken"] for inv in r_comp.json()}
    assert tokens == {"T1"}
    app.dependency_overrides.pop(get_current_user, None)

def test_delete_and_resend_invite(monkeypatch, db_session, seed_data, client):
    calls = []
    monkeypatch.setattr(
        invite_router,
        "send_invite_email",
        lambda email, fn, ln, link: calls.append(link)
    )

    # Create and add the invite
    inv = Invite(
        email="z@acme.com", firstName="Z", lastName="Zap",
        role="user", companyId=seed_data["company"].id,
        inviteToken="TOK", createdAt=datetime.now(timezone.utc)
    )
    db_session.add(inv)
    db_session.commit()

    # Override current user to admin
    app.dependency_overrides[get_current_user] = override_current_user(seed_data["admin"])

    # Delete the invite
    r_del = client.delete(f"/invites/{inv.id}")
    assert r_del.status_code == 200

    # Re-add & resend
    new_inv = Invite(
        email="z@acme.com", firstName="Z", lastName="Zap",
        role="user", companyId=seed_data["company"].id,
        inviteToken="TOK2", createdAt=datetime.now(timezone.utc)
    )
    db_session.add(new_inv)
    db_session.commit()

    r_resend = client.post(f"/invites/{new_inv.id}/resend")
    assert r_resend.status_code == 200

    # The last email link must end with the new token
    assert calls and calls[-1].endswith(new_inv.inviteToken)

    # Clean up the override
    app.dependency_overrides.pop(get_current_user, None)
