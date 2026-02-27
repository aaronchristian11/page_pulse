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

### Build and run containers
```bash
# Build images and start all containers
docker compose up --build

# Run in detached mode (background)
docker compose up --build -d
```

Then open http://localhost:8080

### Stop containers
```bash
docker compose down
```

### Check containers
```bash
docker ps
```

### Check logs
```bash
# Logs for all services
docker compose logs

# Logs for a specific service
docker compose logs backend
docker compose logs frontend

# Follow logs in real time
docker compose logs -f

# Follow logs for a specific service
docker compose logs -f backend
```

### Run bash/sh commands on containers
```shell
docker exec -it <container_name> sh
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
├── frontend/          # Vue 3 app
│   ├── src/
│   │   ├── api/       # Axios API calls
│   │   ├── components/ # BookCard, BookForm
│   │   ├── router/    # Vue Router
│   │   ├── stores/    # Pinia auth store
│   │   └── views/     # Login, Dashboard, Groups, GroupDetail
│   └── Dockerfile
├── backend/           # Express API
│   ├── src/
│   │   ├── db/        # SQLite schema + seed
│   │   └── routes/    # auth, shelves, groups
│   └── Dockerfile
├── data/              # SQLite .db file (auto-created)
└── compose.yaml
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
