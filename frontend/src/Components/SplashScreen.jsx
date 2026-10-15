import SkillBridgeLogo from "./SkillBridgeLogo";

function SplashScreen() {
  return (
    <div className="splash-screen" role="status" aria-label="Loading SkillBridge">
      <div className="splash-content">
        <SkillBridgeLogo width={196} className="splash-logo" />
        <p className="splash-tagline">Find work that works for you.</p>
        <p className="splash-industries">Care <i /> Retail <i /> Education <i /> Hospitality <i /> Technology</p>
        <span className="splash-loader" aria-hidden="true"><span /></span>
      </div>
    </div>
  );
}

export default SplashScreen;
