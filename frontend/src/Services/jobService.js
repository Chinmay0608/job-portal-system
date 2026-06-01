import axios from "axios";

const API_URL =
  "http://localhost:5000/api/jobs";

export const getJobs =
  async () => {
    const response =
      await axios.get(
        API_URL
      );

    return response.data;
  };

export const applyJob =
  async (jobId) => {
    const token =
      localStorage.getItem(
        "token"
      );

    const response =
      await axios.post(
        "http://localhost:5000/api/applications/apply",
        {
          jobId,
        },
        {
          headers: {
            authorization:
              token,
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
        "http://localhost:5000/api/applications/my-applications",
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
        "http://localhost:5000/api/applications/recruiter-applications",
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
        `http://localhost:5000/api/applications/update/${applicationId}`,
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

export const createJob = async (jobData) => {
    const token = localStorage.getItem("token");

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