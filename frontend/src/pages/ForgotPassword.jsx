import {
  useState
} from "react";

import axios
  from "axios";

import toast
  from "react-hot-toast";

import {
  useNavigate
} from "react-router-dom";

function ForgotPassword() {

  const navigate =
    useNavigate();

  const [
    email,
    setEmail
  ] = useState("");

  const [
    loading,
    setLoading
  ] = useState(false);

  const handleSubmit =
    async (e) => {

      e.preventDefault();

      try {

        setLoading(
          true
        );

        const response =
          await axios.post(

            "http://localhost:5000/api/auth/forgot-password",

            {
              email
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

          "Something went wrong"
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
          Forgot Password
        </h1>

        <p className="auth-subtitle">
          Enter your email to
          receive reset link
        </p>

        <form
          onSubmit={
            handleSubmit
          }
        >

          <input
            type="email"

            placeholder="Email"

            className="
              auth-input
            "

            value={email}

            onChange={(e) =>
              setEmail(
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
                ? "Sending..."
                : "Send Reset Link"
            }

          </button>

        </form>

      </div>

    </div>
  );
}

export default
  ForgotPassword;