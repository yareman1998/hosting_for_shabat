# Hosting for Shabbat (אירוח לשבת)

A platform connecting hosts and guests (soldiers, national service volunteers, students, and families) for Shabbat hosting. The application combines rigid factual search filters with semantic vector matches and a multi-stage AI Agent to find the best hosting environments and coordinate expectations.

## Project Structure

This project is organized as a monorepo consisting of the backend API and frontend client:

```text
hosting_for_shabat/
├── Backend/                 # FastAPI (Python) backend application
│   ├── app/                 # Source code (feature-driven structure)
│   │   ├── core/            # Configuration and core environment loaders
│   │   ├── database/        # Centralized DB models (User, Profile, Match, Post)
│   │   ├── features/        # API routers (auth, listings, posts, bookings)
│   │   └── agent/           # AI Agent (embeddings, LangGraph Icebreaker workflow)
│   │   main.py              # Application entry point
│   ├── alembic/             # Database migration configurations
│   └── pyproject.toml       # Python package dependencies
├── Frontend/                # React (TypeScript) client application built with Vite
│   ├── src/                 # Client UI components, stylesheets, and utilities
│   └── package.json         # JavaScript dependencies
└── PROJECT_CONTEXT.md       # Project milestone specifications and MVP context
```

## Core Features

1. **Hybrid Matchmaking (`pgvector`):** Matches guests to hosts by combining rigid requirements (city, kashrut level) with semantic vector similarity computed over free-text household atmosphere profiles.
2. **AI Shabbat Icebreakers (LangGraph):** Automates personalized icebreaker questions based on host notes, guest description, and give-and-take skills, executed via a 4-node LangGraph pipeline with quality guardrails and parsed dynamically.
3. **LangSmith Monitoring:** Complete tracing of LLM nodes, token consumption, and execution paths for performance auditing.
4. **Concurrent Booking Controls:** Implements database row-locking (`with_for_update`) during post-claiming transactions to prevent double-booking.
5. **Off-Platform Redirection:** Dynamic click-to-chat WhatsApp link generation pre-filled with matched booking coordinates.

## Tech Stack

### Backend
* **Framework:** FastAPI
* **Workflow Engine:** LangGraph (with LangChain Core & LangChain Hugging Face)
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

Refer to individual READMEs in each package directory for specific setup and execution instructions:
* **Backend Setup:** See [Backend/README.md](file:///Users/mrjimmyy/Projects/hosting_for_shabat/Backend/README.md)
* **Frontend Setup:** See [Frontend/README.md](file:///Users/mrjimmyy/Projects/hosting_for_shabat/Frontend/README.md)