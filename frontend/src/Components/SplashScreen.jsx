import SkillBridgeLogo from "./SkillBridgeLogo";

function SplashScreen({ isExiting }) {
  return (
    <div className={`splash-screen ${isExiting ? "splash-exit" : ""}`}>
      <div className="splash-content">
        <div className="splash-logo-wrapper mb-2">
          <SkillBridgeLogo width={220} isDark={true} center={true} />
        </div>
        <p className="splash-tagline">Where tech talent and opportunities connect</p>
        <div className="splash-loader">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
}

export default SplashScreen;