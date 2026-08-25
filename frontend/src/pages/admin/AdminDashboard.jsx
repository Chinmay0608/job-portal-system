import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, Users, Activity, Settings, LogOut, Search, Bell, 
  RefreshCcw, ChevronRight, CheckCircle2, Clock, Database, 
  TrendingUp, CircleDot, Briefcase, ServerCrash
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const getAuthHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const SidebarItem = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      active 
        ? 'bg-blue-600 text-white shadow-sm' 
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
    }`}
  >
    {icon}
    {label}
  </button>
);

const DeltaRow = ({ label, value, color }) => {
  const colorMap = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-400',
    rose: 'bg-rose-500'
  };
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <div className={`w-2.5 h-2.5 rounded-full ${colorMap[color]}`}></div>
        {label}
      </div>
      <div className="font-semibold text-slate-900">{value.toLocaleString()}</div>
    </div>
  );
};

const DashboardSkeleton = () => (
  <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 h-32 flex flex-col justify-between">
          <div className="w-1/2 h-4 bg-slate-200 rounded"></div>
          <div>
            <div className="w-3/4 h-8 bg-slate-200 rounded mb-2"></div>
            <div className="w-1/2 h-3 bg-slate-100 rounded"></div>
          </div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl border border-slate-200 h-80 lg:col-span-1"></div>
      <div className="bg-white rounded-xl border border-slate-200 h-80 lg:col-span-2"></div>
    </div>
  </div>
);

const MetricsView = ({ metrics }) => {
  if (!metrics) return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8">
      <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-500 mb-4">
        <ServerCrash size={32} />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">Connection Error</h3>
      <p className="text-slate-500">Failed to connect to Discovery Engine. The backend crawler service might be down.</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* 4-COLUMN KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-4">
            <span className="text-sm font-medium">Registry Size</span>
            <Database size={16} />
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900">{metrics.registrySize?.toLocaleString() || 0}</div>
            <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp size={12} /> +2.4% from yesterday
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-4">
            <span className="text-sm font-medium">Crawler Success</span>
            <CheckCircle2 size={16} />
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900">{metrics.crawlerSuccess || '0%'}</div>
            <div className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1">
              <CircleDot size={10} className="fill-emerald-500 text-emerald-500" /> Optimal Performance
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-4">
            <span className="text-sm font-medium">Avg Crawl Time</span>
            <Clock size={16} />
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900">
              {metrics.averageCrawlTime || 0}<span className="text-lg text-slate-500 ml-1 font-semibold">ms</span>
            </div>
            <div className="text-xs text-emerald-600 font-medium mt-1">Excellent Latency</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-4">
            <span className="text-sm font-medium">Today's Delta</span>
            <Activity size={16} />
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900">
              {((metrics.todayDeltas?.newJobs || 0) + (metrics.todayDeltas?.updatedJobs || 0)).toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">Jobs processed today</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DELTAS PANEL */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col lg:col-span-1 hover:shadow-md transition-shadow">
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Crawler Deltas</h3>
            <p className="text-xs text-slate-500 mt-1">Breakdown of today's sync operations</p>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-center">
            {/* Visual Bar */}
            <div className="w-full h-3 flex rounded-full overflow-hidden mb-8 bg-slate-100">
              <div style={{width: '40%'}} className="bg-emerald-500 hover:opacity-80 transition-opacity"></div>
              <div style={{width: '30%'}} className="bg-blue-500 hover:opacity-80 transition-opacity"></div>
              <div style={{width: '20%'}} className="bg-amber-400 hover:opacity-80 transition-opacity"></div>
              <div style={{width: '10%'}} className="bg-rose-500 hover:opacity-80 transition-opacity"></div>
            </div>
            
            <div className="space-y-4">
              <DeltaRow label="New Jobs Indexed" value={metrics.todayDeltas?.newJobs || 0} color="emerald" />
              <DeltaRow label="Records Updated" value={metrics.todayDeltas?.updatedJobs || 0} color="blue" />
              <DeltaRow label="Unchanged Matches" value={metrics.todayDeltas?.unchangedJobs || 0} color="amber" />
              <DeltaRow label="Expired / Pruned" value={metrics.todayDeltas?.expiredJobs || 0} color="rose" />
            </div>
          </div>
        </div>

        {/* TOP HIRING TABLE */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col overflow-hidden hover:shadow-md transition-shadow">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
            <div>
              <h3 className="font-semibold text-slate-800">Top Hiring Companies</h3>
              <p className="text-xs text-slate-500 mt-1">Companies with the most active listings in registry</p>
            </div>
            <button className="text-sm text-blue-600 font-medium hover:text-blue-700 px-3 py-1.5 hover:bg-blue-50 rounded-md transition-colors">
              View All
            </button>
          </div>
          <div className="flex-1 overflow-x-auto">
            {metrics.topHiring?.length > 0 ? (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider">Company Name</th>
                    <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider">Open Positions</th>
                    <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {metrics.topHiring.map((comp, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 font-bold text-xs group-hover:border-blue-200 group-hover:text-blue-600 transition-colors">
                          {comp.name.charAt(0)}
                        </div>
                        {comp.name}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{comp.count} active listings</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <CircleDot size={10} className="fill-emerald-500" /> Synced
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-slate-400 hover:text-blue-600 transition-colors text-xs font-semibold uppercase tracking-wider">
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-300 mb-4 shadow-sm">
                  <Database size={28} />
                </div>
                <h4 className="text-slate-900 font-semibold mb-1 text-base">No Companies Indexed</h4>
                <p className="text-slate-500 text-sm max-w-sm mx-auto">There are no companies with active listings in the registry. Ensure the crawler is active.</p>
                <button className="mt-5 px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-all shadow-sm hover:shadow active:scale-95">
                  Trigger Manual Crawl
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
  <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 bg-white flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-slate-800">Platform Users</h3>
          <p className="text-xs text-slate-500 mt-1">Total registered candidates and recruiters: {users.length}</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors">
            Export CSV
          </button>
          <button className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
            Add User
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
            <tr>
              <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider">User Profile</th>
              <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider">Account Role</th>
              <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider">Joined Date</th>
              <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-sm border border-slate-200">
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
                <td className="px-6 py-4 text-slate-600">
                  {new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-400 hover:text-slate-900 transition-colors">
                    <Settings size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
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
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden selection:bg-blue-100 selection:text-blue-900">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800/50">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg tracking-tight">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm shadow-blue-900/50">
              <Activity size={18} className="text-white" />
            </div>
            SkillBridge SDE
          </div>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 mt-2 px-3">Overview</div>
          <nav className="space-y-1">
            <SidebarItem icon={<LayoutDashboard size={18} />} label="SDE Metrics" active={activeTab === 'metrics'} onClick={() => setActiveTab('metrics')} />
            <SidebarItem icon={<Users size={18} />} label="User Management" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
            <SidebarItem icon={<Database size={18} />} label="Jobs Registry" />
            <SidebarItem icon={<Briefcase size={18} />} label="Applications" />
          </nav>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 mt-8 px-3">System</div>
          <nav className="space-y-1">
            <SidebarItem icon={<Settings size={18} />} label="Configuration" />
          </nav>
        </div>
        <div className="p-4 border-t border-slate-800/50">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-800/50 transition-colors cursor-pointer group">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-medium group-hover:bg-slate-700 transition-colors">
              <span className="sr-only">Admin User</span>
              A
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-semibold text-white truncate">Admin User</div>
              <div className="text-xs text-slate-500 truncate">admin@skillbridge.com</div>
            </div>
            <button onClick={handleLogout} className="text-slate-500 hover:text-white transition-colors p-1" title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-slate-50">
        {/* HEADER UTILITY BAR */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10 shrink-0">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="hover:text-slate-900 cursor-pointer transition-colors">Admin</span>
            <ChevronRight size={14} className="text-slate-300" />
            <span className="hover:text-slate-900 cursor-pointer transition-colors">Overview</span>
            <ChevronRight size={14} className="text-slate-300" />
            <span className="font-semibold text-slate-900">{activeTab === 'metrics' ? 'SDE Metrics' : 'User Management'}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-semibold border border-emerald-100 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Crawler: Active • 100%
            </div>
            <div className="w-px h-6 bg-slate-200 mx-2"></div>
            
            {/* Global Search Shortcut */}
            <button className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-sm">
              <Search size={14} />
              <span className="text-xs font-medium mr-4">Search...</span>
              <kbd className="hidden sm:inline-block font-sans text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-400 font-semibold shadow-sm">⌘K</kbd>
            </button>

            <button className="text-slate-400 hover:text-slate-600 transition-colors relative p-1.5 hover:bg-slate-100 rounded-lg">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 border border-white rounded-full"></span>
            </button>
            <button 
              onClick={() => { fetchHealth(); fetchUsers(); }} 
              className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-100 rounded-lg"
              title="Refresh Data"
            >
              <RefreshCcw size={18} className={(loadingMetrics || loadingUsers) ? "animate-spin text-blue-600" : ""} />
            </button>
          </div>
        </header>

        {/* SCROLLABLE VIEWPORT */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          {(loadingMetrics || loadingUsers) && !metrics ? (
            <DashboardSkeleton />
          ) : activeTab === 'metrics' ? (
            <MetricsView metrics={metrics} />
          ) : (
            <UsersView users={users} />
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
