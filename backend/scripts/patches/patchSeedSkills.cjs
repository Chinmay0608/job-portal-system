const fs = require('fs');

const path = 'D:/MERN Project/job-portal/backend/scripts/seedSkills.js';
let content = fs.readFileSync(path, 'utf8');

const newSkills = [
  // Original 25
  'Java', 'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'C++', 'C#', 
  'AWS', 'Docker', 'Kubernetes', 'SQL', 'MongoDB', 'Express', 'Angular', 'Vue.js', 
  'PHP', 'Ruby on Rails', 'Go', 'Rust', 'Swift', 'Kotlin', 'HTML', 'CSS', 'Tailwind',
  
  // Frontend & UI
  'Next.js', 'Svelte', 'Redux', 'GraphQL', 'Webpack', 'Babel', 'SCSS', 'LESS', 
  'Bootstrap', 'Material UI', 'Chakra UI', 'Three.js', 'WebGL', 'Figma', 
  'Adobe XD', 'UI/UX Design', 'Wireframing', 'Prototyping',
  
  // Backend & APIs
  'Spring Boot', 'Django', 'Flask', 'FastAPI', 'Laravel', 'ASP.NET', 'NestJS', 
  'Apollo', 'gRPC', 'REST APIs', 'Microservices', 'GraphQL APIs',
  
  // Database & Storage
  'PostgreSQL', 'MySQL', 'SQLite', 'Oracle', 'Redis', 'Cassandra', 'DynamoDB', 
  'Neo4j', 'Elasticsearch', 'Firebase', 'Supabase', 'MariaDB', 'Prisma', 'Mongoose',
  
  // DevOps, Cloud & CI/CD
  'Azure', 'Google Cloud Platform (GCP)', 'Terraform', 'Ansible', 'Chef', 'Puppet', 
  'Jenkins', 'GitHub Actions', 'GitLab CI', 'CircleCI', 'Vercel', 'Heroku', 
  'Nginx', 'Apache', 'Linux', 'Bash', 'Shell Scripting', 'PowerShell',
  
  // Mobile
  'React Native', 'Flutter', 'Dart', 'Objective-C', 'Android SDK', 'iOS SDK', 'Expo',
  
  // Data Science, AI & Machine Learning
  'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow', 'PyTorch', 'Keras', 'Hadoop', 
  'Spark', 'Kafka', 'Airflow', 'Tableau', 'Power BI', 'Deep Learning', 
  'Natural Language Processing', 'Computer Vision', 'Data Engineering', 'MATLAB', 'R',
  
  // Tools & Methodologies
  'Git', 'JIRA', 'Confluence', 'Agile', 'Scrum', 'Kanban', 'TDD', 'BDD', 'CI/CD',
  
  // Cybersecurity
  'Penetration Testing', 'Ethical Hacking', 'Cryptography', 'Network Security', 
  'OWASP', 'SOC 2', 'Identity and Access Management (IAM)',
  
  // Other Languages & Paradigms
  'Scala', 'Perl', 'Haskell', 'Lua', 'Solidity', 'Web3', 'Smart Contracts', 
  'Blockchain', 'Game Development', 'Unity', 'Unreal Engine', 'AR/VR',
  
  // Soft Skills / General
  'Project Management', 'Team Leadership', 'Problem Solving', 'Communication', 
  'Time Management', 'Critical Thinking'
];

const newBaseSkillsBlock = 'const baseSkills = ' + JSON.stringify(newSkills, null, 4) + ';';

content = content.replace(/const baseSkills = \[[^\]]*\];/, newBaseSkillsBlock);

// Also fix the RegExp
const regexEscape = `const escapeRegex = (string) => string.replace(/[.*+?^\\$\\{\\}()|[\\]\\\\]/g, "\\\\$&");\n\nconst seedSkills`;
content = content.replace(/const seedSkills/, regexEscape);

content = content.replace(
  /name: new RegExp\(\`\^\\$\\{skill\\}\\$\`\, \"i\"\)/,
  'name: new RegExp(`^${escapeRegex(skill)}$`, "i")'
);

fs.writeFileSync(path, content);
console.log('Fixed seedSkills.js');
