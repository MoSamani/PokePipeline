# **Poké Pipeline**

Fetch Pokémon from the PokeAPI, store name & url in PostgreSQL, and display them in a Next.js UI. More tables/fields can be added later.

## Abstract

**Poké Pipeline** is a containerized full-stack project built with **Next.js**, **FastAPI**, and **Docker** that demonstrates modern data-fetching, processing, and visualization workflows.  
The application retrieves data from the public Pokémon API, stores structured entities in a **PostgreSQL** database, and provides a responsive, interactive interface to explore Pokémon data.  
The **frontend**, powered by Next.js and **CSS Modules**, ensures a modular and performant user experience.  
The **backend**, implemented with **FastAPI** and **SQLAlchemy 2.x (async)**, handles data ingestion and asynchronous communication with external APIs.  
With **Docker Compose**, the entire environment can be reproduced and started consistently across systems.

# **Stack:**

- Frontend: Next.js (App Router), CSS Modules
- Backend: FastAPI (async), SQLAlchemy 2.x (async), httpx
- DB: PostgreSQL (Docker)
- Runtime: Docker Compose (dev only)

# **Setup:**

1. Copy .env.example in .env in project root
2. Add to docker-compose.dev.yml (backend service):

```
services:
  backend:
    env_file:
      - .env
```

3. Start (Dev)
   Build & Run:

```
docker compose -f docker-compose.dev.yml up --build
```

Just start:

```
docker compose -f docker-compose.dev.yml up
```

Ports:

- Frontend: http://localhost:3000
- PostgreSQL: port 5432 (in Docker)

# **Frontend (V1):**

- app/page.tsx loads data on mount (load()).
- “Import” button calls /api/ingest, then reloads.
- Clicking a row toggles it; if url is missing, the page calls /api/pokemon/url?name=... and caches the result.
- Styles live in app/page.module.css.
