import axios from "axios";
import { getApiBaseUrl } from "./authUtils";

const getApi = () => `${getApiBaseUrl()}/api`;

// Resume Upload Engine: Packs a physical file binary and streams it to the backend cloud pipeline
export const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append("resume", file);

  const token = localStorage.getItem("token");
  const response = await axios.post(`${getApi()}/auth/upload-resume`, formData, {
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
  const response = await axios.get(`${getApi()}/applications/my-applications`, {
    withCredentials: true,
    timeout: 25000,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
  });

  return response.data;
};

export const withdrawApplication = async (applicationId) => {
  const token = localStorage.getItem("token");
  const response = await axios.delete(`${getApi()}/applications/${applicationId}`, {
    withCredentials: true,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
  });

  return response.data;
};

export const updateApplicationStatus = async (applicationId, status) => {
  const token = localStorage.getItem("token");
  const { data } = await axios.patch(
    `${getApi()}/applications/update/${applicationId}`,
    { status },
    {
      withCredentials: true,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );
  return data;
};
