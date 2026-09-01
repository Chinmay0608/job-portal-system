const fs = require('fs');
const path = 'D:/MERN Project/job-portal/frontend/src/pages/candidate/candidateProfile.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Ensure state exists
if (!content.includes('const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);')) {
  content = content.replace(
    /const \[skillError, setSkillError\] = useState\(""\);/,
    'const [skillError, setSkillError] = useState("");\n  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);'
  );
}

// 2. Ensure reset exists
if (!content.includes('setActiveSuggestionIndex(-1);')) {
  content = content.replace(
    /const handleSkillInputChange = \(value\) => \{/,
    'const handleSkillInputChange = (value) => {\n    setActiveSuggestionIndex(-1);'
  );
}

// 3. Update onKeyDown
content = content.replace(
  /onKeyDown=\{\(e\) => \{\s*if \(e\.key === "Enter"\) \{\s*e\.preventDefault\(\);\s*handleAddSkill\(skillInput\);\s*\}\s*\}\}/g,
  `onKeyDown={(e) => {
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        if (activeSuggestionIndex < suggestions.length - 1) {
                          setActiveSuggestionIndex((prev) => prev + 1);
                        }
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        if (activeSuggestionIndex > 0) {
                          setActiveSuggestionIndex((prev) => prev - 1);
                        }
                      } else if (e.key === "Enter") {
                        e.preventDefault();
                        if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
                          handleAddSkill(suggestions[activeSuggestionIndex]);
                        } else {
                          handleAddSkill(skillInput);
                        }
                        setActiveSuggestionIndex(-1);
                      }
                    }}`
);

// 4. Update mapping
content = content.replace(
  /\{suggestions\.map\(\(suggestion\) => \(\s*<button\s*type="button"\s*key=\{suggestion\}\s*className="skill-suggestion-item"\s*style=\{\{\s*width: "100%",\s*textAlign: "left",\s*padding: "10px 12px",\s*border: "none",\s*backgroundColor: "transparent",\s*cursor: "pointer",\s*display: "block",\s*fontSize: "14px",\s*transition: "background-color 0\.2s"\s*\}\}\s*onMouseEnter=\{\(e\) => \(e\.target\.style\.backgroundColor = "#f0f0f0"\)\}\s*onMouseLeave=\{\(e\) => \(e\.target\.style\.backgroundColor = "transparent"\)\}\s*onClick=\{\(\) => handleAddSkill\(suggestion\)\}\s*>\s*\{suggestion\}\s*<\/button>\s*\)\)\}/g,
  `{suggestions.map((suggestion, index) => (
                        <button
                          type="button"
                          key={suggestion}
                          className="skill-suggestion-item"
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "10px 12px",
                            border: "none",
                            backgroundColor: index === activeSuggestionIndex ? "#f0f0f0" : "transparent",
                            cursor: "pointer",
                            display: "block",
                            fontSize: "14px",
                            transition: "background-color 0.2s"
                          }}
                          onMouseEnter={() => setActiveSuggestionIndex(index)}
                          onMouseLeave={() => setActiveSuggestionIndex(-1)}
                          onClick={() => {
                            handleAddSkill(suggestion);
                            setActiveSuggestionIndex(-1);
                          }}
                        >
                          {suggestion}
                        </button>
                      ))}`
);

fs.writeFileSync(path, content);
console.log('Script completed');
