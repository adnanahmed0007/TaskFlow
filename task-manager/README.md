# TaskFlow — Team Task Manager

A full-stack task management application with role-based access control (Admin/Member).

---

## 🚀 Features

- **Authentication** — Signup/Login with JWT tokens
- **Role-Based Access** — Admin can manage projects/members; Members can manage their tasks
- **Projects** — Create, view, delete projects with team members
- **Kanban Board** — Drag-and-drop tasks across status columns
- **List View** — Tabular task view with inline status changes
- **Dashboard** — Stats overview: total projects, tasks, completion rate, overdue count
- **My Tasks** — Personal task view across all projects

---

## 📁 Project Structure

```
src/
├── api/           # Axios API layer
├── components/    # Shared components (Layout, Sidebar)
├── context/       # AuthContext (global auth state)
├── pages/         # Page components
│   ├── LoginPage.js
│   ├── SignupPage.js
│   ├── DashboardPage.js
│   ├── ProjectsPage.js
│   ├── ProjectDetailPage.js
│   └── TasksPage.js
├── App.js         # Routes
└── index.js       # Entry point
```

---

## 🛠 Setup

### Frontend
```bash
cd task-manager
npm install
REACT_APP_API_URL=http://localhost:5000/api npm start
```

### Backend (Express.js)
See backend section below.

---

## 🔌 REST API Expected by Frontend

### Auth
| Method | Endpoint | Body |
|--------|----------|------|
| POST | /api/auth/signup | { name, email, password, role } |
| POST | /api/auth/login | { email, password } |
| GET | /api/auth/me | — |

**Response for login/signup:**
```json
{ "token": "jwt_token", "user": { "_id": "...", "name": "...", "email": "...", "role": "admin|member" } }
```

### Projects
| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | /api/projects | All projects (user is member of) |
| POST | /api/projects | Admin only. Body: { name, description } |
| GET | /api/projects/:id | Single project with members |
| PUT | /api/projects/:id | Admin only |
| DELETE | /api/projects/:id | Admin only |
| POST | /api/projects/:id/members | { userId } |
| DELETE | /api/projects/:id/members/:userId | |

### Tasks
| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | /api/projects/:projectId/tasks | All tasks in project |
| POST | /api/projects/:projectId/tasks | { title, description, priority, dueDate, assignedTo } |
| PUT | /api/projects/:projectId/tasks/:taskId | Update task |
| DELETE | /api/projects/:projectId/tasks/:taskId | |
| PATCH | /api/projects/:projectId/tasks/:taskId/status | { status } |
| GET | /api/tasks/my | Tasks assigned to current user |

### Dashboard
| Method | Endpoint |
|--------|----------|
| GET | /api/dashboard/stats |

**Response:**
```json
{ "totalProjects": 5, "totalTasks": 24, "completedTasks": 14, "overdueTasks": 3 }
```

### Users
| Method | Endpoint |
|--------|----------|
| GET | /api/users | All users (for assignment dropdown) |

---

## 🗃 Database Schema (MongoDB)

### User
```js
{ name, email, password (hashed), role: 'admin'|'member', createdAt }
```

### Project
```js
{ name, description, members: [userId], createdBy: userId, createdAt }
```

### Task
```js
{
  title, description,
  status: 'todo'|'in-progress'|'done'|'blocked',
  priority: 'low'|'medium'|'high',
  dueDate, assignedTo: userId,
  project: projectId, createdBy: userId, createdAt
}
```

---

## 🚂 Railway Deployment

1. Push backend to GitHub
2. Create new Railway project → Deploy from GitHub
3. Add environment variables:
   - `MONGODB_URI` (MongoDB Atlas connection string)
   - `JWT_SECRET` (random secret)
   - `PORT=5000`
4. For frontend: Railway → New Service → Static Site or use Vercel/Netlify
   - Set `REACT_APP_API_URL` to your Railway backend URL
   - Build command: `npm run build`
   - Output dir: `build`

---

## 📦 Backend Quickstart (Express)

```bash
npm init -y
npm install express mongoose bcryptjs jsonwebtoken cors dotenv
```

### server.js skeleton
```js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/users', require('./routes/users'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.listen(process.env.PORT || 5000, () => console.log('Server running'));
```

---

## 📹 Demo Video Checklist
- [ ] Show Signup (Admin + Member)
- [ ] Create a project
- [ ] Add tasks with different priorities
- [ ] Drag tasks on Kanban board
- [ ] Switch to List view and update status
- [ ] Show Dashboard stats
- [ ] Show "My Tasks" page
- [ ] Show role restrictions (member can't delete project)

---

## 🔗 Submission Checklist
- [ ] Live URL (Railway)
- [ ] GitHub Repo (public)
- [ ] This README
- [ ] 2-5 min demo video
