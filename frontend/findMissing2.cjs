const fs = require('fs');
const path = require('path');

function walk(dir) {
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      walk(file);
    } else {
      if (file.endsWith('.jsx') || file.endsWith('.js')) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('useState(')) {
          // Check if there is an import statement that actually imports useState
          const regex = /import.*useState.*from\s+['"]react['"]/;
          const regex2 = /import\s+React\s*,\s*\{\s*useState.*\}\s+from\s+['"]react['"]/;
          const regex3 = /import\s+\{\s*.*useState.*\s*\}\s+from\s+['"]react['"]/;
          
          if (!regex.test(content) && !regex2.test(content) && !regex3.test(content)) {
            console.log('MISSING useState IMPORT IN: ' + file);
          }
        }
      }
    }
  });
}
walk('D:/MERN Project/job-portal/frontend/src');
