import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Footer from "./Components/Footer";
import Navbar from "./Components/Navbar";
import ProtectedRoute from "./Components/ProtectedRoute";
import CandidateDashboard from "./pages/CandidateDashboard";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import RecruiterApplications from "./pages/RecruiterApplications";
import MyApplications from "./pages/MyApplications";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import ForgotPassword
  from "./pages/ForgotPassword";

import ResetPassword
  from "./pages/ResetPassword";


function AppContent() {
  const location = useLocation();
  const hideLayout = location.pathname === "/login" || location.pathname === "/register";

  return (
    <>
      {!hideLayout && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/candidate-dashboard" element={<ProtectedRoute role="candidate"><CandidateDashboard /></ProtectedRoute>} />
        <Route path="/recruiter-dashboard" element={<ProtectedRoute role="recruiter"><RecruiterDashboard /></ProtectedRoute>} />
        <Route path="/my-applications" element={<ProtectedRoute role="candidate"><MyApplications /></ProtectedRoute>} />
        <Route path="/recruiter-applications" element={<ProtectedRoute role="recruiter"><RecruiterApplications /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute role="candidate"><Profile /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
        <Route
          path="/forgot-password"
          element={
            <ForgotPassword />
          }
        />

        <Route
          path="/reset-password/:token"
          element={
            <ResetPassword />
          }
        />
      </Routes>
      {!hideLayout && <Footer />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;