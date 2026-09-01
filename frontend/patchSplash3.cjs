const fs = require('fs');
const path = 'D:/MERN Project/job-portal/frontend/src/App.jsx';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `  // Splash should only ever appear on the very first visit.
  // Check localStorage synchronously on first render so the splash
  // never flashes on subsequent visits/refreshes.
  const hasSeenSplash = localStorage.getItem("sb_has_seen_splash") === "true";

  const [showSplash, setShowSplash] = useState(!hasSeenSplash);
  const [isSplashExiting, setIsSplashExiting] = useState(false);

  useEffect(() => {
    if (hasSeenSplash) return; // already shown before, skip entirely

    // Hold the splash on screen, then trigger the fade-out animation
    const exitTimer = setTimeout(() => setIsSplashExiting(true), 1400);

    // Fully remove the splash from the DOM once the fade-out animation finishes,
    // and record that it has now been seen so it never shows again.
    const removeTimer = setTimeout(() => {
      setShowSplash(false);
      localStorage.setItem("sb_has_seen_splash", "true");
    }, 1900);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [hasSeenSplash]);`;

const newStr = `  // Splash screen will now appear on every full page refresh
  const [showSplash, setShowSplash] = useState(true);
  const [isSplashExiting, setIsSplashExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => setIsSplashExiting(true), 1400);
    const removeTimer = setTimeout(() => setShowSplash(false), 1900);
    return () => { clearTimeout(exitTimer); clearTimeout(removeTimer); };
  }, []);`;

content = content.replace(targetStr, newStr);

// To be safe if line endings differ:
if (content.includes('sb_has_seen_splash')) {
  content = content.replace(/const hasSeenSplash = localStorage\.getItem\("sb_has_seen_splash"\) === "true";/, '');
  content = content.replace(/const \[showSplash, setShowSplash\] = useState\(!hasSeenSplash\);/, 'const [showSplash, setShowSplash] = useState(true);');
  content = content.replace(/if \(hasSeenSplash\) return; \/\/ already shown before, skip entirely/, '');
  content = content.replace(/localStorage\.setItem\("sb_has_seen_splash", "true"\);/, '');
  content = content.replace(/\[hasSeenSplash\]/, '[]');
}

fs.writeFileSync(path, content);
console.log('Patched App.jsx properly');
