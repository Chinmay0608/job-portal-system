import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { HiOutlineCog, HiOutlineOfficeBuilding, HiOutlineKey, HiOutlineDocumentText } from "react-icons/hi";
import "../../Styles/pages/admin/AdminDashboard.css";

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
        axios.get(\`\${import.meta.env.VITE_API_BASE_URL}/api/admin/companies\`, { headers: { Authorization: \`Bearer \${token}\` }}),
        axios.get(\`\${import.meta.env.VITE_API_BASE_URL}/api/admin/config\`, { headers: { Authorization: \`Bearer \${token}\` }})
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
      await axios.put(\`\${import.meta.env.VITE_API_BASE_URL}/api/admin/companies/\${id}\`, 
        { status: newStatus },
        { headers: { Authorization: \`Bearer \${token}\` }}
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
      await axios.put(\`\${import.meta.env.VITE_API_BASE_URL}/api/admin/config/\${key}\`, 
        { value: newValue },
        { headers: { Authorization: \`Bearer \${token}\` }}
      );
      toast.success("Configuration saved.");
      setConfigs(prev => prev.map(c => c.key === key ? { ...c, value: newValue } : c));
    } catch (err) {
      toast.error("Failed to save config.");
    }
  };

  if (loading) {
    return <div className="admin-tab-content"><div className="admin-loader">Loading system config...</div></div>;
  }

  return (
    <div className="admin-tab-content">
      <div className="admin-header-area" style={{ marginBottom: '30px' }}>
        <h2>Configuration & Registry</h2>
        <p>Manage integrated companies and toggle global platform settings.</p>
      </div>

      <div className="admin-config-layout" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        
        {/* Left Column: Companies */}
        <div className="admin-companies-section">
          <div className="admin-table-container" style={{ marginBottom: 0 }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <HiOutlineOfficeBuilding size={24} color="#3b82f6" />
              <h3 style={{ margin: 0 }}>Company Registry</h3>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Company Name</th>
                  <th>Provider ID</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map(comp => (
                  <tr key={comp._id}>
                    <td className="fw-600">{comp.name}</td>
                    <td style={{ color: '#6b7280', fontSize: '0.9rem' }}>{comp.providerId}</td>
                    <td>{comp.priority}</td>
                    <td>
                      <span className={\`badge \${comp.status === 'active' ? 'active' : 'inactive'}\`}>
                        {comp.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => toggleCompanyStatus(comp._id, comp.status)}
                        style={{
                          background: comp.status === 'active' ? '#fee2e2' : '#dcfce7',
                          color: comp.status === 'active' ? '#991b1b' : '#166534',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '0.85rem'
                        }}
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
        <div className="admin-settings-section">
          <div className="admin-table-container">
            <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <HiOutlineCog size={24} color="#8b5cf6" />
              <h3 style={{ margin: 0 }}>Feature Flags</h3>
            </div>
            
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {configs.map(conf => (
                <div key={conf.key} style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                      <HiOutlineKey color="#6b7280" /> {conf.key}
                    </div>
                    {conf.value === 'true' || conf.value === 'false' ? (
                      <select 
                        value={conf.value} 
                        onChange={(e) => handleConfigChange(conf.key, e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
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
                        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #d1d5db', width: '80px', textAlign: 'center' }}
                      />
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.85rem', color: '#6b7280' }}>
                    <HiOutlineDocumentText style={{ marginTop: '2px', flexShrink: 0 }} />
                    <p style={{ margin: 0 }}>{conf.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfigView;
