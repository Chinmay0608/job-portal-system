const fs = require('fs');
const path = 'D:/MERN Project/job-portal/frontend/src/pages/recruiter/RecruiterDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('import CustomSelect from')) {
  content = content.replace(
    /import \{ createJob \} from "\.\.\/\.\.\/Services\/jobService";/,
    `import { createJob } from "../../Services/jobService";\nimport CustomSelect from "../../Components/CustomSelect";`
  );
}

const roleOptions = `{[{ value: "Full-time", label: "Full-time" }, { value: "Part-time", label: "Part-time" }, { value: "Contract", label: "Contract" }]}`;

const regexSelectWrapper = /<div className="custom-dropdown-container">\s*<select name="role" value=\{formData\.role\} onChange=\{handleChange\} className="form-select-native">[\s\S]*?<\/select>\s*<HiChevronDown className="select-dropdown-arrow" \/>\s*<\/div>/;

content = content.replace(regexSelectWrapper, `<div style={{ flex: 1 }}>
                    <CustomSelect
                      name="role"
                      options=${roleOptions}
                      value={formData.role}
                      onChange={handleChange}
                    />
                  </div>`);

fs.writeFileSync(path, content);
console.log('Patched RecruiterDashboard.jsx');
