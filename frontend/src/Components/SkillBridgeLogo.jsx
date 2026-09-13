/**
 * SkillBridge Official Brand Logo
 * High-precision SaaS wordmark featuring an architectural geometric bridge emblem
 * alongside bold modern typography.
 */
const SkillBridgeLogo = ({
  width = 175,
  height,
  className = "",
  variant = "light",
  isDark = false,
  textColor,
  center = false,
  showIcon = true,
}) => {
  const isDarkTheme = variant === "dark" || isDark || textColor === "white" || textColor === "#FFFFFF";
  const skillColor = isDarkTheme ? "#FFFFFF" : "#0F172A";

  return (
    <svg
      width={width}
      height={height}
      viewBox={showIcon ? "0 0 240 48" : "0 0 185 48"}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="SkillBridge"
      role="img"
      style={{ display: "block", maxWidth: "100%", height: "auto", margin: center ? "0 auto" : undefined }}
    >
      <defs>
        <linearGradient id="sbIconGradLeft" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="sbIconGradRight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        <linearGradient id="sbDeckGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
        <linearGradient id="sbTextBridgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>

      {/* Brand Icon Emblem */}
      {showIcon && (
        <g transform="translate(2, 2)">
          {/* Emblem Background Squircle */}
          <rect width="44" height="44" rx="11" fill={isDarkTheme ? "#1E293B" : "#0F172A"} />
          <rect width="43" height="43" x="0.5" y="0.5" rx="10.5" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

          {/* Left Arch */}
          <path
            d="M 11 33 L 11 22 C 11 16 15 12 21 12 C 24 12 27 13.5 28.5 15.5"
            fill="none"
            stroke="url(#sbIconGradLeft)"
            strokeWidth="3.6"
            strokeLinecap="round"
          />

          {/* Right Arch */}
          <path
            d="M 33 11 L 33 22 C 33 28 29 32 23 32 C 20 32 17 30.5 15.5 28.5"
            fill="none"
            stroke="url(#sbIconGradRight)"
            strokeWidth="3.6"
            strokeLinecap="round"
          />

          {/* Bridge Deck Span */}
          <path
            d="M 10 22 L 34 22"
            fill="none"
            stroke="url(#sbDeckGrad)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />

          {/* Center Connection Node */}
          <circle cx="22" cy="22" r="2.8" fill="#FFFFFF" />
          <circle cx="22" cy="22" r="1.5" fill="#38BDF8" />
        </g>
      )}

      {/* Wordmark Typography */}
      <text
        x={showIcon ? "56" : center ? "92" : "0"}
        y="33"
        textAnchor={!showIcon && center ? "middle" : "start"}
        fontFamily="system-ui, -apple-system, 'Inter', 'Segoe UI', Roboto, sans-serif"
        fontSize="28"
        fontWeight="800"
        letterSpacing="-1.2px"
      >
        <tspan fill={skillColor}>Skill</tspan>
        <tspan fill="url(#sbTextBridgeGrad)">Bridge</tspan>
      </text>
    </svg>
  );
};

export default SkillBridgeLogo;
