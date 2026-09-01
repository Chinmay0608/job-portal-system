const fs = require('fs');
const path = 'D:/MERN Project/job-portal/frontend/src/App.jsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /\/\/ Splash should only ever appear[\s\S]*?\}, \[hasSeenSplash\]\);/g;

const newLogic = `// Splash screen will now appear on every full page refresh
  const [showSplash, setShowSplash] = useState(true);
  const [isSplashExiting, setIsSplashExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => setIsSplashExiting(true), 1400);
    const removeTimer = setTimeout(() => setShowSplash(false), 1900);
    return () => { clearTimeout(exitTimer); clearTimeout(removeTimer); };
  }, []);`;

content = content.replace(regex, newLogic);
fs.writeFileSync(path, content);
console.log('Patched App.jsx successfully');
