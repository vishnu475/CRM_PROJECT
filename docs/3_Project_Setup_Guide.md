# ⚙️ [3] Project Setup Guide
## Enterprise CRM, HRMS & ERP Platform

---

> This guide covers local development setup, Docker deployment, and production configuration.
> Estimated setup time: **15–30 minutes** for local, **5–10 minutes** for Docker.

---

## 3.1 Prerequisites

Ensure the following tools are installed before starting:

| Tool | Minimum Version | Download Link |
|:---|:---|:---|
| **Node.js** | v18.0.0+ | https://nodejs.org/ |
| **npm** | v9.0.0+ | Bundled with Node.js |
| **PostgreSQL** | v14.0+ | https://postgresql.org/download/ |
| **Git** | Any | https://git-scm.com/ |
| **Docker** *(optional)* | v20.0+ | https://docker.com/ |
| **Docker Compose** *(optional)* | v2.0+ | Bundled with Docker Desktop |

---

## 3.2 Option A — Local Development Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd CRM
```

### Step 2: Setup PostgreSQL Databases

Connect to your PostgreSQL server and create the two required databases:

```sql
-- Connect as postgres superuser
psql -U postgres

-- Create HRMS Database
CREATE DATABASE "HRMS";

-- Create CRM Database
CREATE DATABASE "crm";

-- Exit psql
\q
```

> TIP: If PostgreSQL is not installed locally, use Docker (Option B) which handles this automatically.

---

### Step 3: Configure Backend Environment

```bash
# Navigate to backend directory
cd backend

# Copy the example environment file
copy .env.example .env     # Windows
# cp .env.example .env     # Mac/Linux
```

Edit `backend/.env` with your PostgreSQL credentials:

```env
# ─── Server Configuration ─────────────────────────────────────
PORT=5000
NODE_ENV=development

# ─── HRMS Database (Primary — Employees, Payroll, Attendance) ──
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_NAME=HRMS
DB_PORT=5432

# ─── CRM Database (Secondary — Leads, Customers, Sales) ────────
CRM_DB_USER=postgres
CRM_DB_PASSWORD=postgres
CRM_DB_HOST=localhost
CRM_DB_NAME=crm
CRM_DB_PORT=5432

# ─── Authentication ────────────────────────────────────────────
JWT_SECRET=enterprise_super_secret_jwt_key_2026
```

---

### Step 4: Install Backend Dependencies & Initialize Database

```bash
# From backend/ directory
npm install

# Initialize HRMS Database (runs all 23 migrations automatically)
node setup_hrms.js

# Initialize CRM Database
node setup_crm.js

# OR run both together
npm run setup
```

> IMPORTANT: The setup scripts automatically create all tables, triggers, stored procedures,
> and seed initial data by running all migration files in sequence.

### Step 5: Start the Backend Server

```bash
# Production start
npm start

# OR Development start (with auto-reload on file changes)
npm run dev
```

✅ Backend API active at:   http://localhost:5000
✅ Health Check endpoint:   http://localhost:5000/api/health

---

### Step 6: Configure & Start the Frontend

Open a **new terminal window**:

```bash
# Navigate to frontend directory
cd frontend

# Install frontend dependencies
npm install

# Start the Vite development server
npm run dev
```

✅ Frontend application at:  http://localhost:5173

---

## 3.3 Option B — Docker Compose Setup (Recommended for Quick Start)

Run the **entire stack** (PostgreSQL HRMS DB + PostgreSQL CRM DB + Backend API + Frontend) with a single command:

```bash
# From the project root (CRM/)
docker-compose up --build
```

### Service URLs After Docker Start

| Service | URL | Description |
|:---|:---|:---|
| **Frontend** | `http://localhost:3001` | React SPA |
| **Backend API** | `http://localhost:5001` | Express REST API |
| **HRMS PostgreSQL** | `localhost:5434` | Employee data |
| **CRM PostgreSQL** | `localhost:5435` | CRM/Sales data |

### Docker Compose Container Breakdown

| Container | Image | Purpose |
|:---|:---|:---|
| `hrms_postgres` | `postgres:16-alpine` | HRMS database |
| `crm_postgres` | `postgres:16-alpine` | CRM database |
| `crm_backend` | Custom Node.js | REST API server |
| `crm_frontend` | Custom Nginx | React SPA server |

### Stop Docker Services

```bash
# Stop all containers
docker-compose down

# Stop and remove all data volumes (CAUTION: deletes database data)
docker-compose down -v
```

---

## 3.4 Environment Variables Reference

| Variable | Default | Description |
|:---|:---|:---|
| `PORT` | `5000` | Express server port |
| `NODE_ENV` | `development` | Environment mode |
| `DB_USER` | `postgres` | HRMS DB username |
| `DB_PASSWORD` | `postgres` | HRMS DB password |
| `DB_HOST` | `localhost` | HRMS DB host |
| `DB_NAME` | `HRMS` | HRMS database name |
| `DB_PORT` | `5432` | HRMS DB port |
| `CRM_DB_USER` | `postgres` | CRM DB username |
| `CRM_DB_PASSWORD` | `postgres` | CRM DB password |
| `CRM_DB_HOST` | `localhost` | CRM DB host |
| `CRM_DB_NAME` | `crm` | CRM database name |
| `CRM_DB_PORT` | `5432` | CRM DB port |
| `JWT_SECRET` | *(required)* | JWT signing secret |

---

## 3.5 Production Deployment

### Step 1: Build Frontend Bundle

```bash
cd frontend
npm run build
# Generates optimized bundle in frontend/dist/
```

### Step 2: Run Backend with PM2

```bash
npm install -g pm2
cd backend
NODE_ENV=production pm2 start index.js --name "erp-api"
pm2 save
pm2 startup
```

### Step 3: Nginx Reverse Proxy Configuration

```nginx
server {
    listen 80;
    server_name erp.yourdomain.com;

    # Serve React Frontend Static Files
    location / {
        root /var/www/crm/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy REST API Requests to Node.js Backend
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy WebSocket Traffic
    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

---

## 3.6 Troubleshooting

| Issue | Likely Cause | Fix |
|:---|:---|:---|
| `Port 5000 already in use` | Another process on port 5000 | `netstat -ano \| findstr :5000` then kill the PID |
| `Database connection refused` | PostgreSQL not running | Start PostgreSQL service |
| `JWT_SECRET not set` | Missing `.env` file | Create `backend/.env` from `.env.example` |
| `Cannot find module` | Dependencies not installed | Run `npm install` in `backend/` |
| `Vite proxy error` | Backend not running | Start backend first, then frontend |
| `Migration failed` | DB permissions issue | Grant superuser or ensure DB exists |

### Health Check Verification

After setup, verify all systems are running:

```bash
curl http://localhost:5000/api/health
```

Expected response:

```json
{
  "status": "OK",
  "message": "CRM + HRMS Dual-DB Enterprise API — All Systems Healthy",
  "databases": {
    "hrms": { "status": "HEALTHY" },
    "crm": { "status": "HEALTHY" }
  }
}
```
