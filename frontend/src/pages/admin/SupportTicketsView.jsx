import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  LifeBuoy, AlertCircle, CheckCircle2, Clock, ExternalLink, Maximize2, 
  Search, Trash2, X, RefreshCcw, User, Globe, Laptop, 
  Eye, Copy, Check, ImageOff, Bot, ChevronRight, List,
  ShieldAlert, Zap, Tag
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Badge renderers ──────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  switch (status) {
    case 'open':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm"><AlertCircle size={13} className="text-amber-500" />Open</span>;
    case 'in_progress':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"><Clock size={13} className="text-blue-500 animate-spin" style={{ animationDuration: '4s' }} />In Progress</span>;
    case 'resolved':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm"><CheckCircle2 size={13} className="text-emerald-500" />Resolved</span>;
    case 'closed':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 shadow-sm"><X size={13} />Closed</span>;
    default:
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
  }
}

function SeverityBadge({ severity }) {
  switch (severity) {
    case 'high':
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-50 text-red-700 border border-red-200"><ShieldAlert size={11} />High</span>;
    case 'medium':
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200"><AlertCircle size={11} />Medium</span>;
    case 'low':
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 size={11} />Low</span>;
    default:
      return null;
  }
}

function CategoryBadge({ category }) {
  if (!category || category === 'other') return <span className="text-slate-400 text-[11px]">—</span>;
  const label = category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200"><Tag size={10} />{label}</span>;
}

function ResolutionChip({ autoResolved }) {
  if (autoResolved)
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-violet-50 text-violet-700 border border-violet-200"><Zap size={10} />Auto-Resolved</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-50 text-slate-500 border border-slate-200"><User size={10} />Needs Review</span>;
}

// ─── Agent Log Modal ──────────────────────────────────────────────────────────

