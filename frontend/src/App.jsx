import { BrowserRouter, Routes, Route } from "react-router-dom";

import CandidateDashboard
from "./pages/CandidateDashboard";

import RecruiterDashboard
from "./pages/RecruiterDashboard";

import MyApplications
from "./pages/MyApplications";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/candidate-dashboard"
          element={
            <CandidateDashboard />
          }
        />

        <Route
          path="/recruiter-dashboard"
          element={
            <RecruiterDashboard />
          }
        />

        <Route
          path="/my-applications"
          element={
            <MyApplications />
          }
        /> 

        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;