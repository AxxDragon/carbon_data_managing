# CARMA Documentation

**Track and manage your company's carbon footprint effortlessly.**


---

## Table of Contents

1. Project Introduction  
2. Setup Instructions  
3. Backend Overview  
4. Frontend Overview  
5. Usage  
6. Development Process  
7. Possible Improvements  


---

## 1. Project Introduction

CARMA (Carbon Management Application) is a full-stack web application that allows companies to track, manage, and analyze their carbon emissions data. Designed with usability and clarity in mind, it supports role-based access, data visualization, and project-level tracking of carbon consumption.

### 🔑 Core Features
- JWT-based authentication with three roles: Admin, Company Admin, and User
- Secure login & user management (invite-only system)
- Company and project-level organization of emissions data
- CRUD operations for consumption records
- Charts and graphs for visualizing carbon usage trends
- Email integration using MailHog for local development

### 🧱 Tech Stack Overview

#### Backend
- **Framework**: FastAPI
- **Database**: SQLite (via SQLAlchemy ORM)
- **Auth**: JWT (access & refresh tokens), bcrypt for hashing
- **Testing**: Pytest + HTTPX + unittest.mock
- **Containerization**: Docker + Docker Compose

#### Frontend
- **Framework**: React with TypeScript
- **Styling**: Bootstrap
- **API Integration**: Axios
- **Testing**: (To be added)

### 🧭 User Capabilities
- Register via invitation and confirm email address
- Log in and manage account based on user role
- Create/edit/delete/view consumption entries
- View emissions dashboards and trends
- Admins can manage users, companies, and projects


---

## 2. Setup Instructions

This section explains how to get CARMA up and running both with and without Docker, including environment setup and dependencies.

### 🔧 Prerequisites
- Python 3.11+
- Node.js + npm
- Docker and Docker Compose
- Git

### 🐳 Docker Setup (Recommended)

1. Clone the repository:
    
       git clone https://github.com/AxxDragon/carbon_data_managing.git
       cd carbon_data_managing

2. Start the app using Docker Compose:

       docker-compose up --build

3. Visit the app:

       Frontend: http://localhost:3000
       Backend (API docs): http://localhost:8000/docs
       MailHog (email testing): http://localhost:8025

### 💻 Local Setup (Without Docker)

#### Backend

1. Create a virtual environment:

       python -m venv venv
       source venv/bin/activate   # Windows: venv\Scripts\activate

2. Install dependencies:

       pip install -r requirements.txt

3. Run the backend:

       uvicorn api.app:app --reload

4. Visit FastAPI Docs:

       http://localhost:8000/docs

#### Frontend

1. Navigate to the frontend directory:

       cd frontend

2. Install dependencies:

       npm install

3. Start the frontend:

       npm run dev

4. Visit the app:

       http://localhost:3000


---

### Part 3: Backend Overview

The backend of CARMA is built with **FastAPI**, using **SQLAlchemy** for ORM and **SQLite** for local development. It's fully containerized with Docker and designed with clean, modular structure and clear separation of concerns.

---

#### 🗃️ Database Models

The main SQLAlchemy models are:

- **Company**
- **User**
- **Invite**
- **Project**
- **User_Project** (association table)
- **ActivityType**
- **FuelType**
- **Unit**
- **Consumption**

---

#### 📁 Routers

Each module under `api/routers/` handles a distinct part of the application:

- `auth.py`: Login, logout, token refresh.
- `users.py`: CRUD for users, user invite setup via invites.
- `invites.py`: Create/edit/delete/resend invites (admin + companyadmin only).
- `projects.py`: Project CRUD.
- `consumption.py`: Submit, retrieve, edit and delete consumption data.
- `options.py`: Retrieve and manage available options (activity types, fuel types, units, etc.).

---

#### 🔐 Authentication & Authorization

Auth is handled with JWT (access + refresh tokens) and `bcrypt` for password hashing. Tokens are issued on login and stored securely client-side.

