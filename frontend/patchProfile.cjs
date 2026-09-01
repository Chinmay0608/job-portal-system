const fs = require('fs');
const path = 'D:/MERN Project/job-portal/frontend/src/pages/candidate/candidateProfile.jsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('import CustomSelect from')) {
  content = content.replace(
    /import \{ getCandidateProfileAPI, updateCandidateProfileAPI \} from "\.\.\/\.\.\/Services\/userService";/,
    `import { getCandidateProfileAPI, updateCandidateProfileAPI } from "../../Services/userService";\nimport CustomSelect from "../../Components/CustomSelect";`
  );
}

const educationOptions = `{[{ value: "", label: "Select Degree" }, { value: "B.Tech", label: "B.Tech" }, { value: "M.Tech", label: "M.Tech" }, { value: "BCA", label: "BCA" }, { value: "MCA", label: "MCA" }]}`;

const expOptions = `{[{ value: "Fresher", label: "Fresher" }, { value: "0-2 Years", label: "0-2 Years" }, { value: "2-5 Years", label: "2-5 Years" }, { value: "5+ Years", label: "5+ Years" }]}`;


const regexEd = /<select\s+value=\{education\}\s+onChange=\{\(e\) => setEducation\(e\.target\.value\)\}\s*>[\s\S]*?<\/select>/;

const regexExp = /<select\s+value=\{experienceLevel\}\s+onChange=\{\(e\) => setExperienceLevel\(e\.target\.value\)\}\s*>[\s\S]*?<\/select>/;

content = content.replace(regexEd, `<CustomSelect
                  options=${educationOptions}
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                />`);

content = content.replace(regexExp, `<CustomSelect
                  options=${expOptions}
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                />`);

fs.writeFileSync(path, content);
console.log('Patched candidateProfile.jsx');