function AgentLogModal({ ticketId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/support/tickets/${ticketId}/log`, getAuthHeaders())
      .then(res => { setData(res.data); setLoading(false); })
      .catch(() => { toast.error('Failed to load agent log'); setLoading(false); });
  }, [ticketId]);

  const logStepColor = (action) => {
    if (action.includes('error')) return 'text-red-600 bg-red-50 border-red-200';
    if (action.includes('complete') || action.includes('resolved') || action.includes('dispatched')) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (action.includes('skipped') || action.includes('override')) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-slate-700 bg-slate-50 border-slate-200';
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-violet-50 text-violet-600 rounded-lg border border-violet-100"><Bot size={18} /></div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">AI Agent Audit Log</h3>
              <p className="text-[11px] text-slate-500">Ticket #{String(ticketId).slice(-8).toUpperCase()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-slate-400 text-sm">
              <div className="w-5 h-5 border-2 border-slate-200 border-t-violet-500 rounded-full animate-spin" />
              Loading agent log...
            </div>
          ) : !data ? (
            <p className="text-center text-sm text-slate-500 py-10">Could not load agent log.</p>
          ) : (
            <>
              {/* AI meta summary */}
              {data.meta && (
                <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Classification</p>
                    <div className="flex flex-wrap gap-1.5">
                      <CategoryBadge category={data.meta.category} />
                      <SeverityBadge severity={data.meta.severity} />
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Resolution</p>
                    <div className="flex flex-wrap gap-1.5">
                      <ResolutionChip autoResolved={data.meta.autoResolved} />
                      <StatusBadge status={data.meta.status} />
                    </div>
                  </div>
                  {data.meta.aiSummary && (
                    <div className="col-span-2 p-3 bg-violet-50 border border-violet-100 rounded-xl">
                      <p className="text-[10px] text-violet-500 font-semibold uppercase tracking-wider mb-1">AI Summary</p>
                      <p className="text-slate-800 text-xs leading-relaxed">{data.meta.aiSummary}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Step-by-step log */}
              {(!data.log || data.log.length === 0) ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  <Bot size={32} className="mx-auto mb-2 opacity-30" />
                  No agent log entries yet. The agent may still be processing.
                </div>
              ) : (
                <ol className="relative border-l-2 border-slate-200 ml-2 space-y-3">
                  {data.log.map((entry, i) => (
                    <li key={i} className="ml-4">
                      <span className="absolute -left-2 w-3.5 h-3.5 bg-white border-2 border-slate-300 rounded-full" />
                      <div className={`p-3 rounded-xl border text-xs ${logStepColor(entry.action)}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold font-mono">{entry.action}</span>
                          <span className="text-[10px] opacity-60">{entry.ts ? new Date(entry.ts).toLocaleTimeString() : ''}</span>
                        </div>
                        {entry.detail && <p className="leading-relaxed opacity-90">{entry.detail}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/70 flex justify-end">
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SupportTicketsView() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [deletingTicketId, setDeletingTicketId] = useState(null);
  const [logTicketId, setLogTicketId] = useState(null);

  useEffect(() => {
    let active = true;
    axios.get(`${API_BASE_URL}/api/support/tickets`, getAuthHeaders())
      .then(res => { if (active) { setTickets(res.data?.tickets || []); setLoading(false); } })
      .catch(err => { console.error(err); if (active) { toast.error('Failed to load support tickets'); setLoading(false); } });
    return () => { active = false; };
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await axios.get(`${API_BASE_URL}/api/support/tickets`, getAuthHeaders());
      setTickets(res.data?.tickets || []);
    } catch { toast.error('Failed to load support tickets'); }
    finally { setRefreshing(false); }
  }, []);

  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter(t => t.status === 'open').length;
    const inProgress = tickets.filter(t => t.status === 'in_progress').length;
    const resolved = tickets.filter(t => t.status === 'resolved').length;
    const autoResolved = tickets.filter(t => t.autoResolved).length;
    return { total, open, inProgress, resolved, autoResolved };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return [ticket.user?.name, ticket.user?.email, ticket.description, ticket.pageUrl, ticket._id, ticket.category, ticket.aiSummary]
        .filter(Boolean).some(v => v.toLowerCase().includes(q));
    });
  }, [tickets, statusFilter, searchQuery]);

  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      setUpdatingStatusId(ticketId);
      setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, status: newStatus } : t));
      if (selectedTicket?._id === ticketId) setSelectedTicket(prev => ({ ...prev, status: newStatus }));
      await axios.patch(`${API_BASE_URL}/api/support/tickets/${ticketId}`, { status: newStatus }, getAuthHeaders());
      toast.success(`Ticket ${newStatus === 'resolved' ? 'resolved' : 'updated'}`);
    } catch { toast.error('Failed to update ticket status'); handleRefresh(); }
    finally { setUpdatingStatusId(null); }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm('Delete this ticket? This cannot be undone.')) return;
    try {
      setDeletingTicketId(ticketId);
      setTickets(prev => prev.filter(t => t._id !== ticketId));
      if (selectedTicket?._id === ticketId) setSelectedTicket(null);
      await axios.delete(`${API_BASE_URL}/api/support/tickets/${ticketId}`, getAuthHeaders());
      toast.success('Ticket deleted');
    } catch { toast.error('Failed to delete ticket'); handleRefresh(); }
    finally { setDeletingTicketId(null); }
  };

  const handleCopy = (text, fieldKey) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm"><LifeBuoy size={22} /></div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Support Tickets & Issues</h2>
            <p className="text-xs text-slate-500 mt-0.5">Review reports, AI triage results, screenshots & resolution status</p>
          </div>
        </div>
        <button onClick={handleRefresh} disabled={loading || refreshing} className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-sm disabled:opacity-50">
          <RefreshCcw size={14} className={refreshing ? 'animate-spin text-blue-600' : ''} />
          {refreshing ? 'Syncing...' : 'Refresh'}
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        {[
          { label: 'Total Reports', value: stats.total, icon: LifeBuoy, color: 'slate' },
          { label: 'Open', value: stats.open, icon: AlertCircle, color: 'amber' },
          { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'blue' },
          { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, color: 'emerald' },
          { label: 'Auto-Resolved', value: stats.autoResolved, icon: Zap, color: 'violet' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold text-${color}-600 uppercase tracking-wider`}>{label}</span>
              <div className={`p-2 bg-${color}-50 rounded-lg text-${color}-600 border border-${color}-100`}><Icon size={16} /></div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tabular-nums">{value}</div>
          </div>
        ))}
      </div>

      {/* TOOLBAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl overflow-x-auto">
            {[
              { key: 'all', label: 'All', count: stats.total },
              { key: 'open', label: 'Open', count: stats.open },
              { key: 'in_progress', label: 'In Progress', count: stats.inProgress },
              { key: 'resolved', label: 'Resolved', count: stats.resolved },
            ].map(({ key, label, count }) => (
              <button key={key} onClick={() => setStatusFilter(key)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${statusFilter === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}`}>
                <span>{label}</span>
                <span className={`px-1.5 rounded-full text-[10px] ${statusFilter === key ? 'bg-slate-100 text-slate-900' : 'bg-slate-200/70 text-slate-600'}`}>{count}</span>
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search user, description, category, AI summary..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"><X size={14} /></button>}
          </div>
        </div>
      </div>

      {/* TICKET TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-3" />
            <p className="text-xs font-medium text-slate-500">Loading support tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-16 text-center">
            <LifeBuoy size={32} className="mx-auto mb-3 text-slate-300" />
            <h4 className="text-sm font-bold text-slate-800">No tickets found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all' ? 'Try resetting your filters.' : 'No issues reported yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 uppercase font-bold tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Reporter</th>
                  <th className="px-5 py-3.5">Issue / AI Summary</th>
                  <th className="px-5 py-3.5">Category & Severity</th>
                  <th className="px-5 py-3.5">Resolution</th>
                  <th className="px-5 py-3.5">Screenshot</th>
                  <th className="px-5 py-3.5">Reported</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map((ticket) => {
                  const reporterName = ticket.user?.name || 'Anonymous';
                  const reporterEmail = ticket.user?.email || ticket.email || 'No email';
                  const reporterRole = ticket.user?.role || 'user';
                  const isUpdating = updatingStatusId === ticket._id;
                  const isDeleting = deletingTicketId === ticket._id;

                  return (
                    <tr key={ticket._id} className="hover:bg-slate-50/70 transition-colors cursor-pointer" onClick={() => setSelectedTicket(ticket)}>
                      {/* STATUS */}
                      <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                        <select value={ticket.status} disabled={isUpdating}
                          onChange={e => handleUpdateStatus(ticket._id, e.target.value)}
                          className="text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-slate-200 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm">
                          <option value="open">🟡 Open</option>
                          <option value="in_progress">🔵 In Progress</option>
                          <option value="resolved">🟢 Resolved</option>
                          <option value="closed">⚫ Closed</option>
                        </select>
                      </td>

                      {/* REPORTER */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shadow-sm shrink-0">
                            {reporterName.charAt(0).toUpperCase()}
                          </div>
                          <div className="overflow-hidden">
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span className="truncate max-w-[110px]">{reporterName}</span>
                              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">{reporterRole}</span>
                            </div>
                            <div className="text-slate-400 text-[11px] truncate max-w-[150px]">{reporterEmail}</div>
                          </div>
                        </div>
                      </td>

                      {/* DESCRIPTION + AI SUMMARY */}
                      <td className="px-5 py-4 max-w-xs">
                        <p className="text-slate-800 font-medium truncate max-w-[240px]" title={ticket.description}>{ticket.description}</p>
                        {ticket.aiSummary && (
                          <p className="text-[11px] text-violet-600 truncate max-w-[240px] mt-0.5 flex items-center gap-1">
                            <Bot size={10} className="shrink-0" />{ticket.aiSummary}
                          </p>
                        )}
                        <span className="text-[10px] font-mono text-slate-400">#{ticket._id.slice(-6)}</span>
                      </td>

                      {/* CATEGORY & SEVERITY */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <CategoryBadge category={ticket.category} />
                          <SeverityBadge severity={ticket.severity} />
                        </div>
                      </td>

                      {/* RESOLUTION CHIP */}
                      <td className="px-5 py-4">
                        <ResolutionChip autoResolved={ticket.autoResolved} />
                      </td>

                      {/* SCREENSHOT */}
                      <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                        {ticket.screenshotUrl ? (
                          <button type="button" onClick={() => setFullscreenImage(ticket.screenshotUrl)}
                            className="relative group/thumb block w-14 h-9 rounded-md border border-slate-200 overflow-hidden bg-slate-100 shadow-sm hover:border-blue-400 transition-colors">
                            <img src={ticket.screenshotUrl} alt="Bug Screenshot" className="w-full h-full object-cover object-top" loading="lazy" />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition-opacity"><Maximize2 size={12} /></div>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400"><ImageOff size={13} />None</span>
                        )}
                      </td>

                      {/* REPORTED DATE */}
                      <td className="px-5 py-4 text-slate-500 font-medium">{formatRelativeTime(ticket.createdAt)}</td>

                      {/* ACTIONS */}
                      <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setSelectedTicket(ticket)} className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="View Details"><Eye size={16} /></button>
                          <button onClick={() => setLogTicketId(ticket._id)} className="p-1.5 rounded-lg text-slate-500 hover:text-violet-600 hover:bg-violet-50 transition-colors" title="View AI Agent Log"><Bot size={16} /></button>
                          <button disabled={isDeleting} onClick={() => handleDeleteTicket(ticket._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50" title="Delete Ticket"><Trash2 size={16} /></button>
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

      {/* DETAIL MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedTicket(null)}>
          <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-2.5 py-1 rounded-md bg-slate-900 text-white font-mono text-xs font-semibold">#{selectedTicket._id.slice(-8)}</span>
                <StatusBadge status={selectedTicket.status} />
                <SeverityBadge severity={selectedTicket.severity} />
                <CategoryBadge category={selectedTicket.category} />
                <ResolutionChip autoResolved={selectedTicket.autoResolved} />
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"><X size={18} /></button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">

              {/* AI Summary banner */}
              {selectedTicket.aiSummary && (
                <div className="flex items-start gap-3 p-4 bg-violet-50 border border-violet-100 rounded-xl">
                  <Bot size={18} className="text-violet-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-bold text-violet-500 uppercase tracking-wider mb-1">AI Summary</p>
                    <p className="text-sm text-slate-800 leading-relaxed">{selectedTicket.aiSummary}</p>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Issue Description</h4>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 whitespace-pre-wrap leading-relaxed">{selectedTicket.description}</div>
              </div>

              {/* Screenshot */}
              {selectedTicket.screenshotUrl && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">User Screenshot</h4>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setFullscreenImage(selectedTicket.screenshotUrl)} className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold px-2 py-1 rounded hover:bg-blue-50"><Maximize2 size={13} />Zoom</button>
                      <a href={selectedTicket.screenshotUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 font-semibold px-2 py-1 rounded hover:bg-slate-100"><ExternalLink size={13} />Open</a>
                    </div>
                  </div>
                  <div className="relative rounded-xl border border-slate-200 overflow-hidden cursor-pointer max-h-80 flex items-center justify-center bg-slate-950/5 shadow-sm group" onClick={() => setFullscreenImage(selectedTicket.screenshotUrl)}>
                    <img src={selectedTicket.screenshotUrl} alt="Full Screenshot" className="max-h-80 w-auto object-contain rounded-lg" />
                    <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs gap-2 transition-opacity"><Maximize2 size={16} />Click to expand</div>
                  </div>
                </div>
              )}

              {/* Reporter + Telemetry grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50/60 border border-slate-200 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><User size={14} className="text-blue-600" />Reporter</h4>
                  <div className="space-y-2 text-xs">
                    {[
                      ['Full Name', selectedTicket.user?.name || 'Anonymous'],
                      ['Email', selectedTicket.user?.email || selectedTicket.email || 'N/A'],
                      ['Role', selectedTicket.user?.role || 'candidate'],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
                        <span className="text-slate-400">{label}</span>
                        <span className="font-semibold text-slate-800 truncate max-w-[180px]">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-slate-50/60 border border-slate-200 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Laptop size={14} className="text-blue-600" />Environment</h4>
                  {(() => {
                    const env = parseUserAgent(selectedTicket.userAgent);
                    return (
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-400">Browser</span><span className="font-semibold text-slate-800">{env.browser}</span></div>
                        <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-400">OS / Device</span><span className="font-semibold text-slate-800">{env.os} ({env.device})</span></div>
                        <div className="py-1">
                          <span className="text-slate-400 block mb-1">Page Route</span>
                          <div className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700">
                            <span className="truncate">{selectedTicket.pageUrl || '/'}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => handleCopy(selectedTicket.pageUrl, 'pageUrl')} className="text-slate-400 hover:text-slate-600 p-1">
                                {copiedField === 'pageUrl' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                              </button>
                              {selectedTicket.pageUrl && <a href={selectedTicket.pageUrl} target="_blank" rel="noreferrer" className="text-blue-600 p-1"><ExternalLink size={13} /></a>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Status switcher */}
              <div className="p-4 bg-slate-100/70 border border-slate-200 rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">Update Resolution Status</h5>
                    <p className="text-[11px] text-slate-500">Override the AI-assigned status if needed</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[['open', '🟡 Open', 'amber'], ['in_progress', '🔵 In Progress', 'blue'], ['resolved', '🟢 Resolve', 'emerald']].map(([val, label, color]) => (
                      <button key={val} onClick={() => handleUpdateStatus(selectedTicket._id, val)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${selectedTicket.status === val ? `bg-${color}-${color === 'emerald' ? '600' : '500'} text-white border-${color}-700 shadow-sm` : `bg-white text-slate-700 border-slate-200 hover:bg-${color}-50 hover:text-${color}-700 hover:border-${color}-200`}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Agent log quick-access */}
              <button onClick={() => { setLogTicketId(selectedTicket._id); }}
                className="w-full flex items-center justify-between p-4 bg-violet-50 hover:bg-violet-100 border border-violet-100 rounded-xl transition-colors group">
                <div className="flex items-center gap-2.5">
                  <Bot size={18} className="text-violet-500" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-violet-800">View AI Agent Audit Log</p>
                    <p className="text-[11px] text-violet-500">Inspect every step the agent took for this ticket</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-violet-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <button onClick={() => handleDeleteTicket(selectedTicket._id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors">
                <Trash2 size={14} />Delete Ticket
              </button>
              <button onClick={() => setSelectedTicket(null)} className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* AGENT LOG MODAL */}
      {logTicketId && <AgentLogModal ticketId={logTicketId} onClose={() => setLogTicketId(null)} />}

      {/* FULLSCREEN IMAGE LIGHTBOX */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setFullscreenImage(null)}>
          <button onClick={() => setFullscreenImage(null)} className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors z-10"><X size={24} /></button>
          <img src={fullscreenImage} alt="Fullscreen Screenshot" className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
