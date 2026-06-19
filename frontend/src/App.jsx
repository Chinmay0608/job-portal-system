import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Footer from "./Components/Footer";
import Navbar from "./Components/Navbar";
import ProtectedRoute from "./Components/ProtectedRoute";
import ScrollToTop from "./Components/ScrollToTop";

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

// ==========================================================================
// 3. RECRUITER ADMINISTRATIVE MANAGEMENT IMPORT SEGMENT
// ==========================================================================
import RecruiterDashboard from "./pages/recruiter/RecruiterDashboard";
import RecruiterApplications from "./pages/recruiter/RecruiterApplications";

// ==========================================================================
// 4. MARKETING, BLOG, & INFORMATION SUBDIVISIONS IMPORT SEGMENT
// ==========================================================================
import Home from "./pages/marketing/Home";
import About from "./pages/marketing/About";
import Blog from "./pages/marketing/Blog";
import Careers from "./pages/marketing/Careers";
import HelpCenter from "./pages/marketing/HelpCenter";
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

// ==========================================================================
// 6. UNIVERSAL UTILITY SHIFT SHARED LAYOUT IMPORT SEGMENT
// ==========================================================================
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

function AppContent() {
  const location = useLocation();

  // Integrated /recruiter-dashboard layout toggle rule parameters
  const hideLayout = ["/login", "/register", "/forgot-password", "/recruiter-dashboard"].includes(location.pathname) || 
                     location.pathname.startsWith("/reset-password");

  return (
    <>
      {!hideLayout && <Navbar />}
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

        {/* Role-Gated Recruiter Spaces */}
        <Route path="/recruiter-dashboard" element={<ProtectedRoute role="recruiter"><RecruiterDashboard /></ProtectedRoute>} />
        <Route path="/recruiter-applications" element={<ProtectedRoute role="recruiter"><RecruiterApplications /></ProtectedRoute>} />

        {/* Authenticated Shared Spaces */}
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

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

        {/* Catch-All Fault Tolerant Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!hideLayout && <Footer />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppContent />
    </BrowserRouter>
  );
}

export default App;