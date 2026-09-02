import axios from "axios";
import { logoutUser } from "./authUtils";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Creates a specialized Axios messenger client bound to the backend domain
const api = axios.create({ baseURL: BASE_URL, withCredentials: true });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // FIX I-12: Skip the logout redirect when the 401 comes from auth endpoints.
      // Previously, a wrong-password login attempt would trigger the interceptor,
      // redirect to /login, and prevent the error toast from ever rendering.
      const requestUrl = error.config?.url || "";
      const isAuthEndpoint =
        requestUrl.includes("/auth/login") ||
        requestUrl.includes("/auth/register") ||
        requestUrl.includes("/auth/google");
      if (!isAuthEndpoint) {
        logoutUser();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// JOB MODULES
export const getJobs = async (params = {}) => (await api.get("/api/jobs", { params })).data;
export const applyJob = async (formData) => (await api.post("/api/applications/apply", formData)).data;
export const applyExternal = async (jobId) => (await api.post("/api/applications/apply-external", { jobId })).data;
export const createJob = async (jobData) => (await api.post("/api/jobs/create", jobData)).data;
export const updateJob = async (jobId, jobData) => (await api.put(`/api/jobs/update/${jobId}`, jobData)).data;
export const deleteJob = async (jobId) => (await api.delete(`/api/jobs/delete/${jobId}`)).data;
export const hideJob = async (jobId) => (await api.post(`/api/jobs/hide/${jobId}`)).data;
export const getRecruiterJobs = async () => (await api.get("/api/jobs/my-jobs")).data;
export const getRecommendedJobs = async () => (await api.get("/api/jobs/recommended")).data;

// USER MODULE
export const updateProfile = async (formData) => (await api.put("/api/users/update-profile", formData)).data;
export const changePassword = async (passwordData) => (await api.put("/api/users/change-password", passwordData)).data;
export const extractSkillsAPI = async () => (await api.post("/api/users/extract-skills")).data;
// APPLICATION TRACKING MODULES
export const getMyApplications = async () => (await api.get("/api/applications/my-applications")).data;
export const getRecruiterApplications = async () => (await api.get("/api/applications/recruiter-applications")).data;
export const updateStatus = async (applicationId, status) => (await api.patch(`/api/applications/update/${applicationId}`, { status })).data;
export const getRecruiterStats = async () => (await api.get("/api/applications/recruiter-stats")).data;
export const toggleSaveJob = async (body) => (await api.post("/api/users/saved-jobs/toggle", body)).data;