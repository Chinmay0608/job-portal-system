import axios
from "axios";

const API =
  "http://localhost:5000/api";

export const uploadResume =
  async (file) => {

    const formData =
      new FormData();

    formData.append(
      "resume",
      file
    );

    const token =
      localStorage.getItem(
        "token"
      );

    const response =
      await axios.post(
        `${API}/auth/upload-resume`,
        formData,
        {
          headers: {
            authorization: token,
          },
        }
      );

    return response.data;
  };