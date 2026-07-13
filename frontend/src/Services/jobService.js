import axios from "axios";
import { isTokenExpired, logoutUser } from "./authUtils";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Creates a specialized Axios messenger client bound to the backend domain
const api = axios.create({ baseURL: BASE_URL });

// Invisible Passport Control: Automatically slips the user token into every request header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      if (isTokenExpired(token)) {
        logoutUser();
        window.location.href = "/login";
        return config;
      }
      config.headers.authorization = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// JOB MODULES
export const getJobs = async (params = {}) => (await api.get("/api/jobs", { params })).data;
export const applyJob = async (formData) => (await api.post("/api/applications/apply", formData)).data;
export const createJob = async (jobData) => (await api.post("/api/jobs/create", jobData)).data;
export const updateJob = async (jobId, jobData) => (await api.put(`/api/jobs/update/${jobId}`, jobData)).data;
export const deleteJob = async (jobId) => (await api.delete(`/api/jobs/delete/${jobId}`)).data;
export const getRecruiterJobs = async () => (await api.get("/api/jobs/my-jobs")).data;

// USER MODULE
export const updateProfile = async (formData) => (await api.put("/api/users/update-profile", formData)).data;
export const changePassword = async (passwordData) => (await api.put("/api/users/change-password", passwordData)).data;

// APPLICATION TRACKING MODULES
export const getMyApplications = async () => (await api.get("/api/applications/my-applications")).data;
export const getRecruiterApplications = async () => (await api.get("/api/applications/recruiter-applications")).data;
export const updateStatus = async (applicationId, status) => (await api.patch(`/api/applications/update/${applicationId}`, { status })).data;
export const getRecruiterStats = async () => (await api.get("/api/applications/recruiter-stats")).data;
export const toggleSaveJob = async (body) => (await api.post("/api/users/saved-jobs/toggle", body)).data;