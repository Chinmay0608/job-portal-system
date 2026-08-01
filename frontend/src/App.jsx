import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Footer from "./Components/Footer";
import Navbar from "./Components/Navbar";
import ProtectedRoute from "./Components/ProtectedRoute";
import ScrollToTop from "./Components/ScrollToTop";
import SplashScreen from "./Components/SplashScreen";

// ==========================================================================
// 1. AUTHENTICATION INFRASTRUCTURE DOMAIN IMPORT SEGMENT
// ==========================================================================
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// ==========================================================================
// 2. CANDIDATE ISOLATED PLATFORM SUITE IMPORT SEGMENT
// ==========================================================================
import CandidateDashboard from "./pages/candidate/CandidateDashboard";
import MyApplications from "./pages/candidate/MyApplications";
import CandidateProfile from "./pages/candidate/candidateProfile";

// ==========================================================================
// 3. RECRUITER ADMINISTRATIVE MANAGEMENT IMPORT SEGMENT
// ==========================================================================
import RecruiterDashboard from "./pages/recruiter/RecruiterDashboard";
import RecruiterApplications from "./pages/recruiter/RecruiterApplications";
import RecruiterProfile from "./pages/recruiter/recruiterProfile";
import AdminDashboard from "./pages/admin/AdminDashboard";

// ==========================================================================
// 4. MARKETING, BLOG, & INFORMATION SUBDIVISIONS IMPORT SEGMENT
// ==========================================================================
import Home from "./pages/marketing/Home";
import About from "./pages/marketing/About";
import Blog from "./pages/marketing/Blog";
import Careers from "./pages/marketing/Careers";
import SalaryData from "./pages/marketing/SalaryData";
import GetFeatured from "./pages/marketing/GetFeatured";
import AiRecruiting from "./pages/marketing/AiRecruiting";
import SuccessStories from "./pages/marketing/SuccessStories";

// ==========================================================================
// 5. LEGAL COMPLIANCE & REGULATORY DECLARATIONS IMPORT SEGMENT
// ==========================================================================
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfUse from "./pages/legal/TermsOfUse";
import CookiePolicy from "./pages/legal/CookiePolicy";
import Security from "./pages/legal/Security";
import HelpCenter from "./pages/legal/HelpCenter";

// ==========================================================================
// 6. UNIVERSAL UTILITY SHIFT SHARED LAYOUT IMPORT SEGMENT
// ==========================================================================
import NotFound from "./pages/NotFound";

function AppContent() {
  const location = useLocation();

  // Integrated /recruiter-dashboard layout toggle rule parameters
  const hideLayout = ["/login", "/register", "/forgot-password"].includes(location.pathname) || 
                     location.pathname.startsWith("/reset-password");

  return (
    <>
      {!hideLayout && <Navbar />}
      <main className="main-content">
        <Routes>
          {/* Immersive Public & Access Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Role-Gated Candidate Spaces */}
          <Route path="/candidate-dashboard" element={<ProtectedRoute role="candidate"><CandidateDashboard /></ProtectedRoute>} />
          <Route path="/my-applications" element={<ProtectedRoute role="candidate"><MyApplications /></ProtectedRoute>} />
          <Route path="/candidate-profile" element={<ProtectedRoute role="candidate"><CandidateProfile /></ProtectedRoute>} />

          {/* ========================================== */}
          {/* ================= ADMIN ================== */}
          <Route path="/admin/dashboard" element={<ProtectedRoute role="recruiter"><AdminDashboard /></ProtectedRoute>} />

          {/* ========================================== */}
          {/* ============== RECRUITER ================= */}
          <Route path="/recruiter-dashboard" element={<ProtectedRoute role="recruiter"><RecruiterDashboard /></ProtectedRoute>} />
          <Route path="/recruiter-applications" element={<ProtectedRoute role="recruiter"><RecruiterApplications /></ProtectedRoute>} />
          <Route path="/recruiter-profile" element={<ProtectedRoute role="recruiter"><RecruiterProfile /></ProtectedRoute>} />

          {/* Informational Marketing & Legal Layout Trees */}
          <Route path="/about" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/help-center" element={<HelpCenter />} />
          <Route path="/salary-data" element={<SalaryData />} />
          <Route path="/get-featured" element={<GetFeatured />} />
          <Route path="/ai-recruiting" element={<AiRecruiting />} />
          <Route path="/success-stories" element={<SuccessStories />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-use" element={<TermsOfUse />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/security" element={<Security />} />
          
          {/* Default 404 Catcher */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!hideLayout && <Footer />}
    </>
  );
}

function App() {
  // Splash should only ever appear on the very first visit.
  // Check localStorage synchronously on first render so the splash
  // never flashes on subsequent visits/refreshes.
  const hasSeenSplash = localStorage.getItem("sb_has_seen_splash") === "true";

  const [showSplash, setShowSplash] = useState(!hasSeenSplash);
  const [isSplashExiting, setIsSplashExiting] = useState(false);

  useEffect(() => {
    if (hasSeenSplash) return; // already shown before, skip entirely

    // Hold the splash on screen, then trigger the fade-out animation
    const exitTimer = setTimeout(() => setIsSplashExiting(true), 1400);

    // Fully remove the splash from the DOM once the fade-out animation finishes,
    // and record that it has now been seen so it never shows again.
    const removeTimer = setTimeout(() => {
      setShowSplash(false);
      localStorage.setItem("sb_has_seen_splash", "true");
    }, 1900);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      {showSplash && <SplashScreen isExiting={isSplashExiting} />}
      <AppContent />
    </BrowserRouter>
  );
}

export default App;