**Invite + Registration Flow:**

1. **Who can invite?** Admins can invite companyadmins and users; companyadmins can invite users.
2. **What happens?** The invited user's data (except password) is stored in the `Invite` model, and a link to complete the account setup with a unique token is emailed to them.
3. **How does it work?** If the token is used within 30 days, the user sets a password and completes registration.

**Authorization** is role-based and handled via `Depends(get_current_user)` in each route, checking the `User.role` field manually or within helper logic.

---

#### ⚠️ Error Handling

The backend relies on FastAPI’s built-in exception handling. Errors like 401/403/404 are raised in routes and helpers using `HTTPException`.

---

#### ⚙️ Environment Configuration

Settings are loaded via a `.env` file. It includes:

- `SMTP_HOST` and `SMTP_PORT` (for local email via MailHog)

---

#### 📧 Emails

Only one type of email is sent: **invitation emails**. These contain a secure token link for the invited user to register. Emails are sent via `email_utils.py` using the `smtplib` library and are visible in **MailHog** during development.

---

#### 🔍 Data Validation

The app uses **Pydantic** for request and response validation:

- Email fields use `EmailStr`.
- Schemas define `response_model` for most routes to enforce output structure and security (e.g., hiding password hashes).

---

#### 🐳 Docker Setup

The backend is containerized with a `Dockerfile` and launched via `docker-compose.yml`, which also includes:

- **MailHog** for email testing
- The **frontend container**
- **SQLite** used as a local file-based DB (volume-mounted)

The `Dockerfile` installs dependencies, runs migrations, and starts the FastAPI app with Uvicorn.

---

#### 🧪 Testing

Backend tests are written with **pytest** and are located in `api/tests/`.

- Uses `httpx.AsyncClient` for integration tests.
- Includes a shared `conftest.py` for database mocking and dependency overrides.
- Some CRUD routes still need tests (notably `projects.py`, `users.py`, and `invites.py`).

Test coverage is improving and structured by router, with fixtures and mock users used throughout.


---

## 4. Frontend Overview

The frontend of CARMA is built using **React** with **TypeScript**, utilizing **Bootstrap** for styling. It is structured to offer a clean, user-friendly interface, with components and pages that allow users to interact with the carbon management system efficiently.

### 📁 Folder Structure

The `frontend/src` folder is organized as follows:

- **`components/`**: Contains reusable UI components such as `Header.tsx`, `Footer.tsx`, and `Layout.tsx`.
- **`context/`**: Houses `AuthContext.tsx`, which is responsible for managing user authentication state across the app.
- **`pages/`**: Each file in this folder represents a route in the app. Key pages include:
  - `LoginPage.tsx`: Login form for users.
  - `ConsumptionList.tsx`: Displays the list of carbon consumption records.
  - `ConsumptionForm.tsx`: Form to add or edit consumption records.
  - `Analyze.tsx`: A page for viewing the carbon emissions data analysis.
  - `TimeOutPage.tsx`: Shown when a user session expires.
  - `LogoutPage.tsx`: Handles the user logout process.
- **`utils/`**: Includes utility function `api.ts` for handling API requests, including authentication headers.
- **`routes.tsx`**: Defines the routing logic for the app, linking URLs to the appropriate page components.
- **`index.tsx`**: The entry point for the application, where the main `App` component is rendered.

### 🧭 State Management

The frontend uses **React Context** to manage user authentication state globally through the `AuthContext.tsx`. This context provides the ability to check if a user is logged in and retrieve their role, allowing conditional rendering and restricting access to specific pages based on user roles.

### 📡 API Integration

The frontend communicates with the backend API via **Axios**. The `api.ts` utility centralizes API calls and includes logic to handle authentication by automatically attaching JWT tokens to request headers.

Key API calls include:

