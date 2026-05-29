import {
  useEffect,
} from "react";

function Home() {

  const tags = [
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "Software Engineer",
    "Java Developer",
    "React Developer",
    "MERN Stack",
    "Android Developer",
    "AI Engineer",
    "Data Analyst",
    "DevOps Engineer",
    "Cyber Security",
    "Cloud Engineer",
    "UI/UX Designer",
    "Remote Jobs",
    "Internships",
    "Product Manager",
    "Machine Learning",
    "Google",
    "Microsoft",
  ];

  useEffect(() => {

    const handleMouseMove =
      (e) => {

        const tags =
          document.querySelectorAll(
            ".floating-tag"
          );

        const hero =
          document.querySelector(
            ".hero-text"
          );

        if (!hero) return;

        const heroRect =
          hero.getBoundingClientRect();

        tags.forEach(
          (tag) => {

            const rect =
              tag.getBoundingClientRect();

            const tagX =
              rect.left +
              rect.width / 2;

            const tagY =
              rect.top +
              rect.height / 2;

            /* ==========
               MOUSE REPEL
            ========== */

            const dx =
              e.clientX - tagX;

            const dy =
              e.clientY - tagY;

            const distance =
              Math.sqrt(
                dx * dx +
                dy * dy
              );

            let moveX = 0;
            let moveY = 0;

            if (
              distance < 150
            ) {

              const angle =
                Math.atan2(
                  dy,
                  dx
                );

              moveX =
                Math.cos(
                  angle
                ) * -25;

              moveY =
                Math.sin(
                  angle
                ) * -25;
            }

            /* ==========
               HERO COLLISION
            ========== */

            const overlapX =
              rect.right >
                heroRect.left &&
              rect.left <
                heroRect.right;

            const overlapY =
              rect.bottom >
                heroRect.top &&
              rect.top <
                heroRect.bottom;

            if (
              overlapX &&
              overlapY
            ) {

              const heroCenterX =
                heroRect.left +
                heroRect.width / 2;

              const direction =
                tagX >
                heroCenterX
                  ? 60
                  : -60;

              moveX +=
                direction;
            }

            tag.style.transform =
              `translate(${moveX}px, ${moveY}px)`;
          }
        );
      };

    window.addEventListener(
      "mousemove",
      handleMouseMove
    );

    return () => {

      window.removeEventListener(
        "mousemove",
        handleMouseMove
      );
    };

  }, []);

  return (
    <div className="hero-container">

      {/* Floating Tags */}

      {tags.map(
        (tag, index) => (
          <button
            key={index}
            className={`floating-tag tag-${index}`}
          >
            {tag}
          </button>
        )
      )}

      {/* Hero Content */}

      <div className="hero-content">

        <div className="hero-text">

          <h1 className="hero-title">
            Find What's Next
          </h1>

          <p className="hero-subtitle">
            Discover jobs,
            connect with recruiters,
            and build your
            dream career.
          </p>

        </div>

      </div>
    </div>
  );
}

export default Home;