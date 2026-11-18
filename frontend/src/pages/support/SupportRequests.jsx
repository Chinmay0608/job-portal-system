import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BsHeadset } from "react-icons/bs";
import { FiArrowLeft, FiExternalLink, FiSend } from "react-icons/fi";
import toast from "react-hot-toast";
import { getStoredUser } from "../../Services/authUtils";
import {
  addSupportRequestDetails,
  getMySupportRequest,
  getMySupportRequests,
} from "../../Services/supportService";

const statusLabels = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

const statusStyles = {
  open: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-slate-100 text-slate-600 border-slate-200",
};

const formatDate = (date) => new Date(date).toLocaleString(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function SupportRequests() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [ticket, setTicket] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const isCandidate = getStoredUser()?.role === "candidate";

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      if (ticketId) {
        const result = await getMySupportRequest(ticketId);
        setTicket(result.ticket);
      } else {
        const result = await getMySupportRequests();
        setTickets(result.tickets || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not load this support request.");
    } finally {
      setIsLoading(false);
    }
  }, [ticketId]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (message.trim().length < 5) return;
    setIsSending(true);
    try {
      const result = await addSupportRequestDetails(ticketId, message.trim());
      setTicket(result.ticket);
      setMessage("");
      toast.success("Details added to your support request");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not send your details. Try again.");
    } finally {
      setIsSending(false);
    }
  };

  const searchUrl = ticket?.reportedJobTitle
    ? `/candidate-dashboard?tab=jobs&search=${encodeURIComponent(ticket.reportedJobTitle)}`
    : "/candidate-dashboard?tab=jobs";

  return (
    <div className="min-h-[70vh] px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-3xl">
        <Link to={ticketId ? "/support/requests" : "/help-center"} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-brand-700">
          <FiArrowLeft /> {ticketId ? "All support requests" : "Help Center"}
        </Link>

        <header className="mb-6 flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700"><BsHeadset size={20} /></span>
          <div>
            <h1 className="m-0 text-2xl font-bold tracking-tight text-slate-900">{ticketId ? "Support request" : "Your support requests"}</h1>
            <p className="mb-0 mt-1 text-sm text-slate-600">View updates and add information for the SkillBridge support team.</p>
          </div>
        </header>

        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500" role="status">Loading support request…</div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-white p-6 text-sm text-rose-700" role="alert">
            <p className="m-0">{error}</p>
            <button type="button" onClick={load} className="mt-3 rounded-lg border border-rose-200 px-3 py-1.5 font-semibold hover:bg-rose-50">Try again</button>
          </div>
        ) : ticketId && ticket ? (
          <article className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="m-0 text-xs font-semibold uppercase tracking-wide text-slate-500">Ticket #{String(ticket._id).slice(-6).toUpperCase()}</p>
                  <p className="mb-0 mt-1 text-sm text-slate-500">Submitted {formatDate(ticket.createdAt)}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusStyles[ticket.status] || statusStyles.open}`}>{statusLabels[ticket.status] || "Open"}</span>
              </div>
              <ol aria-label="Support request progress" className="mt-5 grid grid-cols-3 gap-2 p-0">
                {["Submitted", "In review", "Resolved"].map((step, index) => {
                  const progress = ticket.status === "in_progress" ? 1 : ["resolved", "closed"].includes(ticket.status) ? 2 : 0;
                  const complete = index <= progress;
                  return (
                    <li key={step} className="list-none text-center">
                      <span className={`mx-auto block h-2 rounded-full ${complete ? "bg-cyan-600" : "bg-slate-200"}`} />
                      <span className={`mt-2 block text-[11px] font-semibold ${complete ? "text-slate-800" : "text-slate-400"}`}>{step}</span>
                    </li>
                  );
                })}
              </ol>
              <div className="mt-5 border-t border-slate-100 pt-4">
                <h2 className="m-0 text-base font-bold text-slate-900">Your report</h2>
                <p className="mb-0 mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{ticket.description}</p>
              </div>
              {(ticket.reportedJobTitle || ticket.reportedJobCompany) && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="m-0 text-xs font-bold uppercase tracking-wide text-amber-800">Reported job</p>
                  <p className="mb-0 mt-1 text-sm font-semibold text-slate-900">{ticket.reportedJobTitle || "Job listing"}{ticket.reportedJobCompany ? ` at ${ticket.reportedJobCompany}` : ""}</p>
                  {ticket.reportType === "job_concern" && <p className="mb-0 mt-1 text-xs text-slate-600">Reason: {ticket.concernReason}</p>}
                  {isCandidate && (ticket.category === "job_not_visible" || ticket.reportType === "job_concern") && (
                    <Link to={searchUrl} className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:underline">Search jobs <FiExternalLink size={14} /></Link>
                  )}
                </div>
              )}
            </section>

            {ticket.resolutionMessage && (
              <section className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-5 sm:p-6">
                <h2 className="m-0 text-base font-bold text-slate-900">{ticket.status === "open" ? "Previous support update" : "Support update"}</h2>
                <p className="mb-0 mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{ticket.resolutionMessage}</p>
              </section>
            )}

            {ticket.followUpMessages?.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="m-0 text-base font-bold text-slate-900">Additional details</h2>
                <div className="mt-3 space-y-3">
                  {ticket.followUpMessages.map((item, index) => (
                    <div key={`${item.createdAt}-${index}`} className="rounded-xl bg-slate-50 p-4">
                      <p className="m-0 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.message}</p>
                      <p className="mb-0 mt-2 text-xs text-slate-500">Sent {formatDate(item.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <label htmlFor="ticket-follow-up" className="block text-base font-bold text-slate-900">Need to add something?</label>
              <p className="mb-3 mt-1 text-sm text-slate-600">Add the job title, company, or any detail that may help us investigate.</p>
              <textarea id="ticket-follow-up" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={1200} minLength={5} rows={4} required placeholder="Type additional details…" className="w-full resize-y rounded-xl border border-slate-300 p-3 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-500">Adding details reopens this request for review.</span>
                <button type="submit" disabled={isSending || message.trim().length < 5} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50">
                  <FiSend size={15} /> {isSending ? "Sending…" : "Add details"}
                </button>
              </div>
            </form>
          </article>
        ) : tickets.length ? (
          <div className="space-y-3">
            {tickets.map((item) => (
              <Link key={item._id} to={`/support/requests/${item._id}`} className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-cyan-300 hover:shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ticket #{String(item._id).slice(-6).toUpperCase()}</span>
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusStyles[item.status] || statusStyles.open}`}>{statusLabels[item.status] || "Open"}</span>
                </div>
                <p className="mb-0 mt-3 line-clamp-2 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-800">{item.description}</p>
                <p className="mb-0 mt-3 text-xs text-slate-500">Updated {formatDate(item.updatedAt)}</p>
                {item.resolutionMessage && <p className="mb-0 mt-2 line-clamp-2 text-sm text-slate-600">{item.resolutionMessage}</p>}
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="m-0 text-base font-bold text-slate-900">No support requests yet</h2>
            <p className="mb-0 mt-2 text-sm text-slate-600">When you contact support, your requests and updates will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
