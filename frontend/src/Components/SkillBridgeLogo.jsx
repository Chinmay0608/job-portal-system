import React from "react";

/**
 * SkillBridge Startup Wordmark Logo
 * Modern, geometric SaaS-style wordmark designed for high visual authority.
 * Features unified typography ("Skill" in Deep Navy #0F172A, "Bridge" in Primary Blue #2563EB)
 * with an integrated bridge connection accent at the base junction.
 */
const SkillBridgeLogo = ({ width = 165, height, className = "" }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 260 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="SkillBridge"
      role="img"
      style={{ display: "block" }}
    >
      {/* Wordmark Typography */}
      <text
        x="0"
        y="32"
        fontFamily="system-ui, -apple-system, 'Plus Jakarta Sans', 'Inter', 'Segoe UI', Roboto, sans-serif"
        fontSize="31"
        fontWeight="800"
        letterSpacing="-1.2px"
      >
        <tspan fill="#0F172A">Skill</tspan>
        <tspan fill="#2563EB">Bridge</tspan>
      </text>

      {/* Integrated Typography Accent: Micro Bridge Arc joining Skill & Bridge at baseline */}
      <path
        d="M 88 36 Q 102 41 116 36"
        stroke="#2563EB"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default SkillBridgeLogo;
