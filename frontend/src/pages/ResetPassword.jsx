import {
  useState
} from "react";

import axios
  from "axios";

import toast
  from "react-hot-toast";

import {
  useNavigate,
  useParams
} from "react-router-dom";

function ResetPassword() {

  const navigate =
    useNavigate();

  const {
    token
  } = useParams();

  const [
    password,
    setPassword
  ] = useState("");

  const [
    loading,
    setLoading
  ] = useState(false);

  const handleSubmit =
    async (e) => {

      e.preventDefault();

      if (
        password.length < 6
      ) {

        return toast.error(
          "Password must be at least 6 characters"
        );
      }

      try {

        setLoading(
          true
        );

        const response =
          await axios.put(

            `http://localhost:5000/api/auth/reset-password/${token}`,

            {
              password
            }
          );

        toast.success(
          response.data.message
        );

        navigate(
          "/login"
        );

      } catch (error) {

        toast.error(

          error.response
            ?.data
            ?.message ||

          "Reset failed"
        );

      } finally {

        setLoading(
          false
        );
      }
    };

  return (
    <div className="auth-page">

      <div className="auth-right">

        <h1 className="auth-title">
          Reset Password
        </h1>

        <p className="auth-subtitle">
          Enter your new password
        </p>

        <form
          onSubmit={
            handleSubmit
          }
        >

          <input
            type="password"

            placeholder="New Password"

            className="
              auth-input
            "

            value={password}

            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }

            required
          />

          <button
            type="submit"

            className="
              auth-btn
            "

            disabled={
              loading
            }
          >

            {
              loading
                ? "Resetting..."
                : "Reset Password"
            }

          </button>

        </form>

      </div>

    </div>
  );
}

export default
  ResetPassword;