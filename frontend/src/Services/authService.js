import axios from "axios";

const API_URL =
  `${import.meta.env.VITE_API_BASE_URL}/api/auth`;

export const registerUser =
  async (userData) => {

    const response =
      await axios.post(
        `${API_URL}/register`,
        userData,
        {
          headers: {
            "Content-Type":
              "application/json",
          },
        }
      );

    return response.data;
  };

export const loginUser =
  async (userData) => {

    const response =
      await axios.post(
        `${API_URL}/login`,
        userData,
        {
          headers: {
            "Content-Type":
              "application/json",
          },
        }
      );

    return response.data;
  };