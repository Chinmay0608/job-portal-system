import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { HiOutlineSearch, HiOutlineBriefcase, HiOutlineCheckCircle, HiOutlineGlobeAlt, HiOutlineOfficeBuilding, HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineTrash, HiOutlineBan } from "react-icons/hi";
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
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/jobs/admin/all`, {
        params: { page, limit: 15, source: sourceFilter, status: statusFilter, search },
        headers: { Authorization: `Bearer ${token}` }
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
      await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/api/jobs/${id}`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      toast.success(`Job ${newStatus === "open" ? "activated" : "deactivated"}`);
      fetchJobs();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const deleteJob = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this job?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/jobs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Job deleted");
      fetchJobs();
    } catch (err) {
      toast.error("Failed to delete job");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Jobs Registry</h2>
        <p className="text-xs text-slate-500 mt-0.5">Manage all internal and external job postings on the platform.</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-xl shrink-0">
              <HiOutlineBriefcase />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 m-0">{stats.total}</h3>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5 m-0">Total Jobs</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0">
              <HiOutlineCheckCircle />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 m-0">{stats.active}</h3>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5 m-0">Active</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shrink-0">
              <HiOutlineGlobeAlt />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 m-0">{stats.external}</h3>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5 m-0">External</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center text-xl shrink-0">
              <HiOutlineOfficeBuilding />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 m-0">{stats.internal}</h3>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5 m-0">Internal</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2.5 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl flex-1">
          <HiOutlineSearch className="text-slate-400 text-lg shrink-0" />
          <input 
            type="text" 
            placeholder="Search by title, company, or location..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-transparent border-0 outline-none text-sm text-slate-900 placeholder:text-slate-400"
          />
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="w-full sm:w-44">
            <CustomSelect 
              value={sourceFilter}
              onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
              options={[
                { value: "", label: "All Sources" },
                { value: "internal", label: "Internal Only" },
                { value: "external", label: "External Only" }
              ]}
            />
          </div>
          <div className="w-full sm:w-44">
            <CustomSelect 
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
      </div>

      <div className="overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-xs">
        {loading ? (
          <div className="p-8 text-center text-sm font-semibold text-slate-400">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="p-8 text-center text-sm font-semibold text-slate-500">No jobs found matching your criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-5 py-3.5">Job Title</th>
                  <th className="px-5 py-3.5">Company</th>
                  <th className="px-5 py-3.5">Source</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Applications</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map(job => (
                  <React.Fragment key={job._id}>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-900">{job.title}</td>
                      <td className="px-5 py-4 text-xs font-semibold text-slate-600">{job.company}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          job.isExternal ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-blue-50 text-brand-700 border border-blue-200"
                        }`}>
                          {job.isExternal ? "External" : "Internal"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          job.status === 'open' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-900">{job.applicationCount}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button 
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors border-0 bg-transparent cursor-pointer" 
                            onClick={() => toggleStatus(job._id, job.status)}
                            title={job.status === "open" ? "Deactivate" : "Activate"}
                          >
                            <HiOutlineBan size={16} />
                          </button>
                          <button 
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-700 hover:bg-rose-50 transition-colors border-0 bg-transparent cursor-pointer" 
                            onClick={() => deleteJob(job._id)}
                            title="Delete permanently"
                          >
                            <HiOutlineTrash size={16} />
                          </button>
                          <button 
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors border-0 bg-transparent cursor-pointer"
                            onClick={() => setExpandedRow(expandedRow === job._id ? null : job._id)}
                          >
                            {expandedRow === job._id ? <HiOutlineChevronUp size={16} /> : <HiOutlineChevronDown size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedRow === job._id && (
                      <tr className="bg-slate-50/50">
                        <td colSpan="6" className="px-5 py-4 text-xs text-slate-600">
                          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5">
                            <p className="m-0"><strong className="text-slate-900">Location:</strong> {job.location}</p>
                            <p className="m-0"><strong className="text-slate-900">URL:</strong> {job.isExternal ? <a href={job.applyUrl} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">{job.applyUrl}</a> : "Internal Portal"}</p>
                            <p className="m-0"><strong className="text-slate-900">Required Skills:</strong> {job.skillsRequired?.length > 0 ? job.skillsRequired.join(", ") : "None specified"}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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

export default JobsRegistryView;
