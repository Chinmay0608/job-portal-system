import { useState } from "react";
import { registerUser } from "../services/authService";

function Register() {
  const [formData, setFormData] =
    useState({
      name: "",
      email: "",
      password: "",
      role: "candidate",
    });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value,
    });
  };

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      try {
        const response =
          await registerUser(
            formData
          );

        alert(
          response.message
        );

        console.log(response);
      } catch (error) {
        console.log(error);

        alert(
          "Registration Failed"
        );
      }
    };

  return (
    <div>
      <h1>Register</h1>

      <form
        onSubmit={
          handleSubmit
        }
      >
        <input
          type="text"
          name="name"
          placeholder="Name"
          onChange={
            handleChange
          }
        />

        <br />
        <br />

        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={
            handleChange
          }
        />

        <br />
        <br />

        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={
            handleChange
          }
        />

        <br />
        <br />

        <select
          name="role"
          onChange={
            handleChange
          }
        >
          <option value="candidate">
            Candidate
          </option>

          <option value="recruiter">
            Recruiter
          </option>
        </select>

        <br />
        <br />

        <button type="submit">
          Register
        </button>
      </form>
    </div>
  );
}

export default Register;