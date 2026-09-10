import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { HiOutlineCog, HiOutlineOfficeBuilding, HiOutlineKey, HiOutlineDocumentText } from "react-icons/hi";

function ConfigView() {
  const [companies, setCompanies] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Default configs if empty
  const defaultConfigs = [
    { key: "ENABLE_JOB_CRAWLER", value: "true", description: "Toggle background scraping of external jobs." },
    { key: "MAX_ACTIVE_JOBS_LIMIT", value: "1500", description: "Maximum jobs to keep active before purging." },
    { key: "DAILY_EMAIL_DIGESTS", value: "false", description: "Send automated matches to candidates daily." }
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const [compRes, confRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/companies`, { headers: { Authorization: `Bearer ${token}` }}),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/config`, { headers: { Authorization: `Bearer ${token}` }})
      ]);
      
      setCompanies(compRes.data || []);
      setConfigs(confRes.data.length > 0 ? confRes.data : defaultConfigs);
    } catch (err) {
      toast.error("Failed to load configuration data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleCompanyStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/admin/companies/${id}`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      toast.success("Company status updated!");
      setCompanies(prev => prev.map(c => c._id === id ? { ...c, status: newStatus } : c));
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };

  const handleConfigChange = async (key, newValue) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/admin/config/${key}`, 
        { value: newValue },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      toast.success("Configuration saved.");
      setConfigs(prev => prev.map(c => c.key === key ? { ...c, value: newValue } : c));
    } catch (err) {
      toast.error("Failed to save config.");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-sm font-semibold text-slate-400">Loading system config...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Configuration & Registry</h2>
        <p className="text-xs text-slate-500 mt-0.5">Manage integrated companies and toggle global platform settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Companies */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2.5">
            <HiOutlineOfficeBuilding size={22} className="text-brand-600" />
            <h3 className="text-base font-black text-slate-900 m-0">Company Registry</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-5 py-3">Company Name</th>
                  <th className="px-5 py-3">Provider ID</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {companies.map(comp => (
                  <tr key={comp._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{comp.name}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{comp.providerId}</td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-700">{comp.priority}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        comp.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {comp.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button 
                        onClick={() => toggleCompanyStatus(comp._id, comp.status)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer transition-colors border-0 ${
                          comp.status === 'active' 
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700' 
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {comp.status === 'active' ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Global Config */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2.5">
            <HiOutlineCog size={22} className="text-purple-600" />
            <h3 className="text-base font-black text-slate-900 m-0">Feature Flags</h3>
          </div>
          
          <div className="p-5 space-y-3.5">
            {configs.map(conf => (
              <div key={conf.key} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 truncate">
                    <HiOutlineKey className="text-slate-400 shrink-0" /> 
                    <span className="truncate">{conf.key}</span>
                  </div>
                  {conf.value === 'true' || conf.value === 'false' ? (
                    <select 
                      value={conf.value} 
                      onChange={(e) => handleConfigChange(conf.key, e.target.value)}
                      className="px-2.5 py-1 text-xs font-bold bg-white border border-slate-200 rounded-lg outline-none cursor-pointer"
                    >
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      value={conf.value} 
                      onChange={(e) => setConfigs(prev => prev.map(c => c.key === conf.key ? { ...c, value: e.target.value } : c))}
                      onBlur={(e) => handleConfigChange(conf.key, e.target.value)}
                      className="px-2.5 py-1 text-xs font-bold bg-white border border-slate-200 rounded-lg w-20 text-center outline-none"
                    />
                  )}
                </div>
                <div className="flex items-start gap-1.5 text-xs text-slate-500">
                  <HiOutlineDocumentText className="mt-0.5 shrink-0 text-slate-400" />
                  <p className="m-0 leading-relaxed">{conf.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfigView;
