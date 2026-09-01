const fs = require('fs');
const path = 'D:/MERN Project/job-portal/frontend/src/App.jsx';
let content = fs.readFileSync(path, 'utf8');

// Replace the localStorage logic in App.jsx
const targetLogic = `  // Splash should only ever appear on the very first visit.
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

const newLogic = `  // Splash screen will now appear on every full page refresh
  const [showSplash, setShowSplash] = useState(true);
  const [isSplashExiting, setIsSplashExiting] = useState(false);

  useEffect(() => {
    // Hold the splash on screen, then trigger the fade-out animation
    const exitTimer = setTimeout(() => setIsSplashExiting(true), 1400);

    // Fully remove the splash from the DOM once the fade-out animation finishes
    const removeTimer = setTimeout(() => {
      setShowSplash(false);
    }, 1900);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, []);`;

content = content.replace(targetLogic, newLogic);
fs.writeFileSync(path, content);
console.log('Patched App.jsx to show splash on every refresh');
