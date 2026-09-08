/**
 * SkillBridge Modern SaaS Wordmark Logo
 * Premium geometric wordmark designed for high visual confidence and authority.
 * Features unified typography ("Skill" in Deep Navy #0F172A / White #FFFFFF on dark theme,
 * "Bridge" in Primary Royal Blue #2563EB) with an architectural bridge accent.
 */
const SkillBridgeLogo = ({ width = 165, height, className = "", variant = "light", isDark = false, textColor, center = false }) => {
  const skillFill = (variant === "dark" || isDark || textColor === "white" || textColor === "#FFFFFF") ? "#FFFFFF" : "#0F172A";

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 240 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="SkillBridge"
      role="img"
      style={{ display: "block", maxWidth: "100%", height: "auto", margin: center ? "0 auto" : undefined }}
    >
      <defs>
        <linearGradient id="bridgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>

      {/* Wordmark Typography */}
      <text
        x={center ? "120" : "0"}
        y="32"
        textAnchor={center ? "middle" : "start"}
        fontFamily="system-ui, -apple-system, 'Plus Jakarta Sans', 'Inter', 'Segoe UI', Roboto, sans-serif"
        fontSize="32"
        fontWeight="900"
        letterSpacing="-1.4px"
      >
        <tspan className="logo-skill-text" fill={skillFill}>Skill</tspan>
        <tspan className="logo-bridge-text" fill="url(#bridgeGradient)">Bridge</tspan>
      </text>

      {/* Integrated Architectural Bridge Curve joining Skill & Bridge at baseline */}
      <path
        d={center ? "M 88 37 Q 104 43 120 37" : "M 42 37 Q 58 43 74 37"}
        stroke="url(#bridgeGradient)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx={center ? "104" : "58"} cy="38.5" r="2.2" fill="#3B82F6" className="logo-bridge-dot" />
    </svg>
  );
};

export default SkillBridgeLogo;
