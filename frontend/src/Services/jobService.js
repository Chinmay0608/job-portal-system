import axios from "axios";

const BASE_URL =
  "https://skillbridge-backend-w05j.onrender.com";

const API_URL =
  `${BASE_URL}/api/jobs`;

export const getJobs =
  async () => {

    const response =
      await axios.get(
        API_URL
      );

    return response.data;
  };

export const applyJob =
  async (formData) => {

    const token =
      localStorage.getItem(
        "token"
      );

    const response =
      await axios.post(
        `${BASE_URL}/api/jobs/apply`,
        formData,
        {
          headers: {
            authorization:
              token,
          },
        }
      );

    return response.data;
  };

export const updateJob =
  async (
    jobId,
    jobData
  ) => {

    const token =
      localStorage.getItem(
        "token"
      );

    const response =
      await axios.put(
        `${API_URL}/update/${jobId}`,
        jobData,
        {
          headers: {
            authorization:
              token,
          },
        }
      );

    return response.data;
  };

export const updateProfile =
  async (formData) => {

    const token =
      localStorage.getItem(
        "token"
      );

    const response =
      await axios.put(

        `${BASE_URL}/api/users/update-profile`,

        formData,

        {
          headers: {
            authorization:
              token,

            "Content-Type":
              "multipart/form-data",
          },
        }
      );

    return response.data;
  };

export const getMyApplications =
  async () => {

    const token =
      localStorage.getItem(
        "token"
      );

    const response =
      await axios.get(
        `${BASE_URL}/api/applications/my-applications`,
        {
          headers: {
            authorization:
              token,
          },
        }
      );

    return response.data;
  };

export const getRecruiterApplications =
  async () => {

    const token =
      localStorage.getItem(
        "token"
      );

    const response =
      await axios.get(
        `${BASE_URL}/api/applications/recruiter-applications`,
        {
          headers: {
            authorization:
              token,
          },
        }
      );

    return response.data;
  };

export const updateStatus =
  async (
    applicationId,
    status
  ) => {

    const token =
      localStorage.getItem(
        "token"
      );

    const response =
      await axios.patch(
        `${BASE_URL}/api/applications/update/${applicationId}`,
        { status },
        {
          headers: {
            authorization:
              token,
          },
        }
      );

    return response.data;
  };

export const createJob =
  async (jobData) => {

    const token =
      localStorage.getItem(
        "token"
      );

    const response =
      await axios.post(
        `${API_URL}/create`,
        jobData,
        {
          headers: {
            authorization:
              token,
          },
        }
      );

    return response.data;
  };

export const getRecruiterJobs =
  async () => {

    const token =
      localStorage.getItem(
        "token"
      );

    const response =
      await axios.get(
        `${API_URL}/my-jobs`,
        {
          headers: {
            authorization:
              token,
          },
        }
      );

    return response.data;
  };

export const deleteJob =
  async (jobId) => {

    const token =
      localStorage.getItem(
        "token"
      );

    const response =
      await axios.delete(
        `${API_URL}/delete/${jobId}`,
        {
          headers: {
            authorization:
              token,
          },
        }
      );

    return response.data;
  };

export const getRecruiterStats =
  async () => {

    const token =
      localStorage.getItem(
        "token"
      );

    const response =
      await axios.get(
        `${BASE_URL}/api/applications/recruiter-stats`,
        {
          headers: {
            authorization:
              token,
          },
        }
      );

    return response.data;
  };