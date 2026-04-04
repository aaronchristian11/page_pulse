# 📖 Page Pulse

A MyAnimeList-inspired bookshelf management app built with Vue 3 + Express + SQLite.

## Stack
- **Frontend**: Vue 3, PrimeVue, Pinia, Vue Router
- **Backend**: Express.js, better-sqlite3
- **Database**: SQLite (persisted via Docker volume)

## Installing Docker on Windows

1. Download **Docker Desktop for Windows** from https://www.docker.com/products/docker-desktop
2. Run the installer and follow the prompts
3. When asked, make sure **"Use WSL 2 instead of Hyper-V"** is checked (recommended)
4. Restart your computer when prompted
5. Launch **Docker Desktop** from the Start menu and wait until it says **"Engine running"** in the bottom left
6. Verify the install by opening a terminal and running:
```bash
docker --version
docker compose version
```

> **Note:** Docker Desktop requires Windows 10 64-bit (version 1903 or higher) or Windows 11.

## Quick Start

Two separate compose files are provided — one for local development and one for production.

### Development
Runs the Vite dev server (hot reload) and `tsx` for the backend (no compile step).

```bash
docker compose -f compose.dev.yaml up --build
```

Then open http://localhost:5173

### Production
Compiles TypeScript on the backend and builds static assets on the frontend before serving.

```bash
docker compose -f compose.prod.yaml up --build
```

Then open http://localhost:8080

---

### Run in detached mode (background)
```bash
# Development
docker compose -f compose.dev.yaml up --build -d

# Production
docker compose -f compose.prod.yaml up --build -d
```

### Stop containers
```bash
# Development
docker compose -f compose.dev.yaml down

# Production
docker compose -f compose.prod.yaml down
```

### Check containers
```bash
docker ps
```

### Check logs
```bash
# Logs for all services
docker compose -f compose.dev.yaml logs

# Logs for a specific service
docker compose -f compose.dev.yaml logs backend
docker compose -f compose.dev.yaml logs frontend

# Follow logs in real time
docker compose -f compose.dev.yaml logs -f
```

### Run bash/sh commands on containers
```shell
docker exec -it <container_name> sh
```

### Run migrations and seeders
```shell
npx knex migrate:latest --knexfile src/db/knexfile.ts
npx knex seed:run --knexfile src/db/knexfile.ts
```
#### Run migration rollback
```shell
npx knex migrate:rollback --knexfile src/db/knexfile.ts
```

## Features

### General User
- Create, rename, delete personal bookshelves
- Add books with title, author, ISBN, category, age rating
- Book validation (ISBN format, age rating restrictions)
- Browse and request to join groups
- Add/edit/delete own books on group shelves

### Admin
- Full bookshelf management
- Create, edit, delete groups
- Set group allowed categories and max age rating
- Approve/reject/remove group members

## Project Structure

```
page-pulse/
├── app/
│   ├── frontend/          # Vue 3 app
│   │   ├── src/
│   │   │   ├── api/       # Axios API calls
│   │   │   ├── components/ # BookCard, BookForm
│   │   │   ├── router/    # Vue Router
│   │   │   ├── stores/    # Pinia auth store
│   │   │   └── views/     # Login, Dashboard, Groups, GroupDetail
│   │   ├── Dockerfile.dev  # Vite dev server
│   │   └── Dockerfile.prod # Build + http-server
│   └── backend/           # Express API
│       ├── src/
│       │   ├── db/        # SQLite schema + seed
│       │   └── routes/    # auth, shelves, groups
│       ├── Dockerfile.dev  # tsx (no compile)
│       └── Dockerfile.prod # tsc compile + node
├── data/                  # SQLite .db file (auto-created)
├── compose.dev.yaml        # Local development
└── compose.prod.yaml       # Production
```

## API Endpoints

### Auth
- `POST /api/auth/login`
- `POST /api/auth/register`

### Shelves
- `GET /api/shelves/user/:userId`
- `POST /api/shelves`
- `PUT /api/shelves/:id`
- `DELETE /api/shelves/:id`
- `GET /api/shelves/:id/books`
- `POST /api/shelves/:id/books`
- `DELETE /api/shelves/:shelfId/books/:bookId`

### Groups
- `GET /api/groups`
- `POST /api/groups`
- `PUT /api/groups/:id`
- `DELETE /api/groups/:id`
- `POST /api/groups/:id/join`
- `GET /api/groups/:id/members`
- `PUT /api/groups/:id/members/:userId`
- `DELETE /api/groups/:id/members/:userId`
- `GET /api/groups/:id/books`
- `POST /api/groups/:id/books`
- `PUT /api/groups/:id/books/:bookId`
- `DELETE /api/groups/:id/books/:bookId`
