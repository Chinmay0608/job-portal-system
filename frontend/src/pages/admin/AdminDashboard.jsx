import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../../Styles/AdminDashboard.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const getAuthHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [activeTab, setActiveTab] = useState('metrics'); // 'metrics' or 'users'

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/admin/sde/health`, getAuthHeaders());
        setMetrics(data);
      } catch (err) {
        console.error("Failed to fetch SDE metrics", err);
      } finally {
        setLoadingMetrics(false);
      }
    };
    
    const fetchUsers = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/admin/users`, getAuthHeaders());
        setUsers(data);
      } catch (err) {
        console.error("Failed to fetch users", err);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchHealth();
    fetchUsers();
    
    const interval = setInterval(fetchHealth, 10000); // Polling for metrics
    return () => clearInterval(interval);
  }, []);

  if (loadingMetrics && loadingUsers) return <div className="admin-loading">Loading Admin Dashboard...</div>;

  return (
    <div className="admin-dashboard-container">
      <header className="admin-header">
        <h1>SkillBridge Admin Portal</h1>
        <div className="admin-tabs">
          <button 
            className={`admin-tab ${activeTab === 'metrics' ? 'active' : ''}`}
            onClick={() => setActiveTab('metrics')}
          >
            SDE Metrics
          </button>
          <button 
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            User Management
          </button>
        </div>
      </header>

      {activeTab === 'metrics' && (
        <>
          {!metrics ? (
            <div className="admin-error">Failed to connect to Discovery Engine.</div>
          ) : (
            <>
              <div className="metrics-grid">
                <div className="metric-card glass">
                  <h2>Registry Size</h2>
                  <div className="metric-value">{metrics.registrySize}</div>
                </div>
                <div className="metric-card glass">
                  <h2>Crawler Success</h2>
                  <div className="metric-value">{metrics.crawlerSuccess}</div>
                </div>
                <div className="metric-card glass">
                  <h2>Avg Crawl Time</h2>
                  <div className="metric-value">{metrics.averageCrawlTime}ms</div>
                </div>
              </div>

              <div className="metrics-grid col-2">
                <div className="metric-card glass">
                  <h2>Today's Deltas</h2>
                  <ul className="delta-list">
                    <li><span className="dot green"></span> New Jobs: <strong>{metrics.todayDeltas?.newJobs || 0}</strong></li>
                    <li><span className="dot blue"></span> Updated Jobs: <strong>{metrics.todayDeltas?.updatedJobs || 0}</strong></li>
                    <li><span className="dot yellow"></span> Unchanged Jobs: <strong>{metrics.todayDeltas?.unchangedJobs || 0}</strong></li>
                    <li><span className="dot red"></span> Expired Jobs: <strong>{metrics.todayDeltas?.expiredJobs || 0}</strong></li>
                  </ul>
                </div>
                <div className="metric-card glass">
                  <h2>Top Hiring Companies</h2>
                  <ul className="hiring-list">
                    {metrics.topHiring?.map((comp, i) => (
                      <li key={i}>{comp.name} <span>{comp.count}</span></li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {activeTab === 'users' && (
        <div className="admin-users-section">
          <h2>Platform Users ({users.length})</h2>
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {users.length === 0 && !loadingUsers && (
                  <tr>
                    <td colSpan="4" style={{textAlign: 'center'}}>No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
