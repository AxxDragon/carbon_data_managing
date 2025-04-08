from fastapi import FastAPI
from database import engine, SessionLocal, Base
from fastapi.middleware.cors import CORSMiddleware
from routers import (
    auth,
    consumption,
    invites,
    options,
    projects,
    users,
)  # Importing routes

# Create the FastAPI instance
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allows frontend to access backend
    allow_credentials=True,  # Allows cookies
    allow_methods=["*"],  # Allows all HTTP methods
    allow_headers=["*"],  # Allows all headers
)

# Include the auth routes
app.include_router(auth.router, prefix="/auth")
app.include_router(consumption.router, prefix="/consumption")
app.include_router(invites.router, prefix="/invites")
app.include_router(options.router, prefix="/options")
app.include_router(projects.router, prefix="/projects")
app.include_router(users.router, prefix="/users")

# Create the database tables (this will only run once when you start the app for the first time)
Base.metadata.create_all(bind=engine)


# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
