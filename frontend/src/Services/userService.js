import axios from "axios";

const API = `${import.meta.env.VITE_API_BASE_URL}/api`;

// Resume Upload Engine: Packs a physical file binary and streams it to the backend cloud pipeline
export const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append("resume", file);

  const response = await axios.post(`${API}/auth/upload-resume`, formData, {
    withCredentials: true,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const getMyApplicationsAPI = async () => {
  const response = await axios.get(`${API}/applications/my-applications`, {
    withCredentials: true,
  });

  return response.data;
};

export const withdrawApplication = async (applicationId) => {
  const response = await axios.delete(`${API}/applications/${applicationId}`, {
    withCredentials: true,
  });

  return response.data;
};