import { useState, useEffect, useMemo, useRef } from "react";
import { createJob, getRecruiterJobs, deleteJob, updateJob, getRecruiterApplications } from "../../Services/jobService";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import CustomSelect from "../../Components/CustomSelect";
import EmptyState from "../../Components/common/EmptyState";
import { JobCardSkeleton, MetricCardSkeleton } from "../../Components/common/SkeletonLoader";
import undrawCareerSvg from "../../assets/undraw_career-progress_vfq5.svg";

import {
  HiOutlineBriefcase,
  HiChevronDown,
  HiOutlinePlus,
  HiOutlineMapPin,
  HiOutlineCurrencyRupee,
  HiOutlineDocumentText,
  HiOutlineSquares2X2,
  HiOutlineListBullet,
  HiXMark,
  HiOutlineUserGroup,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineArrowLeft
} from "react-icons/hi2";
const initialFormState = { title: "", role: "Full-time", company: "", location: "", salary: "", description: "" };
const JOBS_PER_PAGE = 6;

function RecruiterDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch (e) {
      return null;
    }
  });

  const [formData, setFormData] = useState(initialFormState);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [stats, setStats] = useState({ totalJobs: 0, totalApplications: 0, shortlisted: 0, rejected: 0 });

  // Modal visibility for Create/Edit Job card
  const [showJobModal, setShowJobModal] = useState(false);

  // Filter: derived dynamically from real job data (no static dropdown options)
  const [statusFilter, setStatusFilter] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // View mode: grid or list — both render the same real job data
  const [viewMode, setViewMode] = useState("grid");

  // Pagination
  const [visibleCount, setVisibleCount] = useState(JOBS_PER_PAGE);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    await Promise.all([fetchJobs(), fetchStats()]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Opens the Create Job card as a modal overlay
  const handleQuickCreate = () => {
    setEditingJob(null);
    setFormData(initialFormState);
    setShowJobModal(true);
  };

  const closeJobModal = () => {
    setShowJobModal(false);
    setEditingJob(null);
    setFormData(initialFormState);
  };


  const generateAIDescription = async () => {
    if (!formData.title || !formData.company) {
      toast.error('Please enter a Job Title and Company first!');
      return;
    }
    setIsGeneratingAI(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/jobs/generate-description`,
        { title: formData.title, company: formData.company, role: formData.role },
        getAuthHeaders()
      );
      setFormData(prev => ({ ...prev, description: response.data.description }));
      toast.success('AI Description Generated successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate description with AI.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.title.trim().length < 3) return toast.error("Job title must be at least 3 characters");
    if (Number(formData.salary) <= 0) return toast.error("Salary must be greater than 0");

    try {
      setSubmitting(true);
      let response = editingJob ? await updateJob(editingJob._id, formData) : await createJob(formData);
      toast.success(response?.message || (editingJob ? "Job updated successfully" : "Job created successfully"));
      setFormData(initialFormState);
      setEditingJob(null);
      setShowJobModal(false);
      await fetchDashboardData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await getRecruiterJobs();
      setJobs(response?.jobs || []);
    } catch (error) {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [appRes, jobRes] = await Promise.all([getRecruiterApplications(), getRecruiterJobs()]);
      const apps = appRes?.applications || [];
      setStats({
        totalJobs: (jobRes?.jobs || []).length,
        totalApplications: apps.length,
        shortlisted: apps.filter((a) => a.status === "shortlisted").length,
        rejected: apps.filter((a) => a.status === "rejected").length,
      });
    } catch (error) {
      console.error("Stats Error:", error);
    }
  };

  const handleDelete = async (jobId) => {
    try {
      const response = await deleteJob(jobId);
      toast.success(response?.message || "Job deleted");
      await fetchDashboardData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Delete failed");
    }
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setFormData({
      title: job.title || "",
      role: job.role || "Full-time",
      company: job.company || "",
      location: job.location || "",
      salary: job.salary || "",
      description: job.description || "",
    });
    setShowJobModal(true);
  };

  // Build the status filter's option list dynamically from the actual jobs returned —
  // no hardcoded "Active / Draft" options that don't map to real data.
  const availableRoleTypes = useMemo(() => {
    const types = new Set(jobs.map((job) => job.role).filter(Boolean));
    return ["All", ...Array.from(types)];
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    if (statusFilter === "All") return jobs;
    return jobs.filter((job) => job.role === statusFilter);
  }, [jobs, statusFilter]);

  const visibleJobs = filteredJobs.slice(0, visibleCount);
  const hasMoreJobs = visibleCount < filteredJobs.length;

  // Reset pagination whenever the filter changes so results start from the top
  useEffect(() => {
    setVisibleCount(JOBS_PER_PAGE);
  }, [statusFilter]);

  // Close the custom filter dropdown when clicking outside it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectFilter = (type) => {
    setStatusFilter(type);
    setIsFilterOpen(false);
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + JOBS_PER_PAGE);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 font-sans pb-28 text-slate-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* SUB-HEADER CONTEXT ROW (Mobile only) */}
        <div className="block md:hidden bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase mb-1">RECRUITER DECK</p>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-900 m-0 truncate">{user?.company || "Your Company"}</h2>
            <button 
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-xs flex items-center gap-1.5 border-0 shrink-0" 
              onClick={handleQuickCreate}
            >
              <HiOutlinePlus size={16} /> Post Job
            </button>
          </div>
        </div>

        {/* TOPBAR (Desktop) */}
        <section className="hidden md:flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight m-0">Welcome back, Recruiter! 👋</h2>
            <p className="text-sm font-medium text-slate-500 mt-1 m-0">Manage your jobs and find the best talent</p>
          </div>
          <div>
            <button 
              type="button" 
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-sm rounded-xl cursor-pointer transition-all shadow-xs flex items-center gap-2 border-0" 
              onClick={handleQuickCreate}
            >
              <HiOutlinePlus size={18} /> Create Job
            </button>
          </div>
        </section>

        {/* SCORECARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <>
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
            </>
          ) : (
            <>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl shrink-0">
                  <HiOutlineBriefcase />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 m-0">{stats.totalJobs}</h3>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5 m-0">Total Jobs</p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center text-xl shrink-0">
                  <HiOutlineUserGroup />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 m-0">{stats.totalApplications}</h3>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5 m-0">Applications</p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0">
                  <HiOutlineCheckCircle />
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
            </>
          )}
        </section>

        {/* JOBS LISTING */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <h3 className="text-xl font-black text-slate-900 m-0">My Posted Jobs</h3>
            <div className="flex flex-wrap items-center gap-3">
              {/* Desktop Filter Dropdown */}
              <div className="relative hidden md:block" ref={filterRef}>
                <button
                  type="button"
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-2 cursor-pointer transition-colors"
                  onClick={() => setIsFilterOpen((prev) => !prev)}
                >
                  <HiOutlineBriefcase className="text-slate-500" />
                  <span>{statusFilter}</span>
                  <HiChevronDown className={`transition-transform duration-200 ${isFilterOpen ? "rotate-180" : ""}`} />
                </button>

                {isFilterOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-20 animate-fade-in">
                    {availableRoleTypes.map((type) => (
                      <button
                        type="button"
                        key={type}
                        className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors cursor-pointer border-0 ${
                          statusFilter === type ? "bg-brand-50 text-brand-700" : "bg-transparent text-slate-700 hover:bg-slate-50"
                        }`}
                        onClick={() => handleSelectFilter(type)}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Scrollable Chips */}
              <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                {availableRoleTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border-0 cursor-pointer ${
                      statusFilter === type
                        ? "bg-brand-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                    onClick={() => handleSelectFilter(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* View Toggle Buttons */}
              <div className="hidden md:inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  className={`p-1.5 rounded-lg text-sm transition-all cursor-pointer border-0 ${
                    viewMode === "grid" ? "bg-white text-brand-600 shadow-xs font-bold" : "bg-transparent text-slate-500 hover:text-slate-900"
                  }`}
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                >
                  <HiOutlineSquares2X2 size={18} />
                </button>
                <button
                  type="button"
                  className={`p-1.5 rounded-lg text-sm transition-all cursor-pointer border-0 ${
                    viewMode === "list" ? "bg-white text-brand-600 shadow-xs font-bold" : "bg-transparent text-slate-500 hover:text-slate-900"
                  }`}
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                >
                  <HiOutlineListBullet size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" : "flex flex-col gap-3.5"}>
            {loading ? (
              <div className="w-full col-span-full space-y-4 py-4" role="status" aria-label="Loading job opportunities">
                <JobCardSkeleton />
                <JobCardSkeleton />
                <JobCardSkeleton />
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="w-full col-span-full py-8">
                <EmptyState
                  illustration={undrawCareerSvg}
                  title={jobs.length === 0 ? "No posted jobs yet" : "No jobs match this filter"}
                  description={
                    jobs.length === 0
                      ? "Post your first role to start receiving matched candidate applications."
                      : "Try choosing another role filter or reset to view all listings."
                  }
                  actionText={jobs.length === 0 ? "Post a Job" : "Clear Filter"}
                  onAction={jobs.length === 0 ? handleQuickCreate : () => setStatusFilter("All")}
                />
              </div>
            ) : (
              visibleJobs.map((job) => (
                <article key={job._id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-3">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                        job.isActive !== false ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}>
                        {job.isActive !== false ? "Active" : "Closed"}
                      </span>
                      <span className="text-slate-400 font-medium">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-slate-900 leading-snug line-clamp-1 mb-1">{job.title}</h4>
                    <p className="text-xs font-semibold text-slate-500 m-0">{job.company}</p>

                    <div className="flex items-center gap-3 text-xs text-slate-500 my-2.5">
                      <div className="flex items-center gap-1">
                        <HiOutlineMapPin className="text-slate-400" />
                        <span>{job.location || "Remote, India"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <HiOutlineUserGroup className="text-slate-400" />
                        <span>Applicants</span>
                      </div>
                    </div>

                    <div className="text-sm font-extrabold text-slate-900 mb-4">
                      {typeof job.salary === 'string' && isNaN(Number(job.salary)) ? job.salary : `₹${Number(job.salary).toLocaleString("en-IN")}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    <button 
                      type="button" 
                      className="flex-1 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer border-0" 
                      onClick={() => handleEdit(job)}
                    >
                      Edit
                    </button>
                    <button 
                      type="button" 
                      className="py-2 px-3 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border-0" 
                      onClick={() => handleDelete(job._id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>

          {!loading && hasMoreJobs && (
            <div className="flex justify-center pt-4">
              <button 
                type="button" 
                className="px-6 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer" 
                onClick={handleLoadMore}
              >
                <span>Load more jobs</span>
                <HiChevronDown />
              </button>
            </div>
          )}
        </section>
      </main>

      {/* MOBILE FLOATING ACTION BUTTON */}
      <button 
        className="md:hidden fixed bottom-6 right-6 z-40 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm px-5 py-3 rounded-full shadow-lg flex items-center gap-2 active:scale-95 cursor-pointer border-0" 
        onClick={handleQuickCreate}
      >
        <HiOutlinePlus size={20} /> Post a new job
      </button>

      {/* CREATE / EDIT JOB MODAL */}
      {showJobModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in" onClick={closeJobModal}>
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 my-auto space-y-4 animate-slide-in-right" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-900 m-0">
                  {editingJob ? "Edit " : "Create "}
                  <span className="text-brand-600">{editingJob ? "Job" : "New Job"}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1 m-0">
                  {editingJob ? "Update the details for this job listing" : "Fill in the details to post a new job"}
                </p>
              </div>
              <button 
                type="button" 
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer border-0" 
                onClick={closeJobModal} 
                aria-label="Close"
              >
                <HiXMark size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1 block">Job Title</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><HiOutlineBriefcase /></span>
                  <input 
                    name="title" 
                    value={formData.title} 
                    onChange={handleChange} 
                    placeholder="e.g. Frontend Developer" 
                    required 
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1 block">Company</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><HiOutlineBriefcase /></span>
                  <input 
                    name="company" 
                    value={formData.company} 
                    onChange={handleChange} 
                    placeholder="e.g. Google" 
                    required 
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1 block">Location</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><HiOutlineMapPin /></span>
                  <input 
                    name="location" 
                    value={formData.location} 
                    onChange={handleChange} 
                    placeholder="e.g. Bangalore" 
                    required 
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1 block">Salary</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><HiOutlineCurrencyRupee /></span>
                    <input 
                      name="salary" 
                      value={formData.salary} 
                      onChange={handleChange} 
                      placeholder="e.g. 1800000" 
                      inputMode="numeric" 
                      required 
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1 block">Role Type</label>
                  <CustomSelect
                    name="role"
                    options={[{ value: "Full-time", label: "Full-time" }, { value: "Part-time", label: "Part-time" }, { value: "Contract", label: "Contract" }]}
                    value={formData.role}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1 block">Job Description</label>
                <div className="relative">
                  <textarea 
                    name="description" 
                    value={formData.description} 
                    onChange={handleChange} 
                    rows={4} 
                    placeholder="Write job description..." 
                    required 
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-sm rounded-xl cursor-pointer transition-all shadow-sm border-0 disabled:opacity-50 mt-2" 
                disabled={submitting}
              >
                {submitting ? "Saving..." : editingJob ? "Update Job" : "Post Job"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecruiterDashboard;