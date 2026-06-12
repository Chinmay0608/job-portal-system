import axios from "axios";

/* ==========================
   BASE URL
========================== */
const API = `${import.meta.env.VITE_API_BASE_URL}/api`;

/* ==========================
   UPLOAD RESUME
========================== */
export const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append("resume", file);

  const token = localStorage.getItem("token");

  const response = await axios.post(`${API}/auth/upload-resume`, formData, {
    headers: {
      authorization: token,
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};