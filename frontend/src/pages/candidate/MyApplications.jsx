import { useEffect, useState } from "react";
import RetryBanner from "../../Components/RetryBanner";
import { getMyApplicationsAPI, withdrawApplication, updateCandidateTrackingStatus } from "../../Services/userService";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import StatusBadge from "../../Components/common/StatusBadge";
import EmptyState from "../../Components/common/EmptyState";
import { JobCardSkeleton } from "../../Components/common/SkeletonLoader";
import undrawResumeSvg from "../../assets/undraw_resume_jrgi.svg";
import AiInterviewAssistant from "../../Components/AiInterviewAssistant";
import { getApiBaseUrl, getStoredUser } from "../../Services/authUtils";
import { Sparkles } from "lucide-react";
import { isTraoEnabled } from "../../utils/envUtils";

function MyApplications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingTrackerId, setUpdatingTrackerId] = useState(null);
  const [fetchError, setFetchError] = useState("");
  const [filter, setFilter] = useState("All");
  const [prepJob, setPrepJob] = useState(null);
  const showTraoPrep = isTraoEnabled();

  const API_URL = getApiBaseUrl();

  const fetchApplications = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please sign in to view your applications");
      navigate("/login");
      return;
    }

    try {
      setFetchError("");
      setLoading(true);
      const response = await getMyApplicationsAPI();
      const validApps = (response?.applications || []).filter((app) => app && app.job);
      setApplications(validApps);
    } catch (error) {
      console.error("Applications Error:", error);
      if (error?.response?.status === 401) {
        toast.error("Your session has expired. Please sign in again.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }
      if (error?.code === "ECONNABORTED") {
        setFetchError("The server took too long to respond while waking up. Please click Retry.");
        toast.error("Server connection timeout. Click Retry.");
      } else {
        setFetchError("Unable to load applications. Please try again.");
        toast.error("Failed to load applications");
      }
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleWithdraw = async (applicationId, jobTitle) => {
    const confirmWithdraw = window.confirm(`Withdraw your application for ${jobTitle}?`);
    if (!confirmWithdraw) return;

    try {
      setDeletingId(applicationId);
      await withdrawApplication(applicationId);
      setApplications((prev) => prev.filter((app) => app._id !== applicationId));
      toast.success("Application withdrawn successfully");
    } catch (error) {
      console.error("Withdraw Error:", error);
      toast.error(error?.response?.data?.message || "Failed to withdraw application");
    } finally {
      setDeletingId(null);
    }
  };

  const handleTrackerStatusChange = async (applicationId, candidateStatus) => {
    try {
      setUpdatingTrackerId(applicationId);
      await updateCandidateTrackingStatus(applicationId, candidateStatus);
      setApplications((prev) => prev.map((app) =>
        app._id === applicationId ? { ...app, candidateStatus } : app
      ));
      toast.success("Your tracking status was updated.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not update your tracking status.");
    } finally {
      setUpdatingTrackerId(null);
    }
  };

  const getResumeUrl = (resume) => {
    if (!resume) return "#";
    if (resume.startsWith("http")) return resume;
    const baseUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
    const cleanResumePath = resume.startsWith("/") ? resume : `/${resume}`;
    return `${baseUrl}${cleanResumePath}`;
  };

  const formatSalary = (job) => {
    if (!job.salary) return "Not specified";
    const raw = String(job.salary);
    // If it's not purely numeric (already has '$' or 'k', etc), return as is
    if (isNaN(Number(raw))) return raw;
    
    // Otherwise it's purely a number
    const formattedNum = Number(raw).toLocaleString("en-US");
    if (job.salaryCurrency === 'INR') return `₹${formattedNum}`;
    if (job.salaryCurrency === 'USD') return `$${formattedNum}`;
    if (job.salaryCurrency) return `${job.salaryCurrency} ${formattedNum}`;
    return formattedNum;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const filteredApplications = applications.filter(app => {
    if (filter === "All") return true;
    return app.status?.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="max-w-[1250px] mx-auto min-h-[60vh] px-4 sm:px-7 pt-7 pb-28">
      <div className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-1.5">My Applications</h1>
        <p className="text-sm sm:text-base text-slate-500">Track your applied jobs and status</p>
      </div>

      {/* TABS */}
      {!loading && applications.length > 0 && (
        <div className="flex justify-center gap-3 mb-7 flex-wrap">
          {["All", "Pending", "Shortlisted", "Selected", "Rejected"].map(tab => (
            <button
              key={tab}
              className={`px-4 py-2 rounded-full font-semibold text-sm cursor-pointer transition-all duration-200 border ${
                filter === tab
                  ? "bg-brand-600 border-brand-600 text-white shadow-md shadow-brand-500/20"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
              onClick={() => setFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {fetchError && <RetryBanner message={fetchError} onRetry={() => fetchApplications()} />}

      {loading ? (
        <div className="space-y-4 max-w-4xl mx-auto py-6" role="status" aria-label="Loading applications">
          <JobCardSkeleton />
          <JobCardSkeleton />
          <JobCardSkeleton />
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          illustration={undrawResumeSvg}
          title="You haven't applied to any jobs yet"
          description="Start applying to verified positions across top companies and track your application milestones here."
          actionText="Browse Jobs"
          actionHref="/candidate-dashboard"
        />
      ) : (
        <div className="flex flex-col items-center w-full">
          <div className="flex flex-wrap gap-5 justify-center w-full max-w-[900px]">
            {filteredApplications.map((application) => {
              if (!application?.job) return null;

              return (
                <div
                  key={application._id}
                  className="w-full bg-white rounded-2xl p-6 border border-slate-200 border-l-4 border-l-brand-600 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    <div className="flex items-start gap-4 mb-4">
                      {/* Avatar / Logo */}
                      {application.job.companyLogo ? (
                        <img
                          src={application.job.companyLogo}
                          alt="Logo"
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-100"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl uppercase shrink-0">
                          {application.job.company?.charAt(0) || "C"}
                        </div>
                      )}
                      
                      <div className="flex flex-col min-w-0 flex-1">
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1 truncate">{application.job.title}</h2>
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className="text-slate-600 text-sm font-medium m-0">{application.job.company}</p>
                          {/* External Badge */}
                          {application.job.isExternal && (
                            <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded border border-slate-200 uppercase tracking-wide">
                              External
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-slate-700 text-sm mb-2 flex items-center gap-1">📍 {application.job.location}</p>
                    <p className="text-base sm:text-lg font-bold text-emerald-600 mb-2">{formatSalary(application.job)}</p>
                    <p className="text-xs text-slate-500 m-0">
                      Applied on {formatDate(application.createdAt)}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 flex-wrap">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="grid gap-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Recruiter status</span>
                        <StatusBadge status={application.status || "pending"} size="md" />
                      </div>
                      <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        My tracker
                        <select
                          value={["applied", "shortlisted", "selected", "rejected"].includes(application.candidateStatus) ? application.candidateStatus : "applied"}
                          onChange={(event) => handleTrackerStatusChange(application._id, event.target.value)}
                          disabled={updatingTrackerId === application._id}
                          className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:cursor-wait disabled:opacity-60"
                          aria-label={`Your tracking status for ${application.job.title}`}
                        >
                          <option value="applied">Applied</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="selected">Selected</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </label>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {showTraoPrep && (
                        <button
                          type="button"
                          onClick={() => setPrepJob(application.job)}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition-colors border-0 cursor-pointer"
                          aria-label={`Create interview prep kit for ${application.job.title} at ${application.job.company}`}
                        >
                          <Sparkles size={16} />
                          Prepare with TRAO AI
                        </button>
                      )}
                      {application.resume && (
                        <a
                          href={`${API_URL}/api/applications/${application._id}/resume?token=${localStorage.getItem("token") || ""}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-sm transition-colors text-center cursor-pointer no-underline"
                          aria-label={`View resume for ${application.job.title}`}
                        >
                          View Resume
                        </a>
                      )}
                      
                      {/* Outlined Withdraw button */}
                      <button
                        className="px-3.5 py-1.5 bg-transparent text-rose-600 border border-rose-500 hover:bg-rose-50 rounded-lg font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-center"
                        onClick={() => handleWithdraw(application._id, application.job.title)}
                        disabled={deletingId === application._id}
                        aria-label={`Withdraw application for ${application.job.title}`}
                      >
                        {deletingId === application._id ? "..." : "Withdraw"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {filteredApplications.length === 0 && filter !== "All" && (
              <div className="w-full col-span-full py-8">
                <EmptyState
                  title={`No ${filter} applications`}
                  description={`You do not have any applications currently marked as "${filter}".`}
                  actionText="View All Applications"
                  onAction={() => setFilter("All")}
                />
              </div>
            )}
          </div>
          
          {/* Global Browse Jobs CTA */}
          <div className="mt-10 text-center pb-10">
            <Link
              to="/candidate-dashboard"
              className="inline-block bg-white text-brand-600 border-2 border-brand-600 hover:bg-brand-600 hover:text-white px-6 py-2.5 rounded-xl font-bold transition-colors no-underline"
            >
              Explore More Jobs
            </Link>
          </div>
        </div>
      )}
      {showTraoPrep && prepJob && (
        <AiInterviewAssistant
          key={prepJob._id}
          user={getStoredUser()}
          job={prepJob}
          autoGenerate
          onClose={() => setPrepJob(null)}
        />
      )}
    </div>
  );
}

export default MyApplications;
