import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  LifeBuoy, AlertCircle, CheckCircle2, Clock, ExternalLink, Maximize2, 
  Search, Trash2, X, RefreshCcw, User, Globe, Laptop, 
  Eye, Copy, Check, ImageOff
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

// Lightweight relative time helper (0 external dependencies)
function formatRelativeTime(dateInput) {
  if (!dateInput) return 'Just now';
  const date = new Date(dateInput);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Lightweight User Agent parser
function parseUserAgent(ua) {
  if (!ua) return { browser: 'Unknown', os: 'Unknown', device: 'Desktop' };
  let browser = 'Other Browser';
  let os = 'Other OS';
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  const device = isMobile ? 'Mobile' : 'Desktop';

  if (/Edg/i.test(ua)) browser = 'Microsoft Edge';
  else if (/Chrome/i.test(ua)) browser = 'Google Chrome';
  else if (/Safari/i.test(ua)) browser = 'Apple Safari';
  else if (/Firefox/i.test(ua)) browser = 'Mozilla Firefox';

  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Macintosh|Mac OS/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';

  return { browser, os, device };
}

export default function SupportTicketsView() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // all | open | in_progress | resolved
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [deletingTicketId, setDeletingTicketId] = useState(null);

  // Fetch tickets on mount using promise resolution
  useEffect(() => {
    let active = true;
    axios.get(`${API_BASE_URL}/api/support/tickets`, getAuthHeaders())
      .then((res) => {
        if (active) {
          setTickets(res.data?.tickets || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load support tickets:', err);
        if (active) {
          toast.error('Failed to load support tickets');
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Manual refresh trigger
  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await axios.get(`${API_BASE_URL}/api/support/tickets`, getAuthHeaders());
      setTickets(res.data?.tickets || []);
    } catch (err) {
      console.error('Failed to load support tickets:', err);
      toast.error('Failed to load support tickets');
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Compute live KPI metrics
  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter(t => t.status === 'open').length;
    const inProgress = tickets.filter(t => t.status === 'in_progress').length;
    const resolved = tickets.filter(t => t.status === 'resolved').length;
    return { total, open, inProgress, resolved };
  }, [tickets]);

  // Filtered tickets based on active tab and search query
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      // Tab filter
      if (statusFilter !== 'all' && ticket.status !== statusFilter) {
        return false;
      }
      // Search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const userName = ticket.user?.name?.toLowerCase() || '';
      const userEmail = ticket.user?.email?.toLowerCase() || '';
      const desc = ticket.description?.toLowerCase() || '';
      const pageUrl = ticket.pageUrl?.toLowerCase() || '';
      const ticketId = ticket._id?.toLowerCase() || '';
      return (
        userName.includes(q) ||
        userEmail.includes(q) ||
        desc.includes(q) ||
        pageUrl.includes(q) ||
        ticketId.includes(q)
      );
    });
  }, [tickets, statusFilter, searchQuery]);

  // Handle status update
  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      setUpdatingStatusId(ticketId);
      // Optimistic update
      setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, status: newStatus } : t));
      if (selectedTicket && selectedTicket._id === ticketId) {
        setSelectedTicket(prev => ({ ...prev, status: newStatus }));
      }

      await axios.patch(
        `${API_BASE_URL}/api/support/tickets/${ticketId}`,
        { status: newStatus },
        getAuthHeaders()
      );

      const statusLabels = {
        open: 'marked as Open',
        in_progress: 'moved to In Progress',
        resolved: 'marked as Resolved'
      };
      toast.success(`Ticket ${statusLabels[newStatus] || 'updated'}`);
    } catch (err) {
      console.error('Status update failed:', err);
      toast.error('Failed to update ticket status');
      // Rollback on failure
      handleRefresh();
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Handle delete ticket
  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
      return;
    }
    try {
      setDeletingTicketId(ticketId);
      setTickets(prev => prev.filter(t => t._id !== ticketId));
      if (selectedTicket && selectedTicket._id === ticketId) {
        setSelectedTicket(null);
      }

      await axios.delete(`${API_BASE_URL}/api/support/tickets/${ticketId}`, getAuthHeaders());
      toast.success('Ticket deleted successfully');
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete ticket');
      handleRefresh();
    } finally {
      setDeletingTicketId(null);
    }
  };

  // Copy helper
  const handleCopy = (text, fieldKey) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Render Status Badge
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
            <AlertCircle size={13} className="text-amber-500" />
            Open
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-sm">
            <Clock size={13} className="text-blue-500 animate-spin" style={{ animationDuration: '4s' }} />
            In Progress
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
            <CheckCircle2 size={13} className="text-emerald-500" />
            Resolved
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      
      {/* 1. HEADER TITLE & REFRESH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
              <LifeBuoy size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Support Tickets & Issues</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review user bug reports, inspect telemetry & screenshots, and track issue resolution
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <button
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            title="Refresh Tickets"
          >
            <RefreshCcw size={14} className={refreshing ? "animate-spin text-blue-600" : ""} />
            <span>{refreshing ? "Syncing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* 2. KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total Tickets */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Reports</span>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
              <LifeBuoy size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
            {stats.total}
          </div>
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border text-slate-700 bg-slate-50 border-slate-200">
              Platform Registry
            </span>
          </div>
        </div>

        {/* Open Tickets */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Open Tickets</span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600 border border-amber-100">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
            {stats.open}
          </div>
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border text-amber-700 bg-amber-50 border-amber-200">
              Action Required
            </span>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">In Progress</span>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600 border border-blue-100">
              <Clock size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
            {stats.inProgress}
          </div>
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border text-blue-700 bg-blue-50 border-blue-200">
              Under Investigation
            </span>
          </div>
        </div>

        {/* Resolved */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Resolved</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
            {stats.resolved}
          </div>
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border text-emerald-700 bg-emerald-50 border-emerald-200">
              Closed & Verified
            </span>
          </div>
        </div>
      </div>

      {/* 3. FILTER & CONTROLS TOOLBAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <span>All</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                statusFilter === 'all' ? 'bg-slate-100 text-slate-900' : 'bg-slate-200/70 text-slate-600'
              }`}>
                {stats.total}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('open')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === 'open'
                  ? 'bg-white text-amber-700 shadow-sm'
                  : 'text-slate-600 hover:text-amber-700 hover:bg-white/50'
              }`}
            >
              <AlertCircle size={13} className="text-amber-500" />
              <span>Open</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-50 text-amber-700 font-bold border border-amber-200">
                {stats.open}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('in_progress')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === 'in_progress'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-blue-700 hover:bg-white/50'
              }`}
            >
              <Clock size={13} className="text-blue-500" />
              <span>In Progress</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-50 text-blue-700 font-bold border border-blue-200">
                {stats.inProgress}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('resolved')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === 'resolved'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-white/50'
              }`}
            >
              <CheckCircle2 size={13} className="text-emerald-500" />
              <span>Resolved</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                {stats.resolved}
              </span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user, email, description, route, ID..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. TICKET LIST TABLE / CARDS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-medium text-slate-500">Loading support tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 mx-auto mb-3 shadow-inner">
              <LifeBuoy size={28} />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No support tickets found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all' 
                ? "No reports match your current filter criteria. Try resetting your search or tabs." 
                : "No issues reported yet. When users submit tickets through the HelpWidget, they will appear here."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 uppercase font-bold tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Reporter</th>
                  <th className="px-5 py-3.5">Issue Description</th>
                  <th className="px-5 py-3.5">Page Route</th>
                  <th className="px-5 py-3.5">Screenshot</th>
                  <th className="px-5 py-3.5">Reported</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map((ticket) => {
                  const reporterName = ticket.user?.name || 'Anonymous User';
                  const reporterEmail = ticket.user?.email || 'No email';
                  const reporterRole = ticket.user?.role || 'user';
                  const isUpdating = updatingStatusId === ticket._id;
                  const isDeleting = deletingTicketId === ticket._id;

                  return (
                    <tr 
                      key={ticket._id} 
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      {/* STATUS */}
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <select
                            value={ticket.status}
                            disabled={isUpdating}
                            onChange={(e) => handleUpdateStatus(ticket._id, e.target.value)}
                            className="text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-slate-200 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm transition-all"
                          >
                            <option value="open">🟡 Open</option>
                            <option value="in_progress">🔵 In Progress</option>
                            <option value="resolved">🟢 Resolved</option>
                          </select>
                        </div>
                      </td>

                      {/* REPORTER */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shadow-sm shrink-0">
                            {reporterName.charAt(0).toUpperCase()}
                          </div>
                          <div className="overflow-hidden">
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span className="truncate max-w-[130px]">{reporterName}</span>
                              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                {reporterRole}
                              </span>
                            </div>
                            <div className="text-slate-400 text-[11px] truncate max-w-[160px]">
                              {reporterEmail}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* DESCRIPTION */}
                      <td className="px-5 py-4 max-w-xs">
                        <p className="text-slate-800 font-medium truncate max-w-[280px]" title={ticket.description}>
                          {ticket.description}
                        </p>
                        <span className="text-[10px] font-mono text-slate-400">
                          ID: #{ticket._id.slice(-6)}
                        </span>
                      </td>

                      {/* PAGE ROUTE */}
                      <td className="px-5 py-4">
                        {ticket.pageUrl ? (
                          <span 
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono text-slate-600 bg-slate-100 border border-slate-200/80 max-w-[170px] truncate"
                            title={ticket.pageUrl}
                          >
                            <Globe size={11} className="shrink-0 text-slate-400" />
                            <span className="truncate">{ticket.pageUrl.replace(/^https?:\/\/[^/]+/, '') || '/'}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">—</span>
                        )}
                      </td>

                      {/* SCREENSHOT */}
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        {ticket.screenshotUrl ? (
                          <button
                            type="button"
                            onClick={() => setFullscreenImage(ticket.screenshotUrl)}
                            className="relative group/thumb block w-14 h-9 rounded-md border border-slate-200 overflow-hidden bg-slate-100 shadow-sm hover:border-blue-400 transition-colors"
                            title="Click to zoom screenshot"
                          >
                            <img
                              src={ticket.screenshotUrl}
                              alt="Bug Screenshot"
                              className="w-full h-full object-cover object-top"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition-opacity">
                              <Maximize2 size={12} />
                            </div>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                            <ImageOff size={13} />
                            <span>None</span>
                          </span>
                        )}
                      </td>

                      {/* REPORTED DATE */}
                      <td className="px-5 py-4 text-slate-500 font-medium">
                        {formatRelativeTime(ticket.createdAt)}
                      </td>

                      {/* ACTIONS */}
                      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedTicket(ticket)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            disabled={isDeleting}
                            onClick={() => handleDeleteTicket(ticket._id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                            title="Delete Ticket"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. SLIDE-OUT / DETAIL MODAL */}
      {selectedTicket && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedTicket(null)}
        >
          <div 
            className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-md bg-slate-900 text-white font-mono text-xs font-semibold">
                  #{selectedTicket._id.slice(-8)}
                </span>
                {renderStatusBadge(selectedTicket.status)}
                <span className="text-xs text-slate-400 font-medium">
                  {new Date(selectedTicket.createdAt).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Description Box */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Issue Description
                </h4>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 whitespace-pre-wrap leading-relaxed">
                  {selectedTicket.description}
                </div>
              </div>

              {/* Screenshot Preview */}
              {selectedTicket.screenshotUrl ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      User Screenshot
                    </h4>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFullscreenImage(selectedTicket.screenshotUrl)}
                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                      >
                        <Maximize2 size={13} />
                        Zoom Image
                      </button>
                      <a
                        href={selectedTicket.screenshotUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 font-semibold px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                      >
                        <ExternalLink size={13} />
                        Open New Tab
                      </a>
                    </div>
                  </div>
                  <div 
                    className="relative rounded-xl border border-slate-200 bg-slate-950/5 overflow-hidden group cursor-pointer max-h-80 flex items-center justify-center shadow-sm"
                    onClick={() => setFullscreenImage(selectedTicket.screenshotUrl)}
                  >
                    <img
                      src={selectedTicket.screenshotUrl}
                      alt="Full Screenshot"
                      className="max-h-80 w-auto object-contain rounded-lg"
                    />
                    <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-semibold text-xs gap-2 transition-opacity">
                      <Maximize2 size={16} /> Click to expand full screen
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Two-Column Telemetry & Reporter Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Reporter Profile */}
                <div className="p-4 bg-slate-50/60 border border-slate-200 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <User size={14} className="text-blue-600" />
                    Reporter Information
                  </h4>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-400">Full Name</span>
                      <span className="font-semibold text-slate-800">{selectedTicket.user?.name || 'Anonymous'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-400">Email</span>
                      <span className="font-mono text-slate-800 truncate max-w-[180px]">{selectedTicket.user?.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-400">Account Role</span>
                      <span className="font-semibold uppercase text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {selectedTicket.user?.role || 'candidate'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-400">User ID</span>
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-700">
                        <span>{selectedTicket.user?._id || selectedTicket.user || 'N/A'}</span>
                        <button
                          onClick={() => handleCopy(selectedTicket.user?._id || selectedTicket.user, 'userId')}
                          className="text-slate-400 hover:text-slate-600 p-0.5"
                          title="Copy ID"
                        >
                          {copiedField === 'userId' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Technical Environment & URL */}
                <div className="p-4 bg-slate-50/60 border border-slate-200 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Laptop size={14} className="text-blue-600" />
                    Environment Telemetry
                  </h4>

                  {(() => {
                    const env = parseUserAgent(selectedTicket.userAgent);
                    return (
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center py-1 border-b border-slate-100">
                          <span className="text-slate-400">Browser</span>
                          <span className="font-semibold text-slate-800">{env.browser}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-100">
                          <span className="text-slate-400">OS & Device</span>
                          <span className="font-semibold text-slate-800">{env.os} ({env.device})</span>
                        </div>
                        <div className="py-1">
                          <span className="text-slate-400 block mb-1">Page Route</span>
                          <div className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700">
                            <span className="truncate">{selectedTicket.pageUrl || 'Root / Home'}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleCopy(selectedTicket.pageUrl, 'pageUrl')}
                                className="text-slate-400 hover:text-slate-600 p-1"
                                title="Copy URL"
                              >
                                {copiedField === 'pageUrl' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                              </button>
                              {selectedTicket.pageUrl && (
                                <a
                                  href={selectedTicket.pageUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 hover:text-blue-700 p-1"
                                  title="Open link"
                                >
                                  <ExternalLink size={13} />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Status Switcher Bar */}
              <div className="p-4 bg-slate-100/70 border border-slate-200 rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">Update Resolution Status</h5>
                    <p className="text-[11px] text-slate-500">Change ticket status to reflect team progress</p>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleUpdateStatus(selectedTicket._id, 'open')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        selectedTicket.status === 'open'
                          ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200'
                      }`}
                    >
                      🟡 Mark as Open
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(selectedTicket._id, 'in_progress')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        selectedTicket.status === 'in_progress'
                          ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
                      }`}
                    >
                      🔵 In Progress
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(selectedTicket._id, 'resolved')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        selectedTicket.status === 'resolved'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                      }`}
                    >
                      🟢 Resolve Ticket
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <button
                onClick={() => handleDeleteTicket(selectedTicket._id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
              >
                <Trash2 size={14} />
                Delete Ticket
              </button>

              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. FULLSCREEN IMAGE LIGHTBOX */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            onClick={() => setFullscreenImage(null)}
            className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors z-10"
            title="Close Lightbox"
          >
            <X size={24} />
          </button>
          <img
            src={fullscreenImage}
            alt="Fullscreen Screenshot"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

    </div>
  );
}
