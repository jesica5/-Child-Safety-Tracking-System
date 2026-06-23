# GuardianShield - Full Stack Child Safety Tracking System

GuardianShield is a state-of-the-art, responsive, full-stack application designed to track child safety, monitor locations in real-time, enforce virtual geofences, log school entry/exit attendance, and trigger immediate emergency alerts.

---

## 🌟 Key Features

1. **Authentication & RBAC**:
   - Secure login and registration.
   - JWT-based authentication with session cache.
   - Role-Based Access Control (Admin, Parent, School Staff).

2. **Telemetry Dashboard**:
   - Statistical tracking cards (children count, active check-ins, alert feeds).
   - Real-time interactive map rendering markers and safe zones.
   - Week-long school attendance trends chart.
   - Built-in simulation control console.

3. **Geofencing & Alerts**:
   - Virtual safe circle boundaries (Home, School).
   - Dynamic Haversine distance computations mapping boundaries in real-time.
   - Automatically generates exit/entry alarms on boundary crossings.

4. **Emergency SOS System**:
   - One-click SOS emergency buttons (header & simulator deck).
   - Instant visual blinking and browser-synthesized audio alarm warnings.
   - Incident manager permitting staff/admins to resolve active alarms.

5. **School Attendance Logs**:
   - Roster lists permitting school staff to log student entry/exits.
   - RFID / NFC / Manual tracking selections.

6. **Search & Reports**:
   - Multi-category reports (Attendance sheets, Incident logs, Enrollment lists).
   - Exporter creating client-side Excel CSV downloads.
   - Custom print stylesheets enabling native PDF printing.

---

## ⚙️ Technology Stack

- **Frontend**: React.js, Vite, Tailwind CSS, Lucide icons, Leaflet & React-Leaflet maps, Recharts graphs.
- **Backend**: Node.js, Express.js, MVC Pattern, RESTful validation sheets, JSON DB fallback.
- **Database**: MongoDB (via Mongoose) with an out-of-the-box local file fallback database (`backend/data/db.json`) if MongoDB is unavailable.

---

## 🚀 Quick Start Instructions

You do not need to install or run MongoDB to evaluate this application! If MONGODB_URI is empty, the system automatically falls back to an integrated file-based JSON database wrapper in the backend.

### 1. Installation

From the root directory, install all parent and subdirectory dependencies:
```bash
npm install
npm run install-all
```

### 2. Environment Configuration (Optional)

Create a `backend/.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/child_safety_tracker
JWT_SECRET=super_secret_child_safety_key_2026
NODE_ENV=development
```
*Note: If `MONGODB_URI` is left blank, the app runs in LocalJSON mode, storing records under `backend/data/db.json` automatically.*

### 3. Running the Application

Start the backend API and frontend React client concurrently:
```bash
npm run dev
```
- **Frontend client**: http://localhost:3000
- **Backend API server**: http://localhost:5000

---

## 🔑 Demo Login Accounts

Quick-login presets are available on the sign-in page to speed up evaluation:

| Profile Role | Email Address | Password |
| :--- | :--- | :--- |
| **System Admin** | `admin@safety.com` | `safety123` |
| **Parent / Guardian** | `parent@safety.com` | `safety123` |
| **School Staff** | `staff@safety.com` | `safety123` |

---

## 🛰️ GPS Simulator Mechanics

Since there are no physical GPS hardware tracking chips, we built a background coordinates generator:
- The backend runs a `setInterval` ticker every 15 seconds.
- It moves the demo child **Bobby Green** along a bus route pathway from **Home** (San Francisco City Hall) to **School** (SFMOMA).
- As Bobby moves:
  - Entering/leaving geofences automatically generates timeline alerts.
  - Arriving at School triggers school check-in logs.
  - Returning home triggers school check-out logs.
- You can override or trigger fast teleports using the **Simulate Tracker** deck on the dashboard.

---

## 📑 Backend API Endpoints

### 1. Authentication (`/api/auth`)
- `POST /register`: Registers parent/staff account.
- `POST /login`: Log in and receive JWT token.
- `GET /me`: Fetch authenticated user profile.

### 2. Children Directory (`/api/children`)
- `GET /`: Lists child profiles (filtered by parent if Parent role).
- `GET /:id`: Inspect specific child details.
- `POST /`: Registers a child profile.
- `PUT /:id`: Edit profile notes.
- `DELETE /:id`: Removes profile (Admin only).

### 3. Geofencing (`/api/geofences`)
- `GET /`: Lists active safe circles.
- `GET /child/:childId`: Retrieve geofences for a child.
- `POST /`: Create custom geofence bounds.
- `DELETE /:id`: Remove geofence.

### 4. Telemetry GPS & Incidents (`/api/location`)
- `POST /update`: Submit new coordinates, check geofences, log transitions.
- `GET /history/:childId`: Fetch breadcrumbs list (last 100).
- `POST /sos/:childId`: Trigger critical SOS alarm.
- `POST /resolve-alert/:alertId`: Resolve active alarm (Staff/Admin only).
- `GET /alerts`: Retrieve active/resolved timeline log.

### 5. School Attendance (`/api/attendance`)
- `GET /`: Retrieve check-in and check-out logs.
- `POST /`: Log Check-In/Check-Out entry.
- `GET /child/:childId`: Retrieve logs for specific child.

### 6. Reports & Statistics (`/api/reports`)
- `GET /dashboard-stats`: Dashboard summaries, status charts, and unread alarms count.
- `GET /query`: Run filtered query reports by dates, classes, searches, or categories.
