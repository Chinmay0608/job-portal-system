import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/auth`;

// 1. Account Creation: Sends registration form data to the server
export const registerUser = async (userData) => {
  const response = await axios.post(`${API_URL}/register`, userData, {
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
};

// 2. Session Authorization: Sends email/password to get a security token
export const loginUser = async (userData) => {
  const response = await axios.post(`${API_URL}/login`, userData, {
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
};

// 3. Logout User
export const logoutUserAPI = async () => {
  const response = await axios.post(`${API_URL}/logout`, {}, {
    withCredentials: true,
  });
  return response.data;
};