- **Login**: Authenticates a user and stores the JWT tokens.
- **Consumption Data**: Fetches, adds, updates, and deletes consumption records.
- **User Data**: Used for user profile management.
- **Project Data**: For managing the projects available.

### 🎨 UI & Styling

The app utilizes **Bootstrap** for responsive and appealing design. Bootstrap's grid system and utility classes are used to streamline the layout of pages, ensuring a consistent, user-friendly experience across different screen sizes.

### 🔑 Authentication & Role-Based Access

The frontend integrates seamlessly with the backend's JWT-based authentication system. On login, users are provided with an access token, which is stored in local storage and is short-lived, and a refresh token, which is stored in a cookie and used to refresh expired access tokens. Those tokens are used for subsequent API requests.

Role-based access is implemented by checking the user’s role within the `AuthContext.tsx` and conditionally rendering UI elements or restricting access to certain pages. The roles supported are:

- **Admin**: Full access to all data and user management functionalities.
- **Company Admin**: Can manage users and projects within their company.
- **User**: Limited access to consumption data and analysis of projects they are assigned to and edit/delete functionality only for self-created entrys.

### 🧪 Testing

Frontend tests are planned but not yet implemented. Testing will focus on key UI components, form validation, and API interaction. Future work includes setting up **Jest** and **React Testing Library** for component testing.


---

## 5. Usage

Once logged in, users are directed to the **Consumption List** page. The following outlines the general usage flow for each user type:

### User Workflow
After logging in, **users** are redirected to the **Consumption List** page. Here they can:

- View a list of all consumption entries across the projects they are assigned to.
- The list is **searchable**, **sortable**, and **paginated**, allowing users to find specific entries easily.
- Users can **edit** or **delete** only the consumption entries they created themselves.
- Users can create new consumption entries by clicking the **blue "+ Add Consumption" button** at the top of the list.

Additionally, users can navigate to the **Analyze** tab, where they can:

- View a list of all the projects they are assigned to.
- Select a project to see a graph visualizing the consumption of various fuel types, along with an **average CO2 emission** calculated from the consumption, over time.

### Company Admin Workflow
After logging in, **company admins** are also directed to the **Consumption List** page. However, their experience includes:

- Viewing, **editing**, and **deleting** all consumption entries within the projects of their company.
- Access to graphs for **all the projects** in the company, and an additional graph that displays the **entire company's consumption** (combining all project data).

Company admins can also access several management tabs in the navigation:

1. **Manage Projects**: Create, edit, or delete projects within their company.
2. **Invite**: Send invites to new users, as well as manage (edit, resend, or delete) pending invites for users within their company.
3. **Manage Users**: Assign or unassign users to projects within their company, and manage user information.

### Admin Workflow
After logging in, **admins** are directed to the **Consumption List** page, where:

- Admins can view, **edit**, and **delete** any consumption entry in the database.
- A **company column** appears in all lists, allowing admins to view and manage data across all companies.

Admins have access to all the same features as company admins, but for **every company** in the system. In addition, admins can:

- Invite new users as **company admins**.
- navigate to the **Manage Options** tab, where they can:
  - Create, edit, and delete **companies**, **activity types**, **fuel types**, and **units**.
    - These options are used in dropdown menus throughout the app.

### Invitation and Account Completion Flow
When a new user is invited:

1. The invited user receives an **email** with a link to a page for completing their account setup.
2. The user is required to **set a password** and confirm it. All other user information (except the password) has already been entered during the invitation creation.
3. Upon successful account creation, the user is redirected to the **login page**.

Once logged in, the user can begin interacting with the app based on their assigned role (Users need to get assigned to one or more projects by their Company Admin to be able to use the website in a meaningful way).


---

## 6. Development Process

This project was developed as part of a full-stack take-home assessment, with the goal of showcasing practical skills across backend and frontend development, architecture design, testing, and DevOps. The assessment was open-ended but provided a basic scenario, requiring a web service to track and manage carbon usage data, with a modern frontend and fully functional REST API. Work on the project started on February 10th, 2025, and was completed by the April 10th deadline, totaling approximately 160 hours of focused work.

