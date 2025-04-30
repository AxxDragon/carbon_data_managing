import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app import app
from database import Base, get_db
from models import Company, ActivityType, FuelType, Unit

# --- In-memory SQLite setup -----------------------------------------------

SQLALCHEMY_DATABASE_URL = "sqlite://"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    # Create all tables then drop them at teardown
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    # Override dependency
    def _get_test_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _get_test_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# --- COMPANY tests -------------------------------------------------------

def test_companies_crud(client: TestClient):
    # 1) GET should start empty
    r = client.get("/options/companies")
    assert r.status_code == 200
    assert r.json() == []

    # 2) POST → create
    r = client.post("/options/companies", json={"name": "Acme"})
    assert r.status_code == 200
    co = r.json()
    assert co["name"] == "Acme"
    co_id = co["id"]

    # 3) GET → see our new one
    r = client.get("/options/companies")
    assert any(c["id"] == co_id and c["name"] == "Acme" for c in r.json())

    # 4) PUT → update name
    r = client.put(f"/options/companies/{co_id}", json={"name": "Acme Corp"})
    assert r.status_code == 200

    # 5) GET → confirm the update
    r = client.get("/options/companies")
    assert any(c["id"] == co_id and c["name"] == "Acme Corp" for c in r.json())

    # 6) DELETE → remove it
    r = client.delete(f"/options/companies/{co_id}")
    assert r.status_code == 200
    assert r.json() == {"message": "Company deleted"}

    # 7) DELETE again → 404
    r = client.delete(f"/options/companies/{co_id}")
    assert r.status_code == 404


# --- ACTIVITY TYPE tests --------------------------------------------------

def test_activity_types_crud(client: TestClient):
    r = client.get("/options/activity-types")
    assert r.status_code == 200
    assert r.json() == []

    r = client.post("/options/activity-types", json={"name": "Travel"})
    assert r.status_code == 200
    at = r.json()
    assert at["name"] == "Travel"
    at_id = at["id"]

    r = client.get("/options/activity-types")
    assert any(a["id"] == at_id and a["name"] == "Travel" for a in r.json())

    r = client.put(f"/options/activity-types/{at_id}", json={"name": "Commute"})
    assert r.status_code == 200

    r = client.get("/options/activity-types")
    assert any(a["id"] == at_id and a["name"] == "Commute" for a in r.json())

    r = client.delete(f"/options/activity-types/{at_id}")
    assert r.status_code == 200
    assert r.json() == {"message": "Activity type deleted"}

    r = client.delete(f"/options/activity-types/{at_id}")
    assert r.status_code == 404


# --- FUEL TYPE tests ------------------------------------------------------

def test_fuel_types_crud(client: TestClient):
    r = client.get("/options/fuel-types")
    assert r.status_code == 200
    assert r.json() == []

    payload = {"name": "Diesel", "averageCO2Emission": 2.5}
    r = client.post("/options/fuel-types", json=payload)
    assert r.status_code == 200
    ft = r.json()
    assert ft["name"] == "Diesel"
    assert ft["averageCO2Emission"] == 2.5
    ft_id = ft["id"]

    r = client.get("/options/fuel-types")
    assert any(f["id"] == ft_id and f["name"] == "Diesel" for f in r.json())

    r = client.put(
        f"/options/fuel-types/{ft_id}",
        json={"name": "Biofuel", "averageCO2Emission": 1.8},
    )
    assert r.status_code == 200

    r = client.get("/options/fuel-types")
    assert any(f["id"] == ft_id and f["name"] == "Biofuel" and f["averageCO2Emission"] == 1.8
               for f in r.json())

    r = client.delete(f"/options/fuel-types/{ft_id}")
    assert r.status_code == 200
    assert r.json() == {"message": "Fuel type deleted"}

    r = client.delete(f"/options/fuel-types/{ft_id}")
    assert r.status_code == 404


# --- UNIT tests -----------------------------------------------------------

def test_units_crud(client: TestClient):
    r = client.get("/options/units")
    assert r.status_code == 200
    assert r.json() == []

    r = client.post("/options/units", json={"name": "Kilogram"})
    assert r.status_code == 200
    u = r.json()
    assert u["name"] == "Kilogram"
    u_id = u["id"]

    r = client.get("/options/units")
    assert any(x["id"] == u_id and x["name"] == "Kilogram" for x in r.json())

    r = client.put(f"/options/units/{u_id}", json={"name": "Ton"})
    assert r.status_code == 200

    r = client.get("/options/units")
    assert any(x["id"] == u_id and x["name"] == "Ton" for x in r.json())

    r = client.delete(f"/options/units/{u_id}")
    assert r.status_code == 200
    assert r.json() == {"message": "Unit deleted"}

    r = client.delete(f"/options/units/{u_id}")
    assert r.status_code == 404
