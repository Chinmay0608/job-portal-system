const fs = require('fs');
const path = 'D:/MERN Project/job-portal/frontend/src/pages/candidate/CandidateDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('import CustomSelect from')) {
  content = content.replace(
    /import \{ useLocation, useNavigate \} from "react-router-dom";/,
    `import { useLocation, useNavigate } from "react-router-dom";\nimport CustomSelect from "../../Components/CustomSelect";`
  );
}

// Experience options
const experienceOptionsStr = `{[{ value: "", label: "All Experience" }, { value: "Fresher", label: "Fresher" }, { value: "0-2 Years", label: "0-2 Years" }, { value: "2-5 Years", label: "2-5 Years" }, { value: "5+ Years", label: "5+ Years" }]}`;

// Source options
const sourceOptionsStr = `{[{ value: "", label: "All Sources" }, { value: "internal", label: "SkillBridge (Internal)" }, { value: "external", label: "Third-party (External)" }]}`;


content = content.replace(
  /<select\s+value=\{experienceFilter\}\s+onChange=\{\(e\) => setExperienceFilter\(e\.target\.value\)\}\s+className="desktop-experience-select ind-select"\s*>\s*<option value="">All Experience<\/option>\s*<option value="Fresher">Fresher<\/option>\s*<option value="0-2 Years">0-2 Years<\/option>\s*<option value="2-5 Years">2-5 Years<\/option>\s*<option value="5\+ Years">5\+ Years<\/option>\s*<\/select>/g,
  `<CustomSelect
    options=${experienceOptionsStr}
    value={experienceFilter}
    onChange={(e) => setExperienceFilter(e.target.value)}
    className="desktop-experience-select ind-select"
  />`
);

content = content.replace(
  /<select\s+value=\{sourceFilter\}\s+onChange=\{\(e\) => setSourceFilter\(e\.target\.value\)\}\s+className="desktop-experience-select ind-select"\s*>\s*<option value="">All Sources<\/option>\s*<option value="internal">SkillBridge \(Internal\)<\/option>\s*<option value="external">Third-party \(External\)<\/option>\s*<\/select>/g,
  `<CustomSelect
    options=${sourceOptionsStr}
    value={sourceFilter}
    onChange={(e) => setSourceFilter(e.target.value)}
    className="desktop-experience-select ind-select"
  />`
);

content = content.replace(
  /<select\s+value=\{experienceFilter\}\s+onChange=\{\(e\) => setExperienceFilter\(e\.target\.value\)\}\s+className="ind-select sheet-select"\s*>\s*<option value="">All Experience<\/option>\s*<option value="Fresher">Fresher<\/option>\s*<option value="0-2 Years">0-2 Years<\/option>\s*<option value="2-5 Years">2-5 Years<\/option>\s*<option value="5\+ Years">5\+ Years<\/option>\s*<\/select>/g,
  `<CustomSelect
    options=${experienceOptionsStr}
    value={experienceFilter}
    onChange={(e) => setExperienceFilter(e.target.value)}
    className="ind-select sheet-select"
  />`
);

content = content.replace(
  /<select\s+value=\{sourceFilter\}\s+onChange=\{\(e\) => setSourceFilter\(e\.target\.value\)\}\s+className="ind-select sheet-select"\s*>\s*<option value="">All Sources<\/option>\s*<option value="internal">SkillBridge \(Internal\)<\/option>\s*<option value="external">Third-party \(External\)<\/option>\s*<\/select>/g,
  `<CustomSelect
    options=${sourceOptionsStr}
    value={sourceFilter}
    onChange={(e) => setSourceFilter(e.target.value)}
    className="ind-select sheet-select"
  />`
);

fs.writeFileSync(path, content);
console.log('Patched CandidateDashboard.jsx');
