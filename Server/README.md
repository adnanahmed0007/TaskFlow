# Task Manager Backend API

REST API for the Team Task Manager full-stack app. Built with Node.js, Express, MongoDB (Mongoose), and JWT authentication.

## Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (MongoDB Atlas)
- **Auth:** JWT (jsonwebtoken) + bcryptjs
- **Validation:** express-validator

---

## Setup & Run Locally

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Create a `.env` file in the root:
```env
DB_URL=mongodb+srv://<username>:<password>@cluster0.ftuwnv8.mongodb.net/?appName=Cluster0
JWT_SECRET=your_jwt_secret
PORT=5000
```

### 3. Start server
```bash
# Production
npm start

# Development (with nodemon)
npm run dev
```

---

## Deploy on Railway

1. Push this `backend/` folder to a GitHub repo
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add environment variables in Railway dashboard:
   - `DB_URL`
   - `JWT_SECRET`
   - `PORT` = 5000
4. Railway will auto-deploy. Copy the generated URL.
5. Set `REACT_APP_API_URL=https://your-railway-url.up.railway.app/api` in your React frontend's `.env`

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/me` | Get current user (auth required) |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | Get all user's projects |
| POST | `/api/projects` | Create a project |
| GET | `/api/projects/:id` | Get single project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project + tasks |
| POST | `/api/projects/:id/members` | Add member by email |
| DELETE | `/api/projects/:id/members/:userId` | Remove member |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/:projectId/tasks` | Get all tasks in a project |
| POST | `/api/projects/:projectId/tasks` | Create a task |
| GET | `/api/projects/:projectId/tasks/:taskId` | Get single task |
| PUT | `/api/projects/:projectId/tasks/:taskId` | Update task |
| PATCH | `/api/projects/:projectId/tasks/:taskId/status` | Update task status only |
| DELETE | `/api/projects/:projectId/tasks/:taskId` | Delete task |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users (for member/task assignment) |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Get stats: projects, tasks, completed, overdue |

---

## Roles
- **Admin** (first registered user): Can manage all projects and users
- **Member**: Can view/create/update tasks in projects they belong to; only project owners can delete

## Auth
All protected routes require:
```
Authorization: Bearer <jwt_token>
```
