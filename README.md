# 🔷 BugTrackr — React Frontend

A modern defect management dashboard built with React + Vite.  
Connects to your Spring Boot backend at `http://localhost:8080`.

For live demo use azure link : https://bugtrackr-frontend-app-ftc4cffyatgth9gd.centralindia-01.azurewebsites.net/login

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev

# 3. Open in browser
http://localhost:5173
```

> Make sure your Spring Boot backend is running on port 8080 before starting.

---

## 🔑 Demo Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Developer | `developer` | `developer123` |
| Tester | `tester` | `tester123` |
| Product Owner | `product` | `product123` |

---

## 📁 Project Structure

```
src/
├── main.jsx                   # App entry point
├── App.jsx                    # Routes & auth guard
├── styles/
│   └── global.css             # CSS variables, resets
├── services/
│   └── api.js                 # All API calls to Spring Boot
├── context/
│   └── AuthContext.jsx        # Login state (localStorage)
├── components/
│   ├── layout/
│   │   ├── Layout.jsx         # Page wrapper with sidebar
│   │   ├── Sidebar.jsx        # Navigation sidebar
│   │   └── Header.jsx         # Top header bar
│   └── defects/
│       ├── BugCard.jsx        # Bug card for grid view
│       └── BugDetailModal.jsx # Modal to view + update a bug
└── pages/
    ├── LoginPage.jsx           # Login screen
    ├── DashboardPage.jsx       # Stats + overview
    ├── BugsPage.jsx            # Card grid with filters
    ├── KanbanPage.jsx          # Drag & drop board (dnd-kit)
    ├── CreateBugPage.jsx       # Form to report new bug
    └── ReportPage.jsx          # Project reports + developer search
```

---

## 🔌 API Endpoints Used

| Method | Endpoint | Used In |
|--------|----------|---------|
| POST | `/api/users/login` | LoginPage |
| GET | `/api/defects/getAll` | Dashboard, BugsPage |
| GET | `/api/defects/{id}` | BugDetailModal |
| GET | `/api/defects/assignedto/{devId}` | ReportPage |
| GET | `/api/defects/report/{projectId}` | ReportPage |
| POST | `/api/defects/new` | CreateBugPage |
| PUT | `/api/defects/resolve` | BugDetailModal, KanbanPage |

---

## ✨ Features

- **Login** with role-based auth (developer / tester / product owner)
- **Dashboard** with live stats, recent bugs, priority chart
- **Bug Grid** — card layout matching the design, with Priority / Severity / Status filters
- **Kanban Board** — drag & drop cards between Open → In Progress → Resolved → Closed (auto-saves to backend)
- **Create Bug** — full form with validation, maps to all backend fields
- **Reports** — project-level report table + developer bug search
- **Bug Detail Modal** — view full details, update status, add resolution notes

---

## 🛠 Tech Stack

- **React 18** + **Vite 5**
- **React Router v6** for routing
- **@dnd-kit** for drag and drop
- **Axios** for HTTP calls
- **CSS Modules** — every component has its own `.module.css`
- **Google Fonts** — Syne (headings) + DM Sans (body)

---

## 📝 Notes for Interviews

- **CSS Modules** are used instead of Tailwind — each component owns its styles, no conflicts
- **AuthContext** uses React Context API + localStorage for persistent login
- **Axios proxy** in `vite.config.js` forwards `/api/*` requests to Spring Boot (avoids CORS in dev)
- **Drag & Drop** uses `@dnd-kit` — `useDraggable` and `useDroppable` hooks on cards and columns
- The **Kanban board** does optimistic UI updates — it updates the screen immediately, then saves to backend, and rolls back if the save fails
