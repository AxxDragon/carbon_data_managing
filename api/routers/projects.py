from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Project, User, Company
from schemas import ProjectSchema, ProjectSubmitSchema
from security import get_current_user
from datetime import date
from logging_config import logger

# Initialize the API router
router = APIRouter()


@router.get("/", response_model=list[ProjectSchema])
def get_projects(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Retrieve projects based on the authenticated user's role.
    - Admin users can view all projects.
    - Company admins can view projects only for their company.
    - Regular users can view projects explicitly assigned to them.
    """
    # Prepare base query with join to include company name
    query = db.query(Project, Company.name.label("company")).join(
        Company, Project.companyId == Company.id
    )

    # Company admins see only their own company's projects
    if user.role == "companyadmin":
        query = query.filter(Project.companyId == user.companyId)

    # Regular users see only projects assigned to them
    elif user.role == "user":
        logger.debug(f"User: {user.projects}")  # Logging for debug/trace
        query = query.filter(Project.id.in_([p.projectId for p in user.projects]))

    projects = query.all()

    # Return serialized project data including dynamic project status
    return [
        ProjectSchema(
            id=proj.id,
            name=proj.name,
            startDate=proj.startDate,
            endDate=proj.endDate,
            status=(
                "Ongoing"
                if proj.endDate is None or proj.endDate >= date.today()
                else "Completed"
            ),
            companyId=proj.companyId,
            company=companyName,
        )
        for proj, companyName in projects
    ]


@router.post("/", response_model=ProjectSchema)
def create_project(
    project_data: ProjectSubmitSchema,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Create a new project.
    - Admins can assign any company ID.
    - Company admins can only create projects for their own company.
    """
    if user.role == "companyadmin":
        project_data.companyId = (
            user.companyId
        )  # Force company ID to current user's company
    elif user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    # Convert empty endDate string to None
    end_date = project_data.endDate if project_data.endDate not in ["", None] else None

    # Create and persist the new project object
    new_project = Project(
        name=project_data.name,
        startDate=project_data.startDate,
        endDate=end_date,
        companyId=project_data.companyId,
    )

    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    # Return project data with computed status and company name
    return ProjectSchema(
        id=new_project.id,
        name=new_project.name,
        startDate=new_project.startDate,
        endDate=end_date,
        status=(
            "Ongoing"
            if new_project.endDate is None or new_project.endDate >= date.today()
            else "Completed"
        ),
        companyId=new_project.companyId,
        company=db.query(Company.name)
        .filter(Company.id == new_project.companyId)
        .scalar(),
    )


@router.put("/{project_id}", response_model=ProjectSchema)
def update_project(
    project_id: int,
    project_data: ProjectSubmitSchema,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Update an existing project by its ID.
    - Company admins can only update their own company’s projects.
    - End date fields with empty string values are converted to None.
    """
    # Retrieve the target project
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Disallow regular users entirely
    if user.role == "user":
        raise HTTPException(status_code=403, detail="Not authorized")

    # Company admins can't edit projects outside their own company
    if user.role == "companyadmin" and project.companyId != user.companyId:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Extract data for update, ignoring unset fields
    update_data = project_data.model_dump(exclude_unset=True)

    # Normalize empty endDate string to None
    if "endDate" in update_data and update_data["endDate"] in ["", None]:
        update_data["endDate"] = None

    # Apply updates to the project model
    for key, value in update_data.items():
        setattr(project, key, value)

    db.commit()
    db.refresh(project)

    # Return updated project info
    return ProjectSchema(
        id=project.id,
        name=project.name,
        startDate=project.startDate,
        endDate=project.endDate,
        status=(
            "Ongoing"
            if project.endDate is None or project.endDate >= date.today()
            else "Completed"
        ),
        companyId=project.companyId,
        company=db.query(Company.name).filter(Company.id == project.companyId).scalar(),
    )


@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Delete a project by ID.
    - Only admins or company admins can delete.
    - Company admins can only delete projects belonging to their own company.
    """
    # Retrieve the project to delete
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Prevent deletion by unauthorized company admins
    if user.role == "companyadmin" and project.companyId != user.companyId:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(project)
    db.commit()
    return {"detail": "Project deleted"}
