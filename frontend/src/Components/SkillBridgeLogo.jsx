import React from "react";

/**
 * SkillBridge Modern SaaS Wordmark Logo
 * Premium geometric wordmark designed for high visual confidence and authority.
 * Features unified typography ("Skill" in Deep Navy #0F172A / White #FFFFFF on dark theme,
 * "Bridge" in Primary Royal Blue #2563EB) with an architectural bridge accent.
 */
const SkillBridgeLogo = ({ width = 165, height, className = "" }) => {
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
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id="bridgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>

      {/* Wordmark Typography */}
      <text
        x="0"
        y="32"
        fontFamily="system-ui, -apple-system, 'Plus Jakarta Sans', 'Inter', 'Segoe UI', Roboto, sans-serif"
        fontSize="32"
        fontWeight="900"
        letterSpacing="-1.4px"
      >
        <tspan className="logo-skill-text" fill="#0F172A">Skill</tspan>
        <tspan className="logo-bridge-text" fill="url(#bridgeGradient)">Bridge</tspan>
      </text>

      {/* Integrated Architectural Bridge Curve joining Skill & Bridge at baseline */}
      <path
        d="M 90 37 Q 106 43 122 37"
        stroke="url(#bridgeGradient)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx="106" cy="38.5" r="2.2" fill="#3B82F6" className="logo-bridge-dot" />
    </svg>
  );
};

export default SkillBridgeLogo;
