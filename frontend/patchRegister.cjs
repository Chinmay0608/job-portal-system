const fs = require('fs');
const path = 'D:/MERN Project/job-portal/frontend/src/pages/auth/Register.jsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('import CustomSelect from')) {
  content = content.replace(
    /import \{ useNavigate, Link \} from "react-router-dom";/,
    `import { useNavigate, Link } from "react-router-dom";\nimport CustomSelect from "../../Components/CustomSelect";`
  );
}

const roleOptions = `{[{ value: "candidate", label: "Candidate" }, { value: "recruiter", label: "Recruiter" }]}`;

const regexRole = /<select\s+name="role"\s+className="register-select"\s+value=\{formData\.role\}\s+onChange=\{handleChange\}\s*>[\s\S]*?<\/select>/;

content = content.replace(regexRole, `<CustomSelect
                  name="role"
                  className="register-select"
                  value={formData.role}
                  onChange={handleChange}
                  options=${roleOptions}
                />`);

fs.writeFileSync(path, content);
console.log('Patched Register.jsx');
