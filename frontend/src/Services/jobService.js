import axios from "axios";

/* ==========================
   BASE URL
========================== */
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/* ==========================
   AXIOS INSTANCE
========================== */
const api = axios.create({
  baseURL: BASE_URL,
});

/* Auto Token Interceptor */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.authorization = token;
  }
  return config;
});

/* ==========================
   PUBLIC JOBS
========================== */
export const getJobs = async () => {
  const response = await api.get("/api/jobs");
  return response.data;
};

/* ==========================
   APPLY JOB
========================== */
export const applyJob = async (formData) => {
  const response = await api.post("/api/jobs/apply", formData);
  return response.data;
};

/* ==========================
   CREATE JOB
========================== */
export const createJob = async (jobData) => {
  const response = await api.post("/api/jobs/create", jobData);
  return response.data;
};

/* ==========================
   UPDATE JOB
========================== */
export const updateJob = async (jobId, jobData) => {
  const response = await api.put(`/api/jobs/update/${jobId}`, jobData);
  return response.data;
};

/* ==========================
   DELETE JOB
========================== */
export const deleteJob = async (jobId) => {
  const response = await api.delete(`/api/jobs/delete/${jobId}`);
  return response.data;
};

/* ==========================
   RECRUITER JOBS
========================== */
export const getRecruiterJobs = async () => {
  const response = await api.get("/api/jobs/my-jobs");
  return response.data;
};

/* ==========================
   PROFILE
========================== */
export const updateProfile = async (formData) => {
  const response = await api.put("/api/users/update-profile", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

/* ==========================
   APPLICATIONS
========================== */
export const getMyApplications = async () => {
  const response = await api.get("/api/applications/my-applications");
  return response.data;
};

export const getRecruiterApplications = async () => {
  const response = await api.get("/api/applications/recruiter-applications");
  return response.data;
};

export const updateStatus = async (applicationId, status) => {
  const response = await api.patch(`/api/applications/update/${applicationId}`, { status });
  return response.data;
};

/* ==========================
   STATS
========================== */
export const getRecruiterStats = async () => {
  const response = await api.get("/api/applications/recruiter-stats");
  return response.data;
};