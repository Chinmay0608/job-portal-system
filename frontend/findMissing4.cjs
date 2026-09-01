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
          // Check for 'useState' inside an import from 'react'
          const lines = content.split('\\n');
          let hasUseStateImport = false;
          for (let line of lines) {
             if (line.includes('import') && line.includes('useState') && line.includes('react')) {
                 hasUseStateImport = true;
             }
          }
          if (!hasUseStateImport) {
              console.log('MISSING useState IMPORT IN: ' + file);
          }
        }
      }
    }
  });
}
walk('D:/MERN Project/job-portal/frontend/src');
