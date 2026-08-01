import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../../Styles/AdminDashboard.css';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const { data } = await axios.get('/api/admin/sde/health');
        setMetrics(data);
      } catch (err) {
        console.error("Failed to fetch SDE metrics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000); // Polling
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="admin-loading">Loading Discovery Engine Core...</div>;
  if (!metrics) return <div className="admin-error">Failed to connect to Discovery Engine.</div>;

  return (
    <div className="admin-dashboard-container">
      <header className="admin-header">
        <h1>SkillBridge SDE</h1>
        <span className="status-badge pulse-green">Healthy</span>
      </header>

      <div className="metrics-grid">
        {/* Core Metrics */}
        <div className="metric-card glass">
          <h3>Registry Size</h3>
          <div className="metric-value">{metrics.registrySize}</div>
        </div>

        <div className="metric-card glass">
          <h3>Crawler Success</h3>
          <div className="metric-value">{metrics.crawlerSuccess}</div>
        </div>

        <div className="metric-card glass">
          <h3>Avg Crawl Time</h3>
          <div className="metric-value">{metrics.averageCrawlTime}ms</div>
        </div>
      </div>

      <div className="metrics-grid col-2">
        {/* Delta Tracking */}
        <div className="metric-card glass">
          <h3>Today's Deltas</h3>
          <ul className="delta-list">
            <li><span className="dot green"></span> New Jobs: <strong>{metrics.todayDeltas?.newJobs || 0}</strong></li>
            <li><span className="dot blue"></span> Updated Jobs: <strong>{metrics.todayDeltas?.updatedJobs || 0}</strong></li>
            <li><span className="dot yellow"></span> Unchanged Jobs: <strong>{metrics.todayDeltas?.unchangedJobs || 0}</strong></li>
            <li><span className="dot red"></span> Expired Jobs: <strong>{metrics.todayDeltas?.expiredJobs || 0}</strong></li>
          </ul>
        </div>

        {/* Top Hiring */}
        <div className="metric-card glass">
          <h3>Top Hiring Companies</h3>
          <ul className="hiring-list">
            {metrics.topHiring?.map((comp, i) => (
              <li key={i}>{comp.name} <span>{comp.count}</span></li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