I approached the project with prior experience in JavaScript and Python, having just completed my software development apprenticeship. However, many of the tools and frameworks I used in this project — such as FastAPI, React with TypeScript, SQLAlchemy, Docker, and JWT authentication — were new to me. I had never before built a full-stack application of this scope completely on my own. The learning curve was steep, but I navigated it using online documentation, tutorials, and ChatGPT to acquire the knowledge I needed in real time. This independent self-learning process is one of the most valuable aspects of the project and something I consider a key strength.

I started by outlining the desired functionality and designing a database structure that could support it. After experimenting with a few options, I settled on SQLite, which was lightweight and simple to set up for the current scope, while still leaving room for future migration if needed. Thanks to SQLAlchemy’s ORM and FastAPI’s tight integration, changes to the database could be managed efficiently.

I built the backend and frontend in parallel, progressing one feature/page at a time. For each new page, I began by creating the necessary API endpoints in FastAPI, followed by building the associated frontend logic and interface in React with TypeScript. This iterative development pattern allowed for fast manual testing and debugging. I began with authentication and login, followed by the consumption listing and form functionality. Once the core CRUD operations were in place, I expanded to more complex features such as the user invitation flow with secure invite tokens sent via email, and the analysis page with graphical data visualization. Minor pages like logout and user settings were added during that process as needed.

In terms of styling, I used Bootstrap because of its reliability, wide adoption, and the availability of community resources that helped me quickly implement clean and responsive designs. The app was made containerized with Docker to ease local development and reviewer setup, and email functionality was tested using MailHog.

For version control, I used Git and GitHub. While I didn’t use branches, I committed regularly and tracked progress through issues and personal notes. Although there were no major algorithmic challenges, working with new tools often meant debugging unexpected behavior — usually caused by small mistakes like typos, misconfigured parameters, or incorrect assumptions about how libraries worked. Where needed, I applied workarounds, such as switching to alternative packages or changing approaches entirely. These situations were part of the learning experience and helped deepen my understanding of the stack.

Ultimately, while the code may not be groundbreaking, the project demonstrates my ability to independently learn and apply modern technologies to solve a real-world problem. I was intentional about using industry-standard tools, not just because they were required or recommended by the assignment, but because their popularity ensures stability, community support, and relevance for future professional projects.


---

## 7. Possible Improvements

In retrospect, I recognize that I chose a scope that was too large for the constraints of the assignment. My initial goal was to create something genuinely usable and impressive, but this conflicted with the original purpose of the project: a time-bound demonstration of my current abilities. While I’m proud of what I accomplished, this decision led to a longer development timeline and some compromises in feature completeness.

To keep the scope manageable, several features did not make it into the final version. These include — but are not limited to:

- **Stronger data validation logic**: For example, linking fuel types to compatible units to prevent invalid combinations and support more robust internal logic.
- **Improved security and access control**: Currently, the system allows some data to be visible across users (like user names), which would need refinement depending on the use case and privacy requirements.
- **Extended analysis features**: Adding more charts, metrics, or filtering options to the analysis page would provide better insights and usability for real users.
- **More customization for list views**: Allowing users to sort, filter, or hide columns in tables like consumption or users would make the app more versatile.
- **User-project assignment during invitation**: It would be more convenient if new users could be assigned to projects at the point of invitation, rather than only after registration.
- **Completion of placeholder pages**: The app’s footer contains links to pages like Terms of Use and Imprint that haven’t been implemented yet.
- **Finishing the backend test suite**: While some core features are tested, many edge cases and routes (especially on the frontend) still lack automated tests.

These are all areas I’d be excited to continue improving if the project were extended or maintained. For now, I prioritized building a functional, clear MVP that shows my understanding of full-stack development — while acknowledging that refinement and polish are always part of the next step.
