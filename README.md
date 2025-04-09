# CARMA

**Carbon Emission Data Management Tool**

CARMA helps companies track and manage their carbon-emission-producing resource consumption. It offers a secure, role-based system for managing users, projects, and consumption data with powerful visualizations and granular access control.

---

## 📦 Installation

### Prerequisites

- Docker & Docker Compose  
- Node.js & npm/yarn (for frontend development)

### 🐳 Getting Started with Docker

1. Install Docker Desktop  
2. Clone the repo  
3. Run:

    docker-compose up --build

### Access

- **Frontend**: [http://localhost:3000](http://localhost:3000)  
- **Backend (FastAPI docs)**: [http://localhost:8000/docs](http://localhost:8000/docs)  
- **MailHog UI**: [http://localhost:8025](http://localhost:8025)

---

## 🚀 Features

- **Invite-only registration** with secure token-based sign-up  
- **JWT-based authentication** with refresh tokens  
- **Role-based access control** (Admin, Company Admin, User)  
- **Consumption data tracking** with CRUD functionality  
- **Data visualizations** via interactive graphs  
- **Filtering and user-specific data views**  
- **User, company, and project management** (Admin/Company Admin)  
- **Manage dropdown options** like companies, fuel types, and units (Admin only)  
- **Responsive frontend** built with React + Bootstrap  
- **Fully containerized** using Docker  
- **Mail testing** with MailHog  
- **Test coverage** using `pytest`  

---

## 🛠️ Tech Stack

**Backend**  
- Python, FastAPI  
- SQLAlchemy & SQLite  
- JWT Auth (python-jose)  
- Dockerized with Uvicorn  
- Email handling for development via MailHog  

**Frontend**  
- React + TypeScript  
- Zustand for state management  
- React Query for server state  
- Bootstrap for styling  
- Recharts for data visualizations  

---

## 🧪 Testing

Backend tests are written using `pytest` and cover key functionality like authentication, permissions, and core API routes. Additional tests are being added continuously.

To run backend tests:

    pytest

(Or use your IDE’s testing UI — e.g., VSCode)

---

## 📁 Project Structure

project-root/
│
├── api/               # Backend (FastAPI, models, routes, tests)
│   ├── tests/         # Pytest test files
│   └── ...
│
├── frontend/          # React frontend
│   └── ...
│
├── docker-compose.yml
├── README.md
└── documentation.md   # Extended technical docs (WIP)


## 🔒 Roles & Permissions

| Role              | Access Level                                                                     |
|-------------------|----------------------------------------------------------------------------------|
| **Admin**         | Full access to all data, user/project/company/option management                  |
| **Company Admin** | Access limited to their company; can manage users and projects within it         |
| **User**          | View-only access to their project consumption data; can manage their own entries |

---

## 📄 License

This project is licensed under the [MIT License](https://choosealicense.com/licenses/mit/).

---

## 🤝 Credits

Huge shoutout to [ChatGPT](https://openai.com/chatgpt) — most of the backend logic, frontend functionality and test files were created with AI assistance. The final product was crafted with care and refined manually through many iterative hours.