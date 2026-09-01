import LegalLayout from "../../Components/LegalLayout";

function CookiePolicy() {
  return (
    <LegalLayout title="Cookie Policy">
      <p className="effective-date">Effective Date: June 15, 2026</p>
      
      <p>
        SkillBridge uses cookies and similar tracking technologies to help analyze traffic, 
        maximize application performance, and provide an optimized, highly personalized 
        experience for candidates and corporate recruiters alike.
      </p>

      <h2>1. What Are Cookies?</h2>
      <p>
        Cookies are small text documents dropped dynamically onto your local workstation storage 
        by your browser utility wrapper as you navigate across web pages. They serve as reliable local 
        state memory logs for application sessions.
      </p>

      <h2>2. How We Utilize Cookies</h2>
      <p>We deploy tracking technologies across several distinct performance vectors:</p>
      <ul>
        <li><strong>Essential Session Cookies:</strong> Crucial elements handling secure authorization states and account validation checkpoints.</li>
        <li><strong>Preference Configuration Logs:</strong> Remembers your explicit layout modes, dashboard sorting options, and local workspace filter criteria.</li>
        <li><strong>Performance Metrics:</strong> Aggregates operational telemetry to help our team optimize system loading times and background data pipelines.</li>
      </ul>

      <h2>3. Managing Cookie Parameters</h2>
      <p>
        You have complete authority over local data trackers. Most modern browsers allow you to block, 
        restrict, or wipe cookie registries entirely through their internal settings panel. However, 
        disabling essential session cookies may cause specific interactive dashboard modules to stop working.
      </p>
    </LegalLayout>
  );
}

export default CookiePolicy;