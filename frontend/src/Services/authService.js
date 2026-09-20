import axios from "axios";
import { getApiBaseUrl } from "./authUtils";

const getAuthApiUrl = () => `${getApiBaseUrl()}/api/auth`;

// Common headers for all auth requests (satisfies CSRF middleware)
const authHeaders = {
  "Content-Type": "application/json",
  "x-requested-with": "XMLHttpRequest",
};

// 1. Account Creation: Sends registration form data to the server
export const registerUser = async (userData) => {
  const response = await axios.post(`${getAuthApiUrl()}/register`, userData, {
    headers: authHeaders,
    withCredentials: true,
  });
  if (response.data.token) {
    localStorage.setItem("token", response.data.token);
  }
  return response.data;
};

// 2. Session Authorization: Sends email/password to get a security token
export const loginUser = async (userData) => {
  const response = await axios.post(`${getAuthApiUrl()}/login`, userData, {
    headers: authHeaders,
    withCredentials: true,
  });
  if (response.data.token) {
    localStorage.setItem("token", response.data.token);
  }
  return response.data;
};

// 3. Logout User
export const logoutUserAPI = async () => {
  const response = await axios.post(`${getAuthApiUrl()}/logout`, {}, {
    headers: authHeaders,
    withCredentials: true,
  });
  return response.data;
};