import { BrowserRouter, Routes, Route } from "react-router-dom";

import Footer
from "./Components/Footer";

import RecruiterApplications
from "./pages/RecruiterApplications";

import ProtectedRoute
from "./Components/ProtectedRoute";

import Navbar
from "./Components/Navbar";

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
      {
        location.pathname !== "/login" &&
        location.pathname !== "/register" && (
          <Navbar />
        )
      }
      <Routes>
        <Route
          path="/candidate-dashboard"
          element={
            <ProtectedRoute
              role="candidate"
            >
              <CandidateDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recruiter-dashboard"
          element={
            <ProtectedRoute
              role="recruiter"
            >
              <RecruiterDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-applications"
          element={
            <ProtectedRoute
              role="candidate"
            >
              <MyApplications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recruiter-applications"
          element={
            <ProtectedRoute
              role="recruiter"
            >
              <RecruiterApplications />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />
      </Routes>
      {
        location.pathname !== "/login" &&
        location.pathname !== "/register" && (
          <Footer />
        )
      }
      
    </BrowserRouter>
  );
}

export default App;