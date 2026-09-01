import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { HiOutlineSearch, HiOutlineBriefcase, HiOutlineCheckCircle, HiOutlineGlobeAlt, HiOutlineOfficeBuilding, HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineTrash, HiOutlineBan } from "react-icons/hi";
import "../../Styles/pages/admin/AdminDashboard.css";
import CustomSelect from "../../Components/CustomSelect";

function JobsRegistryView() {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sourceFilter, setSourceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(\`\${import.meta.env.VITE_API_BASE_URL}/api/jobs/admin/all\`, {
        params: { page, limit: 15, source: sourceFilter, status: statusFilter, search },
        headers: { Authorization: \`Bearer \${token}\` }
      });
      setJobs(res.data.jobs);
      setStats(res.data.stats);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      toast.error("Failed to load jobs registry");
    } finally {
      setLoading(false);
    }
  }, [page, sourceFilter, statusFilter, search]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const toggleStatus = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem("token");
      const newStatus = currentStatus === "open" ? "closed" : "open";
      await axios.patch(\`\${import.meta.env.VITE_API_BASE_URL}/api/jobs/\${id}\`, 
        { status: newStatus },
        { headers: { Authorization: \`Bearer \${token}\` }}
      );
      toast.success(\`Job \${newStatus === "open" ? "activated" : "deactivated"}\`);
      fetchJobs();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const deleteJob = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this job?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(\`\${import.meta.env.VITE_API_BASE_URL}/api/jobs/\${id}\`, {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      toast.success("Job deleted");
      fetchJobs();
    } catch (err) {
      toast.error("Failed to delete job");
    }
  };

  return (
    <div className="admin-tab-content">
      <div className="admin-header-area">
        <h2>Jobs Registry</h2>
        <p>Manage all internal and external job postings on the platform.</p>
      </div>

      {stats && (
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <HiOutlineBriefcase className="stat-icon" />
            <div className="stat-info">
              <h3>{stats.total}</h3>
              <p>Total Jobs</p>
            </div>
          </div>
          <div className="admin-stat-card">
            <HiOutlineCheckCircle className="stat-icon match" />
            <div className="stat-info">
              <h3>{stats.active}</h3>
              <p>Active</p>
            </div>
          </div>
          <div className="admin-stat-card">
            <HiOutlineGlobeAlt className="stat-icon external" />
            <div className="stat-info">
              <h3>{stats.external}</h3>
              <p>External</p>
            </div>
          </div>
          <div className="admin-stat-card">
            <HiOutlineOfficeBuilding className="stat-icon internal" />
            <div className="stat-info">
              <h3>{stats.internal}</h3>
              <p>Internal</p>
            </div>
          </div>
        </div>
      )}

      <div className="admin-filters-bar">
        <div className="admin-search-box">
          <HiOutlineSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by title, company, or location..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="admin-filter-dropdowns">
          <CustomSelect 
            className="admin-select"
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
            options={[
              { value: "", label: "All Sources" },
              { value: "internal", label: "Internal Only" },
              { value: "external", label: "External Only" }
            ]}
          />
          <CustomSelect 
            className="admin-select"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            options={[
              { value: "", label: "All Statuses" },
              { value: "active", label: "Active Only" },
              { value: "inactive", label: "Inactive Only" }
            ]}
          />
        </div>
      </div>

      <div className="admin-table-container">
        {loading ? (
          <div className="admin-loader">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="admin-empty">No jobs found matching your criteria.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Company</th>
                <th>Source</th>
                <th>Status</th>
                <th>Applications</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <React.Fragment key={job._id}>
                  <tr className={expandedRow === job._id ? "expanded" : ""}>
                    <td className="fw-600">{job.title}</td>
                    <td>{job.company}</td>
                    <td>
                      <span className={\`badge \${job.isExternal ? "external" : "internal"}\`}>
                        {job.isExternal ? "External" : "Internal"}
                      </span>
                    </td>
                    <td>
                      <span className={\`badge \${job.status === 'open' ? 'active' : 'inactive'}\`}>
                        {job.status}
                      </span>
                    </td>
                    <td>
                      <strong>{job.applicationCount}</strong>
                    </td>
                    <td className="actions-cell">
                      <button 
                        className="action-btn toggle-btn" 
                        onClick={() => toggleStatus(job._id, job.status)}
                        title={job.status === "open" ? "Deactivate" : "Activate"}
                      >
                        <HiOutlineBan />
                      </button>
                      <button 
                        className="action-btn delete-btn" 
                        onClick={() => deleteJob(job._id)}
                        title="Delete permanently"
                      >
                        <HiOutlineTrash />
                      </button>
                      <button 
                        className="action-btn expand-btn"
                        onClick={() => setExpandedRow(expandedRow === job._id ? null : job._id)}
                      >
                        {expandedRow === job._id ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
                      </button>
                    </td>
                  </tr>
                  {expandedRow === job._id && (
                    <tr className="expanded-details-row">
                      <td colSpan="6">
                        <div className="expanded-details">
                          <p><strong>Location:</strong> {job.location}</p>
                          <p><strong>URL:</strong> {job.isExternal ? <a href={job.applyUrl} target="_blank" rel="noreferrer">{job.applyUrl}</a> : "Internal Portal"}</p>
                          <p><strong>Required Skills:</strong> {job.skillsRequired?.length > 0 ? job.skillsRequired.join(", ") : "None specified"}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
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

export default JobsRegistryView;
