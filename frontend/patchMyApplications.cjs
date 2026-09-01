const fs = require('fs');
const path = 'D:/MERN Project/job-portal/frontend/src/pages/candidate/MyApplications.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add updateApplicationStatus to imports
content = content.replace(
  /import \{ getMyApplicationsAPI, withdrawApplication \} from "\.\.\/\.\.\/Services\/userService";/,
  'import { getMyApplicationsAPI, withdrawApplication, updateApplicationStatus } from "../../Services/userService";'
);

// 2. Add updatingId state
content = content.replace(
  /const \[deletingId, setDeletingId\] = useState\(null\);/,
  'const [deletingId, setDeletingId] = useState(null);\n  const [updatingId, setUpdatingId] = useState(null);'
);

// 3. Add handleStatusChange function
const handleStatusChangeFunc = `
  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      setUpdatingId(applicationId);
      await updateApplicationStatus(applicationId, newStatus);
      toast.success("Status updated successfully!");
      fetchApplications();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };
`;
content = content.replace(
  /const handleWithdraw = async \(applicationId, jobTitle\) => \{/,
  handleStatusChangeFunc + '\n  const handleWithdraw = async (applicationId, jobTitle) => {'
);

// 4. Update the status badge to a select dropdown
const oldStatusBadge = /<span className=\{\`status-badge \$\{application\.status\?\.toLowerCase\(\)\}\`\}>\s*\{application\.status\}\s*<\/span>/g;
const newStatusBadge = `<select 
                      className={\`status-badge \$\{application.status?.toLowerCase()\}\`}
                      value={application.status?.toLowerCase() || "pending"}
                      onChange={(e) => handleStatusChange(application._id, e.target.value)}
                      style={{ cursor: 'pointer', border: '1px solid #e5e7eb', outline: 'none', appearance: 'auto', paddingRight: '20px' }}
                      disabled={updatingId === application._id}
                    >
                      <option value="pending">Pending</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="selected">Selected</option>
                      <option value="rejected">Rejected</option>
                    </select>`;
content = content.replace(oldStatusBadge, newStatusBadge);

// 5. Add "Selected" to tabs
content = content.replace(
  /\{\["All", "Pending", "Shortlisted", "Rejected"\]\.map\(tab => \(/,
  '{["All", "Pending", "Shortlisted", "Selected", "Rejected"].map(tab => ('
);

fs.writeFileSync(path, content);
console.log('Patched MyApplications.jsx');
