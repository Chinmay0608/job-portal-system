import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, Users, Activity, Settings, LogOut, Search, Bell, 
  RefreshCcw, ChevronLeft, ChevronRight, CheckCircle2, Clock, Database, 
  TrendingUp, CircleDot, Briefcase, ServerCrash, Home, Trash2,
  UserCheck, UserX, ExternalLink, Shield, ShieldAlert, Cpu, AlertTriangle, Sparkles,
  BookMarked, MousePointerClick, LifeBuoy, Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import SupportTicketsView from './SupportTicketsView';
import AdminMessagesView from './AdminMessagesView';
import { TableRowSkeleton } from '../../Components/common/SkeletonLoader';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const getAuthHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const SidebarItem = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
      active 
        ? 'bg-slate-100 text-slate-900 font-semibold shadow-sm' 
        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium'
    }`}
  >
    {icon}
    {label}
  </button>
);

const MetricCard = ({ title, icon, value, suffix, badgeText, badgeIcon: BadgeIcon, badgeColor = "emerald" }) => {
  const badgeColors = {
    emerald: "text-emerald-700 bg-emerald-50 border-emerald-200",
    blue: "text-blue-700 bg-blue-50 border-blue-200",
    amber: "text-amber-700 bg-amber-50 border-amber-200",
    rose: "text-rose-700 bg-rose-50 border-rose-200",
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
          {icon}
        </div>
      </div>
      
      <div>
        <div className="text-3xl font-bold text-slate-900">
          {value}
          {suffix && <span className="text-lg text-slate-500 ml-1 font-semibold">{suffix}</span>}
        </div>
      </div>

      <div className="mt-3">
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold border ${badgeColors[badgeColor]}`}>
          {BadgeIcon && <BadgeIcon size={12} />}
          {badgeText}
        </span>
      </div>
    </div>
  );
};

