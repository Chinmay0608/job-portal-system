import axios from "axios";

/* Backend URL */
const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/auth`;

/* Register User */
export const registerUser = async (userData) => {
  const response = await axios.post(`${API_URL}/register`, userData);
  return response.data;
};

/* Login User */
export const loginUser = async (userData) => {
  const response = await axios.post(`${API_URL}/login`, userData);
  return response.data;
};