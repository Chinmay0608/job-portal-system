import React from "react";

const SkillBridgeLogo = ({ width = 180, height, className = "" }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 600 180"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="skillBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>

      {/* Skill */}
      <text
        x="35"
        y="120"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="92"
        fontWeight="600"
        fill="url(#skillBlue)"
        letterSpacing="-4"
      >
        skill
      </text>

      {/* Bridge */}
      <text
        x="260"
        y="120"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="92"
        fontWeight="600"
        fill="#172B4D"
        letterSpacing="-4"
      >
        bridge
      </text>

      {/* Bridge arc */}
      <path
        d="M390 58 Q465 5 540 58"
        fill="none"
        stroke="url(#skillBlue)"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default SkillBridgeLogo;
