import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const AdminDashboard = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchStatus = async () => {
    try {
      setLoading(true);
      // We must use withCredentials or our existing api instance to pass the auth cookie/token
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/jobs/sync/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus(res.data.data);
    } catch (err) {
      toast.error("Failed to load sync status");
    } finally {
      setLoading(false);
    }
  };

  const triggerSync = async () => {
    try {
      setSyncing(true);
      toast.loading("Syncing jobs in background...", { id: "sync" });
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_URL}/api/jobs/sync`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res.data.message || "Sync triggered successfully", { id: "sync" });
      fetchStatus();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to trigger sync", { id: "sync" });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto", fontFamily: "Inter, sans-serif" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "24px" }}>System Health</h1>
      
      <div style={{ background: "#fff", borderRadius: "8px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "1.25rem", margin: 0 }}>Sync Engine Status</h2>
          <div style={{ display: "flex", gap: "10px" }}>
            <button 
              onClick={fetchStatus}
              style={{ padding: "8px 16px", background: "#f3f4f6", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              Refresh
            </button>
            <button 
              onClick={triggerSync}
              disabled={syncing || (status && status.running)}
              style={{ padding: "8px 16px", background: "#ef4444", color: "white", border: "none", borderRadius: "4px", cursor: (syncing || (status && status.running)) ? "not-allowed" : "pointer" }}
            >
              {syncing ? "Syncing..." : "Trigger Manual Sync"}
            </button>
          </div>
        </div>

        {loading ? (
          <p>Loading status...</p>
        ) : status ? (
          <div>
            <div style={{ marginBottom: "16px" }}>
              <strong>Engine:</strong> {status.engine} <br/>
              <strong>Status:</strong> {status.running ? <span style={{color: '#eab308'}}>Running...</span> : <span style={{color: '#22c55e'}}>Idle</span>}
            </div>

            {status.providers?.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
                    <th style={{ padding: "8px" }}>Provider</th>
                    <th style={{ padding: "8px" }}>Status</th>
                    <th style={{ padding: "8px" }}>Total Jobs</th>
                    <th style={{ padding: "8px" }}>Last Sync</th>
                  </tr>
                </thead>
                <tbody>
                  {status.providers.map((p, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "12px 8px" }}>{p.name}</td>
                      <td style={{ padding: "12px 8px" }}>
                        <span style={{ 
                          background: p.status === 'SUCCESS' ? '#dcfce7' : '#fee2e2',
                          color: p.status === 'SUCCESS' ? '#166534' : '#991b1b',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.8rem'
                        }}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 8px" }}>{p.totalJobsFetched || 0}</td>
                      <td style={{ padding: "12px 8px" }}>
                        {p.lastSyncAt ? new Date(p.lastSyncAt).toLocaleString() : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No providers configured.</p>
            )}
          </div>
        ) : (
          <p>No status available.</p>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