const DeltaBadge = ({ label, value, color }) => {
  const colorStyles = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-400',
    rose: 'bg-rose-500'
  };
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
      <div className="flex items-center gap-2.5 text-sm font-medium text-slate-600">
        <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${colorStyles[color]}`}></div>
        {label}
      </div>
      <div className="font-bold text-slate-900">{value.toLocaleString()}</div>
    </div>
  );
};

const DashboardSkeleton = () => (
  <div className="w-full space-y-6 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 h-36 flex flex-col justify-between">
          <div className="flex justify-between">
            <div className="w-1/2 h-4 bg-slate-200 rounded"></div>
            <div className="w-8 h-8 bg-slate-100 rounded-lg"></div>
          </div>
          <div className="w-2/3 h-8 bg-slate-200 rounded mt-4"></div>
          <div className="w-1/3 h-5 bg-slate-100 rounded mt-3"></div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-slate-200 h-96"></div>
      <div className="bg-white rounded-xl border border-slate-200 h-96"></div>
    </div>
  </div>
);

const MetricsView = ({ metrics, fetchHealth, handleTriggerCrawl, triggeringCrawl, setActiveTab }) => {
  if (!metrics) return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8">
      <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-4 border border-rose-100 shadow-sm">
        <ServerCrash size={32} />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">Connection Error</h3>
      <p className="text-slate-500 mb-6">Failed to connect to Discovery Engine API.</p>
      <button onClick={fetchHealth} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm">
        Retry Connection
      </button>
    </div>
  );

  const totalDeltas = (metrics.todayDeltas?.newJobs || 0) + (metrics.todayDeltas?.updatedJobs || 0);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard 
          title="Registry Size"
          icon={<Database size={18} />}
          value={metrics.registrySize?.toLocaleString() || 0}
          badgeText="+2.4% from yesterday"
          badgeIcon={TrendingUp}
          badgeColor="emerald"
        />
        <MetricCard 
          title="Crawler Success"
          icon={<CheckCircle2 size={18} />}
          value={metrics.crawlerSuccess || '0%'}
          badgeText="Optimal Health"
          badgeIcon={CircleDot}
          badgeColor="emerald"
        />
        <MetricCard 
          title="Avg Crawl Time"
          icon={<Clock size={18} />}
          value={metrics.averageCrawlTime || 0}
          suffix="ms"
          badgeText={metrics.averageCrawlTime < 500 ? "Excellent Latency" : "Normal Latency"}
          badgeIcon={Activity}
          badgeColor={metrics.averageCrawlTime < 500 ? "emerald" : "blue"}
        />
        <MetricCard 
          title="Today's Delta"
          icon={<Activity size={18} />}
          value={totalDeltas.toLocaleString()}
          badgeText="Jobs Processed Today"
          badgeColor="blue"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Crawler Deltas</h3>
            <p className="text-xs text-slate-500 mt-1">Categorized breakdown of today's sync operations</p>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-center">
            <div className="w-full h-4 flex rounded-full overflow-hidden mb-8 bg-slate-100 shadow-inner">
              <div style={{width: '40%'}} className="bg-emerald-500 hover:opacity-90 transition-opacity"></div>
              <div style={{width: '30%'}} className="bg-blue-500 hover:opacity-90 transition-opacity"></div>
              <div style={{width: '20%'}} className="bg-amber-400 hover:opacity-90 transition-opacity"></div>
              <div style={{width: '10%'}} className="bg-rose-500 hover:opacity-90 transition-opacity"></div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <DeltaBadge label="New Jobs" value={metrics.todayDeltas?.newJobs || 0} color="emerald" />
              <DeltaBadge label="Updated" value={metrics.todayDeltas?.updatedJobs || 0} color="blue" />
              <DeltaBadge label="Unchanged" value={metrics.todayDeltas?.unchangedJobs || 0} color="amber" />
              <DeltaBadge label="Expired" value={metrics.todayDeltas?.expiredJobs || 0} color="rose" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
            <div>
              <h3 className="font-semibold text-slate-900">Top Hiring Companies</h3>
              <p className="text-xs text-slate-500 mt-1">Companies with most active registry listings</p>
            </div>
            <button onClick={() => setActiveTab('jobs')} className="text-sm text-blue-600 font-medium hover:text-blue-700 px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors">
              View All
            </button>
          </div>
          <div className="flex-1 overflow-x-auto">
            {metrics.topHiring?.length > 0 ? (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider">Openings</th>
                    <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {metrics.topHiring.map((comp, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 font-bold text-xs group-hover:border-blue-200 group-hover:text-blue-600 transition-colors">
                          {comp.name.charAt(0)}
                        </div>
                        {comp.name}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700">{comp.count}</span>
                          <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <CircleDot size={8} className="fill-emerald-500" /> ACTIVE
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => setActiveTab('jobs')} className="text-slate-400 hover:text-blue-600 transition-colors text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded hover:bg-blue-50">
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 mb-4 shadow-sm">
                  <Database size={24} />
                </div>
                <h4 className="text-slate-900 font-semibold mb-1">No Indexed Companies</h4>
                <p className="text-slate-500 text-sm max-w-xs mx-auto mb-5">There are no active listings in the registry. The crawler queue may be empty.</p>
                <button 
                  onClick={handleTriggerCrawl}
                  disabled={triggeringCrawl}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {triggeringCrawl ? "Triggering..." : "Trigger Manual Crawl"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const UsersView = ({ users, loading, onRefresh, onToggleRole, onDeleteUser }) => {
  const [filter, setFilter] = useState('');

  const filteredUsers = users.filter(u => {
    if (!filter) return true;
    const searchLower = filter.toLowerCase();
    return (u.name?.toLowerCase() || '').includes(searchLower) || (u.email?.toLowerCase() || '').includes(searchLower);
  });

  return (
    <div className="w-full animate-in fade-in duration-500 space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <div className="px-6 py-5 border-b border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-semibold text-slate-900">Platform Users</h3>
            <p className="text-xs text-slate-500 mt-1">Total registered candidates and recruiters: {users.length}</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search user name or email..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 w-full sm:w-64"
              />
            </div>
            <button 
              onClick={onRefresh}
              className="p-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              title="Refresh Users"
            >
              <RefreshCcw size={16} className={loading ? "animate-spin text-blue-600" : ""} />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">User Profile</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Account Role</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Joined Date</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <>
                  <TableRowSkeleton columns={4} />
                  <TableRowSkeleton columns={4} />
                  <TableRowSkeleton columns={4} />
                  <TableRowSkeleton columns={4} />
                </>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map(u => {
                  const isAdmin = u.role === 'admin' || u.email?.toLowerCase() === 'admin@gmail.com';
                  return (
                    <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-sm border border-slate-200 shadow-sm">
                            {u.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 flex items-center gap-1.5">
                              {u.name}
                              {isAdmin && <Shield size={14} className="text-amber-500 fill-amber-100" />}
                            </div>
                            <div className="text-xs text-slate-500">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${
                          u.role === 'admin'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : u.role === 'recruiter' 
                            ? 'bg-purple-50 text-purple-700 border-purple-100' 
                            : 'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium text-xs">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isAdmin && (
                            <>
                              <button 
                                onClick={() => onToggleRole(u._id, u.role, u.name)}
                                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                                title="Toggle Role (Candidate / Recruiter / Admin)"
                              >
                                Switch Role
                              </button>
                              <button 
                                onClick={() => onDeleteUser(u._id, u.email, u.name)}
                                className="text-slate-400 hover:text-rose-600 transition-colors p-1.5 hover:bg-rose-50 rounded-lg"
                                title="Delete User Account"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                          {isAdmin && (
                            <span className="text-xs font-semibold text-slate-400 italic px-2">Primary Admin</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex justify-center mb-3 text-slate-300"><Users size={32} /></div>
                    No users match your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const JobsView = ({ 
  jobs, 
  loading, 
  search, 
  setSearch, 
  pagination, 
  onPageChange, 
  onLimitChange, 
  onRefresh, 
  onDeleteJob 
}) => {
  const formatSourceLabel = (job) => {
    if (!job.isExternal) return 'Platform Direct';
    const src = job.source || 'EXTERNAL';
    if (src === 'EXTERNAL_AGGREGATOR') return 'External Aggregator';
    return src.replace(/_/g, ' ');
  };

  const total = pagination?.totalJobs ?? jobs.length;
  const page = pagination?.page || 1;
  const totalPages = pagination?.totalPages || 1;
  const limit = pagination?.limit || 50;

  const startIdx = total === 0 ? 0 : (page - 1) * limit + 1;
  const endIdx = Math.min(page * limit, total);

  return (
    <div className="w-full animate-in fade-in duration-500 space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <div className="px-6 py-5 border-b border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-semibold text-slate-900 text-lg">Jobs Registry</h3>
            <p className="text-xs text-slate-500 mt-1">
              Showing <span className="font-semibold text-slate-700">{startIdx.toLocaleString()} – {endIdx.toLocaleString()}</span> of <span className="font-bold text-slate-900">{total.toLocaleString()}</span> active postings in database
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search job title, company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 w-full sm:w-72"
              />
            </div>
            <button 
              onClick={onRefresh}
              className="p-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              title="Refresh Jobs"
            >
              <RefreshCcw size={16} className={loading ? "animate-spin text-blue-600" : ""} />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Job Title</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Company</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Source</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Posted Date</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <>
                  <TableRowSkeleton columns={6} />
                  <TableRowSkeleton columns={6} />
                  <TableRowSkeleton columns={6} />
                  <TableRowSkeleton columns={6} />
                </>
              ) : jobs.length > 0 ? (
                jobs.map(j => (
                  <tr key={j._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <div className="font-semibold text-slate-900">{j.title}</div>
                      {j.salary && <div className="text-xs text-slate-500">{j.salary}</div>}
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-medium whitespace-nowrap">
                      {j.company || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {j.location || 'Remote / Unspecified'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${
                        j.isExternal 
                           ? 'bg-amber-50 text-amber-700 border-amber-200' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {formatSourceLabel(j)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                      {j.createdAt ? new Date(j.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button 
                        onClick={() => onDeleteJob(j._id, j.title)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-2 hover:bg-rose-50 rounded-lg"
                        title="Delete Job"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex justify-center mb-3 text-slate-300"><Briefcase size={32} /></div>
                    No jobs match your search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION TOOLBAR */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
            </select>
            <span className="text-xs text-slate-400">
              (Showing {startIdx.toLocaleString()}–{endIdx.toLocaleString()} of {total.toLocaleString()})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              Page {page} of {Math.max(1, totalPages)}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1 || loading}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-white text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages || loading}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-white text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Next Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ApplicationsView = ({ applications, loading, onRefresh }) => {
  const [filter, setFilter] = useState('');

  const validApps = applications.filter(app => app && app.candidate);

  const filteredApps = validApps.filter(app => {
    if (!filter) return true;
    const searchLower = filter.toLowerCase();
    const candName = app.candidate?.name?.toLowerCase() || '';
    const candEmail = app.candidate?.email?.toLowerCase() || '';
    const jobTitle = app.job?.title?.toLowerCase() || '';
    const jobComp = app.job?.company?.toLowerCase() || '';
    return candName.includes(searchLower) || candEmail.includes(searchLower) || jobTitle.includes(searchLower) || jobComp.includes(searchLower);
  });

  return (
    <div className="w-full animate-in fade-in duration-500 space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <div className="px-6 py-5 border-b border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-semibold text-slate-900 text-lg">Platform Applications</h3>
            <p className="text-xs text-slate-500 mt-1">Total application records: {applications.length}</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Filter by candidate, job..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 w-full sm:w-72"
              />
            </div>
            <button 
              onClick={onRefresh}
              className="p-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              title="Refresh Applications"
            >
              <RefreshCcw size={16} className={loading ? "animate-spin text-blue-600" : ""} />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Candidate</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Job Applied For</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Applied Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <>
                  <TableRowSkeleton columns={4} />
                  <TableRowSkeleton columns={4} />
                  <TableRowSkeleton columns={4} />
                  <TableRowSkeleton columns={4} />
                </>
              ) : filteredApps.length > 0 ? (
                filteredApps.map(app => (
                  <tr key={app._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{app.candidate?.name || app.candidate?.email || 'Candidate'}</div>
                      <div className="text-xs text-slate-500">{app.candidate?.email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{app.job?.title || 'External / Custom Job'}</div>
                      <div className="text-xs text-slate-500">{app.job?.company || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${
                        app.status === 'Accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        app.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {app.status || 'Applied'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                      {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex justify-center mb-3 text-slate-300"><Briefcase size={32} /></div>
                    No application records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const SecurityAuditView = ({ securityData, loading, onRefresh }) => {
  const [filterSeverity, setFilterSeverity] = useState('');

  const logs = (securityData?.logs || []).filter(log => {
    if (!filterSeverity) return true;
    return log.severity === filterSeverity;
  });

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-800 border-rose-200 font-bold';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 border-amber-200 font-bold';
      case 'MEDIUM':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="w-full animate-in fade-in duration-500 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard 
          title="Total Security Events"
          icon={<ShieldAlert size={18} />}
          value={securityData?.totalLogs || 0}
          badgeText="Live System Logged"
          badgeColor="blue"
        />
        <MetricCard 
          title="Critical Security Alerts"
          icon={<AlertTriangle size={18} />}
          value={securityData?.criticalCount || 0}
          badgeText={securityData?.criticalCount > 0 ? "Requires Review" : "Zero Critical Threats"}
          badgeColor={securityData?.criticalCount > 0 ? "rose" : "emerald"}
        />
        <MetricCard 
          title="High Risk Activity"
          icon={<Shield size={18} />}
          value={securityData?.highCount || 0}
          badgeText="Monitored & Logged"
          badgeColor="amber"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <div className="px-6 py-5 border-b border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-semibold text-slate-900 text-lg">Security & Audit Event Stream</h3>
            <p className="text-xs text-slate-500 mt-1">Real-time log of security events, auth checks, and administrative changes</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High Only</option>
              <option value="MEDIUM">Medium Only</option>
              <option value="LOW">Low Only</option>
            </select>
            <button onClick={onRefresh} className="p-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 shadow-sm">
              <RefreshCcw size={16} className={loading ? "animate-spin text-blue-600" : ""} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Severity</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Event Type</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">User Email</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">IP Address</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Endpoint</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    <RefreshCcw size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
                    Loading security logs...
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map(log => (
                  <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-xs font-medium text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs border ${getSeverityBadge(log.severity)}`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 text-xs whitespace-nowrap">
                      {log.eventType}
                    </td>
                    <td className="px-6 py-4 text-slate-700 text-xs font-medium whitespace-nowrap">
                      {log.userEmail}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs font-mono whitespace-nowrap">
                      {log.ipAddress}
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs font-mono">
                      {log.endpoint}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex justify-center mb-3 text-slate-300"><Shield size={32} /></div>
                    No security events recorded. System operates with zero threats.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AiAnalyticsView = ({ aiData, loading, onRefresh }) => {
  const stats = aiData?.stats || {};
  const topUsers = aiData?.topUsers || [];
  const logs = aiData?.logs || [];

  return (
    <div className="w-full animate-in fade-in duration-500 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard 
          title="Total AI Queries"
          icon={<Sparkles size={18} />}
          value={aiData?.totalQueries || 0}
          badgeText="Gemini LLM Interactions"
          badgeColor="blue"
        />
        <MetricCard 
          title="Total Tokens Consumed"
          icon={<Cpu size={18} />}
          value={stats.totalTokens?.toLocaleString() || 0}
          badgeText="Prompt + Completion"
          badgeColor="emerald"
        />
        <MetricCard 
          title="Estimated Cost (USD)"
          icon={<Database size={18} />}
          value={`$${(stats.totalCost || 0).toFixed(4)}`}
          badgeText="Gemini Flash Rate"
          badgeColor="amber"
        />
        <MetricCard 
          title="Avg Latency"
          icon={<Clock size={18} />}
          value={Math.round(stats.avgLatency || 0)}
          suffix="ms"
          badgeText="Fast Response"
          badgeColor="emerald"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* TOP AI USERS */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 bg-white">
            <h3 className="font-semibold text-slate-900">Top Candidate AI Users</h3>
            <p className="text-xs text-slate-500 mt-1">Candidates with highest AI usage & token consumption</p>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider">Candidate Email</th>
                  <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider">Queries</th>
                  <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider">Tokens Used</th>
                  <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider">Est. Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topUsers.length > 0 ? (
                  topUsers.map((u, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {u._id}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        {u.count}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                        {u.tokens.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-semibold text-xs">
                        ${u.cost.toFixed(4)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-slate-400">
                      No AI query activity recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* LIVE AI LOGS */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 bg-white flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-slate-900">Recent AI Interaction Logs</h3>
              <p className="text-xs text-slate-500 mt-1">Live stream of Gemini LLM interactions</p>
            </div>
            <button onClick={onRefresh} className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
              <RefreshCcw size={14} className={loading ? "animate-spin text-blue-600" : ""} />
            </button>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider">Candidate</th>
                  <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider">Model</th>
                  <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length > 0 ? (
                  logs.slice(0, 8).map(l => (
                    <tr key={l._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-3.5 text-xs text-slate-500">
                        {new Date(l.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-3.5 font-medium text-slate-800 text-xs">
                        {l.userEmail}
                      </td>
                      <td className="px-6 py-3.5 text-xs">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 font-mono">
                          {l.model}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs font-mono text-slate-600">
                        {l.responseTimeMs} ms
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-slate-400">
                      No recent AI logs available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const CandidateActivityView = ({ activityData, loading, onRefresh }) => {
  const [search, setSearch] = useState('');

  const activities = activityData?.activities || [];
  const stats = activityData?.stats || {};

  const filtered = activities.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (a.candidate?.name || '').toLowerCase().includes(q) ||
      (a.candidate?.email || '').toLowerCase().includes(q) ||
      (a.job?.title || '').toLowerCase().includes(q) ||
      (a.job?.company || '').toLowerCase().includes(q)
    );
  });

  const statusColors = {
    pending:           'bg-blue-50 text-blue-700 border-blue-100',
    shortlisted:       'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected:          'bg-rose-50 text-rose-700 border-rose-200',
    selected:          'bg-purple-50 text-purple-700 border-purple-100',
    applied_externally:'bg-amber-50 text-amber-700 border-amber-200',
  };

  return (
    <div className="w-full animate-in fade-in duration-500 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Applications"
          icon={<Briefcase size={18} />}
          value={stats.totalApplications ?? 0}
          badgeText="All Platform Applications"
          badgeColor="blue"
        />
        <MetricCard
          title="Unique Candidates"
          icon={<Users size={18} />}
          value={stats.uniqueCandidates ?? 0}
          badgeText="Active Job Seekers"
          badgeColor="emerald"
        />
        <MetricCard
          title="Saved → Applied"
          icon={<BookMarked size={18} />}
          value={stats.savedAndApplied ?? 0}
          badgeText={`${stats.savedRatio ?? 0}% of Applications`}
          badgeColor="amber"
        />
        <MetricCard
          title="Direct Apply"
          icon={<MousePointerClick size={18} />}
          value={stats.directApply ?? 0}
          badgeText="Applied Without Saving"
          badgeColor="rose"
        />
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <div className="px-6 py-5 border-b border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-semibold text-slate-900 text-lg">Candidate Application Activity</h3>
            <p className="text-xs text-slate-500 mt-1">
              Shows every job a candidate applied to, with a{' '}
              <span className="font-semibold text-emerald-600">My Jobs ✓</span> flag if the job also appeared in their saved list
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search candidate or job..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 w-full sm:w-72"
              />
            </div>
            <button
              onClick={onRefresh}
              className="p-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              title="Refresh"
            >
              <RefreshCcw size={16} className={loading ? 'animate-spin text-blue-600' : ''} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Candidate</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Job Applied For</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">App Status</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">In My Jobs?</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Applied On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                    <RefreshCcw size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
                    Loading candidate activity...
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map(a => (
                  <tr key={a._id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Candidate */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm border border-slate-200 shadow-sm shrink-0">
                          {(a.candidate?.name || a.candidate?.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{a.candidate?.name || '—'}</div>
                          <div className="text-xs text-slate-500">{a.candidate?.email}</div>
                          {a.candidate?.experienceLevel && (
                            <div className="text-[10px] text-slate-400 mt-0.5">{a.candidate.experienceLevel}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Job */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{a.job?.title || 'N/A'}</div>
                      <div className="text-xs text-slate-500">{a.job?.company || 'N/A'}</div>
                      {a.job?.location && (
                        <div className="text-[10px] text-slate-400 mt-0.5">{a.job.location}</div>
                      )}
                    </td>

                    {/* Application Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${statusColors[a.status] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                        {a.status || 'pending'}
                      </span>
                    </td>

                    {/* My Jobs flag */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {a.savedInMyJobs ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">
                          <BookMarked size={12} />
                          Saved in My Jobs
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border bg-slate-50 text-slate-500 border-slate-200">
                          <MousePointerClick size={12} />
                          Direct Apply
                        </span>
                      )}
                    </td>

                    {/* Applied date */}
                    <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                      {a.appliedAt ? new Date(a.appliedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex justify-center mb-3 text-slate-300"><UserCheck size={32} /></div>
                    No candidate activity records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ConfigurationView = ({ onRefresh }) => {
  return (
    <div className="w-full animate-in fade-in duration-500 space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-semibold text-slate-900 text-lg">System Configuration</h3>
            <p className="text-xs text-slate-500">Manage SDE Crawler & System Settings</p>
          </div>
          <button onClick={onRefresh} className="p-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">
            <RefreshCcw size={16} />
          </button>
        </div>

        <div className="space-y-4 max-w-2xl">
          <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-900 text-sm">SDE Automatic Sync</div>
              <div className="text-xs text-slate-500">Enable periodic background jobs crawling</div>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-semibold text-xs rounded-full border border-emerald-200">
              ACTIVE
            </span>
          </div>

          <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-900 text-sm">Crawl Interval</div>
              <div className="text-xs text-slate-500">Frequency for SDE health checks</div>
            </div>
            <span className="px-3 py-1 bg-slate-200 text-slate-800 font-semibold text-xs rounded-md">
              10 seconds
            </span>
          </div>

          <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-900 text-sm">Primary Database</div>
              <div className="text-xs text-slate-500">MongoDB Atlas (jobportal)</div>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 font-semibold text-xs rounded-full border border-blue-200">
              CONNECTED
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [jobsPagination, setJobsPagination] = useState({ totalJobs: 0, page: 1, totalPages: 1, limit: 50 });
  const [jobsSearch, setJobsSearch] = useState('');
  const [jobsPage, setJobsPage] = useState(1);
  const [jobsLimit, setJobsLimit] = useState(50);
  const [applications, setApplications] = useState([]);
  const [securityData, setSecurityData] = useState(null);
  const [aiData, setAiData] = useState(null);
  const [activityData, setActivityData] = useState(null);

  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingApps, setLoadingApps] = useState(false);
  const [loadingSecurity, setLoadingSecurity] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);

  const [activeTab, setActiveTab] = useState('metrics');
  const [supportRefreshKey, setSupportRefreshKey] = useState(0);
  const [triggeringCrawl, setTriggeringCrawl] = useState(false);

  const navigate = useNavigate();

  const handleTriggerCrawl = async () => {
    setTriggeringCrawl(true);
    try {
      await axios.post(`${API_BASE_URL}/api/jobs/sync`, {}, getAuthHeaders());
      toast.success("Manual crawl triggered successfully!");
      setTimeout(() => fetchHealth(), 4000);
    } catch (err) {
      toast.error("Failed to trigger manual crawl");
    } finally {
      setTriggeringCrawl(false);
    }
  };

  const fetchHealth = async () => {
    setLoadingMetrics(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/admin/sde/health`, getAuthHeaders());
      setMetrics(data);
    } catch (err) {
      console.error("Failed to fetch SDE metrics", err);
    } finally {
      setLoadingMetrics(false);
    }
  };
  
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/admin/users`, getAuthHeaders());
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchJobs = async (search = jobsSearch, page = jobsPage, limit = jobsLimit) => {
    setLoadingJobs(true);
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/api/admin/jobs?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`,
        getAuthHeaders()
      );
      if (Array.isArray(data)) {
        setJobs(data);
        setJobsPagination({ totalJobs: data.length, page: 1, totalPages: 1, limit: data.length });
      } else {
        setJobs(data.jobs || []);
        setJobsPagination({
          totalJobs: data.totalJobs || 0,
          page: data.page || page,
          totalPages: data.totalPages || 1,
          limit: data.limit || limit,
        });
      }
    } catch (err) {
      console.error("Failed to fetch jobs registry", err);
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchApplications = async () => {
    setLoadingApps(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/admin/applications`, getAuthHeaders());
      setApplications(data);
    } catch (err) {
      console.error("Failed to fetch applications", err);
    } finally {
      setLoadingApps(false);
    }
  };

  const fetchActivity = async () => {
    setLoadingActivity(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/admin/candidate-activity`, getAuthHeaders());
      setActivityData(data);
    } catch (err) {
      console.error("Failed to fetch candidate activity", err);
    } finally {
      setLoadingActivity(false);
    }
  };

  const fetchSecurity = async () => {
    setLoadingSecurity(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/admin/security/logs`, getAuthHeaders());
      setSecurityData(data);
    } catch (err) {
      console.error("Failed to fetch security logs", err);
    } finally {
      setLoadingSecurity(false);
    }
  };

  const fetchAiUsage = async () => {
    setLoadingAi(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/admin/ai/usage`, getAuthHeaders());
      setAiData(data);
    } catch (err) {
      console.error("Failed to fetch AI usage", err);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleToggleRole = async (userId, currentRole, userName) => {
    const roleCycle = { candidate: 'recruiter', recruiter: 'admin', admin: 'candidate' };
    const newRole = roleCycle[currentRole] || 'candidate';
    try {
      await axios.patch(`${API_BASE_URL}/api/admin/users/${userId}/role`, { role: newRole }, getAuthHeaders());
      toast.success(`Role for ${userName} updated to ${newRole}`);
      fetchUsers();
    } catch (err) {
      toast.error("Failed to update user role");
    }
  };

  const handleDeleteUser = async (userId, userEmail, userName) => {
    if (!window.confirm(`Are you sure you want to delete user ${userName || userEmail}?`)) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/users/${userId}`, getAuthHeaders());
      toast.success(`User ${userEmail} deleted successfully`);
      fetchUsers();
    } catch (err) {
      toast.error("Failed to delete user account");
    }
  };

  const handleDeleteJob = async (jobId, jobTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${jobTitle}" from registry?`)) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/jobs/${jobId}`, getAuthHeaders());
      toast.success("Job removed from registry");
      fetchJobs(jobsSearch, jobsPage, jobsLimit);
      fetchHealth();
    } catch (err) {
      toast.error("Failed to delete job");
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'jobs') fetchJobs(jobsSearch, jobsPage, jobsLimit);
    if (activeTab === 'applications') fetchApplications();
    if (activeTab === 'activity') fetchActivity();
    if (activeTab === 'security') fetchSecurity();
    if (activeTab === 'ai') fetchAiUsage();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'jobs') {
      const timer = setTimeout(() => {
        setJobsPage(1);
        fetchJobs(jobsSearch, 1, jobsLimit);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [jobsSearch]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans overflow-hidden selection:bg-blue-100 selection:text-blue-900 fixed inset-0 z-50">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-sm z-20">
        
        {/* BRANDING LOGO */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg tracking-tight cursor-pointer" onClick={() => window.location.reload()}>
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center shadow-sm">
              <Activity size={18} className="text-white" />
            </div>
            SkillBridge <span className="text-slate-400 font-normal">Admin</span>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 mt-2 px-3">Overview</div>
          <nav className="space-y-1">
            <SidebarItem icon={<LayoutDashboard size={18} />} label="SDE Metrics" active={activeTab === 'metrics'} onClick={() => setActiveTab('metrics')} />
            <SidebarItem icon={<Users size={18} />} label="User Management" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
            <SidebarItem icon={<Database size={18} />} label="Jobs Registry" active={activeTab === 'jobs'} onClick={() => setActiveTab('jobs')} />
            <SidebarItem icon={<Briefcase size={18} />} label="Applications" active={activeTab === 'applications'} onClick={() => setActiveTab('applications')} />
            <SidebarItem icon={<BookMarked size={18} />} label="Candidate Activity" active={activeTab === 'activity'} onClick={() => setActiveTab('activity')} />
            <SidebarItem icon={<LifeBuoy size={18} />} label="Reported Issues" active={activeTab === 'support'} onClick={() => setActiveTab('support')} />
            <SidebarItem icon={<Send size={18} />} label="Direct Messages" active={activeTab === 'messages'} onClick={() => setActiveTab('messages')} />
          </nav>
          
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 mt-8 px-3">Security & AI</div>
          <nav className="space-y-1">
            <SidebarItem icon={<ShieldAlert size={18} />} label="Security Audit" active={activeTab === 'security'} onClick={() => setActiveTab('security')} />
            <SidebarItem icon={<Sparkles size={18} />} label="AI Analytics" active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} />
            <SidebarItem icon={<Settings size={18} />} label="Configuration" active={activeTab === 'configuration'} onClick={() => setActiveTab('configuration')} />
          </nav>
        </div>

        {/* BOTTOM PROFILE & LOGOUT */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer group border border-transparent hover:border-slate-200">
            <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 font-bold shadow-sm">
              <span className="sr-only">Admin User</span>
              {(JSON.parse(localStorage.getItem('user') || '{}').name || 'Admin').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-semibold text-slate-900 truncate">{JSON.parse(localStorage.getItem('user') || '{}').name || "Admin User"}</div>
              <div className="text-[11px] font-medium text-slate-500 truncate">{JSON.parse(localStorage.getItem('user') || '{}').email || "admin"}</div>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-rose-600 transition-colors p-1.5 hover:bg-rose-50 rounded-lg" title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-slate-50/50">
        
        {/* TOP HEADER UTILITY BAR */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10 shrink-0">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <span className="flex items-center gap-2 hover:text-slate-900 cursor-pointer transition-colors"><Home size={14} /> Admin</span>
            <ChevronRight size={14} className="text-slate-300" />
            <span className="hover:text-slate-900 cursor-pointer transition-colors">Overview</span>
            <ChevronRight size={14} className="text-slate-300" />
            <span className="font-bold text-slate-900">
              {activeTab === 'metrics' ? 'SDE Metrics' : 
               activeTab === 'users' ? 'User Management' : 
               activeTab === 'jobs' ? 'Jobs Registry' : 
               activeTab === 'applications' ? 'Applications' : 
               activeTab === 'activity' ? 'Candidate Activity' : 
               activeTab === 'support' ? 'Reported Issues' : 
               activeTab === 'messages' ? 'Direct Messages' : 
               activeTab === 'security' ? 'Security Audit' : 
               activeTab === 'ai' ? 'AI Analytics' : 'Configuration'}
            </span>
          </div>
          
          {/* Right Utilities */}
          <div className="flex items-center gap-4">
            {/* Live System Status Pill */}
            <div className="hidden md:flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-[11px] font-bold border border-emerald-100 shadow-sm uppercase tracking-wide">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${metrics?.isOnline !== false ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${metrics?.isOnline !== false ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              </span>
              {metrics?.isOnline !== false ? `Crawler: Active • ${metrics?.crawlerSuccess || '100%'}` : "Crawler: Offline"}
            </div>
            
            <div className="hidden md:block w-px h-6 bg-slate-200 mx-2"></div>
            
            <button onClick={() => toast("No new notifications")} className="text-slate-400 hover:text-slate-600 transition-colors relative p-2 hover:bg-slate-100 rounded-lg">
              <Bell size={18} />
            </button>
            <button 
              onClick={() => {
                fetchHealth();
                if (activeTab === 'users') fetchUsers();
                if (activeTab === 'jobs') fetchJobs(jobsSearch, jobsPage, jobsLimit);
                if (activeTab === 'applications') fetchApplications();
                if (activeTab === 'activity') fetchActivity();
                if (activeTab === 'support') setSupportRefreshKey(k => k + 1);
                if (activeTab === 'security') fetchSecurity();
                if (activeTab === 'ai') fetchAiUsage();
              }} 
              className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-lg"
              title="Refresh Data"
            >
              <RefreshCcw size={18} className={(loadingMetrics || loadingUsers || loadingJobs || loadingApps || loadingActivity || loadingSecurity || loadingAi) ? "animate-spin text-blue-600" : ""} />
            </button>
          </div>
        </header>

        {/* SCROLLABLE VIEWPORT */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 w-full">
          {loadingMetrics && !metrics ? (
            <DashboardSkeleton />
          ) : activeTab === 'metrics' ? (
            <MetricsView metrics={metrics} fetchHealth={fetchHealth} handleTriggerCrawl={handleTriggerCrawl} triggeringCrawl={triggeringCrawl} setActiveTab={setActiveTab} />
          ) : activeTab === 'users' ? (
            <UsersView users={users} loading={loadingUsers} onRefresh={fetchUsers} onToggleRole={handleToggleRole} onDeleteUser={handleDeleteUser} />
          ) : activeTab === 'jobs' ? (
            <JobsView 
              jobs={jobs} 
              loading={loadingJobs} 
              search={jobsSearch} 
              setSearch={setJobsSearch} 
              pagination={jobsPagination}
              onPageChange={(newPage) => {
                setJobsPage(newPage);
                fetchJobs(jobsSearch, newPage, jobsLimit);
              }}
              onLimitChange={(newLimit) => {
                setJobsLimit(newLimit);
                setJobsPage(1);
                fetchJobs(jobsSearch, 1, newLimit);
              }}
              onRefresh={() => fetchJobs(jobsSearch, jobsPage, jobsLimit)} 
              onDeleteJob={handleDeleteJob} 
            />
          ) : activeTab === 'applications' ? (
            <ApplicationsView applications={applications} loading={loadingApps} onRefresh={fetchApplications} />
          ) : activeTab === 'activity' ? (
            <CandidateActivityView activityData={activityData} loading={loadingActivity} onRefresh={fetchActivity} />
          ) : activeTab === 'support' ? (
            <SupportTicketsView key={supportRefreshKey} />
          ) : activeTab === 'messages' ? (
            <AdminMessagesView />
          ) : activeTab === 'security' ? (
            <SecurityAuditView securityData={securityData} loading={loadingSecurity} onRefresh={fetchSecurity} />
          ) : activeTab === 'ai' ? (
            <AiAnalyticsView aiData={aiData} loading={loadingAi} onRefresh={fetchAiUsage} />
          ) : activeTab === 'configuration' ? (
            <ConfigurationView onRefresh={fetchHealth} />
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
