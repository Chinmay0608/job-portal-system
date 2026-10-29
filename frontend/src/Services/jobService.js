import axios from "axios";
import { logoutUser, getApiBaseUrl } from "./authUtils";

const BASE_URL = getApiBaseUrl();

// Creates a specialized Axios messenger client bound to the backend domain
const api = axios.create({ baseURL: BASE_URL, withCredentials: true });

api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
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
export const hideJob = async (jobId, feedback) =>
  (await api.post(`/api/jobs/hide/${jobId}`, feedback)).data;

export const postAIChatMessage = async (messages) => {
  const response = await api.post("/api/jobs/ai/chat", { messages });
  return response.data;
};

export const synthesizeDhruvSpeech = async ({ text, voice }) =>
  (await api.post("/api/jobs/ai/speech", { text, voice }, { responseType: "blob" })).data;

export const getDhruvRealtimeScribeToken = async () =>
  (await api.post("/api/jobs/ai/transcribe-token")).data;

export const postAIFeedback = async ({ prompt, response, rating, feedbackReason }) => {
  const res = await api.post("/api/jobs/ai-chat/feedback", { prompt, response, rating, feedbackReason });
  return res.data;
};

export const generateJobDescriptionAPI = async ({ title, company, role }) => {
  const res = await api.post("/api/jobs/generate-description", { title, company, role });
  return res.data;
};

export const getFullJobDescriptionAPI = async (jobId) =>
  (await api.get(`/api/jobs/${jobId}/full-description`)).data;
export const getEnglishJobDescriptionAPI = async (jobId) =>
  (await api.get(`/api/jobs/${jobId}/english-description`)).data;



export const getRecruiterJobs = async () => (await api.get("/api/jobs/my-jobs")).data;
export const getRecommendedJobs = async () => (await api.get("/api/jobs/recommended")).data;
export const getPublicStatsAPI = async () => (await api.get("/api/jobs/public-stats")).data;

// USER MODULE
export const getUserProfile = async () => (await api.get("/api/users/profile")).data;
export const updateProfile = async (formData) => (await api.put("/api/users/update-profile", formData)).data;
export const completeRecruiterOnboardingAPI = async (payload) =>
  (await api.post("/api/users/recruiter-onboarding", payload)).data;
export const changePassword = async (passwordData) => (await api.put("/api/users/change-password", passwordData)).data;
export const extractSkillsAPI = async () => (await api.post("/api/users/extract-skills")).data;
export const clearSkillsAPI = async () => (await api.delete("/api/users/skills")).data;
// APPLICATION TRACKING MODULES
export const getMyApplications = async () => (await api.get("/api/applications/my-applications")).data;
export const getRecruiterApplications = async () => (await api.get("/api/applications/recruiter-applications")).data;
export const updateStatus = async (applicationId, status) => (await api.patch(`/api/applications/update/${applicationId}`, { status })).data;
export const getRecruiterStats = async () => (await api.get("/api/applications/recruiter-stats")).data;
export const toggleSaveJob = async (body) => (await api.post("/api/users/saved-jobs/toggle", body)).data;
export const completeOnboardingAPI = async (data) =>
  (await api.post("/api/users/complete-onboarding", data, {
    headers: { "x-requested-with": "XMLHttpRequest" },
  })).data;

export const getResumeSignedUrlAPI = async (userId) =>
  (await api.get(`/api/users/resume/${userId}?format=json`)).data;
