import "../../Styles/pages/SuccessStories.css";

function SuccessStories() {
  const stories = [
    {
      name: "Sarah Chen",
      role: "Frontend Developer",
      // Changed fit=crop to fit=facearea and added facepad=3 to zoom out smoothly around the face
      image:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=3&w=600&h=500&q=80",
      story:
        "After months of searching, Sarah found the perfect frontend role through SkillBridge and joined TechNova within 3 weeks.",
    },

    {
      name: "Emma Wilson",
      role: "UI/UX Designer",
      // Applied the same facepad zoom parameter here
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=3&w=600&h=500&q=80",
      story:
        "Emma transitioned into remote design work and landed her dream position with a global startup.",
    },

    {
      name: "Marcus Wood",
      role: "Backend Engineer",
      // Applied the same facepad zoom parameter here
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=3&w=600&h=500&q=80",
      story:
        "Marcus used SkillBridge’s AI recommendations and secured a backend engineering role faster than expected.",
    },
  ];

  const impactStats = [
    { number: "10K+", title: "Successful Hires" },
    { number: "500+", title: "Partner Companies" },
    { number: "95%", title: "Candidate Satisfaction" },
    { number: "120+", title: "Cities Reached" },
  ];

  return (
    <div className="success-page">
      {/* HERO */}
      <section className="success-hero">
        <div className="success-tag">SUCCESS STORIES</div>
        <h1>Real People. <br /> Real Career Growth.</h1>
        <p>
          Discover how candidates transformed their careers and companies found exceptional talent through SkillBridge.
        </p>
      </section>

      {/* FEATURED STORY */}
      {/* FEATURED STORY */}
      <section className="featured-story">
        <div className="featured-card">
          <img
            src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=facearea&facepad=3&w=1200&h=800&q=80"
            alt="Featured Success"
            className="featured-img"
          />

          <div className="featured-content">
            <span>FEATURED STORY</span>

            <h2>
              From Internship
              <br />
              to Full-Time Role
            </h2>

            <p>
              “SkillBridge completely changed my
              job search journey. I started as an
              intern and within 6 months I was
              offered a full-time software
              engineering role.”
            </p>

            <div className="story-badge">
              Hired at TechNova 🚀
            </div>
          </div>
        </div>
      </section>

      {/* STORIES GRID */}
      <section className="stories-section">
        <div className="stories-header">
          <h2>More Success Stories</h2>
          <p>Trusted by thousands of professionals building their future.</p>
        </div>

        <div className="stories-grid">
          {stories.map((story, index) => (
            <div className="story-card" key={index}>
              <img src={story.image} alt={story.name} />
              <div className="story-card-content">
                <span>{story.role}</span>
                <h3>{story.name}</h3>
                <p>{story.story}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* IMPACT SECTION */}
      <section className="impact-section">
        <h2>Our Impact</h2>
        <div className="impact-grid">
          {impactStats.map((item, index) => (
            <div className="impact-card" key={index}>
              <h3>{item.number}</h3>
              <p>{item.title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="success-cta">
        <h2>Your Success Story <br /> Starts Today</h2>
        <p>Join SkillBridge and connect with opportunities built for your future.</p>
        <button>Get Started</button>
      </section>
    </div>
  );
}

export default SuccessStories;