import { useEffect } from "react";

function Home() {
  const tags = [
    { text: "Full Stack Developers", top: "18%", left: "28%" },
    { text: "Hardware", top: "20%", left: "78%" },
    { text: "Aerospace", top: "34%", left: "12%" },
    { text: "Blockchain Developers", top: "31%", left: "39%" },
    { text: "Boston", top: "29%", left: "47%" },
    { text: "Web3", top: "28%", left: "55%" },
    { text: "Denver", top: "28%", left: "64%" },
    { text: "Los Angeles", top: "33%", left: "58%" },
    { text: "San Francisco", top: "53%", left: "17%" },
    { text: "React Developers", top: "58%", left: "30%" },
    { text: "Databases", top: "55%", left: "46%" },
    { text: "Front End Developers", top: "59%", left: "43%" },
    { text: "Artificial Intelligence", top: "62%", left: "53%" },
    { text: "New York", top: "66%", left: "55%" },
    { text: "Mental Health", top: "50%", left: "82%" },
    { text: "Flutter Developers", top: "55%", left: "75%" },
    { text: "Node JS Developers", top: "59%", left: "8%" },
    { text: "SaaS", top: "67%", left: "22%" },
    { text: "Vue JS Developers", top: "74%", left: "63%" },
    { text: "Robotics", top: "74%", left: "83%" },
    { text: "Cyber Security", top: "84%", left: "19%" },
    { text: "iOS Developers", top: "82%", left: "28%" },
    { text: "Android Developers", top: "80%", left: "52%" }
  ];

  useEffect(() => {
    const handleMouseMove = (e) => {
      const floatingTags = document.querySelectorAll(".wellfound-floating-tag");
      const heroHeading = document.querySelector(".wellfound-card");
      if (!heroHeading) return;

      const heroRect = heroHeading.getBoundingClientRect();
      const heroCenterX = heroRect.left + heroRect.width / 2;
      const heroCenterY = heroRect.top + heroRect.height / 2;

      floatingTags.forEach((tag) => {
        const rect = tag.getBoundingClientRect();
        const tagCenterX = rect.left + rect.width / 2;
        const tagCenterY = rect.top + rect.height / 2;

        // 1. Mouse Repel Calculations
        const dxMouse = e.clientX - tagCenterX;
        const dyMouse = e.clientY - tagCenterY;
        const distanceMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

        let moveX = 0;
        let moveY = 0;

        if (distanceMouse < 140) {
          const angleMouse = Math.atan2(dyMouse, dxMouse);
          const force = (140 - distanceMouse) / 140;
          moveX += Math.cos(angleMouse) * -35 * force;
          moveY += Math.sin(angleMouse) * -35 * force;
        }

        // 2. Main Red Card Collision Boundaries
        const dxHero = tagCenterX - heroCenterX;
        const dyHero = tagCenterY - heroCenterY;
        
        const bufferX = heroRect.width / 2 + rect.width / 2 + 15;
        const bufferY = heroRect.height / 2 + rect.height / 2 + 10;

        if (Math.abs(dxHero) < bufferX && Math.abs(dyHero) < bufferY) {
          const angleHero = Math.atan2(dyHero, dxHero);
          moveX += Math.cos(angleHero) * 45;
          moveY += Math.sin(angleHero) * 25;
        }

        tag.style.transform = `translate(${moveX}px, ${moveY}px)`;
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // --- Inline Styles to Bypass Bootstrap Overrides ---
  const containerStyle = {
    position: "relative",
    width: "100%",
    minHeight: "100vh",
    overflow: "hidden",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f7f7f5",
    padding: "0",
    margin: "0",
    boxSizing: "border-box",
    fontFamily: "Inter, system-ui, sans-serif"
  };

  const tagsContainerStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: 1
  };

  const contentStyle = {
    position: "relative",
    zIndex: 10,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "none"
  };

  const cardStyle = {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "14px",
    border: "3px dashed #ef4444",
    borderRadius: "28px",
    padding: "24px 48px",
    background: "#ffffff",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.02)",
    pointerEvents: "auto",
    userSelect: "none"
  };

  const logoStyle = {
    fontSize: "5.5rem",
    fontWeight: "900",
    color: "#0c1017",
    letterSpacing: "-4px",
    lineHeight: "1",
    display: "inline-block"
  };

  const dotStyle = {
    color: "#ef4444"
  };

  const titleStyle = {
  fontSize: "5.5rem",
  fontWeight: "800",
  color: "#0c1017",      
  lineHeight: "1",
  letterSpacing: "-2px",
  margin: "0",
  padding: "0"
};

  return (
    <div style={containerStyle}>
      {/* Background Interactive Tags Layer */}
      <div style={tagsContainerStyle}>
        {tags.map((tag, index) => {
          const baseTagStyle = {
            position: "absolute",
            top: tag.top,
            left: tag.left,
            pointerEvents: "auto",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "12px 22px",
            fontSize: "15px",
            fontWeight: "500",
            color: "#4a5568",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "transform 0.2s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.2s",
            outline: "none",
            display: "inline-block",
            width: "auto" 
          };

          return (
            <button
              key={index}
              className="wellfound-floating-tag"
              style={baseTagStyle}
              onMouseEnter={(e) => {
                e.target.style.boxShadow = "0 8px 20px rgba(0,0,0,0.06)";
                e.target.style.color = "#000000";
                e.target.style.borderColor = "#cbd5e1";
              }}
              onMouseLeave={(e) => {
                e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.03)";
                e.target.style.color = "#4a5568";
                e.target.style.borderColor = "#e2e8f0";
              }}
            >
              {tag.text}
            </button>
          );
        })}
      </div>

      {/* Main Center Message Layer */}
      <div style={contentStyle}>
        <div className="wellfound-card" style={cardStyle}>
          <span style={logoStyle}>
            w<span style={dotStyle}>:</span>
          </span>
          <h1 style={titleStyle}>Find what's next</h1>
        </div>
      </div>
    </div>
  );
}

export default Home;