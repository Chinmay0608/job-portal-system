# SkillBridge

**Bridging talent and opportunity in one job portal.**

SkillBridge is a full-stack job portal built for candidates and recruiters to connect, apply, manage applications, and track opportunities with a polished MERN stack experience.

## 🚀 Short Description

SkillBridge enables job seekers to browse jobs, apply with resumes, manage their profile, and track application history. Recruiters can post jobs, review applicants, and manage hiring workflows from a dedicated dashboard.

## 🧰 Tech Stack

- ![MERN](https://img.shields.io/badge/MongoDB-%234ea94b?style=flat&logo=mongodb)
- ![Express](https://img.shields.io/badge/Express-%23404d59?style=flat&logo=express)
- ![React](https://img.shields.io/badge/React-%2361DAFB?style=flat&logo=react)
- ![Node.js](https://img.shields.io/badge/Node.js-%23339933?style=flat&logo=node.js)
- ![Firebase](https://img.shields.io/badge/Firebase-%234f3ff5?style=flat&logo=firebase)
- ![Multer](https://img.shields.io/badge/Multer-%23000000?style=flat)
- ![React Router](https://img.shields.io/badge/React%20Router-%23ca4245?style=flat&logo=react-router)

## ⭐ Features

### Candidate Features

- Browse and search jobs
- Apply with saved/resume uploads
- View application history and status
- Edit candidate profile and skills
- Withdraw pending applications (future improvement)

### Recruiter Features

- Create and manage job postings
- Review and shortlist applicants
- View individual applicant profiles
- Separate recruiter dashboard and analytics

### General Features

- JWT authentication with Firebase Google OAuth support
- Role-based protected routes
- Resume and profile image uploads via Multer
- Responsive UI with Bootstrap and custom styling
- Notification support via `react-hot-toast`

## 🖼 Screenshots

> Replace these placeholders with your app screenshots later.

| Home | Candidate Dashboard |
| --- | --- |
| `screenshot-home.png` | `screenshot-candidate-dashboard.png` |

| Recruiter Dashboard | Application Detail |
| --- | --- |
| `screenshot-recruiter-dashboard.png` | `screenshot-application-detail.png` |

## ⚙️ Setup & Installation

### 1. Clone the repo

```bash
git clone https://github.com/<your-username>/skillbridge.git
cd skillbridge
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
| `VITE_API_BASE_URL` | Backend API base URL (e.g. `http://localhost:5000/api`) |

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

## 🌐 Live Demo

Live demo coming soon.

## 🤝 Contributing

Contributions are welcome! Please open issues or pull requests to help improve SkillBridge.

## 📄 License

This project is licensed under the MIT License.
