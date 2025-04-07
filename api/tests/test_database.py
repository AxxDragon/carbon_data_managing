from database import get_db
from sqlalchemy.orm import Session


# Test that a database connection can be established
def test_get_db():
    # Use the dependency to get a DB session
    db = next(get_db())

    # Assert that the db is a valid Session instance
    assert isinstance(db, Session)

    assert db is not None

    # Cleanup: Ensure session is closed after test
    db.close()
