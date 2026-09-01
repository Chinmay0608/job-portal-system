const fs = require('fs');

const path = 'D:/MERN Project/job-portal/frontend/src/pages/admin/AdminDashboard.jsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add toast import
if (!code.includes('import toast')) {
  code = code.replace(
    /import { useNavigate } from 'react-router-dom';/,
    "import { useNavigate } from 'react-router-dom';\nimport toast from 'react-hot-toast';"
  );
}

// 2. MetricsView props
code = code.replace(
  /const MetricsView = \(\{ metrics, fetchHealth \}\) => \{/,
  "const MetricsView = ({ metrics, fetchHealth, handleTriggerCrawl, triggeringCrawl, setActiveTab }) => {"
);

// 3. Trigger Manual Crawl button
code = code.replace(
  /<button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-all shadow-sm active:scale-95">\s*Trigger Manual Crawl\s*<\/button>/m,
  `<button 
                  onClick={handleTriggerCrawl}
                  disabled={triggeringCrawl}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {triggeringCrawl ? "Triggering..." : "Trigger Manual Crawl"}
                </button>`
);

// 4. View All button
code = code.replace(
  /<button className="text-sm text-blue-600 font-medium hover:text-blue-700 px-3 py-1\.5 hover:bg-blue-50 rounded-lg transition-colors">\s*View All\s*<\/button>/m,
  `<button onClick={() => setActiveTab('jobs')} className="text-sm text-blue-600 font-medium hover:text-blue-700 px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors">\n                View All\n              </button>`
);

// 5. Inspect button
code = code.replace(
  /<button className="text-slate-400 hover:text-blue-600 transition-colors text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded hover:bg-blue-50">\s*Inspect\s*<\/button>/g,
  `<button onClick={() => toast("Company inspect view coming soon")} className="text-slate-400 hover:text-blue-600 transition-colors text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded hover:bg-blue-50">\n                          Inspect\n                        </button>`
);

// 6. AdminDashboard main component updates
const hookCode = `  const [triggeringCrawl, setTriggeringCrawl] = useState(false);

  const handleTriggerCrawl = async () => {
    setTriggeringCrawl(true);
    try {
      await axios.post(\`\${API_BASE_URL}/api/jobs/sync\`, {}, getAuthHeaders());
      toast.success("Manual crawl triggered successfully!");
      setTimeout(() => fetchHealth(), 4000);
    } catch (err) {
      toast.error("Failed to trigger manual crawl");
    } finally {
      setTriggeringCrawl(false);
    }
  };`;

if (!code.includes('const handleTriggerCrawl = async () => {')) {
  code = code.replace(
    /const fetchHealth = async \(\) => \{/,
    hookCode + '\n\n  const fetchHealth = async () => {'
  );
}

// 7. Sidebar links
code = code.replace(
  /<SidebarItem icon=\{<Database size=\{18\} \/>\} label="Jobs Registry" \/>/,
  `<SidebarItem icon={<Database size={18} />} label="Jobs Registry" active={activeTab === 'jobs'} onClick={() => setActiveTab('jobs')} />`
);
code = code.replace(
  /<SidebarItem icon=\{<Briefcase size=\{18\} \/>\} label="Applications" \/>/,
  `<SidebarItem icon={<Briefcase size={18} />} label="Applications" active={activeTab === 'applications'} onClick={() => setActiveTab('applications')} />`
);
code = code.replace(
  /<SidebarItem icon=\{<Settings size=\{18\} \/>\} label="Configuration" \/>/,
  `<SidebarItem icon={<Settings size={18} />} label="Configuration" active={activeTab === 'configuration'} onClick={() => setActiveTab('configuration')} />`
);

// 8. Top header: activeTab text mapping
code = code.replace(
  /<span className="font-bold text-slate-900">\{activeTab === 'metrics' \? 'SDE Metrics' : 'User Management'\}<\/span>/,
  `<span className="font-bold text-slate-900">
                {activeTab === 'metrics' ? 'SDE Metrics' : 
                 activeTab === 'users' ? 'User Management' : 
                 activeTab === 'jobs' ? 'Jobs Registry' : 
                 activeTab === 'applications' ? 'Applications' : 'Configuration'}
              </span>`
);

// 9. Search and Bell
code = code.replace(
  /<button className="text-slate-400 hover:text-slate-600 transition-colors relative p-2 hover:bg-slate-100 rounded-lg w-full flex items-center justify-between group">\s*<div className="flex items-center gap-2">\s*<Search size=\{18\} \/>\s*<span className="text-sm font-medium">Search<\/span>\s*<\/div>\s*<span className="text-xs font-semibold px-1\.5 py-0\.5 bg-slate-100 rounded border border-slate-200 text-slate-400 group-hover:bg-white transition-colors">\s*⌘K\s*<\/span>\s*<\/button>/m,
  `<button onClick={() => toast('Global search coming soon')} className="text-slate-400 hover:text-slate-600 transition-colors relative p-2 hover:bg-slate-100 rounded-lg w-full flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <Search size={18} />
                  <span className="text-sm font-medium">Search</span>
                </div>
              </button>`
);

code = code.replace(
  /<button className="text-slate-400 hover:text-slate-600 transition-colors relative p-2 hover:bg-slate-100 rounded-lg">\s*<Bell size=\{18\} \/>\s*<span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 border-2 border-white rounded-full"><\/span>\s*<\/button>/m,
  `<button onClick={() => toast("No new notifications")} className="text-slate-400 hover:text-slate-600 transition-colors relative p-2 hover:bg-slate-100 rounded-lg">
                <Bell size={18} />
              </button>`
);


// 10. Crawler Active status pill
code = code.replace(
  /<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"><\/span>\s*<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"><\/span>\s*<\/span>\s*Crawler: Active • 100%\s*<\/div>/m,
  `<span className={\`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 \${metrics?.isOnline !== false ? 'bg-emerald-400' : 'bg-rose-400'}\`}></span>
                  <span className={\`relative inline-flex rounded-full h-2 w-2 \${metrics?.isOnline !== false ? 'bg-emerald-500' : 'bg-rose-500'}\`}></span>
                </span>
                {metrics?.isOnline !== false ? \`Crawler: Active • \${metrics?.crawlerSuccess || '100%'}\` : "Crawler: Offline"}
              </div>`
);

// 11. Render Switch for activeTab
const viewSwitchRegex = /\) : activeTab === 'metrics' \? \(\s*<MetricsView metrics=\{metrics\} fetchHealth=\{fetchHealth\} \/>\s*\) : \(\s*<UsersView users=\{users\} \/>\s*\)/m;
const newViewSwitch = `) : activeTab === 'metrics' ? (
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
            )`;
code = code.replace(viewSwitchRegex, newViewSwitch);


fs.writeFileSync(path, code);
console.log('AdminDashboard.jsx patched successfully');
