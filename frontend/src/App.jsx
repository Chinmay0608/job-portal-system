import { useState, useEffect, lazy, Suspense } from "react";
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
const CandidateDashboard = lazy(() => import("./pages/candidate/CandidateDashboard"));
const MyApplications = lazy(() => import("./pages/candidate/MyApplications"));
const CandidateProfile = lazy(() => import("./pages/candidate/candidateProfile"));

// ==========================================================================
// 3. RECRUITER ADMINISTRATIVE MANAGEMENT IMPORT SEGMENT
// ==========================================================================
const RecruiterDashboard = lazy(() => import("./pages/recruiter/RecruiterDashboard"));
const RecruiterApplications = lazy(() => import("./pages/recruiter/RecruiterApplications"));
const RecruiterProfile = lazy(() => import("./pages/recruiter/recruiterProfile"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));

// ==========================================================================
// 4. MARKETING, BLOG, & INFORMATION SUBDIVISIONS IMPORT SEGMENT
// ==========================================================================
import Home from "./pages/marketing/Home";
const About = lazy(() => import("./pages/marketing/About"));
const Blog = lazy(() => import("./pages/marketing/Blog"));
const Careers = lazy(() => import("./pages/marketing/Careers"));
const SalaryData = lazy(() => import("./pages/marketing/SalaryData"));
const GetFeatured = lazy(() => import("./pages/marketing/GetFeatured"));
const AiRecruiting = lazy(() => import("./pages/marketing/AiRecruiting"));
const SuccessStories = lazy(() => import("./pages/marketing/SuccessStories"));

// ==========================================================================
// 5. LEGAL COMPLIANCE & REGULATORY DECLARATIONS IMPORT SEGMENT
// ==========================================================================
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const TermsOfUse = lazy(() => import("./pages/legal/TermsOfUse"));
const CookiePolicy = lazy(() => import("./pages/legal/CookiePolicy"));
const Security = lazy(() => import("./pages/legal/Security"));
const HelpCenter = lazy(() => import("./pages/legal/HelpCenter"));

// ==========================================================================
// 6. UNIVERSAL UTILITY SHIFT SHARED LAYOUT IMPORT SEGMENT
// ==========================================================================
import NotFound from "./pages/NotFound";

function AppContent() {
  const location = useLocation();

  // Integrated /recruiter-dashboard layout toggle rule parameters
  const hideLayout = ["/login", "/register", "/forgot-password"].includes(location.pathname.toLowerCase()) || 
                     location.pathname.toLowerCase().startsWith("/reset-password");

  return (
    <>
      {!hideLayout && <Navbar />}
      <main className="main-content">
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
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
            <Route path="/admin/dashboard" element={<ProtectedRoute role="recruiter" email="admin@gmail.com"><AdminDashboard /></ProtectedRoute>} />

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
        </Suspense>
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