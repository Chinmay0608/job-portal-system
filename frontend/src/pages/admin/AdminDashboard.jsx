import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, Users, Activity, Settings, LogOut, Search, Bell, 
  RefreshCcw, ChevronRight, CheckCircle2, Clock, Database, 
  TrendingUp, CircleDot, Briefcase, ServerCrash, Home
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

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
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
          {icon}
        </div>
      </div>
      
      {/* Middle Row (Value) */}
      <div>
        <div className="text-3xl font-bold text-slate-900">
          {value}
          {suffix && <span className="text-lg text-slate-500 ml-1 font-semibold">{suffix}</span>}
        </div>
      </div>

      {/* Bottom Row (Badge) */}
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
  <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
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
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* 4-COLUMN KPI GRID */}
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

      {/* 2-COLUMN DASHBOARD SPLIT */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: CRAWLER DELTAS */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Crawler Deltas</h3>
            <p className="text-xs text-slate-500 mt-1">Categorized breakdown of today's sync operations</p>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-center">
            {/* Visual Color Bar */}
            <div className="w-full h-4 flex rounded-full overflow-hidden mb-8 bg-slate-100 shadow-inner">
              <div style={{width: '40%'}} className="bg-emerald-500 hover:opacity-90 transition-opacity"></div>
              <div style={{width: '30%'}} className="bg-blue-500 hover:opacity-90 transition-opacity"></div>
              <div style={{width: '20%'}} className="bg-amber-400 hover:opacity-90 transition-opacity"></div>
              <div style={{width: '10%'}} className="bg-rose-500 hover:opacity-90 transition-opacity"></div>
            </div>
            
            {/* Compact Stat Badges */}
            <div className="grid grid-cols-2 gap-3">
              <DeltaBadge label="New Jobs" value={metrics.todayDeltas?.newJobs || 0} color="emerald" />
              <DeltaBadge label="Updated" value={metrics.todayDeltas?.updatedJobs || 0} color="blue" />
              <DeltaBadge label="Unchanged" value={metrics.todayDeltas?.unchangedJobs || 0} color="amber" />
              <DeltaBadge label="Expired" value={metrics.todayDeltas?.expiredJobs || 0} color="rose" />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TOP HIRING TABLE */}
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
                        <button onClick={() => toast("Company inspect view coming soon")} className="text-slate-400 hover:text-blue-600 transition-colors text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded hover:bg-blue-50">
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

const UsersView = ({ users }) => (
  <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="px-6 py-5 border-b border-slate-100 bg-white flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-slate-900">Platform Users</h3>
          <p className="text-xs text-slate-500 mt-1">Total registered candidates and recruiters: {users.length}</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => toast("CSV Export feature coming soon")}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
          >
            Export CSV
          </button>
          <button 
            onClick={() => toast("Add User feature coming soon")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            Add User
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
            {users.map(u => (
              <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-sm border border-slate-200 shadow-sm">
                      {u.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{u.name}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${
                    u.role === 'recruiter' 
                      ? 'bg-purple-50 text-purple-700 border-purple-100' 
                      : 'bg-blue-50 text-blue-700 border-blue-100'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600 font-medium">
                  {new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => toast(`Settings for ${u.name} coming soon`)}
                    className="text-slate-400 hover:text-slate-900 transition-colors p-2 hover:bg-slate-100 rounded-lg"
                  >
                    <Settings size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                  <div className="flex justify-center mb-3 text-slate-300"><Users size={32} /></div>
                  No users found in the database.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [activeTab, setActiveTab] = useState('metrics'); // 'metrics' or 'users'
  const navigate = useNavigate();

    const [triggeringCrawl, setTriggeringCrawl] = useState(false);

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

  useEffect(() => {
    fetchHealth();
    fetchUsers();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

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
          <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg tracking-tight cursor-pointer" onClick={() => navigate("/")}>
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
          </nav>
          
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 mt-8 px-3">System</div>
          <nav className="space-y-1">
            <SidebarItem icon={<Settings size={18} />} label="Configuration" active={activeTab === 'configuration'} onClick={() => setActiveTab('configuration')} />
          </nav>
        </div>

        {/* BOTTOM PROFILE & LOGOUT */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer group border border-transparent hover:border-slate-200">
            <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 font-bold shadow-sm">
              <span className="sr-only">Admin User</span>
              A
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-semibold text-slate-900 truncate">Admin User</div>
              <div className="text-[11px] font-medium text-slate-500 truncate">admin@skillbridge.com</div>
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
                 activeTab === 'applications' ? 'Applications' : 'Configuration'}
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
            
            {/* Global Search Shortcut */}
            <button className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-sm">
              <Search size={14} />
              <span className="text-xs font-medium mr-4">Search...</span>
              <kbd className="hidden sm:inline-block font-sans text-[10px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 font-bold">⌘K</kbd>
            </button>

            <button onClick={() => toast("No new notifications")} className="text-slate-400 hover:text-slate-600 transition-colors relative p-2 hover:bg-slate-100 rounded-lg">
                <Bell size={18} />
              </button>
            <button 
              onClick={() => { fetchHealth(); fetchUsers(); }} 
              className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-lg"
              title="Refresh Data"
            >
              <RefreshCcw size={18} className={(loadingMetrics || loadingUsers) ? "animate-spin text-blue-600" : ""} />
            </button>
          </div>
        </header>

        {/* SCROLLABLE VIEWPORT */}
        <div className="flex-1 overflow-y-auto p-8">
          {(loadingMetrics || loadingUsers) && !metrics ? (
            <DashboardSkeleton />
          ) : activeTab === 'metrics' ? (
              <MetricsView metrics={metrics} fetchHealth={fetchHealth} handleTriggerCrawl={handleTriggerCrawl} triggeringCrawl={triggeringCrawl} setActiveTab={setActiveTab} />
            ) : activeTab === 'users' ? (
              <UsersView users={users} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-4 border border-slate-200">
                  <Activity size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">View Coming Soon</h3>
                <p className="text-slate-500 max-w-md">The {activeTab === 'jobs' ? 'Jobs Registry' : activeTab === 'applications' ? 'Applications' : 'Configuration'} dashboard is currently under development. Please check back later.</p>
              </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
