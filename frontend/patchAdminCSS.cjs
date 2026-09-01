const fs = require('fs');
const path = 'D:/MERN Project/job-portal/frontend/src/Styles/AdminDashboard.css';
let content = fs.readFileSync(path, 'utf8');

const tableCSS = `
/* Admin Views Specific Styles */
.admin-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}
.admin-stat-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.stat-icon {
  font-size: 2.5rem;
  color: #3b82f6;
  background: #eff6ff;
  padding: 10px;
  border-radius: 10px;
}
.stat-icon.match { color: #10b981; background: #dcfce7; }
.stat-icon.external { color: #8b5cf6; background: #ede9fe; }
.stat-icon.internal { color: #f59e0b; background: #fef3c7; }

.stat-info h3 {
  margin: 0;
  font-size: 1.5rem;
  color: #111827;
}
.stat-info p {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.admin-filters-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
  background: white;
  padding: 15px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}
.admin-search-box {
  display: flex;
  align-items: center;
  flex: 1;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0 10px;
}
.admin-search-box input {
  border: none;
  background: transparent;
  padding: 10px;
  width: 100%;
  outline: none;
}
.admin-filter-dropdowns {
  display: flex;
  gap: 10px;
}
.admin-select {
  width: 200px;
}

.admin-table-container {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  margin-bottom: 20px;
}
.admin-table {
  width: 100%;
  border-collapse: collapse;
}
.admin-table th, .admin-table td {
  padding: 15px 20px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}
.admin-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 0.05em;
}
.admin-table tr:hover {
  background: #f9fafb;
}
.badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
}
.badge.active { background: #dcfce7; color: #166534; }
.badge.inactive { background: #fee2e2; color: #991b1b; }
.badge.external { background: #ede9fe; color: #5b21b6; }
.badge.internal { background: #fef3c7; color: #92400e; }

.actions-cell {
  display: flex;
  gap: 10px;
}
.action-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 5px;
  border-radius: 6px;
  transition: all 0.2s;
}
.action-btn.toggle-btn { color: #f59e0b; }
.action-btn.toggle-btn:hover { background: #fef3c7; }
.action-btn.delete-btn { color: #ef4444; }
.action-btn.delete-btn:hover { background: #fee2e2; }
.action-btn.expand-btn { color: #6b7280; }
.action-btn.expand-btn:hover { background: #f3f4f6; }

.expanded-details-row {
  background: #f9fafb;
}
.expanded-details-row:hover {
  background: #f9fafb;
}
.expanded-details {
  padding: 15px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-top: -10px;
  margin-bottom: 10px;
}
.expanded-details p {
  margin: 5px 0;
  font-size: 0.95rem;
}

.admin-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
}
.admin-pagination button {
  padding: 8px 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}
.admin-pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.admin-loader, .admin-empty {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}
`;

if (!content.includes('admin-stats-grid')) {
  content += tableCSS;
  fs.writeFileSync(path, content);
  console.log('Added table styles to AdminDashboard.css');
}
