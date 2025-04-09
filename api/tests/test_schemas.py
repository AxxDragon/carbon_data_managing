import pytest
from datetime import date, datetime
from schemas import (
    LoginSchema,
    ConsumptionSchema,
    ConsumptionSubmitSchema,
    CompanySchema,
    ActivityTypeSchema,
    FuelTypeSchema,
    UnitSchema,
    ProjectSchema,
    ProjectSubmitSchema,
    UserSchema,
    UserSubmitSchema,
    InviteSchema,
    InviteSubmitSchema,
)


def test_login_schema_valid():
    data = {"email": "test@example.com", "password": "secret123"}
    schema = LoginSchema(**data)
    assert schema.email == "test@example.com"
    assert schema.password == "secret123"


def test_consumption_submit_schema_valid():
    data = {
        "projectId": 1,
        "amount": 123.45,
        "startDate": date.today(),
        "endDate": date.today(),
        "reportDate": date.today(),
        "description": "Test description",
        "activityTypeId": 2,
        "fuelTypeId": 3,
        "unitId": 4,
        "userId": 5,
    }
    schema = ConsumptionSubmitSchema(**data)
    assert schema.amount == 123.45


def test_company_schema():
    schema = CompanySchema(name="Green Co.")
    assert schema.name == "Green Co."


def test_fuel_type_schema():
    schema = FuelTypeSchema(name="Diesel", averageCO2Emission=2.68)
    assert schema.name == "Diesel"
    assert schema.averageCO2Emission == 2.68


def test_user_submit_schema():
    schema = UserSubmitSchema(inviteToken="abc123", password="securepass")
    assert schema.inviteToken == "abc123"


def test_invite_submit_schema_invalid_email():
    with pytest.raises(ValueError):
        InviteSubmitSchema(
            email="notanemail",
            firstName="Jane",
            lastName="Doe",
            role="user",
            companyId=1,
        )
