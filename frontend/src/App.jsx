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
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import About from "./pages/About";
import Blog from "./pages/Blog";
import Careers from "./pages/Careers";
import HelpCenter from "./pages/HelpCenter";

import SalaryData from "./pages/SalaryData";
import GetFeatured from "./pages/GetFeatured";

import AiRecruiting from "./pages/AiRecruiting";
import SuccessStories from "./pages/SuccessStories";

import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import CookiePolicy from "./pages/CookiePolicy";
import Security from "./pages/Security";

function AppContent() {
  const location = useLocation();

  const hideLayout =
    [
      "/login",
      "/register",
      "/forgot-password",
    ].includes(location.pathname) ||
    location.pathname.startsWith("/reset-password");

  return (
    <>
      {!hideLayout && <Navbar />}

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/reset-password/:token"
          element={<ResetPassword />}
        />

        {/* Candidate Routes */}
        <Route
          path="/candidate-dashboard"
          element={
            <ProtectedRoute role="candidate">
              <CandidateDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-applications"
          element={
            <ProtectedRoute role="candidate">
              <MyApplications />
            </ProtectedRoute>
          }
        />

        {/* Recruiter Routes */}
        <Route
          path="/recruiter-dashboard"
          element={
            <ProtectedRoute role="recruiter">
              <RecruiterDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recruiter-applications"
          element={
            <ProtectedRoute role="recruiter">
              <RecruiterApplications />
            </ProtectedRoute>
          }
        />

        {/* Shared Protected Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Footer Pages */}
        <Route path="/about" element={<About />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/help-center" element={<HelpCenter />} />

        <Route
          path="/salary-data"
          element={<SalaryData />}
        />
        <Route
          path="/get-featured"
          element={<GetFeatured />}
        />

        <Route
          path="/ai-recruiting"
          element={<AiRecruiting />}
        />
        <Route
          path="/success-stories"
          element={<SuccessStories />}
        />

        <Route
          path="/privacy-policy"
          element={<PrivacyPolicy />}
        />
        <Route
          path="/terms-of-use"
          element={<TermsOfUse />}
        />
        <Route
          path="/cookie-policy"
          element={<CookiePolicy />}
        />
        <Route path="/security" element={<Security />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
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