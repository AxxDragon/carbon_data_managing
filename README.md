# CarMa

**Carbon Emission Data  
Management Tool**

CarMa helps companies track and manage their carbon-emission-producing resource consumption. It offers a secure, role-based system for managing users, projects, and consumption data with powerful visualizations and granular access control.

---

## 📦 Installation

### Prerequisites

- Docker & Docker Compose  
- Node.js & npm/yarn (for frontend development)

### 🐳 Getting Started with Docker

1. Clone the repo  
2. Install and run Docker Desktop  
3. Run:

   docker-compose up --build

### Access

- **Frontend**: http://localhost:3000  
- **Backend (FastAPI docs)**: http://localhost:8000/docs  
- **MailHog UI**: http://localhost:8025

---

## 🚀 Features

- **Invite-only registration** with secure token-based sign-up  
- **JWT-based authentication** with refresh tokens  
- **Role-based access control** (Admin, Company Admin, User)  
- **Consumption data tracking** with full CRUD  
- **Data visualizations** via interactive graphs  
- **Filtering and user-specific data views**  
- **User, company, and project management** (Admin/Company Admin)  
- **Manage dropdown options** like companies, fuel types, and units (Admin only)  
- **Responsive frontend** built with React + Bootstrap  
- **Fully containerized** using Docker  
- **Mail testing** with MailHog  

---

## 🧪 Testing

### Backend

We have comprehensive backend tests covering authentication, authorization, core CRUD endpoints, and utility functions:

- Run all backend tests:

  pytest

- Test coverage report (optional):

  pytest --cov=api --cov-report=html

### Frontend

The React/TypeScript frontend includes unit and integration tests for components, hooks, and API interactions:

- Run frontend tests:

  cd frontend  
  npm test  
  or  
  yarn test

- Watch mode (re-runs on file changes):

  npm test -- --watchAll

---

## 📁 Project Structure

project-root/  
│  
├── api/                      # Backend (FastAPI app, models, routers, tests)  
│   ├── routers/              # API endpoint definitions  
│   ├── schemas/              # Pydantic models  
│   ├── utils/                # Email & logging helpers  
│   └── tests/                # Pytest test suites  
│  
├── frontend/                 # React + TypeScript app  
│   ├── src/                  # Components, hooks, pages, tests  
│   └── public/               # Static assets  
│  
├── docker-compose.yml  
├── Dockerfile                # Backend container  
├── frontend/Dockerfile  
├── README.md  
├── original_assignment.pdf   # PDF with the original assignment
└── documentation.md          # Extended technical docs & architecture  

---

## 🔒 Roles & Permissions

| Role              | Access Level                                                                                 |
|-------------------|----------------------------------------------------------------------------------------------|
| **Admin**         | Full access to all data and settings, including user/project/company/option management       |
| **Company Admin** | Limited to their own company; can manage users and projects within it                        |
| **User**          | View and manage their own consumption entries; read-only across other data of their projects |

---

## 📄 License

This project is licensed under the [MIT License](https://choosealicense.com/licenses/mit/).

---

## 🤝 Credits

Huge shout-out to ChatGPT — most of the backend logic, frontend functionality, and test files were bootstrapped with AI assistance. The final product was crafted with care and refined manually through many iterative hours.
