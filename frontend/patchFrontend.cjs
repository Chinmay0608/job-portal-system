const fs = require('fs');
let c = fs.readFileSync('D:/MERN Project/job-portal/frontend/src/pages/recruiter/RecruiterDashboard.jsx', 'utf8');

c = c.replace(
  'const [submitting, setSubmitting] = useState(false);', 
  'const [submitting, setSubmitting] = useState(false);\n  const [isGeneratingAI, setIsGeneratingAI] = useState(false);'
);

const aiFunc = `
  const generateAIDescription = async () => {
    if (!formData.title || !formData.company) {
      toast.error('Please enter a Job Title and Company first!');
      return;
    }
    setIsGeneratingAI(true);
    try {
      const response = await axios.post(
        \`\${API_BASE_URL}/api/jobs/generate-description\`,
        { title: formData.title, company: formData.company, role: formData.role },
        getAuthHeaders()
      );
      setFormData(prev => ({ ...prev, description: response.data.description }));
      toast.success('AI Description Generated successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate description with AI.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = async (e) => {`;

c = c.replace('  const handleSubmit = async (e) => {', aiFunc);

const aiTextarea = `<div className="input-field-box textarea-field-box" style={{position: 'relative'}}>
                  <span className="field-prefix-icon prefix-textarea-icon"><HiOutlineDocumentText /></span>
                  <div className="input-stack" style={{width: '100%'}}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>Job Description</label>
                      <button 
                        type="button" 
                        onClick={generateAIDescription}
                        disabled={isGeneratingAI}
                        style={{
                          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                          color: 'white',
                          border: 'none',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          opacity: isGeneratingAI ? 0.7 : 1,
                          boxShadow: '0 2px 4px rgba(99, 102, 241, 0.2)'
                        }}
                      >
                        {isGeneratingAI ? "✨ Generating..." : "✨ Enhance with AI"}
                      </button>
                    </div>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows={6} placeholder="Write job description or use AI..." required />
                  </div>
                </div>`;

// We'll replace the block.
const textareaRegex = /<div className="input-field-box textarea-field-box">[\s\S]*?<\/textarea>\s*<\/div>\s*<\/div>/;
c = c.replace(textareaRegex, aiTextarea);

fs.writeFileSync('D:/MERN Project/job-portal/frontend/src/pages/recruiter/RecruiterDashboard.jsx', c);
