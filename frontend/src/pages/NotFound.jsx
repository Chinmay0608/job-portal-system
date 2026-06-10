import { useNavigate } from "react-router-dom";

function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "20px" }}>
      <img src="/undraw_page-not-found_6wni.svg" alt="404" style={{ width: "380px", maxWidth: "90%" }} />
      <h1 style={{ fontSize: "5rem", fontWeight: "800", marginTop: "20px", color: "#07111f" }}>404</h1>
      <h2 style={{ fontWeight: "700" }}>Page Not Found</h2>
      <p style={{ color: "#6b7280", marginTop: "10px", maxWidth: "420px" }}>The page you are looking for does not exist or has been moved.</p>
      <button onClick={() => navigate("/")} style={{ marginTop: "24px", border: "none", background: "#07111f", color: "white", padding: "14px 28px", borderRadius: "16px", fontWeight: "600", cursor: "pointer" }}>Go Home</button>
    </div>
  );
}

export default NotFound;