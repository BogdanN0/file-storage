# 📁 File Manager

A full-featured web application for managing files and folders with sharing capabilities.

## 🎯 About the Project

File Manager is a modern file management system that allows you to:

- ✅ **User Authentication** - secure login and registration
- 📂 **Create Folders & Upload Files** - organize your file structure
- 👥 **Share with Others** - share files and folders with other users
- 🌐 **Public Links** - make your files and folders publicly accessible
- 🔒 **Access Control** - manage permissions for your files

## 🛠 Tech Stack

### Frontend

- **Next.js 14** - React framework with App Router
- **TypeScript** - typed JavaScript
- **React Query** - state management and caching
- **Axios** - HTTP client

### Backend

- **NestJS** - progressive Node.js framework
- **Prisma ORM** - modern database toolkit
- **JWT** - user authentication
- **PostgreSQL 15** - relational database

### Infrastructure

- **Docker & Docker Compose** - application containerization
- **Yarn Workspaces** - monorepo setup

## 🚀 Quick Start

### Option 1: Using Docker (Recommended)

```bash
# 1. Clone the repository
git clone <repository-url>
cd monorepo-project

# 2. Start all services
docker-compose up -d

# 3. Apply database migrations
docker exec -it monorepo-backend yarn prisma migrate dev --name init

# 4. (Optional) Seed database with test data
docker exec -it monorepo-backend yarn prisma:seed
```

**Done!** The application is now available at:

- 🌐 Frontend: http://localhost:3000
- 🔧 Backend API: http://localhost:3001/api
- 📖 Swagger docs: http://localhost:3001/api/docs

### Option 2: Local Development without Docker

#### Requirements

- Node.js 20+
- Yarn 1.22+
- PostgreSQL 15+

#### Setup Steps

```bash
# 1. Install dependencies
yarn install

# 2. Create database
psql -U postgres
CREATE DATABASE monorepo_db;
\q

# 3. Configure environment variables
```

Create `apps/backend/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/monorepo_db?schema=public"
UPLOAD_DIR="./uploads"
NODE_ENV="development"
PORT=3001
```

Create `apps/frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

```bash
# 4. Generate Prisma Client and apply migrations
cd apps/backend
yarn prisma generate
yarn prisma migrate dev --name init
yarn prisma:seed  # optional
cd ../..

# 5. Start backend (in separate terminal)
cd apps/backend
yarn start:dev

# 6. Start frontend (in separate terminal)
cd apps/frontend
yarn dev
```

The application will be available at:

- Frontend: http://localhost:3000
- Backend: http://localhost:3001/api

## 📋 Useful Commands

```bash
# Docker commands
yarn docker:up          # Start all services
yarn docker:down        # Stop all services
yarn docker:build       # Rebuild Docker images

# Development
yarn dev:frontend       # Start frontend
yarn dev:backend        # Start backend

# Database
yarn prisma:generate    # Generate Prisma Client
yarn prisma:migrate     # Create migration
yarn prisma:seed        # Seed database with test data
yarn prisma:studio      # Open Prisma Studio

# View logs
docker-compose logs -f          # All logs
docker-compose logs -f backend  # Backend logs
```

## 🔧 Project Structure

```
/
├── apps/
│   ├── frontend/          # Next.js application
│   └── backend/           # NestJS API + Prisma
├── packages/
│   └── shared/            # Shared TypeScript types
├── docker-compose.yml     # Docker configuration
└── package.json          # Root workspace
```

## 📝 Notes

- First-time Docker setup may take time to download images and install dependencies
- To stop services use `docker-compose down`
- For complete cleanup (including database): `docker-compose down -v`
- Hot-reload works automatically when you change files

---

## ✅ Implementation Checklist

- Simple authentication ✅
- Simple UI ✅
- File upload functionality ✅
- Support for a hierarchical folder system (nested folders and files) ✅
- File and folder management: clone, remove, rename, and edit (optional) ✅
- Search files and folders by name (optional) ✅
- Public or private file visibility (optional) ✅
- File viewing accessibility management (public/private) (optional) ✅
- Ability to grant users access via email with specific permissions (optional) ✅
- Viewing shared files or folders through a public link (optional) ✅
- Background jobs for compressing videos and images (optional) ❌
- Unit tests (optional) ❌
- Reordering of files and folders (optional) ❌
