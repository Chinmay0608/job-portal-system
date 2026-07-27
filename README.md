# SkillBridge

**Bridging talent and opportunity in one job portal.**

SkillBridge is a full-stack job portal built for candidates and recruiters to connect, apply, manage applications, and track opportunities with a highly optimized, scalable MERN stack experience.

## 🚀 Short Description

SkillBridge enables job seekers to browse live external jobs, apply with resumes, manage their profile, and track application history. Recruiters can post jobs, review applicants, and manage hiring workflows from a dedicated dashboard. 

The platform is designed with a premium frontend UI and heavily optimized backend architecture designed for scale (Redis Caching, Distributed Cron Locks, BullMQ Email Queues, and MongoDB Indexing).

---

## 🏗 System Architecture & Workflow

```mermaid
graph TD
    %% Frontend Layer
    subgraph Frontend ["Client / Frontend (React + Vite)"]
        UI["User Interface"]
        AuthUI["Google OAuth / JWT Auth"]
        UI -->|API Requests| API_Gateway
    end

    %% Backend API Layer
    subgraph Backend ["Backend API (Express / Node.js)"]
        API_Gateway["Express Routes"]
        Middleware["Rate Limiting & Security Middlewares"]
        Cache["Redis API Cache"]
        Controllers["Controllers / Business Logic"]
        
        API_Gateway --> Middleware
        Middleware --> Cache
        Cache -->|"Cache Miss"| Controllers
        Cache -->|"Cache Hit"| API_Gateway
    end

    %% Background Workers Layer
    subgraph Workers ["Background Workers (BullMQ / Node-Cron)"]
        EmailWorker["Email Queue Worker"]
        CronWorker["Job Cleanup Cron"]
        DistributedLock["Redis Distributed Lock"]
        
        CronWorker -->|Acquires| DistributedLock
    end

    %% Database & External Services
    subgraph Infrastructure ["Data Layer & Services"]
        MongoDB[("MongoDB Atlas")]
        Redis[("Redis Cloud")]
        Cloudinary["Cloudinary Storage"]
        SMTP["Gmail SMTP / SendGrid"]
        Firebase["Firebase Auth"]
    end

    %% Connections
    Controllers <--> MongoDB
    Controllers <--> Cloudinary
    AuthUI <--> Firebase
    Controllers -->|"Add Jobs"| Redis
    EmailWorker -->|"Pops Jobs"| Redis
    EmailWorker -->|Sends| SMTP
```

---

## 🧰 Tech Stack

- ![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b?style=flat&logo=mongodb)
- ![Express](https://img.shields.io/badge/Express-%23404d59?style=flat&logo=express)
- ![React](https://img.shields.io/badge/React-%2361DAFB?style=flat&logo=react)
- ![Node.js](https://img.shields.io/badge/Node.js-%23339933?style=flat&logo=node.js)
- ![Redis](https://img.shields.io/badge/Redis-%23DC382D?style=flat&logo=redis) (Caching, Locks, Queues)
- ![BullMQ](https://img.shields.io/badge/BullMQ-%23000000?style=flat) (Async Email Queues)
- ![Firebase](https://img.shields.io/badge/Firebase-%234f3ff5?style=flat&logo=firebase) (Google OAuth)
- ![Cloudinary](https://img.shields.io/badge/Cloudinary-%233448C5?style=flat&logo=cloudinary) (Secure Resume Delivery)

---

## ⭐ Key Features

### 🔒 Security & Scaling
- **Redis-Backed Rate Limiting:** Brute-force protection on all auth routes.
- **API Caching:** High-traffic endpoints (`GET /api/jobs`) are cached in Redis with instant invalidation upon mutations.
- **Distributed Cron Locks:** Background jobs utilize Redis `SET NX EX` to prevent duplicate executions across horizontal deployments.
- **Asynchronous Email Queues:** Emails are offloaded to BullMQ background workers to prevent blocking HTTP request threads.
- **Time-Expiring Signed URLs:** Sensitive candidate resumes are served via Cloudinary authenticated, expiring URLs rather than public static links.

### 👤 Candidate Features
- Browse and search live external jobs.
- Apply directly with uploaded resumes.
- View application history and status.
- Edit candidate profile and skills.

### 🏢 Recruiter Features
- Create and manage job postings.
- Review and shortlist applicants.
- View individual applicant profiles.
- Separate recruiter dashboard and analytics.

---

## ⚙️ Setup & Installation

### 1. Clone the repo

```bash
git clone https://github.com/Chinmay0608/job-portal-system.git
cd job-portal-system
```

### 2. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 3. Environment variables

Create `.env` files in both `backend/` and `frontend/` using the example files.

#### Backend `.env`

| Key | Description |
| --- | --- |
| `PORT` | Port for backend server (e.g. `5000`) |
| `MONGO_URI` | MongoDB connection string |
| `REDIS_URL` | Redis connection URL |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `JWT_EXPIRE` | JWT expiration (e.g. `7d`) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `EMAIL_USER` | SMTP email user for password reset |
| `EMAIL_PASS` | SMTP email password |

#### Frontend `.env`

| Key | Description |
| --- | --- |
| `VITE_API_BASE_URL` | Backend API base URL |
| `VITE_FIREBASE_API_KEY` | Firebase API Key |

### 4. Run development servers

#### Backend

```bash
cd backend
npm run dev
```

#### Frontend

```bash
cd frontend
npm run dev
```

## 🤝 Contributing

Contributions are welcome! Please open issues or pull requests to help improve SkillBridge.

## 📄 License

This project is licensed under the MIT License.
