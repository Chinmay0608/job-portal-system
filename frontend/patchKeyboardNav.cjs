const fs = require('fs');

const path = 'D:/MERN Project/job-portal/frontend/src/pages/candidate/candidateProfile.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add activeSuggestionIndex state
if (!content.includes('activeSuggestionIndex')) {
  content = content.replace(
    /const \[skillError, setSkillError\] = useState\(""\);/g,
    'const [skillError, setSkillError] = useState("");\n  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);'
  );
}

// 2. Reset activeSuggestionIndex in fetchSkillSuggestions or handleSkillInputChange
if (!content.includes('setActiveSuggestionIndex(-1)')) {
  content = content.replace(
    /const handleSkillInputChange = \(value\) => \{/g,
    'const handleSkillInputChange = (value) => {\n    setActiveSuggestionIndex(-1);'
  );
}

// 3. Update onKeyDown
const oldOnKeyDown = `onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSkill(skillInput);
                      }
                    }}`;
const newOnKeyDown = `onKeyDown={(e) => {
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
                    }}`;
content = content.replace(oldOnKeyDown, newOnKeyDown);

// 4. Update the map function and the button styles
const oldMapStart = `{suggestions.map((suggestion) => (
                        <button
                          type="button"
                          key={suggestion}
                          className="skill-suggestion-item"
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "10px 12px",
                            border: "none",
                            backgroundColor: "transparent",
                            cursor: "pointer",
                            display: "block",
                            fontSize: "14px",
                            transition: "background-color 0.2s"
                          }}
                          onMouseEnter={(e) => (e.target.style.backgroundColor = "#f0f0f0")}
                          onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
                          onClick={() => handleAddSkill(suggestion)}
                        >
                          {suggestion}
                        </button>
                      ))}`;

const newMapStart = `{suggestions.map((suggestion, index) => (
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
                      ))}`;

content = content.replace(oldMapStart, newMapStart);

fs.writeFileSync(path, content);
console.log('Successfully patched keyboard navigation for skills dropdown!');
