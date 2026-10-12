import axios from "axios";
import { logoutUser, getApiBaseUrl } from "./authUtils";

const BASE_URL = getApiBaseUrl();

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

export const startInterviewSessionAPI = async (data = {}) =>
  (await api.post("/api/interview/start", data)).data;

export const submitInterviewAnswerAPI = async (data = {}) =>
  (await api.post("/api/interview/submit-answer", data)).data;

export const getInterviewHistoryAPI = async () =>
  (await api.get("/api/interview/history")).data;

export const getInterviewSessionDetailsAPI = async (sessionId) =>
  (await api.get(`/api/interview/session/${sessionId}`)).data;
