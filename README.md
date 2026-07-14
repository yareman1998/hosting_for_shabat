# Hosting for Shabbat (אירוח לשבת)

A platform connecting hosts and guests (soldiers, national service volunteers, students, and families) for Shabbat hosting. The application combines factual search filters with semantic vector matches to find the best hosting environments.

## Project Structure

This project is organized as a monorepo consisting of the backend API and frontend client:

```text
hosting_for_shabat/
├── Backend/                 # FastAPI (Python) backend application
│   ├── app/                 # Source code (feature-driven structure)
│   ├── alembic/             # Database migration configurations
│   └── pyproject.toml       # Python package dependencies
├── Frontend/                # React (TypeScript) client application built with Vite
│   ├── src/                 # Client UI components, stylesheets, and utilities
│   └── package.json         # JavaScript dependencies
└── PROJECT_CONTEXT.md       # Project milestone specifications and MVP context
```

## Tech Stack

### Backend
* **Framework:** FastAPI
* **Database:** PostgreSQL (with `pgvector` extension for semantic AI matching)
* **ORM:** SQLAlchemy (v2.0)
* **Migrations:** Alembic
* **Authentication:** JWT (JSON Web Tokens) & Passwords hashing (bcrypt)
* **Package Management:** `uv`

### Frontend
* **Framework:** React with TypeScript
* **Build System:** Vite
* **Styles:** Vanilla CSS for customized layout styling
* **Package Management:** `pnpm`

## Getting Started

Refer to individual readmes in each package directory for specific setup instructions:
* **Backend Setup:** See [Backend/README.md](file:///Users/mrjimmyy/Projects/hosting_for_shabat/Backend/README.md)
* **Frontend Setup:** See [Frontend/README.md](file:///Users/mrjimmyy/Projects/hosting_for_shabat/Frontend/README.md)