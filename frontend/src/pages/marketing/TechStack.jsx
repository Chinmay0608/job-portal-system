import { ArrowLeft, BrainCircuit, Cloud, Code2, Database, Layers3 } from "lucide-react";
import { Link } from "react-router-dom";

const stack = [
  {
    icon: Code2,
    title: "Frontend",
    description: "The responsive interface candidates and recruiters use to search, apply, and manage hiring.",
    tools: ["React", "Vite", "Tailwind CSS"],
  },
  {
    icon: Database,
    title: "Backend & data",
    description: "APIs and persistent data for jobs, profiles, applications, and recruiter workflows.",
    tools: ["Node.js", "Express", "MongoDB", "Mongoose"],
  },
  {
    icon: BrainCircuit,
    title: "AI & resume processing",
    description: "Semantic matching, resume parsing, and job content processing.",
    tools: ["Transformers.js", "Google Gemini", "PDF Parse"],
  },
  {
    icon: Layers3,
    title: "Background services",
    description: "Caching, scheduled work, and queued tasks that support platform operations.",
    tools: ["Redis", "BullMQ", "Node Cron"],
  },
  {
    icon: Cloud,
    title: "Identity & file storage",
    description: "Services used for authentication and managing uploaded profile documents.",
    tools: ["Firebase Admin", "Cloudinary"],
  },
];

function TechStack() {
  return (
    <div className="min-h-screen bg-[#faf7f1] px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <Link to="/careers" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 no-underline hover:text-indigo-900">
          <ArrowLeft size={17} /> Back to Careers
        </Link>

        <header className="mb-10 max-w-3xl">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
            <Layers3 size={14} /> Built for modern hiring
          </span>
          <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">The technology behind SkillBridge</h1>
          <p className="m-0 text-base leading-relaxed text-slate-600 sm:text-lg">
            A practical look at the tools powering our candidate experience, recruiter workflows, and AI-assisted job matching.
          </p>
        </header>

        <section aria-label="SkillBridge technology stack" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stack.map(({ icon: Icon, title, description, tools }) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-700">
                <Icon size={21} aria-hidden="true" />
              </span>
              <h2 className="mb-2 text-lg font-bold text-slate-900">{title}</h2>
              <p className="mb-5 text-sm leading-relaxed text-slate-600">{description}</p>
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {tools.map((tool) => (
                  <li key={tool} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">{tool}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}

export default TechStack;
