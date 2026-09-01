import axios from "axios";

const API = `${import.meta.env.VITE_API_BASE_URL}/api`;

// Resume Upload Engine: Packs a physical file binary and streams it to the backend cloud pipeline
export const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append("resume", file);

  const token = localStorage.getItem("token");
  const response = await axios.post(`${API}/auth/upload-resume`, formData, {
    withCredentials: true,
    headers: {
      "Content-Type": "multipart/form-data",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
  });

  return response.data;
};

export const getMyApplicationsAPI = async () => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${API}/applications/my-applications`, {
    withCredentials: true,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
  });

  return response.data;
};

export const withdrawApplication = async (applicationId) => {
  const token = localStorage.getItem("token");
  const response = await axios.delete(`${API}/applications/${applicationId}`, {
    withCredentials: true,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
  });

  return response.data;
};
export const updateApplicationStatus = async (applicationId, status) => {
  const { data } = await api.patch(`/api/applications/update/${applicationId}`, { status });
  return data;
};
