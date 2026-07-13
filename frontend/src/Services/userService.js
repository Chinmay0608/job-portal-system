import axios from "axios";

const API = `${import.meta.env.VITE_API_BASE_URL}/api`;

// Resume Upload Engine: Packs a physical file binary and streams it to the backend cloud pipeline
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

export const getMyApplicationsAPI = async (token) => {
  const response = await axios.get(`${API}/applications/my-applications`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const withdrawApplication = async (applicationId, token) => {
  const response = await axios.delete(`${API}/applications/${applicationId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};