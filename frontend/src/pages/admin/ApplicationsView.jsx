import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { HiOutlineSearch, HiOutlineDocumentText, HiOutlineClock, HiOutlineXCircle, HiOutlineBadgeCheck, HiOutlineExternalLink } from "react-icons/hi";
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
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/applications/admin/all`, {
        params: { page, limit: 20, status: statusFilter, search },
        headers: { Authorization: `Bearer ${token}` }
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
      case "pending": 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Pending</span>;
      case "shortlisted": 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-brand-700 border border-blue-200">Shortlisted</span>;
      case "selected": 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Selected</span>;
      case "rejected": 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">Rejected</span>;
      default: 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  const handleResumeClick = async (resumeUrl) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/upload/signed-url`,
        { fileUrl: resumeUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.open(res.data.signedUrl, "_blank");
    } catch (err) {
      toast.error("Failed to access resume document securely.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Global Applications</h2>
        <p className="text-xs text-slate-500 mt-0.5">Monitor platform-wide candidate application statuses and resumes.</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-xl shrink-0">
              <HiOutlineDocumentText />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 m-0">{stats.total}</h3>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5 m-0">Total Apps</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shrink-0">
              <HiOutlineClock />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 m-0">{stats.pending}</h3>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5 m-0">Pending</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center text-xl shrink-0">
              <HiOutlineBadgeCheck />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 m-0">{stats.shortlisted}</h3>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5 m-0">Shortlisted</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl shrink-0">
              <HiOutlineXCircle />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 m-0">{stats.rejected}</h3>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5 m-0">Rejected</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2.5 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl flex-1">
          <HiOutlineSearch className="text-slate-400 text-lg shrink-0" />
          <input 
            type="text" 
            placeholder="Search candidate, email, or job..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-transparent border-0 outline-none text-sm text-slate-900 placeholder:text-slate-400"
          />
        </div>
        <div className="w-full sm:w-52">
          <CustomSelect 
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

      <div className="overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-xs">
        {loading ? (
          <div className="p-8 text-center text-sm font-semibold text-slate-400">Loading applications...</div>
        ) : applications.length === 0 ? (
          <div className="p-8 text-center text-sm font-semibold text-slate-500">No applications found matching your criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-6 py-3.5">Candidate</th>
                  <th className="px-6 py-3.5">Job & Company</th>
                  <th className="px-6 py-3.5">Applied Date</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map(app => (
                  <tr key={app._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{app.candidate?.name || "Unknown"}</div>
                      <div className="text-xs text-slate-500">
                        {app.candidate?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{app.job?.title || "Deleted Job"}</div>
                      <div className="text-xs text-slate-500">
                        {app.job?.company} {app.job?.isExternal ? "(External)" : ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                      {new Date(app.appliedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(app.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {app.candidate?.resume ? (
                        <button 
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold rounded-lg transition-colors cursor-pointer border-0" 
                          onClick={() => handleResumeClick(app.candidate.resume)}
                          title="View Resume Document"
                        >
                          <HiOutlineDocumentText size={14} /> <span>Resume</span>
                        </button>
                      ) : app.job?.isExternal ? (
                        <a 
                          href={app.job.applyUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors no-underline"
                          title="View External Job Portal"
                        >
                          <HiOutlineExternalLink size={14} /> <span>Portal</span>
                        </a>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">No Docs</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <button 
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border-0 shadow-xs"
          >
            Previous
          </button>
          <span className="text-xs sm:text-sm font-semibold text-slate-600">Page {page} of {totalPages}</span>
          <button 
            disabled={page === totalPages} 
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border-0 shadow-xs"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default ApplicationsView;
