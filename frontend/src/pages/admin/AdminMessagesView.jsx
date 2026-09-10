import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Send,
  Mail,
  Users,
  User,
  AlertTriangle,
  Megaphone,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  Loader2,
  Eye,
  Shield,
  X,
  Radio,
  FileText,
  BellRing
} from "lucide-react";
import toast from "react-hot-toast";
import debounce from "lodash.debounce";
import {
  sendMessageAPI,
  getAdminSentMessagesAPI,
  searchRecipientsAPI,
} from "../../Services/messageService";

export default function AdminMessagesView() {
  // Compose state
  const [deliveryMode, setDeliveryMode] = useState("specific"); // "specific" | "broadcast"
  const [targetRole, setTargetRole] = useState("candidate"); // "all" | "candidate" | "recruiter"
  const [recipientQuery, setRecipientQuery] = useState("");
  const [recipientResults, setRecipientResults] = useState([]);
  const [isSearchingRecipient, setIsSearchingRecipient] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("normal");
  const [sendEmailCopy, setSendEmailCopy] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Sent messages log state
  const [sentMessages, setSentMessages] = useState([]);
  const [isLoadingSent, setIsLoadingSent] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Detail preview modal
  const [previewMessage, setPreviewMessage] = useState(null);

  // Debounced user search
  const performSearch = useRef(
    debounce(async (q) => {
      if (!q || q.trim().length < 2) {
        setRecipientResults([]);
        setIsSearchingRecipient(false);
        return;
      }
      try {
        setIsSearchingRecipient(true);
        const users = await searchRecipientsAPI(q.trim());
        setRecipientResults(users);
      } catch (err) {
        console.error("Recipient search error:", err);
      } finally {
        setIsSearchingRecipient(false);
      }
    }, 300)
  ).current;

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setRecipientQuery(val);
    performSearch(val);
  };

  // Fetch sent messages
  const fetchSentMessages = useCallback(async (targetPage = 1) => {
    setIsLoadingSent(true);
    try {
      const res = await getAdminSentMessagesAPI(targetPage, 15);
      if (res.success) {
        setSentMessages(res.messages || []);
        setPage(res.page || 1);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.totalCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch sent messages:", err);
      toast.error("Failed to load sent message history");
    } finally {
      setIsLoadingSent(false);
    }
  }, []);

  useEffect(() => {
    fetchSentMessages(1);
  }, [fetchSentMessages]);

  // Submit handler
  const handleDispatch = async () => {
    if (!title.trim()) {
      toast.error("Please enter a message title");
      return;
    }
    if (!content.trim()) {
      toast.error("Please enter message content");
      return;
    }
    if (deliveryMode === "specific" && !selectedRecipient) {
      toast.error("Please search and select a recipient");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        priority,
        targetRole: deliveryMode === "specific" ? "specific" : targetRole,
        recipientId: deliveryMode === "specific" ? selectedRecipient._id : undefined,
        sendEmailCopy,
      };

      const res = await sendMessageAPI(payload);
      if (res.success) {
        toast.success(
          deliveryMode === "specific"
            ? `Message dispatched to ${selectedRecipient.name}!`
            : "System announcement broadcasted successfully!"
        );
        // Reset form
        setTitle("");
        setContent("");
        setSelectedRecipient(null);
        setRecipientQuery("");
        setShowConfirmModal(false);
        // Refresh log
        fetchSentMessages(1);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      const msg = err?.response?.data?.message || "Failed to dispatch communication";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case "urgent":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200">
            <AlertTriangle size={12} />
            Urgent
          </span>
        );
      case "announcement":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
            <Megaphone size={12} />
            Announcement
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <BellRing size={12} />
            Normal
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Send className="text-blue-600" size={24} />
            Direct Messages & System Announcements
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Dispatch official in-app notifications and email notices to individual candidates, recruiters, or segment broadcasts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchSentMessages(page)}
          disabled={isLoadingSent}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all"
        >
          <RefreshCw size={15} className={isLoadingSent ? "animate-spin text-blue-600" : ""} />
          Refresh Log
        </button>
      </div>

      {/* Main Grid: Compose (Left 5 cols) & Sent History (Right 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ─── COMPOSE CARD ───────────────────────────────────────────────── */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText size={18} className="text-blue-600" />
              Compose Communication
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose targeting mode, write message, and optionally send email copy.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setShowConfirmModal(true);
            }}
            className="p-5 space-y-4"
          >
            {/* Delivery Mode Toggle */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Delivery Target
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setDeliveryMode("specific");
                    setSelectedRecipient(null);
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    deliveryMode === "specific"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <User size={14} />
                  Direct (1:1)
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryMode("broadcast")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    deliveryMode === "broadcast"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Users size={14} />
                  Role Broadcast
                </button>
              </div>
            </div>

            {/* Direct Recipient Search */}
            {deliveryMode === "specific" && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Select Recipient <span className="text-rose-500">*</span>
                </label>

                {selectedRecipient ? (
                  <div className="flex items-center justify-between p-3 bg-blue-50/80 border border-blue-200 rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                        {selectedRecipient.name?.slice(0, 2).toUpperCase() || "U"}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 leading-tight">
                          {selectedRecipient.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {selectedRecipient.email} &bull; <span className="capitalize font-semibold text-blue-700">{selectedRecipient.role}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRecipient(null);
                        setRecipientQuery("");
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Remove recipient"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                      <input
                        type="text"
                        value={recipientQuery}
                        onChange={handleQueryChange}
                        placeholder="Search candidate or recruiter by name / email..."
                        className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      {isSearchingRecipient && (
                        <Loader2 className="absolute right-3 top-2.5 animate-spin text-slate-400" size={16} />
                      )}
                    </div>

                    {/* Results Dropdown */}
                    {recipientResults.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto divide-y divide-slate-100">
                        {recipientResults.map((u) => (
                          <div
                            key={u._id}
                            onClick={() => {
                              setSelectedRecipient(u);
                              setRecipientResults([]);
                              setRecipientQuery("");
                            }}
                            className="p-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <div>
                              <div className="text-xs font-bold text-slate-900">{u.name}</div>
                              <div className="text-[11px] text-slate-500">{u.email}</div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                              {u.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Broadcast Role Selector */}
            {deliveryMode === "broadcast" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Target User Segment
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "all", label: "All Users" },
                    { id: "candidate", label: "Candidates" },
                    { id: "recruiter", label: "Recruiters" },
                  ].map((seg) => (
                    <button
                      key={seg.id}
                      type="button"
                      onClick={() => setTargetRole(seg.id)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                        targetRole === seg.id
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {seg.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Priority Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Priority Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "normal", label: "Normal", color: "text-slate-700 border-slate-200" },
                  { id: "urgent", label: "Urgent", color: "text-rose-700 border-rose-200" },
                  { id: "announcement", label: "Announcement", color: "text-purple-700 border-purple-200" },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPriority(p.id)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                      priority === p.id
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Title */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Subject / Title <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">{title.length}/150</span>
              </div>
              <input
                type="text"
                maxLength={150}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Action Required: Please verify your contact information"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>

            {/* Message Body */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Message Content <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">{content.length}/5000</span>
              </div>
              <textarea
                rows={5}
                maxLength={5000}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your official message here. Clear formatting with line breaks will be preserved..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed resize-none"
                required
              />
            </div>

            {/* Email Copy Checkbox */}
            <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <input
                type="checkbox"
                id="sendEmailCopy"
                checked={sendEmailCopy}
                onChange={(e) => setSendEmailCopy(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
              />
              <label htmlFor="sendEmailCopy" className="text-xs text-slate-700 font-medium cursor-pointer select-none flex items-center gap-1.5">
                <Mail size={14} className="text-blue-600" />
                <span>Send copy to recipient email address(es)</span>
              </label>
            </div>

            {/* Dispatch Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Dispatching Communication...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Send Communication</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* ─── SENT MESSAGES HISTORY TABLE (7 cols) ───────────────────────── */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock size={18} className="text-blue-600" />
                Sent Communications History
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {totalCount} total communication{totalCount === 1 ? "" : "s"} dispatched by system admins
              </p>
            </div>
          </div>

          {isLoadingSent ? (
            <div className="p-12 text-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
              <p className="text-xs">Loading communication history...</p>
            </div>
          ) : sentMessages.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Send size={22} />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No Messages Dispatched Yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Use the compose box to send direct messages to candidates or announce platform updates to all recruiters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Subject & Content</th>
                    <th className="py-3 px-4">Target Audience</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4 text-center">Read Count</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
                  {sentMessages.map((msg) => (
                    <tr key={msg._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 max-w-[200px]">
                        <div className="font-bold text-slate-900 truncate" title={msg.title}>
                          {msg.title}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate" title={msg.content}>
                          {msg.content}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {msg.targetRole === "specific" ? (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-600" />
                            <span className="font-medium text-slate-800">
                              {msg.recipient?.name || "Specific User"}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="font-semibold capitalize text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              {msg.targetRole === "all" ? "All Users" : `${msg.targetRole}s`}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getPriorityBadge(msg.priority)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="font-bold text-slate-800 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                          {msg.readCount} read
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                        {new Date(msg.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setPreviewMessage(msg)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Page {page} of {totalPages}</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => fetchSentMessages(page - 1)}
                      className="px-2.5 py-1 rounded-md border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => fetchSentMessages(page + 1)}
                      className="px-2.5 py-1 rounded-md border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── CONFIRMATION DIALOG ────────────────────────────────────────── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[10010] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <Send size={20} />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Confirm Dispatch</h4>
                <p className="text-xs text-slate-500">Review communication target before dispatching</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 border border-slate-200 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Target:</span>
                <span className="font-bold text-slate-900">
                  {deliveryMode === "specific"
                    ? `${selectedRecipient?.name} (${selectedRecipient?.email})`
                    : `Segment Broadcast (${targetRole.toUpperCase()})`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Priority:</span>
                <span className="capitalize font-bold text-slate-900">{priority}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Email Copy:</span>
                <span className="font-bold text-slate-900">{sendEmailCopy ? "Yes (via SMTP)" : "In-app only"}</span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <div className="font-semibold text-slate-500 mb-1">Subject:</div>
                <div className="font-bold text-slate-900">{title}</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDispatch}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Confirm & Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DETAIL PREVIEW MODAL ────────────────────────────────────────── */}
      {previewMessage && (
        <div className="fixed inset-0 z-[10010] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-blue-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Official Notice</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewMessage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-lg font-bold text-slate-900">{previewMessage.title}</h3>
                {getPriorityBadge(previewMessage.priority)}
              </div>
              <div className="text-xs text-slate-500">
                Dispatched on {new Date(previewMessage.createdAt).toLocaleString()} &bull; {previewMessage.readCount} user(s) read
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
              {previewMessage.content}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPreviewMessage(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
