from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Project, User, Company
from schemas import ProjectSchema, ProjectSubmitSchema
from security import get_current_user
from datetime import date

router = APIRouter()

@router.get("/", response_model=list[ProjectSchema])
def get_projects(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Admins get all projects, company admins only see their company's projects."""
    query = db.query(Project, Company.name.label("company")).join(Company, Project.companyId == Company.id)
    
    if user.role == "companyadmin":
        query = query.filter(Project.companyId == user.companyId)

    projects = query.all()

    return [
        ProjectSchema(
            id=proj.id,
            name=proj.name,
            startDate=proj.startDate,
            endDate=proj.endDate,
            status="Ongoing" if proj.endDate is None or proj.endDate >= date.today() else "Completed",
            companyId=proj.companyId,
            company=companyName
        ) for proj, companyName in projects
    ]

@router.post("/", response_model=ProjectSchema)
def create_project(project_data: ProjectSubmitSchema, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Admins assign company, companyadmins use their own."""
    if user.role == "companyadmin":
        project_data.companyId = user.companyId
    elif user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    # Convert empty endDate to None
    end_date = project_data.endDate if project_data.endDate not in ["", None] else None

    new_project = Project(
        name=project_data.name,
        startDate=project_data.startDate,
        endDate=end_date,
        companyId=project_data.companyId
    )

    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    return ProjectSchema(
        id=new_project.id,
        name=new_project.name,
        startDate=new_project.startDate,
        endDate=end_date,
        status="Ongoing" if new_project.endDate is None or new_project.endDate >= date.today() else "Completed",
        companyId=new_project.companyId,
        company=db.query(Company.name).filter(Company.id == new_project.companyId).scalar()
    )

@router.put("/{project_id}", response_model=ProjectSchema)
def update_project(
    project_id: int, project_data: ProjectSubmitSchema, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if user.role == "companyadmin" and project.companyId != user.companyId:
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = project_data.model_dump(exclude_unset=True)

    # Convert empty strings to None
    if "endDate" in update_data and update_data["endDate"] in ["", None]:
        update_data["endDate"] = None

    for key, value in update_data.items():
        setattr(project, key, value)

    db.commit()
    db.refresh(project)

    return ProjectSchema(
        id=project.id,
        name=project.name,
        startDate=project.startDate,
        endDate=project.endDate,
        status="Ongoing" if project.endDate is None or project.endDate >= date.today() else "Completed",
        companyId=project.companyId,
        company=db.query(Company.name).filter(Company.id == project.companyId).scalar()
    )

@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if user.role == "companyadmin" and project.companyId != user.companyId:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(project)
    db.commit()
    return {"detail": "Project deleted"}
