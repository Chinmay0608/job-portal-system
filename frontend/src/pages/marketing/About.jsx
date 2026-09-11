import { Link } from "react-router-dom";
import {
  Sparkles,
  Target,
  ShieldCheck,
  Zap,
  Users,
  Briefcase,
  ArrowRight,
  CheckCircle2,
  Globe,
  HeartHandshake,
  TrendingUp,
  Building2,
  BrainCircuit,
} from "lucide-react";

function About() {
  const pillars = [
    {
      icon: <BrainCircuit className="about-pillar-icon text-indigo-600" />,
      title: "AI-Powered Precision",
      description:
        "Our in-house vector embedding pipeline matches candidates with roles based on deep skill alignment, experience tier, and context — moving far beyond simple keyword matching.",
    },
    {
      icon: <CheckCircle2 className="about-pillar-icon text-emerald-600" />,
      title: "Zero-Ghosting Transparency",
      description:
        "Every application lifecycle step is clear and tracked. Candidates receive real-time status updates, while recruiters benefit from structured applicant pipelines.",
    },
    {
      icon: <ShieldCheck className="about-pillar-icon text-blue-600" />,
      title: "Verified Roles & PII Security",
      description:
        "We enforce automated PII masking, token sanitization, and recruiter verification to ensure every job listing is legitimate and candidate data stays private.",
    },
    {
      icon: <Zap className="about-pillar-icon text-amber-600" />,
      title: "Streamlined Hiring Speed",
      description:
        "From AI resume parsing to automated ticket resolution, SkillBridge cuts hiring turnaround times by up to 60%, allowing teams to secure top talent faster.",
    },
  ];

  const stats = [
    { number: "50K+", label: "Verified Jobs Posted", icon: <Briefcase /> },
    { number: "20K+", label: "Active Candidates", icon: <Users /> },
    { number: "1.5K+", label: "Hiring Enterprises", icon: <Building2 /> },
    { number: "98%", label: "Match Precision Score", icon: <TrendingUp /> },
  ];

  const valueProps = {
    candidates: [
      "AI-driven resume parsing & instant profile generation",
      "Semantic job matching matching your exact tech stack",
      "Direct recruiter communication & ticket support",
      "Transparent application status tracking",
    ],
    recruiters: [
      "Smart candidate triage with NLP sentiment & spam filters",
      "High-intent applicant recommendations with vector scoring",
      "Multi-channel job distribution & candidate management",
      "Automated Telegram alerts & operational desk tools",
    ],
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="text-center max-w-4xl mx-auto mb-16 sm:mb-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs sm:text-sm font-semibold mb-6 shadow-sm">
          <Sparkles size={16} className="text-indigo-600 animate-pulse" />
          <span>Redefining Job Discovery & Hiring</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6">
          Bridging the Gap Between <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-brand-600 bg-clip-text text-transparent">
            Talent & Opportunity
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
          SkillBridge was built on a simple conviction: finding a job or hiring exceptional people shouldn’t feel like sending applications into a void. We bring transparency, intelligence, and speed back to modern recruitment.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm sm:text-base shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:-translate-y-0.5 no-underline"
          >
            Explore Open Roles <ArrowRight size={18} />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm sm:text-base border border-slate-200 shadow-sm transition-all duration-200 hover:text-slate-900 no-underline"
          >
            For Employers & Recruiters
          </Link>
        </div>
      </section>

      {/* 2. MISSION & VISION DUAL CARDS */}
      <section className="mb-16 sm:mb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          <div className="bg-white rounded-2xl p-7 sm:p-9 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5">
                <HeartHandshake size={26} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">Why We Exist</h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-3">
                Traditional job boards are noisy, flooded with spam, and lack genuine context. Job seekers spend hours customizing resumes only to receive automated rejection emails, while hiring managers drown in unqualified applicants.
              </p>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                SkillBridge was engineered from the ground up to solve both sides of the equation — using local AI embeddings, NLP PII protection, and real-time operational workflows to make recruitment human, fast, and reliable.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-7 sm:p-9 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
                <Target size={26} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">Our Core Mission</h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                Our mission is to create a trusted global talent marketplace where skills speak louder than keywords. We empower candidates to showcase their true potential while giving organizations the tools to hire smarter, faster, and fairer.
              </p>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50/80 border border-emerald-100 text-emerald-800 text-sm font-medium">
              <Globe size={20} className="text-emerald-600 shrink-0" />
              <span>Connecting candidates & recruiters across 30+ tech domains worldwide.</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE PILLARS / WHY SKILLBRIDGE */}
      <section className="mb-16 sm:mb-20">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            Built For Performance
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 mb-2">The SkillBridge Advantage</h2>
          <p className="text-slate-500 text-sm sm:text-base">Four foundational pillars driving transparent matching and enterprise recruitment.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                {pillar.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{pillar.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{pillar.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. DUAL PERSPECTIVES: CANDIDATES vs RECRUITERS */}
      <section className="mb-16 sm:mb-20">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
            Unified Ecosystem
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 mb-2">Built for Both Sides of the Hiring Table</h2>
          <p className="text-slate-500 text-sm sm:text-base">Whether you are pursuing your next career milestone or scaling a world-class team.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Candidates Column */}
          <div className="bg-white rounded-2xl p-7 sm:p-8 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-4">
                <Users size={14} /> Job Seekers & Professionals
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Accelerate Your Career Journey</h3>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Discover roles tailored precisely to your skillset with complete visibility into every application.
              </p>
              <ul className="space-y-3 mb-8">
                {valueProps.candidates.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                    <CheckCircle2 size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold text-sm group no-underline"
            >
              Browse All Jobs <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Recruiters Column */}
          <div className="bg-white rounded-2xl p-7 sm:p-8 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-4">
                <Building2 size={14} /> Employers & Hiring Managers
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Hire Exceptional Talent Faster</h3>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Streamline candidate discovery, evaluate candidates with AI precision, and manage hiring workflows effortlessly.
              </p>
              <ul className="space-y-3 mb-8">
                {valueProps.recruiters.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold text-sm group no-underline"
            >
              Start Hiring Today <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. IMPACT STATS BANNER */}
      <section className="mb-16 sm:mb-20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-3xl p-8 sm:p-12 text-white shadow-2xl border border-slate-800">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
          {stats.map((st, idx) => (
            <div className="flex flex-col items-center justify-center" key={idx}>
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-sky-400 mb-3 shadow-inner">
                {st.icon}
              </div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">{st.number}</div>
              <div className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">{st.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. CALL TO ACTION (CTA) */}
      <section className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-brand-600 rounded-3xl p-8 sm:p-14 text-center text-white shadow-2xl">
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">Ready to Experience Modern Hiring?</h2>
          <p className="text-white/90 text-sm sm:text-base mb-8 leading-relaxed">
            Join thousands of candidates finding meaningful work and recruiters building high-impact teams on SkillBridge.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/jobs"
              className="px-6 py-3.5 rounded-xl bg-white text-indigo-700 font-bold text-sm sm:text-base hover:bg-slate-50 transition-all duration-200 shadow-md hover:-translate-y-0.5 no-underline"
            >
              Explore Jobs Now
            </Link>
            <Link
              to="/careers"
              className="px-6 py-3.5 rounded-xl bg-white/15 hover:bg-white/20 text-white font-semibold text-sm sm:text-base border border-white/30 backdrop-blur-sm transition-all duration-200 no-underline"
            >
              View Open Careers
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;