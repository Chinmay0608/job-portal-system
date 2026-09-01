import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { HiOutlineSearch, HiOutlineDocumentText, HiOutlineClock, HiOutlineXCircle, HiOutlineBadgeCheck, HiOutlineExternalLink } from "react-icons/hi";
import "../../Styles/pages/admin/AdminDashboard.css";
import CustomSelect from "../../Components/CustomSelect";

function ApplicationsView() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(\`\${import.meta.env.VITE_API_BASE_URL}/api/applications/admin/all\`, {
        params: { page, limit: 20, status: statusFilter, search },
        headers: { Authorization: \`Bearer \${token}\` }
      });
      setApplications(res.data.applications);
      setStats(res.data.stats);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const getStatusBadge = (status) => {
    switch(status) {
      case "pending": return <span className="badge internal">Pending</span>;
      case "shortlisted": return <span className="badge external">Shortlisted</span>;
      case "selected": return <span className="badge active">Selected</span>;
      case "rejected": return <span className="badge inactive">Rejected</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  const handleResumeClick = async (resumeUrl) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        \`\${import.meta.env.VITE_API_BASE_URL}/api/upload/signed-url\`,
        { fileUrl: resumeUrl },
        { headers: { Authorization: \`Bearer \${token}\` } }
      );
      window.open(res.data.signedUrl, "_blank");
    } catch (err) {
      toast.error("Failed to access resume document securely.");
    }
  };

  return (
    <div className="admin-tab-content">
      <div className="admin-header-area">
        <h2>Global Applications</h2>
        <p>Monitor platform-wide candidate application statuses and resumes.</p>
      </div>

      {stats && (
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <HiOutlineDocumentText className="stat-icon" />
            <div className="stat-info">
              <h3>{stats.total}</h3>
              <p>Total Apps</p>
            </div>
          </div>
          <div className="admin-stat-card">
            <HiOutlineClock className="stat-icon internal" />
            <div className="stat-info">
              <h3>{stats.pending}</h3>
              <p>Pending</p>
            </div>
          </div>
          <div className="admin-stat-card">
            <HiOutlineBadgeCheck className="stat-icon external" />
            <div className="stat-info">
              <h3>{stats.shortlisted}</h3>
              <p>Shortlisted</p>
            </div>
          </div>
          <div className="admin-stat-card">
            <HiOutlineXCircle className="stat-icon inactive" />
            <div className="stat-info">
              <h3>{stats.rejected}</h3>
              <p>Rejected</p>
            </div>
          </div>
        </div>
      )}

      <div className="admin-filters-bar">
        <div className="admin-search-box">
          <HiOutlineSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search candidate, email, or job..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="admin-filter-dropdowns">
          <CustomSelect 
            className="admin-select"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            options={[
              { value: "", label: "All Statuses" },
              { value: "pending", label: "Pending" },
              { value: "shortlisted", label: "Shortlisted" },
              { value: "selected", label: "Selected" },
              { value: "rejected", label: "Rejected" }
            ]}
          />
        </div>
      </div>

      <div className="admin-table-container">
        {loading ? (
          <div className="admin-loader">Loading applications...</div>
        ) : applications.length === 0 ? (
          <div className="admin-empty">No applications found matching your criteria.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Job & Company</th>
                <th>Applied Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map(app => (
                <tr key={app._id}>
                  <td>
                    <div className="fw-600">{app.candidate?.name || "Unknown"}</div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                      {app.candidate?.email}
                    </div>
                  </td>
                  <td>
                    <div className="fw-600">{app.job?.title || "Deleted Job"}</div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                      {app.job?.company} {app.job?.isExternal ? "(External)" : ""}
                    </div>
                  </td>
                  <td>
                    {new Date(app.appliedAt).toLocaleDateString()}
                  </td>
                  <td>
                    {getStatusBadge(app.status)}
                  </td>
                  <td className="actions-cell">
                    {app.candidate?.resume ? (
                      <button 
                        className="action-btn toggle-btn" 
                        onClick={() => handleResumeClick(app.candidate.resume)}
                        title="View Resume Document"
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem' }}
                      >
                        <HiOutlineDocumentText /> Resume
                      </button>
                    ) : app.job?.isExternal ? (
                      <a 
                        href={app.job.applyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="action-btn expand-btn"
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem', textDecoration: 'none' }}
                        title="View External Job Portal"
                      >
                        <HiOutlineExternalLink /> Portal
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>No Docs</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="admin-pagination">
          <button 
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button 
            disabled={page === totalPages} 
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default ApplicationsView;
