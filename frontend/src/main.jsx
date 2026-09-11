import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import "bootstrap/dist/css/bootstrap.min.css"; 
import "./index.css"; 
import axios from "axios";

// Global default headers to satisfy backend CSRF checks
axios.defaults.headers.common["x-requested-with"] = "XMLHttpRequest";

// Auto-recover from stale chunks when new builds are deployed (Vite official pattern)
window.addEventListener("vite:preloadError", (event) => {
  console.warn("[Vite] Preload error detected (stale deployment chunk). Auto-reloading...");
  const lastReload = sessionStorage.getItem("vite_preload_reload");
  const now = Date.now();
  if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
    sessionStorage.setItem("vite_preload_reload", now.toString());
    window.location.reload();
  }
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <>
      {/* Engineered Toast System: Customized branding parameters for micro-feedback */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: "18px", background: "#07111f", color: "#fff", padding: "16px 20px" },
          success: { iconTheme: { primary: "#10b981", secondary: "#fff" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
        }}
      />
      <App />
    </>
  </StrictMode>
);