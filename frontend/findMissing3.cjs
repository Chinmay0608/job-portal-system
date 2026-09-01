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
        if (content.includes('useState') && !content.includes('import ') && !content.includes('require(')) {
          console.log('SUSPICIOUS FILE: ' + file);
        }
      }
    }
  });
}
walk('D:/MERN Project/job-portal/frontend/src');
