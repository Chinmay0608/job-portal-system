import axios from "axios";
import { getApiBaseUrl } from "./authUtils";

const api = axios.create({ baseURL: getApiBaseUrl(), withCredentials: true });
api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  config.headers = config.headers || {};
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getMySupportRequests = async () =>
  (await api.get("/api/support/my-tickets")).data;

export const getMySupportRequest = async (ticketId) =>
  (await api.get(`/api/support/my-tickets/${ticketId}`)).data;

export const addSupportRequestDetails = async (ticketId, message) =>
  (await api.post(`/api/support/my-tickets/${ticketId}/messages`, { message })).data;
