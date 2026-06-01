import {
  useState
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  loginUser,
} from "../services/authService";

function Login() {

  const navigate =
    useNavigate();

  const [
    email,
    setEmail
  ] = useState("");

  const [
    password,
    setPassword
  ] = useState("");

  const handleSubmit =
    async (e) => {

      e.preventDefault();

      try {

        const response =
          await loginUser({
            email,
            password,
          });

        localStorage.setItem(
          "token",
          response.token
        );

        localStorage.setItem(
          "user",
          JSON.stringify(
            response.user
          )
        );

        if (
          response.user.role ===
          "candidate"
        ) {

          navigate(
            "/candidate-dashboard"
          );

        } else {

          navigate(
            "/recruiter-dashboard"
          );
        }

      } catch (error) {

        alert(
          error.response
            ?.data
            ?.message ||
          "Login failed"
        );
      }
    };

  return (
    <div className="auth-container">

      <div className="auth-card">

        <h1 className="auth-title">
          Login
        </h1>

        <form
          onSubmit={
            handleSubmit
          }
        >

          <input
            type="email"
            placeholder="Email"
            className="auth-input"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="auth-input"
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
            className="auth-btn"
          >
            Login
          </button>

        </form>

      </div>
    </div>
  );
}

export default Login;