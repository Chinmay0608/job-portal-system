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
        const hasUseStateCall = content.includes('useState(');
        const hasImport = content.includes('useState') && (content.includes('import {') || content.includes('import React'));
        
        // A simpler check: if it uses useState but doesn't have the word 'useState' in an import statement
        const importMatch = content.match(/import\s+[^;]*useState[^;]*from\s+['"]react['"]/);
        const importMatch2 = content.match(/import\s+.*useState.*from\s+['"]react['"]/);
        
        if (hasUseStateCall) {
          // let's just do a manual check if we can't find an import line with useState
          const lines = content.split('\n');
          let imported = false;
          for(let line of lines) {
             if (line.includes('import ') && line.includes('useState')) {
                imported = true;
                break;
             }
          }
          if (!imported) {
             console.log('MISSING IMPORT IN: ' + file);
          }
        }
      }
    }
  });
}

walk('D:/MERN Project/job-portal/frontend/src');
