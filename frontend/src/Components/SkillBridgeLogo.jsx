const SkillBridgeLogo = ({ width = 165, height, className = "", variant = "light", isDark = false, textColor, center = false }) => {
  const skillFill = (variant === "dark" || isDark || textColor === "white" || textColor === "#FFFFFF") ? "#FFFFFF" : "#0F172A";

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 196 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="SkillBridge"
      role="img"
      style={{ display: "block", maxWidth: "100%", height: "auto", margin: center ? "0 auto" : undefined }}
    >
      <text
        x="98"
        y="35"
        textAnchor="middle"
        fontFamily="'Trebuchet MS', 'Arial Rounded MT Bold', system-ui, sans-serif"
        fontSize="32"
        fontWeight="900"
        letterSpacing="-1.5px"
      >
        <tspan className="logo-skill-text" fill={skillFill}>Skill</tspan>
        <tspan className="logo-bridge-text" fill="#2563EB">Bridge</tspan>
      </text>
    </svg>
  );
};

export default SkillBridgeLogo;
