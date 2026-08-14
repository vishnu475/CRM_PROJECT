# CRM & HRMS Backend API Server (PostgreSQL)

Node.js + Express + PostgreSQL backend API server powering the CRM, HRMS, and Attendance Kiosk Engine.

## 📁 Directory Structure

```text
CRM_PROJECT/
├── frontend/             ← React + TypeScript + Vite Frontend App
└── backend/              ← Node.js + Express + PostgreSQL Backend Server
    ├── config/           ← Configuration files
    ├── db/
    │   └── pool.js       ← PostgreSQL connection pool
    ├── routes/
    │   ├── employees.js   ← HRMS Employee API routes
    │   └── attendance.js  ← Attendance Kiosk & Daily Log API routes
    ├── .env              ← Environment variables (Port, DB credentials)
    ├── index.js          ← Main Express server entry point
    └── package.json      ← Backend dependencies
```

## 🚀 How to Run the Backend Server

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```

The server will launch at `http://localhost:5000` and automatically connect to your PostgreSQL database (`HRMS`) on port 5432!
