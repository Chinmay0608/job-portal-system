const fs = require('fs');
const path = 'D:/MERN Project/job-portal/frontend/src/pages/candidate/CandidateDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

const regexExpDesktop = /<select\s+value=\{experienceFilter\}\s+onChange=\{\(e\) => setExperienceFilter\(e\.target\.value\)\}\s+className="desktop-experience-select ind-select"\s*>[\s\S]*?<\/select>/;

const regexSrcDesktop = /<select\s+value=\{sourceFilter\}\s+onChange=\{\(e\) => setSourceFilter\(e\.target\.value\)\}\s+className="desktop-experience-select ind-select"\s*>[\s\S]*?<\/select>/;

const regexExpMobile = /<select\s+value=\{experienceFilter\}\s+onChange=\{\(e\) => setExperienceFilter\(e\.target\.value\)\}\s+className="ind-select sheet-select"\s*>[\s\S]*?<\/select>/;

const regexSrcMobile = /<select\s+value=\{sourceFilter\}\s+onChange=\{\(e\) => setSourceFilter\(e\.target\.value\)\}\s+className="ind-select sheet-select"\s*>[\s\S]*?<\/select>/;

const experienceOptionsStr = `{[{ value: "", label: "All Experience" }, { value: "Fresher", label: "Fresher" }, { value: "0-2 Years", label: "0-2 Years" }, { value: "2-5 Years", label: "2-5 Years" }, { value: "5+ Years", label: "5+ Years" }]}`;

const sourceOptionsStr = `{[{ value: "", label: "All Sources" }, { value: "internal", label: "SkillBridge (Internal)" }, { value: "external", label: "Third-party (External)" }]}`;

content = content.replace(regexExpDesktop, `<CustomSelect
                  options=${experienceOptionsStr}
                  value={experienceFilter}
                  onChange={(e) => setExperienceFilter(e.target.value)}
                  className="desktop-experience-select ind-select"
                />`);

content = content.replace(regexSrcDesktop, `<CustomSelect
                  options=${sourceOptionsStr}
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="desktop-experience-select ind-select"
                />`);

content = content.replace(regexExpMobile, `<CustomSelect
                      options=${experienceOptionsStr}
                      value={experienceFilter}
                      onChange={(e) => setExperienceFilter(e.target.value)}
                      className="ind-select sheet-select"
                    />`);

content = content.replace(regexSrcMobile, `<CustomSelect
                      options=${sourceOptionsStr}
                      value={sourceFilter}
                      onChange={(e) => setSourceFilter(e.target.value)}
                      className="ind-select sheet-select"
                    />`);

fs.writeFileSync(path, content);
console.log('Patched CandidateDashboard.jsx with improved regex');
