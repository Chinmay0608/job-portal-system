import "../Styles/components/SplashScreen.css";

function SplashScreen({ isExiting }) {
  return (
    <div className={`splash-screen ${isExiting ? "splash-exit" : ""}`}>
      <div className="splash-content">
        <h1 className="splash-logo">
          <span className="splash-skill">Skill</span>
          <span className="splash-bridge">Bridge</span>
        </h1>
        <p className="splash-tagline">Find your next opportunity</p>
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