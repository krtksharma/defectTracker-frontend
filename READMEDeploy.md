# 🔷 BugTrackr

> A full-stack defect management system built with **React + Spring Boot**, deployed on **Microsoft Azure**.

[![Frontend](https://img.shields.io/badge/Frontend-Azure_Static_Web_Apps-0078D4?logo=microsoft-azure)](https://bugtrackr-frontend.azurestaticapps.net)
[![Backend](https://img.shields.io/badge/Backend-Azure_App_Service-0078D4?logo=microsoft-azure)](https://bugtrackr-api.azurewebsites.net/swagger-ui/index.html)
[![Java](https://img.shields.io/badge/Java-17-ED8B00?logo=openjdk)](https://openjdk.org/projects/jdk/17/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-6DB33F?logo=spring)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)

---

## 🔗 Live Links

| | Link |
|---|---|
| 🖥️ **Live App** | https://bugtrackr-frontend.azurestaticapps.net |
| 📡 **API Docs (Swagger)** | https://bugtrackr-api.azurewebsites.net/swagger-ui/index.html |
| 💻 **GitHub** | https://github.com/YOUR_USERNAME/bugtrackr |

**Demo credentials:**

| Role | Username | Password |
|------|----------|----------|
| Tester | `tester` | `tester123` |
| Developer | `developer` | `developer123` |
| Product Owner | `product` | `product123` |

---

## 📸 Screenshots

| Login | Bug Reports | Kanban Board |
|-------|------------|--------------|
| ![Login](docs/screenshots/login.png) | ![Bugs](docs/screenshots/bugs.png) | ![Kanban](docs/screenshots/kanban.png) |

---

## ✨ Features

### 🐛 Bug Lifecycle Management
- Create bug reports with title, description, steps to reproduce, expected vs actual behavior
- Priority levels: P1 (Critical), P2 (Medium), P3 (Low)
- Severity levels: Blocking, Critical, Major, Minor, Low
- Status workflow: `Open → In Progress → Resolved → Closed`
- Auto-calculated expected resolution date based on severity + priority

### 👥 Role-Based Access Control
| Feature | Tester | Developer | Product Owner |
|---------|--------|-----------|---------------|
| Create bugs | ✅ | ❌ | ❌ |
| Resolve bugs | ❌ | ✅ | ❌ |
| Kanban board | ❌ | ✅ | ❌ |
| Project reports | ❌ | ❌ | ✅ |
| View all bugs | ✅ | ✅ | ✅ |
| Comment on bugs | ✅ | ✅ | ❌ |
| Upload attachments | ✅ | ❌ | ❌ |

### 🎯 Core Functionality
- **Drag & Drop Kanban** — move bugs between status columns, auto-saves to backend
- **Live Search** — URL-synced search across title, ID, developer, status, severity
- **Comments/Discussion** — testers and developers discuss bugs in real time
- **File Attachments** — upload screenshots, logs, PDFs (max 10MB)
- **Audit History** — every change logged: who changed what and when
- **In-App Notifications** — auto-dismiss toasts + bell panel with mark-as-read
- **Developer Dashboard** — shows only bugs assigned to the logged-in developer
- **Project Reports** — product owners generate per-project defect reports

### 🔐 Security
- JWT authentication (HS256, 24h expiry)
- Spring Security with role-based route protection
- Stateless sessions — no cookies

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                 React Frontend                  │
│  Vite + React Router + Axios + dnd-kit          │
│  Azure Static Web Apps                          │
└──────────────────────┬──────────────────────────┘
                       │ HTTPS + JWT
┌──────────────────────▼──────────────────────────┐
│              Spring Boot Backend                │
│  REST API + Spring Security + JPA               │
│  Azure App Service (F1 Free)                    │
└──────────────────────┬──────────────────────────┘
                       │ JDBC
┌──────────────────────▼──────────────────────────┐
│           MySQL / H2 Database                   │
│  Azure Database for MySQL Flexible Server       │
└─────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
bugtrackr/                          ← React Frontend
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx         Role-filtered navigation
│   │   │   ├── Header.jsx          Search + notifications + user dropdown
│   │   │   ├── NotificationBell.jsx Auto-dismiss notification panel
│   │   │   └── UserDropdown.jsx    Avatar menu with role info
│   │   └── defects/
│   │       ├── BugCard.jsx         Card tile for bug grid
│   │       └── BugDetailModal.jsx  4-tab modal: Details|Comments|Files|History
│   ├── pages/
│   │   ├── LoginPage.jsx           Combined sign-in / sign-up tabs
│   │   ├── DashboardPage.jsx       Role-specific stats + assigned bugs
│   │   ├── BugsPage.jsx            3-col card grid with URL-synced search
│   │   ├── KanbanPage.jsx          Drag & drop board (developer only)
│   │   ├── CreateBugPage.jsx       3-section bug creation form (tester only)
│   │   └── ReportPage.jsx          Project reports (product owner only)
│   ├── context/
│   │   ├── AuthContext.jsx         JWT auth + role permissions
│   │   └── ToastContext.jsx        Global toast notifications
│   └── services/
│       └── api.js                  All Axios API calls

bugtrackr-backend/                  ← Spring Boot Backend
├── src/main/java/com/cognizant/
│   ├── controller/
│   │   ├── AuthController.java     Login, register, user management
│   │   ├── DefectController.java   CRUD for bugs
│   │   ├── CommentAndAttachmentController.java
│   │   ├── NotificationController.java
│   │   └── AuditLogController.java
│   ├── entities/
│   │   ├── Defect.java             Main bug entity
│   │   ├── Resolution.java         Resolution notes
│   │   ├── Comment.java            Discussion comments
│   │   ├── Attachment.java         File metadata
│   │   ├── AuditLog.java           Immutable change history
│   │   ├── Notification.java       In-app alerts
│   │   └── User.java               User accounts
│   ├── services/
│   │   ├── DefectServiceImpl.java  Business logic + audit + notifications
│   │   └── UserServiceImpl.java    Auth + registration
│   ├── security/
│   │   ├── JwtUtil.java            Token generate/validate
│   │   └── JwtAuthFilter.java      Request interceptor
│   └── config/
│       └── SecurityConfig.java     Spring Security + CORS
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js 18+
- Java 17+
- Maven 3.8+

### Backend
```bash
cd bugtrackr-backend

# Copy local properties
cp src/main/resources/application-azure.properties \
   src/main/resources/application-local.properties

# Edit application-local.properties for H2 (no MySQL needed):
# spring.datasource.url=jdbc:h2:mem:bugtrackrdb
# spring.datasource.driver-class-name=org.h2.Driver
# spring.jpa.hibernate.ddl-auto=create-drop

mvn spring-boot:run
# Starts on http://localhost:8080
# Swagger UI: http://localhost:8080/swagger-ui/index.html
```

### Frontend
```bash
cd bugtrackr
npm install
npm run dev
# Opens on http://localhost:5173
```

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/users/login` | ❌ Public | Login — returns JWT |
| POST | `/api/users/register` | ❌ Public | Register new account |
| GET | `/api/users/role/{role}` | ✅ JWT | Get users by role |

### Defects
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/defects/getAll` | Any | All bugs |
| GET | `/api/defects/{id}` | Any | Bug detail |
| POST | `/api/defects/new` | Tester | Create bug |
| PUT | `/api/defects/resolve` | Developer | Update status + resolution |
| GET | `/api/defects/assignedto/{devId}` | Any | Developer's bugs |
| GET | `/api/defects/report/{projectId}` | Product Owner | Project report |

### Comments, Attachments, History
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/defects/{id}/comments` | List comments |
| POST | `/api/defects/{id}/comments` | Add comment |
| DELETE | `/api/comments/{id}` | Delete comment |
| GET | `/api/defects/{id}/attachments` | List files |
| POST | `/api/defects/{id}/attachments` | Upload file |
| GET | `/api/attachments/download/{name}` | Download file |
| GET | `/api/defects/{id}/history` | Audit trail |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Unread only |
| PUT | `/api/notifications/{id}/read` | Mark one read |
| PUT | `/api/notifications/read-all` | Mark all read |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 | UI framework |
| Vite 5 | Build tool |
| React Router v6 | Client-side routing |
| Axios | HTTP client |
| @dnd-kit | Drag & drop |
| CSS Modules | Scoped styles |

### Backend
| Technology | Purpose |
|-----------|---------|
| Spring Boot 3 | Application framework |
| Spring Security | Auth + JWT |
| Spring Data JPA | Database ORM |
| JJWT 0.11.5 | JWT tokens |
| MySQL / H2 | Database |
| Lombok | Boilerplate reduction |
| Springdoc OpenAPI | Swagger UI |

### Cloud
| Service | Tier | Cost |
|---------|------|------|
| Azure Static Web Apps | Free | $0/month |
| Azure App Service | F1 Free | $0/month |
| Azure Database for MySQL | Free 12mo | $0 year 1 |

---

## 🚢 Deployment

See [AZURE_DEPLOYMENT.md](docs/AZURE_DEPLOYMENT.md) for the full step-by-step guide.

**Quick summary:**
1. Push repo to GitHub
2. Create Azure Static Web App → link to GitHub → auto-deploys frontend
3. Create Azure App Service (Java 17, Free F1) → add secrets → deploy backend
4. Set `VITE_API_URL` GitHub secret → frontend points to backend

---

## 📝 Interview Talking Points

This project demonstrates:

- **DTO Pattern** — entities never exposed directly; `DefectDTO`, `UserPublicDTO`, `LoginResponse` keep data safe
- **JWT Stateless Auth** — `JwtUtil` + `JwtAuthFilter` + `SecurityConfig` with role-based route guards
- **Separation of Concerns** — Controller → Service → Repository (each layer has one job)
- **Role-Based UI** — `AuthContext` permission map drives which nav items/features each role sees
- **Optimistic Updates** — Kanban board updates UI instantly, rolls back if backend fails
- **URL-driven State** — search via `?q=` param; both header and inline search stay in sync
- **Audit Trail** — every bug change recorded in `AuditLog` with actor, timestamp, old/new values
- **Notification System** — DB-backed, `seenIds` ref prevents duplicate toasts on page loads
- **CI/CD Pipeline** — GitHub Actions auto-deploys both frontend and backend on push to main

---

## 👤 Author

**Your Name**  
[LinkedIn](https://linkedin.com/in/yourprofile) · [GitHub](https://github.com/yourusername)

---

## 📄 License

MIT — free to use for portfolio and learning purposes.
