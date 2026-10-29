import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { flushSync } from "react-dom";
import axios from "axios";
import CustomSelect from "../../Components/CustomSelect";
import ExperienceSelect from "../../Components/ExperienceSelect";
import OnboardingWizard from "../../Components/OnboardingWizard";
import { getCountryCurrency, getSalaryOptions } from "../../utils/countryCurrency";
import { getJobs, applyJob, applyExternal, getMyApplications, toggleSaveJob, getRecommendedJobs, hideJob, getUserProfile, getFullJobDescriptionAPI, getEnglishJobDescriptionAPI } from "../../Services/jobService";
import { CANDIDATE_WELCOME_DISMISSED_KEY, setStoredUser, getApiBaseUrl } from "../../Services/authUtils";
import debounce from "lodash.debounce";
import toast from "react-hot-toast";
import RetryBanner from "../../Components/RetryBanner";
import DOMPurify from "dompurify";
import { marked } from "marked";
import StatusBadge from "../../Components/common/StatusBadge";
import EmptyState from "../../Components/common/EmptyState";
import { JobCardSkeleton } from "../../Components/common/SkeletonLoader";
import { FiSearch, FiMapPin, FiBookmark, FiThumbsDown, FiShare2, FiExternalLink, FiCheckCircle } from "react-icons/fi";
import { FaBookmark } from "react-icons/fa";
import workChatSvg from "../../assets/undraw_work-chat_kw8x.svg";
import {
  getMyMessages,
  markMessageAsRead,
  markAllMessagesAsRead,
  notifyMessagesUpdated,
} from "../../Services/messageService";
import DashboardTour from "../../Components/DashboardTour";
import {
  Shield as ShieldIcon,
  AlertTriangle as AlertTriangleIcon,
  Megaphone as MegaphoneIcon,
  Clock as ClockIcon,
  Info as InfoIcon,
  X as CloseIcon,
  ChevronRight as ChevronRightIcon,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  Bookmark,
  FileText,
  UserRound,
  Sparkles,
  Flag,
  Grid2X2,
  PanelLeft,
} from "lucide-react";

const JOBS_PER_PAGE = 20;
const PROFILE_NUDGE_THRESHOLD = 30;
const HIDE_JOB_REASONS = [
  { value: "seniority", label: "Seniority doesn't match" },
  { value: "salary", label: "Salary isn't suitable" },
  { value: "tech_stack_mismatch", label: "Tech stack mismatch" },
  { value: "other", label: "Other" },
];
const JOB_CONCERN_REASONS = [
  "Fake or scam job",
  "Incorrect information",
  "Job already closed / expired",
  "Discriminatory or inappropriate",
  "Duplicate posting",
  "Other",
];
const PENDING_EXTERNAL_APPLICATION_KEY = "pending_external_application_confirmation";
const deriveCompanyDomain = (company) => {
  if (!company || typeof company !== "string") return null;
  const raw = company.trim();
  const lower = raw.toLowerCase();

  const domainOverrides = {
    "trigent software private limited": "trigent.com",
    "trigent software": "trigent.com",
    trigent: "trigent.com",
    "rotzinger group": "rotzingergroup.com",
    rotzinger: "rotzingergroup.com",
    "swisspeak partners gmbh": "swisspeak.com",
    "swisspeak partners": "swisspeak.com",
    swisspeak: "swisspeak.com",
    "mistral.ai": "mistral.ai",
    mistral: "mistral.ai",
    "centraal bureau voor de statistiek": "cbs.nl",
    cbs: "cbs.nl",
    nasdaq: "nasdaq.com",
    bureau: "bureau.id",
    swiggy: "swiggy.com",
    keploy: "keploy.io",
    datadog: "datadoghq.com",
    alma31: "almapay.com",
    openai: "openai.com",
    graphcore: "graphcore.ai",
    "standard chartered bank": "sc.com",
    papigen: "papigen.com",
    "atharv consulting": "atharvconsulting.in",
    "atharv consultings": "atharvconsulting.in",
    flipkart: "flipkart.com",
    "flipkart minutes": "flipkart.com",
    snowflake: "snowflake.com",
    acclime: "acclime.com",
    "acclime india": "acclime.com",
    rentomojo: "rentomojo.com",
    codemonk: "codemonk.io",
    babaclick: "babaclick.com",
    "vanco ai": "vanco.ai",
    vanco: "vanco.ai",
    innoventes: "innoventestech.com",
    "innoventes technologies": "innoventestech.com",
    stitch: "stitch.co",
    "stitch financial technologies": "stitch.co",
    blinkit: "blinkit.com",
    stan: "getstan.app",
    "hevo data": "hevodata.com",
    hevo: "hevodata.com",
    "larsen & toubro (l&t)": "larsentoubro.com",
    "larsen & toubro": "larsentoubro.com",
    "l&t": "larsentoubro.com",
    rupeek: "rupeek.com",
    "stratzy ai": "stratzy.in",
    stratzy: "stratzy.in",
    kpmg: "kpmg.com",
    "kpmg india": "kpmg.com",
    abb: "abb.com",
    "abb india": "abb.com",
    "abb group": "abb.com",
    kiwi: "gokiwi.in",
    ridecell: "ridecell.com",
    sculptsoft: "sculptsoft.com",
    credgenics: "credgenics.com",
    appbrew: "appbrew.tech",
    aiqon: "aiqon.in",
    tekworks: "tekworks.in",
    klimb: "klimb.io",
  };

  if (domainOverrides[lower]) return domainOverrides[lower];

  // 1. Direct domain in company name (e.g. Mistral.ai, Booking.com)
  const domainMatch = raw.match(/\b([a-zA-Z0-9-]+\.(?:ai|io|com))\b/i);
  if (domainMatch) return domainMatch[1].toLowerCase();

  // Strict: Never guess arbitrary domains for unknown companies
  return null;
};

const getCompanyLogo = (company, logo) => {
  if (logo && typeof logo === "string" && logo.trim().length > 0 && !logo.includes("ui-avatars.com")) {
    return logo;
  }
  const domain = deriveCompanyDomain(company);
  if (domain) {
    return `https://unavatar.io/${domain}`;
  }
  return "";
};
const companyLogoDomains = {};

const getRelativeTime = (dateString) => {
  if (!dateString) return "";
  const diff = Date.now() - new Date(dateString).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  return `Posted ${days} days ago`;
};

const isDescriptionSnippet = (description) => {
  const text = (description || "").trim();
  return (
    isMisstructuredDescription(text) ||
    text.length < 350 ||
    text.endsWith("...") ||
    text.endsWith("…") ||
    text.endsWith("â€¦") ||
    /\band\s*\.\.\.$/i.test(text) ||
    text.includes("read more on career portal") ||
    text.includes("preview snippet")
  );
};

const isMisstructuredDescription = (description) => {
  const text = description || "";
  return (
    /\$(?:undefined|null)\b/i.test(text) ||
    /is hiring for [\s\S]{1,120}? in the [\s\S]{1,60}? space\./i.test(text) ||
    /Use the Apply button to open the employer's official application page\./i.test(text) ||
    /<h3[^>]*>\s*Role Summary\s*<\/h3>\s*<p[^>]*>\s*(?:Required|undefined|null)\s*<\/p>/i.test(
      text,
    ) ||
    /<h3[^>]*>\s*(?:Key Responsibilities|Required Qualifications)\s*<\/h3>\s*<p[^>]*>\s*(?:undefined|null|Not specified in the employer posting\.)/i.test(
      text,
    ) ||
    (/<h3[^>]*>\s*Role Summary\s*<\/h3>[\s\S]{0,1200}?(?:Job Description|Required Experience and Skills)/i.test(
      text,
    ) &&
      /<h3[^>]*>\s*(?:Key Responsibilities|Required Qualifications)\s*<\/h3>\s*<p[^>]*>\s*Not specified in the employer posting\./i.test(
        text,
      ))
  );
};

const isReferralAlertDescription = (description) =>
  /\breferral\s+alert\s*:/i.test(String(description || "").replace(/<[^>]*>/g, " "));

const isDescriptionInEnglish = (text) => {
  if (!text) return true;
  const stripped = String(text)
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/[\r\n\t]+/g, " ")
    .trim();
  if (stripped.length < 20) return true;

  const nonLatinMatches = stripped.match(/[^\u0020-\u024F\s\d.,!?'"()\-:;/@%&*+=#$€£₹[\]{}<>]/g);
  const totalLetters = (stripped.match(/[\p{L}]/gu) || []).length;
  if (totalLetters > 0 && nonLatinMatches && (nonLatinMatches.length / totalLetters) > 0.15) {
    return false;
  }

  const englishTokens = new Set([
    "the", "and", "to", "of", "in", "for", "is", "with", "that", "you", "your",
    "will", "are", "be", "as", "at", "this", "have", "from", "or", "an", "we",
    "our", "work", "team", "experience", "skills", "role", "requirements", "job"
  ]);

  const words = stripped.toLowerCase().match(/\b[a-z]{2,}\b/g) || [];
  if (words.length < 5) return true;

  let englishCount = 0;
  for (const word of words) {
    if (englishTokens.has(word)) englishCount++;
  }

  const uniqueEnglishWords = new Set(words.filter(w => englishTokens.has(w))).size;
  return uniqueEnglishWords >= 3 || (englishCount / words.length) >= 0.08;
};

const alignWhoWeAreHeading = (html) => {
  const doc = new DOMParser().parseFromString(DOMPurify.sanitize(html), "text/html");
  doc.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((heading) => {
    if (/^who\s+we\s+are\s*:?\s*$/i.test(heading.textContent.trim())) {
      heading.classList.add("job-description-who-we-are");
    }
  });
  doc.querySelectorAll("ul > li").forEach((item) => {
    const firstText = item.firstChild;
    if (firstText?.nodeType === 3) {
      firstText.textContent = firstText.textContent.replace(/^\s*(?:\([a-z]\)|[a-z][).])\s+/i, "");
    }
  });
  return doc.body.innerHTML;
};

  const renderExternalDescription = (text, job) => {
    if (!text) return null;

    const hasHtmlMarkup = /<[a-z][\s\S]*>/i.test(text);
    const decodedText = hasHtmlMarkup ? text : decodeHTMLEntities(text);
    if (hasHtmlMarkup || /<[a-z][\s\S]*>/i.test(decodedText)) {
      return (
        <div
          className="job-description-content prose prose-slate max-w-none space-y-3 leading-relaxed
            prose-headings:font-bold prose-headings:text-slate-900 prose-headings:mt-4 prose-headings:mb-2
            prose-p:text-slate-700 prose-p:leading-relaxed prose-p:my-2
            prose-li:text-slate-700 prose-li:leading-relaxed
            prose-ul:list-disc prose-ul:pl-5 prose-ul:my-2
            prose-strong:text-slate-900"
          dangerouslySetInnerHTML={{ __html: alignWhoWeAreHeading(decodedText) }}
        />
      );
    }

    if (decodedText.includes("##") || decodedText.includes("**")) {
      const md = decodedText
        .replace(/\bSalary comparison\b[\s\S]*$/i, "")
        .replace(/\b(?:Receive similar jobs by email|Similar jobs)\b[\s\S]*$/i, "")
        .replace(/\b(?:Back to last search|Stats for this job|Apply for this job)\b/gi, " ")
        .replace(/\bin the \$undefined space\b/gi, "")
        .replace(/\$undefined\s*/gi, "")
        .replace(/[ \t]{3,}/g, "\n\n")
        .replace(/(?<!\n)(#{1,6}\s)/g, "\n\n$1")
        .replace(/(?<!\n|\*)([-*]\s)/g, "\n$1");
      const html = marked.parse(md);
      return (
        <div
          className="job-description-content prose prose-slate max-w-none
            prose-headings:font-semibold prose-headings:text-slate-800
            prose-p:text-slate-700 prose-p:leading-relaxed
            prose-li:text-slate-700 prose-li:leading-relaxed
            prose-ul:list-disc prose-ul:pl-5
            prose-strong:text-slate-800"
          dangerouslySetInnerHTML={{ __html: alignWhoWeAreHeading(html) }}
        />
      );
    }

    let body = decodedText
      .replace(/\bSalary comparison\b[\s\S]*$/i, "")
      .replace(/\b(?:Receive similar jobs by email|Similar jobs)\b[\s\S]*$/i, "")
      .replace(/\b(?:Back to last search|Stats for this job)\b/gi, " ")
      .replace(/\bin the \$undefined space\b/gi, "")
      .replace(/\$undefined\s*/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    const leadingJobDetails = [job?.title, job?.company]
      .filter(Boolean)
      .some((value) => body.slice(0, 300).toLowerCase().includes(value.toLowerCase()));
    const applyActionIndex = body.toLowerCase().indexOf("apply for this job");
    if (leadingJobDetails && applyActionIndex >= 0 && applyActionIndex < 400) {
      body = body.slice(applyActionIndex + "apply for this job".length).trim();
    }
    body = body.replace(/\bApply for this job\b/gi, " ").replace(/\s+/g, " ").trim();

    const sectionHeaders = [
      "About the role", "About the company", "About us", "Who We Are", "The role",
      "Job description", "Key responsibilities", "Your responsibilities",
      "Responsibilities", "Key requirements", "What you'll need",
      "Skills required", "Skills & experience", "Required skills",
      "Required qualifications", "Minimum qualifications", "Qualifications",
      "Preferred qualifications", "Nice-to-have", "Nice to have",
      "Perks & benefits", "What we offer", "Benefits", "How to apply",
      "Application process", "Next steps", "Working hours", "Compensation",
      "Location", "Skills",
    ];

    const escapedHeaders = sectionHeaders
      .sort((a, b) => b.length - a.length)
      .map((header) => header.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const headerPattern = new RegExp(
      `(^|\\s)(${escapedHeaders.join("|")})\\s*:?\\s*`,
      "gi",
    );
    const sections = [];
    let currentHeading = "Overview";
    let cursor = 0;

    for (const match of body.matchAll(headerPattern)) {
      const content = body.slice(cursor, match.index).trim();
      if (content) sections.push({ heading: currentHeading, content });
      currentHeading = match[2]
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
      cursor = match.index + match[0].length;
    }

    const finalContent = body.slice(cursor).trim();
    if (finalContent) sections.push({ heading: currentHeading, content: finalContent });
    if (sections.length === 0 && body) {
      sections.push({ heading: "Overview", content: body });
    }

    return (
      <div className="job-description-content space-y-5 text-slate-700">
        {sections.map(({ heading, content }, idx) => {
          const items = content
            .split(/\s*[â€¢â—â–ª]\s*|\s*;\s*|\s*(?<=\.)\s+(?=[A-Z])/)
            .map((item) => item.replace(/^[-*]\s*/, "").replace(/^(?:\([a-z]\)|[a-z][).])\s+/i, "").trim())
            .filter(Boolean);
          const isWhoWeAreSection = /^who\s+we\s+are$/i.test(heading);
          const isSkillSection = /skills/i.test(heading);
          const listItems = isSkillSection
            ? content.split(/\s*,\s*/).map((item) => item.trim()).filter(Boolean)
            : items;
          const paragraphs = content
            .split(/(?<=[.!?])\s+(?=[A-Z])/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean);
          return (
            <section key={idx} className="border-b border-slate-100 pb-5 last:border-0 last:pb-0">
              <h5 className={`mb-2 ${isWhoWeAreSection ? "job-description-who-we-are" : ""} text-sm font-bold tracking-tight text-slate-900`}>
                {heading}
              </h5>
              {!isWhoWeAreSection ? (
                <ul className="m-0 ml-12 list-disc space-y-1.5 pl-5">
                  {listItems.map((item, i) => (
                    <li key={i} className="text-slate-700">{item}</li>
                  ))}
                </ul>
              ) : (
                <div className="ml-12 space-y-2">
                  {paragraphs.map((paragraph, i) => (
                    <p key={i} className="m-0 text-slate-700">{paragraph}</p>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    );
  };

  const decodeHTMLEntities = (text) => {
  if (!text) return '';
  const doc = new DOMParser().parseFromString(text, 'text/html');
  return doc.documentElement.textContent;
};

const formatSalary = (salaryText, min, max, currency, showRange = true) => {
  const currencySymbol = currency === "INR" || currency === "\u20B9"
    ? "\u20B9"
    : currency === "EUR"
      ? "\u20AC"
      : currency === "GBP"
        ? "\u00A3"
        : "$";

  if (!showRange) return typeof salaryText === "string" && isNaN(Number(salaryText)) && salaryText !== "Competitive" ? salaryText : "Competitive";

  if (min && max) {
    const formatShorthand = (num) => {
      if (num >= 100000) return `${currencySymbol}${Number((num / 100000).toFixed(1))}L`;
      if (num >= 1000) return `${currencySymbol}${Number((num / 1000).toFixed(1))}k`;
      return `${currencySymbol}${num}`;
    };
    if (min === max) {
      return formatShorthand(min);
    }
    return `${formatShorthand(min)}\u2013${formatShorthand(max)}`;
  }

  if (typeof salaryText === "string" && isNaN(Number(salaryText))) return salaryText;
  if (!salaryText || Number(salaryText) === 0) return "Competitive";
  return `${currencySymbol}${Number(salaryText).toLocaleString(currency === "INR" ? "en-IN" : "en-US")} a year`;
};
const inferExperienceFromDescription = (description = "") => {
  const text = decodeHTMLEntities(description).replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ");
  const matches = [...text.matchAll(/\b(\d+)\s*(\+|(?:-|â€“|to)\s*(\d+)\+?)?\s*years?\b/gi)]
    .filter((match) => /experience/i.test(text.slice(Math.max(0, match.index - 50), match.index + match[0].length + 80)));
  const buckets = new Set(matches.map((match) => {
    const minimum = Number(match[1]);
    const maximum = Number(match[3]);
    if (minimum >= 5) return "5+ Years";
    if (minimum >= 3 || (minimum === 2 && maximum >= 3)) return "2-5 Years";
    return "0-2 Years";
  }));
  return buckets.size === 1 ? [...buckets][0] : "Not Specified";
};


// Same field list used in Profile.jsx's calculateCompletion, kept identical
// so the percentage shown here always matches the Profile page exactly.
const calculateCompletion = (profileUser) => {
  const fields = [
    profileUser?.name,
    profileUser?.email,
    profileUser?.phone,
    profileUser?.location,
    profileUser?.linkedin,
    profileUser?.github,
    profileUser?.portfolio,
    profileUser?.about,
    profileUser?.education,
    profileUser?.experienceLevel,
    profileUser?.skills?.length > 0,
    profileUser?.resume,
    profileUser?.profileImage,
  ];

  const completed = fields.filter(Boolean).length;
  return Math.round((completed / fields.length) * 100);
};

const getPopularRolesForField = (field = "") => {
  const value = field.toLowerCase();
  if (value.includes("health") || value.includes("medical")) return ["Doctor / Physician", "Registered Nurse", "Pharmacist", "Clinical Research Associate"];
  if (value.includes("data") || value.includes("analytics")) return ["Data Analyst", "Data Scientist", "Machine Learning Engineer", "Data Engineer"];
  if (value.includes("media") || value.includes("video")) return ["Video Editor", "Content Creator", "Motion Graphics Designer", "Video Producer"];
  if (value.includes("design") || value.includes("creative")) return ["UI/UX Designer", "Product Designer", "Graphic Designer", "Visual Designer"];
  if (value.includes("management") || value.includes("product")) return ["Product Manager", "Project Manager", "Operations Manager", "Scrum Master"];
  if (value.includes("marketing") || value.includes("sales")) return ["Digital Marketing Specialist", "SEO Specialist", "Sales Executive", "Business Development Manager"];
  if (value.includes("finance") || value.includes("account")) return ["Financial Analyst", "Accountant", "Auditor", "Tax Consultant"];
  if (value.includes("support") || value.includes("operation") || value.includes("hr")) return ["Customer Support Representative", "Technical Support Specialist", "Customer Success Manager", "Operations Associate"];
  if (value.includes("cloud") || value.includes("devops")) return ["DevOps Engineer", "Cloud Engineer", "Site Reliability Engineer", "Platform Engineer"];
  if (value.includes("core engineering")) return ["Mechanical Engineer", "Civil Engineer", "Electrical Engineer", "Hardware Engineer"];
  return ["Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer"];
};

const calculateJobMatchScore = (job, user) => {
  if (!job || !user) return { score: 75, matchedSkills: [], isDomainMatch: true };

  const userField = (user.field || "Software Engineering").toLowerCase();
  const userSkills = user.skills || [];
  const userExp = (user.experienceLevel || "Fresher").toLowerCase();

  const titleLower = (job.title || "").toLowerCase();
  const roleLower = (job.role || job.employmentType || "").toLowerCase();
  const descLower = (job.description || "").toLowerCase();
  const reqLower = Array.isArray(job.skillsRequired)
    ? job.skillsRequired.join(" ").toLowerCase()
    : String(job.skillsRequired || "").toLowerCase();

  const fullText = `${titleLower} ${roleLower} ${descLower} ${reqLower}`;

  // 1. Domain / Field Matching (Max 40 pts)
  const fieldKeywordsMap = {
    "software engineering": ["software", "developer", "engineer", "frontend", "backend", "fullstack", "react", "node", "java", "python", "javascript", "sde", "programmer", "coder", "software engineer", "web developer"],
    "data science & analytics": ["data scientist", "data analyst", "analytics", "data science", "machine learning", "tableau", "power bi", "deep learning", "sql analyst"],
    "product management": ["product manager", "product management", "scrum master", "product owner", "agile coach"],
    "ui/ux & design": ["ui/ux", "ux designer", "ui designer", "graphic designer", "figma", "visual designer", "product designer"],
    "devops & cloud": ["devops", "cloud engineer", "sre", "kubernetes", "docker", "aws", "sysadmin", "infrastructure engineer"],
    "marketing & growth": ["marketing", "growth hacker", "seo", "content writer", "social media", "digital marketing", "brand manager", "mba"],
    "sales & bd": ["sales", "business development", "account executive", "sales manager", "bde", "sales representative"],
    "finance & accounting": ["finance", "accountant", "accounting", "auditor", "financial analyst", "tax consultant"],
    "hr & operations": ["hr", "human resources", "recruiter", "talent acquisition", "people operations", "operations manager"],
    "core engineering": ["mechanical engineer", "civil engineer", "electrical engineer", "hardware engineer", "cad designer"]
  };

  const keywords = fieldKeywordsMap[userField] || [userField];
  const isDomainMatch = keywords.some((kw) => {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(fullText);
  });
  const domainScore = isDomainMatch ? 40 : 0;

  // 2. Skill Matching from Job Description (Max 40 pts)
  const matchedSkills = [];
  userSkills.forEach((skill) => {
    const sLower = skill.toLowerCase();
    const escaped = sLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped}\\b`, "i").test(fullText)) {
      matchedSkills.push(skill);
    }
  });

  const skillCount = userSkills.length || 1;
  const skillRatio = matchedSkills.length / skillCount;
  const skillScore = Math.min(40, Math.round(skillRatio * 40));

  // 3. Experience Match (Max 20 pts)
  let expScore = 20;
  if (userExp.includes("fresher") || userExp.includes("0-2")) {
    if (titleLower.includes("senior") || titleLower.includes("lead") || titleLower.includes("principal")) {
      expScore = 5;
    }
  }

  const rawScore = domainScore + skillScore + expScore;
  const finalScore = isDomainMatch ? Math.min(98, Math.max(50, rawScore)) : Math.max(20, rawScore);

  return {
    score: finalScore,
    matchedSkills,
    isDomainMatch,
  };
};

function CandidateDashboard() {
  const [jobs, setJobs] = useState([]);
  const [recommendedJobsList, setRecommendedJobsList] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [applicationRecords, setApplicationRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [jobLoadError, setJobLoadError] = useState("");

  const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get("search") || "");
  const [submittedSearch, setSubmittedSearch] = useState(() => new URLSearchParams(window.location.search).get("search") || "");
  const [locationFilter, setLocationFilter] = useState(() => new URLSearchParams(window.location.search).get("location") || "");
  const [experienceFilter, setExperienceFilter] = useState("");
  const [salaryFilter, setSalaryFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState("All");
  const [isRemoteFilter, setIsRemoteFilter] = useState("All");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);

  const [selectedJob, setSelectedJob] = useState(null);
  const [jobViewMode, setJobViewMode] = useState("grid");
  const skipJobResetOnTabChangeRef = useRef(false);
  const [isGridJobModalOpen, setIsGridJobModalOpen] = useState(false);
  useEffect(() => {
    if (!isGridJobModalOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsGridJobModalOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isGridJobModalOpen]);
  const [externalApplyToConfirm, setExternalApplyToConfirm] = useState(null);
  const [isConfirmingExternalApplication, setIsConfirmingExternalApplication] = useState(false);
  const pendingExternalApplyRef = useRef(null);
  const externalSiteLeftRef = useRef(false);
  const [isConcernModalOpen, setIsConcernModalOpen] = useState(false);
  const [concernReason, setConcernReason] = useState("");
  const [concernDetails, setConcernDetails] = useState("");
  const [isSubmittingConcern, setIsSubmittingConcern] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [showApplyPanel, setShowApplyPanel] = useState(false);
  const [isExpandingDescription, setIsExpandingDescription] = useState(false);
  
  // Consolidate list tabs (All Jobs, Recommended, Saved)
  const [activeTab, setActiveTab] = useState("All Jobs");
  const [pendingHideJob, setPendingHideJob] = useState(null);
  const [hideJobReason, setHideJobReason] = useState("");
  const [hideJobDetails, setHideJobDetails] = useState("");
  const [isHidingJob, setIsHidingJob] = useState(false);

  // Mobile-specific UI states
  const [isMobileSearchExpanded, setIsMobileSearchExpanded] = useState(false);

  // Resume reuse flow: ask the candidate whether to reuse their saved
  // profile resume, or upload a different one for this specific application.
  const [resumeChoiceMode, setResumeChoiceMode] = useState(false);
  const [useSavedResume, setUseSavedResume] = useState(null); // null | true | false
  const [fetchingSavedResume, setFetchingSavedResume] = useState(false);

  // Profile completion nudge: one-time modal shown on first dashboard visit
  // if the candidate's profile is below the completion threshold.
  const [showProfileNudge, setShowProfileNudge] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [showWelcomeHeader, setShowWelcomeHeader] = useState(() => {
    try {
      return localStorage.getItem(CANDIDATE_WELCOME_DISMISSED_KEY) !== "true";
    } catch {
      return true;
    }
  });
  const [isWelcomeHeaderClosing, setIsWelcomeHeaderClosing] = useState(false);
  const welcomeHeaderRef = useRef(null);

  const [visibleCount, setVisibleCount] = useState(JOBS_PER_PAGE);

  // Mobile detail view toggle
  const [isMobileDetailView, setIsMobileDetailView] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [englishDescription, setEnglishDescription] = useState(null);
  const [isTranslatingDescription, setIsTranslatingDescription] = useState(false);
  const [translationError, setTranslationError] = useState("");
  const [showOriginalDescription, setShowOriginalDescription] = useState(false);

  // Post-Apply Feedback Loop State
  const [pendingFeedbackJob, setPendingFeedbackJob] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Official Admin Communications & Announcements State
  const [officialMessages, setOfficialMessages] = useState([]);
  const [selectedOfficialMessage, setSelectedOfficialMessage] = useState(null);
  const [unreadOfficialCount, setUnreadOfficialCount] = useState(0);
  const [officialFilter, setOfficialFilter] = useState("all"); // "all" | "unread"
  const [loadingOfficialMessages, setLoadingOfficialMessages] = useState(false);
  const [showUrgentBanner, setShowUrgentBanner] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();
  const isJobsView = new URLSearchParams(location.search).get("tab") === "jobs";

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch (error) {
      console.error("Invalid user data:", error);
      return null;
    }
  });
  const popularRoles = getPopularRolesForField(user?.field || "Software Engineering");

  const API_URL = getApiBaseUrl();

  useEffect(() => {
    if (!showWelcomeHeader) return;
    let closeFrame;
    const closeTimer = setTimeout(() => {
      try {
        localStorage.setItem(CANDIDATE_WELCOME_DISMISSED_KEY, "true");
      } catch {
        // Keep the banner dismissal scoped to this render if storage is unavailable.
      }
      const header = welcomeHeaderRef.current;
      if (header) {
        header.style.height = `${header.getBoundingClientRect().height}px`;
        closeFrame = requestAnimationFrame(() => {
          header.style.height = "0px";
          setIsWelcomeHeaderClosing(true);
        });
      } else {
        setIsWelcomeHeaderClosing(true);
      }
    }, 25_000);
    return () => {
      clearTimeout(closeTimer);
      if (closeFrame) cancelAnimationFrame(closeFrame);
    };
  }, [showWelcomeHeader]);

  useEffect(() => {
    if (!isWelcomeHeaderClosing) return;
    const removeTimer = setTimeout(() => setShowWelcomeHeader(false), 1200);
    return () => clearTimeout(removeTimer);
  }, [isWelcomeHeaderClosing]);

  // Define all functions before useEffect hooks
  const fetchJobs = async ({ searchTerm, locationTerm, experienceTerm, salaryTerm, companyTerm, sourceTerm, employmentTerm, remoteTerm, field, page }) => {
    try {
      setJobLoadError("");
      setLoading(true);
      const effectiveField = field !== undefined ? field : user?.field;
      const response = await getJobs({
        search: searchTerm,
        location: locationTerm,
        experience: experienceTerm,
        minSalary: salaryTerm,
        source: sourceTerm,
        employmentType: employmentTerm,
        isRemote: remoteTerm === "true" ? "true" : undefined,
        field: effectiveField,
        page,
        limit: JOBS_PER_PAGE,
      });

      const rawJobs = response?.jobs || [];
      // Deduplicate by _id in case the API returns the same job from multiple sources
      const uniqueJobs = rawJobs.filter(
        (job, idx, arr) => arr.findIndex((j) => j._id === job._id) === idx
      );
      setJobs(uniqueJobs);
      setTotalJobs(response?.totalJobs || 0);
      setTotalPages(response?.totalPages || 1);
      setCurrentPage(response?.currentPage || 1);

      setSelectedJob(null);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setJobLoadError("Unable to load jobs. Please check your connection and retry.");
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const fetchAppliedJobs = async () => {
    try {
      const response = await getMyApplications();
      const records = (response?.applications || []).filter((app) => app?.job);
      setApplicationRecords(records);
      const appliedIds = records.map((app) => app.job._id);
      setAppliedJobs(appliedIds);
    } catch (error) {
      console.error("Error fetching applications:", error);
    }
  };

  const refreshRecommendedJobs = async () => {
    try {
      const response = await getRecommendedJobs();
      setRecommendedJobsList(response?.jobs || []);
    } catch (error) {
      console.error("Failed to refresh personalized recommendations:", error);
    }
  };

  const debouncedFetchJobs = useMemo(
    () =>
      debounce((params) => {
        fetchJobs(params);
      }, 400),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleOnboardingComplete = async (updatedUser) => {
    setUser(updatedUser);
    setStoredUser(updatedUser);
    try {
      const recRes = await getRecommendedJobs();
      setRecommendedJobsList(recRes?.jobs || []);
    } catch (err) {
      console.error("Failed to refresh recommended jobs after onboarding:", err);
    }
    fetchJobs({
      searchTerm: submittedSearch,
      locationTerm: locationFilter,
      experienceTerm: experienceFilter,
      salaryTerm: salaryFilter,
      companyTerm: companyFilter,
      sourceTerm: sourceFilter,
      employmentTerm: employmentTypeFilter,
      remoteTerm: isRemoteFilter,
      field: updatedUser?.field,
      page: 1,
    });
  };

  useEffect(() => {
    const fetchAllInitialData = async () => {
      let currentUser = user;
      // Sync fresh user profile to ensure hasCompletedOnboarding is accurate
      try {
        const profileRes = await getUserProfile();
        if (profileRes?.user) {
          currentUser = profileRes.user;
          setUser(profileRes.user);
          setStoredUser(profileRes.user);
        }
      } catch (err) {
        console.error("Failed to sync user profile on mount:", err);
      }

      await fetchAppliedJobs();
      
      // Fetch normal jobs
      await fetchJobs({
        searchTerm: submittedSearch,
        locationTerm: locationFilter,
        experienceTerm: experienceFilter,
        salaryTerm: salaryFilter,
        companyTerm: companyFilter,
        sourceTerm: sourceFilter,
        employmentTerm: employmentTypeFilter,
        remoteTerm: isRemoteFilter,
        field: currentUser?.field,
        page: currentPage,
      });

      // Fetch globally recommended jobs from backend
      try {
        const response = await getRecommendedJobs();
        setRecommendedJobsList(response?.jobs || []);
      } catch (err) {
        console.error("Failed to load recommended jobs", err);
      }
    };

    fetchAllInitialData();
  }, []); // eslint-disable-next-line react-hooks/exhaustive-deps

  // Profile completion nudge â€” runs once per account, ever, unless they
  // complete enough of their profile that it would no longer trigger.
  // We only show this after onboarding has been completed.
  useEffect(() => {
    if (!user?.email || !user?.hasCompletedOnboarding) return;

    const nudgeKey = `sb_seen_profile_nudge_${user.email}`;
    const alreadySeen = localStorage.getItem(nudgeKey) === "true";
    const completion = calculateCompletion(user);

    if (!alreadySeen && completion < PROFILE_NUDGE_THRESHOLD) {
      setShowProfileNudge(true);
      localStorage.setItem(nudgeKey, "true");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.hasCompletedOnboarding]);

  useEffect(() => {
    const hasSeen = localStorage.getItem("has_seen_dashboard_tour_v1");
    if (!hasSeen) {
      const timer = setTimeout(() => {
        localStorage.setItem("has_seen_dashboard_tour_v1", "true");
        setIsTourOpen(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (location.state?.openGuidedTour) setIsTourOpen(true);
  }, [location.state]);

  useEffect(() => {
    if (location.state?.roleType === "remote") {
      setLocationFilter("Remote");
    } else if (location.state?.roleType === "all") {
      setLocationFilter("");
    }
  }, [location.state]);

  // Auto-expand snippet descriptions onsite so candidates never have to leave SkillBridge
  const attemptedExpansionIdsRef = useRef(new Set());
  useEffect(() => {
    if (
      !selectedJob?._id ||
      selectedJob.descriptionUnavailable ||
      attemptedExpansionIdsRef.current.has(selectedJob._id)
    ) {
      return;
    }

    const isReferralAlert = isReferralAlertDescription(selectedJob.description);
    const isTruncatedSnippet = isDescriptionSnippet(selectedJob.description);

    if (isReferralAlert || isTruncatedSnippet) {
      attemptedExpansionIdsRef.current.add(selectedJob._id);
      let isCancelled = false;
      setIsExpandingDescription(true);

      getFullJobDescriptionAPI(selectedJob._id)
        .then((res) => {
          if (!isCancelled && res?.jobId) {
            const description = res.isSourceVerified
              ? res.description
              : isReferralAlert
                ? ""
                : res.description || selectedJob.description;
            const descriptionUnavailable = isReferralAlert && !res.isSourceVerified;
            setSelectedJob((prev) =>
              prev && prev._id === res.jobId
                ? { ...prev, description, isFullDescription: res.isFullDescription === true, descriptionSourceVerified: res.isSourceVerified === true, descriptionUnavailable }
                : prev
            );
            setJobs((prevJobs) =>
              prevJobs.map((j) =>
                j._id === res.jobId
                  ? { ...j, description, isFullDescription: res.isFullDescription === true, descriptionSourceVerified: res.isSourceVerified === true, descriptionUnavailable }
                  : j
              )
            );
            setRecommendedJobsList((prevRec) =>
              prevRec.map((j) =>
                j._id === res.jobId
                  ? { ...j, description, isFullDescription: res.isFullDescription === true, descriptionSourceVerified: res.isSourceVerified === true, descriptionUnavailable }
                  : j
              )
            );
          }
        })
        .catch((err) => {
          attemptedExpansionIdsRef.current.delete(selectedJob._id);
          console.warn("Could not expand full job description:", err?.message);
        })
        .finally(() => {
          if (!isCancelled) setIsExpandingDescription(false);
        });

      return () => {
        isCancelled = true;
      };
    }
  }, [selectedJob?._id, selectedJob?.description, selectedJob?.isFullDescription, selectedJob?.descriptionUnavailable]);

  useEffect(() => {
    if (
      !selectedJob?._id ||
      !selectedJob.description ||
      isReferralAlertDescription(selectedJob.description) ||
      isDescriptionInEnglish(selectedJob.description)
    ) {
      setEnglishDescription(null);
      setTranslationError("");
      setShowOriginalDescription(false);
      setIsTranslatingDescription(false);
      return;
    }
    let isCancelled = false;
    const { _id, description } = selectedJob;
    setEnglishDescription(null);
    setTranslationError("");
    setShowOriginalDescription(false);
    setIsTranslatingDescription(true);

    getEnglishJobDescriptionAPI(_id)
      .then((result) => {
        if (isCancelled) return;
        if (result?.description) {
          setEnglishDescription({ jobId: _id, source: description, text: result.description });
        } else {
          setTranslationError("We couldn't translate this description. Try again.");
        }
      })
      .catch((error) => {
        console.warn("Could not translate job description:", error?.message);
        if (!isCancelled) setTranslationError(error?.response?.data?.message || "English translation is unavailable. Try again.");
      })
      .finally(() => {
        if (!isCancelled) setIsTranslatingDescription(false);
      });

    return () => { isCancelled = true; };
  }, [selectedJob?._id, selectedJob?.description]);

  // Post-Apply Visibility Listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && pendingFeedbackJob) {
        setTimeout(() => {
          setShowFeedbackModal(true);
        }, 500);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pendingFeedbackJob]);

  useEffect(() => {
    try {
      const pending = JSON.parse(sessionStorage.getItem(PENDING_EXTERNAL_APPLICATION_KEY) || "null");
      if (pending?.jobId) {
        pendingExternalApplyRef.current = pending;
        setExternalApplyToConfirm(pending);
      }
    } catch {
      sessionStorage.removeItem(PENDING_EXTERNAL_APPLICATION_KEY);
    }

    const handleBlur = () => {
      if (pendingExternalApplyRef.current) externalSiteLeftRef.current = true;
    };
    const handleReturn = () => {
      if (document.visibilityState !== "visible" || !externalSiteLeftRef.current) return;
      externalSiteLeftRef.current = false;
      setExternalApplyToConfirm(pendingExternalApplyRef.current);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (pendingExternalApplyRef.current) externalSiteLeftRef.current = true;
      } else {
        handleReturn();
      }
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleReturn);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleReturn);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    debouncedFetchJobs({
      searchTerm: submittedSearch,
      locationTerm: locationFilter,
      experienceTerm: experienceFilter,
      salaryTerm: salaryFilter,
      companyTerm: companyFilter,
      sourceTerm: sourceFilter,
      employmentTerm: employmentTypeFilter,
      remoteTerm: isRemoteFilter,
      field: user?.field,
      page: 1,
    });
  }, [submittedSearch, locationFilter, experienceFilter, salaryFilter, companyFilter, sourceFilter, employmentTypeFilter, isRemoteFilter, user?.field, debouncedFetchJobs]);

  const submitApplication = async (fileToSubmit) => {
    const resumeToSend = fileToSubmit || resumeFile;

    if (!resumeToSend) {
      return toast.error("Please upload your resume");
    }

    try {
      setApplying(true);
      const formData = new FormData();
      formData.append("resume", resumeToSend);
      formData.append("jobId", selectedJob?._id);

      const response = await applyJob(formData);
      toast.success(response?.message || "Application submitted successfully");

      if (response?.user) {
        setUser(response.user);
        setStoredUser(response.user);
      }

      setAppliedJobs((prev) => [...prev, selectedJob?._id]);

      // Do NOT auto-switch the job, keep the current job open so the user 
      // can see the "Applied Already" button state.
      resetApplyState();
    } catch (error) {
      console.error("Application Error:", error);
      toast.error(error?.response?.data?.message || "Application Failed");
    } finally {
      setApplying(false);
    }
  };

  const resetApplyState = () => {
    setShowApplyPanel(false);
    setResumeFile(null);
    setResumeChoiceMode(false);
    setUseSavedResume(null);
  };

  // External listings are only tracked after the candidate confirms they applied.
  const handleApplyNowClick = async () => {
    if (selectedJob?.isExternal) {
      const pending = {
        jobId: selectedJob._id,
        title: selectedJob.title,
        company: selectedJob.company,
        companyLogo: selectedJob.companyLogo,
      };
      sessionStorage.setItem(PENDING_EXTERNAL_APPLICATION_KEY, JSON.stringify(pending));
      pendingExternalApplyRef.current = pending;
      externalSiteLeftRef.current = false;
      if (/^mailto:/i.test(selectedJob.applyUrl || "")) {
        window.location.href = selectedJob.applyUrl;
      } else {
        window.open(selectedJob.applyUrl, "_blank", "noopener,noreferrer");
      }
      return;
    }

    if (user?.resume) {
      setResumeChoiceMode(true);
    } else {
      setShowApplyPanel(true);
    }
  };
  
  const handleConfirmExternalApplication = async (applied) => {
    const pending = externalApplyToConfirm;
    if (!pending) return;
    if (!applied) {
      sessionStorage.removeItem(PENDING_EXTERNAL_APPLICATION_KEY);
      pendingExternalApplyRef.current = null;
      setExternalApplyToConfirm(null);
      return;
    }

    setIsConfirmingExternalApplication(true);
    try {
      await applyExternal(pending.jobId);
      setAppliedJobs((prev) => [...new Set([...prev, pending.jobId])]);
      toast.success("Application added to My Applications.");
      sessionStorage.removeItem(PENDING_EXTERNAL_APPLICATION_KEY);
      pendingExternalApplyRef.current = null;
      setExternalApplyToConfirm(null);
    } catch (error) {
      console.error("Failed to track confirmed external application:", error);
      toast.error(error?.response?.data?.message || "Could not update My Applications. Please try again.");
    } finally {
      setIsConfirmingExternalApplication(false);
    }
  };

  const handleToggleSave = async (jobId) => {
    if (!jobId) return;

    try {
      const response = await toggleSaveJob({ jobId });
      const updatedSavedJobs = response?.savedJobs || [];

      const updatedUser = {
        ...user,
        savedJobs: updatedSavedJobs,
      };

      setUser(updatedUser);
      setStoredUser(updatedUser);
    } catch (error) {
      console.error("Save job error:", error);
      toast.error("Could not update saved jobs");
    }
  };

  const openHideJobFeedback = (job) => {
    if (!job) return;
    setPendingHideJob(job);
    setHideJobReason("");
    setHideJobDetails("");
  };

  const handleConfirmHideJob = async () => {
    if (!pendingHideJob || !hideJobReason || (hideJobReason === "other" && !hideJobDetails.trim())) return;
    try {
      setIsHidingJob(true);
      await hideJob(pendingHideJob._id, {
        reason: hideJobReason,
        details: hideJobDetails.trim(),
      });
      await refreshRecommendedJobs();
      toast.success("Job hidden. Your recommendations have been updated.");
      setJobs((prev) => prev.filter((job) => job._id !== pendingHideJob._id));
      setRecommendedJobsList((prev) => prev.filter((job) => job._id !== pendingHideJob._id));
      if (selectedJob?._id === pendingHideJob._id) {
        const remaining = jobs.filter((job) => job._id !== pendingHideJob._id);
        setSelectedJob(remaining.length > 0 ? remaining[0] : null);
      }
      setPendingHideJob(null);
    } catch (error) {
      console.error("Could not hide job:", error);
      toast.error(error?.response?.data?.message || "Could not hide job");
    } finally {
      setIsHidingJob(false);
    }
  };

  const handleShareJob = (job) => {
    if (!job) return;
    const shareUrl = `${window.location.origin}/candidate-dashboard?jobId=${job._id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Job link copied to clipboard!");
    } else {
      toast.success("Job link ready to share!");
    }
  };

  const handleTranslateJobDescription = async () => {
    if (!selectedJob?._id || isTranslatingDescription) return;
    const { _id, description } = selectedJob;
    setIsTranslatingDescription(true);
    setTranslationError("");
    try {
      const result = await getEnglishJobDescriptionAPI(_id);
      if (result?.description) {
        setEnglishDescription({ jobId: _id, source: description, text: result.description });
        setShowOriginalDescription(false);
      } else {
        setTranslationError("No English translation was returned. Please try again.");
      }
    } catch (error) {
      setTranslationError(error?.response?.data?.message || "English translation is unavailable. Try again.");
    } finally {
      setIsTranslatingDescription(false);
    }
  };

  const handleSubmitJobConcern = async (event) => {
    event.preventDefault();
    if (!selectedJob || !JOB_CONCERN_REASONS.includes(concernReason)) return;

    setIsSubmittingConcern(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${getApiBaseUrl()}/api/support/report`, {
        reportType: "job_concern",
        concernReason,
        details: concernDetails.trim(),
        reportedJob: {
          id: selectedJob._id,
          title: selectedJob.title,
          company: selectedJob.company,
        },
        pageUrl: `/candidate-dashboard?jobId=${selectedJob._id}`,
      }, {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        timeout: 45000,
      });
      toast.success("Thanks. Your concern has been submitted for review.");
      setIsConcernModalOpen(false);
      setConcernReason("");
      setConcernDetails("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not submit your concern. Please try again.");
    } finally {
      setIsSubmittingConcern(false);
    }
  };

  const closeJobConcernModal = () => {
    if (isSubmittingConcern) return;
    setIsConcernModalOpen(false);
    setConcernReason("");
    setConcernDetails("");
  };

  // Candidate confirmed: reuse the saved profile resume for this application.
  const handleUseSavedResume = async () => {
    try {
      setApplying(true);
      const formData = new FormData();
      formData.append("jobId", selectedJob?._id);
      formData.append("useProfileResume", "true");

      const response = await applyJob(formData);
      toast.success(response?.message || "Application submitted successfully");

      if (response?.user) {
        setUser(response.user);
        setStoredUser(response.user);
      }

      setAppliedJobs((prev) => [...prev, selectedJob?._id]);
      resetApplyState();
    } catch (error) {
      console.error("Application Error:", error);
      toast.error(error?.response?.data?.message || "Application Failed");
      setResumeChoiceMode(false);
      setShowApplyPanel(true);
    } finally {
      setApplying(false);
    }
  };

  // Candidate declined: show the normal uploader for a different resume.
  const handleUseDifferentResume = () => {
    setUseSavedResume(false);
    setResumeChoiceMode(false);
    setShowApplyPanel(true);
  };

  const closeFeedbackModal = () => {
    setShowFeedbackModal(false);
    setPendingFeedbackJob(null);
  };

  const handleFeedbackYes = async () => {
    if (!pendingFeedbackJob) return;
    try {
      await applyExternal(pendingFeedbackJob._id);
      setAppliedJobs((prev) => [...prev, pendingFeedbackJob._id]);
      toast.success("Great! Application tracked.");
    } catch (error) {
      console.error(error);
    }
    closeFeedbackModal();
  };

  const handleFeedbackNo = () => {
    closeFeedbackModal();
  };

  const handleFeedbackHide = async () => {
    if (!pendingFeedbackJob) return;
    try {
      await hideJob(pendingFeedbackJob._id, { reason: "not_interested" });
      await refreshRecommendedJobs();
      toast.success("Job hidden. Your recommendations have been updated.");
      
      setJobs((prev) => prev.filter((j) => j._id !== pendingFeedbackJob._id));
      setRecommendedJobsList((prev) => prev.filter((j) => j._id !== pendingFeedbackJob._id));
      
      if (selectedJob?._id === pendingFeedbackJob._id) {
        setSelectedJob(null);
        setIsMobileDetailView(false);
      }
    } catch {
      toast.error("Failed to hide job");
    }
    closeFeedbackModal();
  };

  const INDIAN_CITIES = [
    "india", "bangalore", "bengaluru", "mumbai", "delhi", "noida", "gurgaon", "gurugram", 
    "hyderabad", "chennai", "pune", "jaipur", "kolkata", "ahmedabad", "surat", "chandigarh", "kochi"
  ];

  const matchesLocationFilter = (jobLocation, filterTerm) => {
    if (!filterTerm || !filterTerm.trim()) return true;
    const term = filterTerm.trim().toLowerCase();
    const loc = (jobLocation || "").toLowerCase();

    if (term === "india") {
      return INDIAN_CITIES.some((city) => loc.includes(city));
    }
    return loc.includes(term);
  };

  const availableJobs = jobs
    .filter((job) => !appliedJobs.includes(job._id))
    .filter((job, idx, arr) => arr.findIndex((j) => j._id === job._id) === idx)
    .filter((job) => {
      // Location filter check for All Jobs
      if (locationFilter && !matchesLocationFilter(job.location, locationFilter)) {
        return false;
      }
      return true;
    });

  // Combine initial recommended jobs + live search result jobs for the Recommended tab
  const availableRecommended = [...recommendedJobsList, ...jobs]
    .filter((job) => !appliedJobs.includes(job._id))
    .filter((job, idx, arr) => arr.findIndex((j) => j._id === job._id) === idx);

  // Apply location, search, and experience filters to Recommended tab as well
  const filteredRecommended = availableRecommended.filter((job) => {
    // 1. Location Filter
    if (locationFilter && !matchesLocationFilter(job.location, locationFilter)) {
      return false;
    }

    // 2. Keyword Search
    if (submittedSearch && submittedSearch.trim()) {
      const sTerm = submittedSearch.trim().toLowerCase();
      const titleLower = (job.title || "").toLowerCase();
      const companyLower = (job.company || "").toLowerCase();
      const descLower = (job.description || "").toLowerCase();
      const matchesSearch = titleLower.includes(sTerm) || companyLower.includes(sTerm) || descLower.includes(sTerm);
      if (!matchesSearch) return false;
    }

    // 3. Experience Level Filter
    if (experienceFilter && experienceFilter !== "All Experience") {
      const jobExperience = (job.experienceRequired || "").toLowerCase();
      const expLower = experienceFilter.toLowerCase();
      let matchesExp;
      if (expLower.includes("0-1") || expLower.includes("0–1") || expLower === "0-2 years") {
        matchesExp = jobExperience.includes("0-1") || jobExperience.includes("0–1") || jobExperience.includes("0-2") || jobExperience.includes("fresher") || jobExperience.includes("entry");
      } else if (expLower.includes("1-3") || expLower.includes("1–3")) {
        matchesExp = jobExperience.includes("1-3") || jobExperience.includes("1–3") || jobExperience.includes("0-2") || jobExperience.includes("2-5");
      } else if (expLower.includes("3-5") || expLower.includes("3–5") || expLower === "2-5 years") {
        matchesExp = jobExperience.includes("3-5") || jobExperience.includes("3–5") || jobExperience.includes("2-5") || jobExperience.includes("1-3");
      } else if (expLower.includes("5+")) {
        matchesExp = jobExperience.includes("5+") || jobExperience.includes("senior") || jobExperience.includes("lead");
      } else {
        matchesExp = jobExperience === expLower;
      }
      if (jobExperience && !matchesExp) {
        return false;
      }
    }

    // 4. Fresher/Junior Experience Guard
    const titleLower = job.title?.toLowerCase() || "";
    const userExp = user?.experienceLevel?.toLowerCase() || "fresher";

    if (userExp === "fresher" || userExp === "0-2 years") {
      if (
        titleLower.includes("senior") || 
        titleLower.includes("lead") || 
        titleLower.includes("principal") || 
        titleLower.includes("staff") ||
        titleLower.includes("director") ||
        titleLower.includes("head")
      ) {
        return false;
      }
    }
    return true;
  }).sort((a, b) => {
    const scoreA = calculateJobMatchScore(a, user).score;
    const scoreB = calculateJobMatchScore(b, user).score;
    return scoreB - scoreA;
  });

  const rawDisplayed = activeTab === "Recommended"
    ? filteredRecommended
    : activeTab === "Saved"
    ? availableJobs.filter((job) => user?.savedJobs?.includes(job._id))
    : availableJobs;

  // Final deduplication guard â€” ensures no duplicate _id regardless of source
  const seen = new Set();
  const displayedJobs = rawDisplayed.filter((job) => {
    if (!job._id || seen.has(job._id)) return false;
    seen.add(job._id);
    return true;
  });

  const visibleJobs = displayedJobs;

  const changeJobView = (mode) => {
    const updateView = () => {
      const jobForView = selectedJob || (mode === "split" ? displayedJobs[0] : null);
      if (mode === "split" && !selectedJob && jobForView) setSelectedJob(jobForView);
      setJobViewMode(mode);
      setIsMobileDetailView(window.innerWidth < 1024 && Boolean(jobForView));
      setIsGridJobModalOpen(false);
    };

    if (typeof document.startViewTransition === "function") {
      document.startViewTransition(() => flushSync(updateView));
    } else {
      updateView();
    }
  };

  const handleJobSelect = (job) => {
    setSelectedJob(job);
    setIsGridJobModalOpen(jobViewMode === "grid");
    resetApplyState();
    setIsMobileDetailView(window.innerWidth < 1024);
    setIsDescriptionExpanded(false);
  };

  // Reset pagination whenever the filters or the All/Recommended toggle change,
  // so a new search always starts back at the first 20 results.
  useEffect(() => {
    setVisibleCount(JOBS_PER_PAGE);
  }, [submittedSearch, locationFilter, salaryFilter, companyFilter, activeTab]);

  useEffect(() => {
    if (skipJobResetOnTabChangeRef.current) {
      skipJobResetOnTabChangeRef.current = false;
      return;
    }
    setSelectedJob(null);
  }, [activeTab]);

  const profileCompletion = user ? calculateCompletion(user) : 0;

  const retryFetchJobs = () => {
    fetchJobs({
      searchTerm: submittedSearch,
      locationTerm: locationFilter,
      salaryTerm: salaryFilter,
      companyTerm: companyFilter,
      page: currentPage,
    });
  };

  // Fetch official messages from backend
  const fetchOfficialMessages = useCallback(async () => {
    setLoadingOfficialMessages(true);
    try {
      const res = await getMyMessages({ page: 1, limit: 50 });
      if (res?.success) {
        const msgs = res.messages || [];
        setOfficialMessages(msgs);
        const unread = typeof res.unreadCount === "number"
          ? res.unreadCount
          : msgs.filter((m) => !m.isRead).length;
        setUnreadOfficialCount(unread);
        if (msgs.length > 0) {
          setSelectedOfficialMessage((prev) => {
            if (prev) {
              return msgs.find((m) => m._id === prev._id) || msgs[0];
            }
            return msgs[0];
          });
        }
      }
    } catch (err) {
      console.warn("Failed fetching official communications:", err);
    } finally {
      setLoadingOfficialMessages(false);
    }
  }, []);

  // Listen to URL ?tab=messages or ?tab=alerts
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (tabParam === "messages" || tabParam === "alerts") {
      window.dispatchEvent(new CustomEvent("skillbridge_open_messages"));
    }
  }, [location.search]);

  // Initial fetch and global event listeners for official messages
  useEffect(() => {
    fetchOfficialMessages();

    const handleSync = (e) => {
      if (typeof e.detail?.unreadCount === "number") {
        setUnreadOfficialCount(e.detail.unreadCount);
      } else {
        fetchOfficialMessages();
      }
    };

    window.addEventListener("skillbridge_official_messages_updated", handleSync);
    return () => {
      window.removeEventListener("skillbridge_official_messages_updated", handleSync);
    };
  }, [fetchOfficialMessages]);

  const handleSelectOfficialMessage = (msg) => {
    setSelectedOfficialMessage(msg);
    setIsMobileDetailView(true);
    if (!msg.isRead) {
      // Optimistic update
      setOfficialMessages((prev) =>
        prev.map((m) => (m._id === msg._id ? { ...m, isRead: true } : m))
      );
      setUnreadOfficialCount((prev) => {
        const next = Math.max(0, prev - 1);
        notifyMessagesUpdated(next);
        return next;
      });
      markMessageAsRead(msg._id).catch((err) => {
        console.error("Failed marking official message as read:", err);
      });
    }
  };

  const handleMarkAllOfficialRead = async () => {
    setOfficialMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
    setUnreadOfficialCount(0);
    notifyMessagesUpdated(0);
    try {
      await markAllMessagesAsRead();
      toast.success("All messages marked as read");
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark all as read");
    }
  };

  const renderPriorityBadge = (priority) => {
    switch (priority) {
      case "urgent":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangleIcon size={11} />
            Urgent Action Required
          </span>
        );
      case "announcement":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <MegaphoneIcon size={11} />
            Platform Update
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-brand-700 border border-blue-200">
            <InfoIcon size={11} />
            Notice
          </span>
        );
    }
  };

  const filteredOfficialMessages = officialMessages.filter((m) => {
    if (officialFilter === "unread") return !m.isRead;
    return true;
  });

  const urgentOfficialMessage = officialMessages.find(
    (m) => !m.isRead && (m.priority === "urgent" || m.priority === "announcement")
  );

  const openRecommendedJob = (job) => {
    if (activeTab !== "All Jobs") skipJobResetOnTabChangeRef.current = true;
    setActiveTab("All Jobs");
    setSelectedJob(job);
    setJobViewMode("split");
    setIsGridJobModalOpen(false);
    setIsMobileDetailView(window.innerWidth < 1024);
    setIsDescriptionExpanded(false);
    resetApplyState();
    navigate("/candidate-dashboard?tab=jobs");
  };

  const homeJobPool = [...new Map([...recommendedJobsList, ...jobs].filter((job) => job?._id).map((job) => [job._id, job])).values()];
  const homeCompanies = [...new Map(homeJobPool.filter((job) => job.company).map((job) => [job.company, job])).values()].slice(0, 6);
  const recommendedIds = new Set(recommendedJobsList.map((job) => job._id));
  const homeLatestJobs = jobs.filter((job) => !recommendedIds.has(job._id)).slice(0, 4);
  if (!homeLatestJobs.length) homeLatestJobs.push(...jobs.slice(0, 4));

  return (
    <div className="candidate-dashboard-surface w-full min-h-screen font-sans pb-3">
      <DashboardTour isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />
      <h1 className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', borderWidth: 0 }}>Candidate Dashboard</h1>
      {jobLoadError && (
        <div className="flex justify-end px-6 w-full mb-4">
          <RetryBanner message={jobLoadError} onRetry={retryFetchJobs} />
        </div>
      )}
      
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-4">
        {/* DASHBOARD TOP HEADER & TOUR BAR */}
        {isJobsView && showWelcomeHeader && (
          <div ref={welcomeHeaderRef} className={`candidate-welcome-collapse${isWelcomeHeaderClosing ? " is-closing" : ""}`}>
            <div className="candidate-welcome-header bg-white p-4 sm:px-6 sm:py-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">CANDIDATE WORKSPACE</span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 m-0">Welcome back, {user?.name?.split(" ")[0] || "Candidate"}! 👋</h2>
              </div>
            </div>
          </div>
        )}

        {/* TOP SUMMARY BANNER FOR URGENT / UNREAD OFFICIAL COMMUNICATIONS */}
        {unreadOfficialCount > 0 && showUrgentBanner && (
          <div className={`mb-5 p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm ${
            urgentOfficialMessage?.priority === "announcement"
              ? "bg-purple-50 border-purple-200 text-purple-900"
              : urgentOfficialMessage?.priority === "urgent"
              ? "bg-rose-50 border-rose-200 text-rose-900"
              : "bg-blue-50 border-blue-200 text-blue-900"
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/80 flex items-center justify-center shrink-0 shadow-xs">
                {urgentOfficialMessage?.priority === "urgent" ? (
                  <AlertTriangleIcon size={18} className="text-rose-600" />
                ) : urgentOfficialMessage?.priority === "announcement" ? (
                  <MegaphoneIcon size={18} className="text-purple-600" />
                ) : (
                  <ShieldIcon size={18} className="text-blue-600" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold m-0 leading-tight">
                  {urgentOfficialMessage?.priority === "urgent"
                    ? `You have ${unreadOfficialCount} unread urgent notification${unreadOfficialCount > 1 ? "s" : ""} from administration`
                    : `You have ${unreadOfficialCount} unread official announcement${unreadOfficialCount > 1 ? "s" : ""}`}
                </h4>
                <p className="text-xs text-slate-600 m-0 mt-0.5">
                  {urgentOfficialMessage ? urgentOfficialMessage.title : "Check your official communications hub for critical platform updates."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("skillbridge_open_messages"));
                }}
              >
                <span>View Messages</span>
                <ChevronRightIcon size={14} />
              </button>
              <button
                type="button"
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white/60 transition-colors border-0 bg-transparent cursor-pointer"
                onClick={() => setShowUrgentBanner(false)}
                title="Dismiss alert banner"
                aria-label="Dismiss banner"
              >
                <CloseIcon size={16} />
              </button>
            </div>
          </div>
        )}

        {isJobsView ? (
        <>
        {/* JOB DISCOVERY SEARCH */}
        <section className="candidate-home-search mb-5" data-tour="search-filters">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
            <div>
              <p className="candidate-home-eyebrow">YOUR NEXT MOVE</p>
              <h2 className="candidate-home-title">Find work that fits your life</h2>
              <p className="candidate-home-subtitle">Search roles by title, skills, company, or location.</p>
            </div>
            {!loading && (
              <div className="candidate-results-summary" aria-live="polite">
                <strong>{totalJobs.toLocaleString()}</strong>
                <span>open roles</span>
              </div>
            )}
          </div>

          <div className="candidate-search-controls">
            <div 
              className="candidate-search-bar flex flex-col md:flex-row items-stretch md:items-center bg-white border border-slate-300 rounded-2xl shadow-sm p-1.5 gap-1 hover:border-slate-400 transition-colors cursor-pointer md:cursor-default"
              onClick={() => window.innerWidth <= 768 && setIsMobileSearchExpanded(true)}
            >
              <div className="flex-1 flex items-center px-3 py-2 gap-2.5 min-w-0">
                <FiSearch className="text-slate-400 text-lg shrink-0" />
                <label className="sr-only" htmlFor="candidate-job-search">Job title, skills, or company</label>
                <input
                  id="candidate-job-search"
                  type="text"
                  placeholder="Job title, keywords, or company"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  readOnly={window.innerWidth <= 768}
                  className="w-full bg-transparent border-0 outline-none text-sm text-slate-900 placeholder:text-slate-400 font-medium"
                />
              </div>
              <div className="hidden md:block w-px h-7 bg-slate-200 my-auto shrink-0" />
              <div className="hidden md:flex flex-1 items-center px-3 py-2 gap-2.5 min-w-0">
                <FiMapPin className="text-slate-400 text-lg shrink-0" />
                <label className="sr-only" htmlFor="candidate-location-search">Location</label>
                <input
                  id="candidate-location-search"
                  type="text"
                  placeholder="e.g. India, USA, or Bangalore..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full bg-transparent border-0 outline-none text-sm text-slate-900 placeholder:text-slate-400 font-medium"
                />
              </div>
              <div className="hidden md:block w-px h-7 bg-slate-200 my-auto shrink-0" />
              <div className="hidden md:flex flex-1 items-center px-3 py-2 gap-2.5 min-w-0">
                <CalendarClock className="text-slate-400 shrink-0" size={18} aria-hidden="true" />
                <ExperienceSelect
                  borderless
                  aria-label="Filter by experience"
                  value={experienceFilter}
                  onChange={(e) => setExperienceFilter(e.target.value)}
                  placeholder="All Experience"
                  className="w-full text-sm"
                />
              </div>
              <button 
                className="hidden md:block md:-translate-x-1 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-sm rounded-full cursor-pointer transition-all shrink-0 shadow-sm border-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                onClick={(e) => {
                  e.stopPropagation();
                  setSubmittedSearch(search.trim());
                  setCurrentPage(1);
                }}
              >
                Find jobs
              </button>
            </div>

            <div className="candidate-desktop-filters hidden md:grid">
              <CustomSelect
                options={getSalaryOptions(user?.country)}
                value={salaryFilter}
                onChange={(e) => setSalaryFilter(e.target.value)}
                placeholder={`Any salary (${getCountryCurrency(user?.country).symbol})`}
                aria-label="Filter by minimum salary"
                borderless
                mutedValue
                maxMenuHeight={320}
                className="candidate-filter-select"
              />
              <div className="candidate-filter-select-with-icon">
                <BriefcaseBusiness size={17} className="candidate-filter-prefix-icon" aria-hidden="true" />
                <CustomSelect
                options={[
                  { value: "All", label: "Any job type" },
                  { value: "Full-time", label: "Full-time" },
                  { value: "Internship", label: "Internship" },
                  { value: "Contract", label: "Contract" },
                  { value: "Part-time", label: "Part-time" },
                ]}
                value={employmentTypeFilter}
                onChange={(e) => setEmploymentTypeFilter(e.target.value)}
                placeholder="Any job type"
                aria-label="Filter by job type"
                borderless
                mutedValue
                maxMenuHeight={320}
                className="candidate-filter-select candidate-filter-select-has-icon"
                />
              </div>
              <label className={`candidate-remote-filter ${isRemoteFilter === "true" ? "is-active" : ""}`}>
                <input
                  type="checkbox"
                  checked={isRemoteFilter === "true"}
                  onChange={(e) => setIsRemoteFilter(e.target.checked ? "true" : "All")}
                />
                <span>Remote only</span>
              </label>
              {(submittedSearch || locationFilter || experienceFilter || salaryFilter || companyFilter || sourceFilter || employmentTypeFilter !== "All" || isRemoteFilter === "true") && (
                <button
                  type="button"
                  className="candidate-clear-filters"
                  onClick={() => {
                    setSearch("");
                    setSubmittedSearch("");
                    setLocationFilter("");
                    setExperienceFilter("");
                    setSalaryFilter("");
                    setCompanyFilter("");
                    setSourceFilter("");
                    setEmploymentTypeFilter("All");
                    setIsRemoteFilter("All");
                    setCurrentPage(1);
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </section>
        </>
        ) : (
          <section className="space-y-6 pb-8" aria-labelledby="candidate-home-title">
            <div className="rounded-3xl border border-[#e9dfd1] bg-gradient-to-br from-[#fffdf9] via-white to-[#f7eddf] p-6 shadow-sm sm:p-8">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
                <div>
                <p className="candidate-home-eyebrow">YOUR CAREER, IN MOTION</p>
                <h2 id="candidate-home-title" className="m-0 max-w-2xl text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl">
                  Find your next opportunity, {user?.name?.split(" ")[0] || "Candidate"}.
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                  Explore roles that match your skills and move your career forward.
                </p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm">
                  <div>
                    <p className="m-0 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">Your profile</p>
                    <p className="mb-0 mt-1 text-2xl font-black text-slate-900">{profileCompletion}<span className="text-base text-slate-400">% complete</span></p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Profile completion" aria-valuenow={profileCompletion} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full rounded-full bg-brand-600 transition-[width] duration-500" style={{ width: `${profileCompletion}%` }} />
                  </div>
                  <button type="button" onClick={() => navigate("/candidate-profile")} className="mt-3 inline-flex items-center gap-1 border-0 bg-transparent p-0 text-sm font-bold text-brand-700 hover:text-brand-800">
                    Complete your profile <ChevronRightIcon size={15} />
                  </button>
                </div>
              </div>

              <form onSubmit={(event) => { event.preventDefault(); setSubmittedSearch(search.trim()); setCurrentPage(1); navigate("/candidate-dashboard?tab=jobs"); }} className="mt-6 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm md:flex-row md:items-center">
                <label className="sr-only" htmlFor="home-job-search">Job title, company, or skill</label>
                <div className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2"><FiSearch className="shrink-0 text-slate-400" size={19} /><input id="home-job-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Job title, company, or skill" className="w-full border-0 bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400" /></div>
                <span className="hidden h-8 w-px bg-slate-200 md:block" aria-hidden="true" />
                <label className="sr-only" htmlFor="home-location-search">Location or remote</label>
                <div className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2"><FiMapPin className="shrink-0 text-slate-400" size={19} /><input id="home-location-search" value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} placeholder="Location or Remote" className="w-full border-0 bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400" /></div>
                <button type="submit" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border-0 bg-brand-600 px-5 text-sm font-bold text-white transition hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">Find jobs <ArrowUpRight size={16} /></button>
              </form>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="mr-1 font-semibold">Popular:</span>
                {popularRoles.map((term) => (
                  <button key={term} type="button" onClick={() => { setSearch(term); setSubmittedSearch(term); setCurrentPage(1); navigate("/candidate-dashboard?tab=jobs"); }} className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-brand-700">{term}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { label: "Open opportunities", value: totalJobs.toLocaleString(), detail: "Across your job search", icon: BriefcaseBusiness, action: () => navigate("/candidate-dashboard?tab=jobs"), color: "bg-blue-50 text-blue-700" },
                { label: "Applications", value: applicationRecords.length, detail: "Track your progress", icon: FileText, action: () => navigate("/my-applications"), color: "bg-amber-50 text-amber-700" },
                { label: "Saved jobs", value: user?.savedJobs?.length || 0, detail: "Roles to revisit", icon: Bookmark, action: () => { setActiveTab("Saved"); navigate("/candidate-dashboard?tab=jobs"); }, color: "bg-violet-50 text-violet-700" },
              ].map(({ label, value, detail, icon: Icon, action, color }) => (
                <button key={label} type="button" onClick={action} className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${color}`}><Icon size={19} /></span>
                  <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-slate-500">{label}</span><span className="mt-0.5 block text-2xl font-black leading-none text-slate-900">{value}</span><span className="mt-1 block text-xs text-slate-500">{detail}</span></span>
                  <ArrowUpRight size={16} className="text-slate-400 transition group-hover:text-brand-600" />
                </button>
              ))}
            </div>

            {homeCompanies.length > 0 && (
              <section aria-labelledby="home-companies-title" className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div><p className="candidate-home-eyebrow">EMPLOYERS ON SKILLBRIDGE</p><h3 id="home-companies-title" className="m-0 text-base font-extrabold text-slate-900">Companies hiring</h3></div>
                  <button type="button" onClick={() => navigate("/candidate-dashboard?tab=jobs")} className="inline-flex shrink-0 items-center gap-1 border-0 bg-transparent p-0 text-sm font-bold text-brand-700 hover:text-brand-800">Browse jobs <ChevronRightIcon size={15} /></button>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                  {homeCompanies.map((job) => (
                    <button key={job.company} type="button" onClick={() => { setCompanyFilter(job.company); setCurrentPage(1); navigate("/candidate-dashboard?tab=jobs"); }} className="flex min-w-0 items-center gap-2.5 rounded-xl border border-slate-100 bg-[#fffdfa] px-3 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50/40">
                      {getCompanyLogo(job.company, job.companyLogo) ? (
                        <img 
                          src={getCompanyLogo(job.company, job.companyLogo)}
                          alt="" 
                          className="h-9 w-9 shrink-0 rounded-lg border border-slate-100 bg-white object-contain p-1" 
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextElementSibling) e.currentTarget.nextElementSibling.style.display = 'grid';
                          }}
                        />
                      ) : null}
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-sm font-black text-slate-600 ${getCompanyLogo(job.company, job.companyLogo) ? 'hidden' : ''}`}>
                        {(job.company || "S").slice(0, 1).toUpperCase()}
                      </span>
                      <span className="truncate text-xs font-bold text-slate-700">{job.company}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {homeLatestJobs.length > 0 && (
              <section aria-labelledby="home-latest-jobs-title">
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div><p className="candidate-home-eyebrow">FRESH OPPORTUNITIES</p><h3 id="home-latest-jobs-title" className="m-0 text-xl font-extrabold text-slate-900">Latest jobs</h3><p className="mb-0 mt-1 text-sm text-slate-500">New roles from across your job search.</p></div>
                  <button type="button" onClick={() => navigate("/candidate-dashboard?tab=jobs")} className="inline-flex shrink-0 items-center gap-1 border-0 bg-transparent p-0 text-sm font-bold text-brand-700 hover:text-brand-800">Show all <ArrowUpRight size={15} /></button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {homeLatestJobs.map((job) => (
                    <button key={job._id} type="button" onClick={() => openRecommendedJob(job)} className="group flex min-h-[176px] flex-col rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
                      <span className="flex min-w-0 items-center gap-2.5">
                        {getCompanyLogo(job.company, job.companyLogo) ? (
                          <img 
                            src={getCompanyLogo(job.company, job.companyLogo)}
                            alt="" 
                            className="h-9 w-9 shrink-0 rounded-lg border border-slate-100 object-contain p-1" 
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextElementSibling) e.currentTarget.nextElementSibling.style.display = 'grid';
                            }}
                          />
                        ) : null}
                        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 font-bold text-brand-700 ${getCompanyLogo(job.company, job.companyLogo) ? 'hidden' : ''}`}>
                          {(job.company || "S").slice(0, 1).toUpperCase()}
                        </span>
                        <span className="truncate text-xs font-semibold text-slate-600">{job.company || "SkillBridge employer"}</span>
                      </span>
                      <span className="mt-3 line-clamp-2 text-sm font-extrabold leading-5 text-slate-900">{job.title}</span>
                      <span className="mt-2 flex flex-wrap gap-1.5"><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">{job.employmentType || "Full-time"}</span>{job.isRemote && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">Remote</span>}</span>
                      <span className="mt-auto flex items-end justify-between gap-2 pt-3"><span className="min-w-0"><span className="block truncate text-xs font-bold text-slate-800">{formatSalary(job.salary, job.salaryMin, job.salaryMax, job.salaryCurrency, job.showSalaryRange !== false)}</span><span className="mt-0.5 block truncate text-[11px] text-slate-500">{job.location || "Location flexible"}</span></span><ArrowUpRight size={16} className="shrink-0 text-slate-400 transition group-hover:text-brand-600" /></span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="recent-applications-title">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                  <div><p className="candidate-home-eyebrow">YOUR PROGRESS</p><h3 id="recent-applications-title" className="m-0 text-lg font-extrabold text-slate-900">Recent applications</h3></div>
                  <button type="button" onClick={() => navigate("/my-applications")} className="inline-flex shrink-0 items-center gap-1 border-0 bg-transparent p-0 text-sm font-bold text-brand-700 hover:text-brand-800">View all <ChevronRightIcon size={15} /></button>
                </div>
                {applicationRecords.length ? (
                  <div className="divide-y divide-slate-100">
                    {applicationRecords.slice(0, 3).map((application) => (
                      <div key={application._id} className="flex items-center gap-3 px-5 py-4">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-600"><BriefcaseBusiness size={18} /></span>
                        <div className="min-w-0 flex-1"><p className="m-0 truncate text-sm font-bold text-slate-900">{application.job.title}</p><p className="mb-0 mt-1 truncate text-xs text-slate-500">{application.job.company || "Company"}{application.createdAt ? ` Â· Applied ${new Date(application.createdAt).toLocaleDateString()}` : ""}</p></div>
                        <StatusBadge status={application.status || "pending"} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-8 text-center">
                    <p className="m-0 text-sm font-semibold text-slate-700">Your application updates will appear here.</p>
                    <p className="mb-4 mt-1 text-xs text-slate-500">Find a role that fits and keep track of every next step.</p>
                    <button type="button" onClick={() => navigate("/candidate-dashboard?tab=jobs")} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50">Browse jobs</button>
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="recommended-home-title">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div><p className="candidate-home-eyebrow">MATCHED TO YOUR PROFILE</p><h3 id="recommended-home-title" className="m-0 text-lg font-extrabold text-slate-900">Recommended for you</h3></div>
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-700"><Sparkles size={17} /></span>
                </div>
                {recommendedJobsList.length ? (
                  <div className="space-y-2.5">
                    {recommendedJobsList.slice(0, 3).map((job) => {
                      const match = calculateJobMatchScore(job, user);
                      return (
                        <button key={job._id} type="button" onClick={() => openRecommendedJob(job)} className="group flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-[#fffdfa] p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-brand-700"><BriefcaseBusiness size={17} /></span>
                          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-900">{job.title}</span><span className="mt-1 block truncate text-xs text-slate-500">{job.company || "Company"} Â· {job.location || "Location flexible"}</span></span>
                          <span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-[11px] font-bold text-brand-700">{match.score}% match</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-600">Complete your profile to get more relevant job recommendations.</div>
                )}
                <button type="button" onClick={() => { setActiveTab("Recommended"); navigate("/candidate-dashboard?tab=jobs"); }} className="mt-4 inline-flex items-center gap-1 border-0 bg-transparent p-0 text-sm font-bold text-brand-700 hover:text-brand-800">Explore all recommendations <ArrowUpRight size={15} /></button>
              </section>
            </div>

            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#e9dfd1] bg-[#fffaf2] p-5 sm:flex-row sm:items-center sm:px-6">
              <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-amber-700 shadow-sm"><FileText size={18} /></span><div><h3 className="m-0 text-sm font-extrabold text-slate-900">Make your next application count</h3><p className="mb-0 mt-1 text-sm text-slate-600">Keep your profile and resume up to date before you apply.</p></div></div>
              <button type="button" onClick={() => navigate("/candidate-profile")} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#e7d9c6] bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50">Review profile <ArrowUpRight size={15} /></button>
            </div>
          </section>
        )}

        {isJobsView && (
        <>
        {/* MOBILE SEARCH EXPANDED VIEW (Bottom Sheet) */}
        {isMobileSearchExpanded && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in" onClick={() => setIsMobileSearchExpanded(false)}>
            <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 pb-8 shadow-2xl flex flex-col gap-3.5 max-h-[88vh] overflow-y-auto overscroll-contain animate-slide-in-right" onClick={e => e.stopPropagation()}>
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 m-0">Search & Filters</h3>
                  <p className="text-xs text-slate-500 m-0 mt-0.5">Filter by role, location, pay, experience, and mode</p>
                </div>
                <button 
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center border-0 cursor-pointer font-bold transition-colors" 
                  onClick={() => setIsMobileSearchExpanded(false)}
                  aria-label="Close filters"
                >
                  âœ•
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {/* 1. Keyword / Title Search */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Keywords / Title</label>
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
                    <FiSearch className="text-slate-400 text-base shrink-0" />
                    <input
                      type="text"
                      placeholder="Job title, skills, or company"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-transparent border-0 outline-none text-sm text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* 2. Location */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Location</label>
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
                    <FiMapPin className="text-slate-400 text-base shrink-0" />
                    <input
                      type="text"
                      placeholder="City, State, or India"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="w-full bg-transparent border-0 outline-none text-sm text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* 3. Experience & Pay in 2-col grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Experience</label>
                    <ExperienceSelect
                      compact
                      aria-label="Filter by experience"
                      value={experienceFilter}
                      onChange={(e) => setExperienceFilter(e.target.value)}
                      placeholder="All Experience"
                      className="w-full text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Minimum Pay / Salary</label>
                    <CustomSelect
                      options={getSalaryOptions(user?.country)}
                      value={salaryFilter}
                      onChange={(e) => setSalaryFilter(e.target.value)}
                      placeholder={`Any salary (${getCountryCurrency(user?.country).symbol})`}
                      className="w-full text-sm"
                    />
                  </div>
                </div>

                {/* 4. Job Type & Remote Option */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Job Type</label>
                    <CustomSelect
                      options={[
                        { value: "All", label: "All Types" },
                        { value: "Full-time", label: "Full-time" },
                        { value: "Internship", label: "Internship" },
                        { value: "Contract", label: "Contract" },
                        { value: "Part-time", label: "Part-time" }
                      ]}
                      value={employmentTypeFilter}
                      onChange={(e) => setEmploymentTypeFilter(e.target.value)}
                      placeholder="All Types"
                      className="w-full text-sm"
                    />
                  </div>

                  <div className="pt-2 sm:pt-4">
                    <label className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={isRemoteFilter === "true"}
                        onChange={(e) => setIsRemoteFilter(e.target.checked ? "true" : "All")}
                        className="w-4 h-4 cursor-pointer accent-brand-600 rounded"
                      />
                      <span className="text-xs font-bold text-slate-800">Remote roles only</span>
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 mt-1">
                  <button 
                    type="button"
                    className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors border-0"
                    onClick={() => {
                      setSearch("");
                      setSubmittedSearch("");
                      setLocationFilter("");
                      setExperienceFilter("");
                      setSalaryFilter("");
                      setCompanyFilter("");
                      setSourceFilter("");
                      setEmploymentTypeFilter("All");
                      setIsRemoteFilter("All");
                      setIsMobileSearchExpanded(false);
                      setCurrentPage(1);
                      fetchJobs({
                        searchTerm: "",
                        locationTerm: "",
                        experienceTerm: "",
                        salaryTerm: "",
                        companyTerm: "",
                        sourceTerm: "",
                        employmentTerm: "All",
                        remoteTerm: "All",
                        page: 1,
                      });
                    }}
                  >
                    Reset All
                  </button>
                  <button 
                    type="button"
                    className="flex-2 py-2.5 px-5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md shadow-brand-600/20 border-0"
                    onClick={() => {
                      setIsMobileSearchExpanded(false);
                      setSubmittedSearch(search.trim());
                      setCurrentPage(1);
                    }}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={`candidate-results-layout grid grid-cols-1 ${jobViewMode === "split" && selectedJob ? "lg:grid-cols-12" : ""} gap-6 items-start`}>
          {/* LEFT COLUMN: LISTING CONTAINER */}
          <div data-tour="job-feed" className={`${isMobileDetailView && jobViewMode === "split" ? "hidden lg:block" : "block"} ${jobViewMode === "split" && selectedJob ? "lg:col-span-5 lg:sticky lg:top-[76px] lg:h-[calc(100vh-88px)]" : "w-full"} overflow-y-auto pr-0 lg:pr-2 pb-2 space-y-4 custom-scrollbar`}>
            <div className="candidate-feed-heading">
              <div>
                <p className="candidate-home-eyebrow">SEARCH RESULTS</p>
                <h2>{totalJobs.toLocaleString()} verified jobs</h2>
                <p className="m-0 mt-1 text-sm text-slate-500">Showing {displayedJobs.length ? (currentPage - 1) * JOBS_PER_PAGE + 1 : 0}–{Math.min(currentPage * JOBS_PER_PAGE, totalJobs)} of {totalJobs.toLocaleString()} jobs · Page {currentPage} of {totalPages}</p>
              </div>
              <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1">
                <button type="button" aria-label="Grid view" aria-pressed={jobViewMode === "grid"} onClick={() => changeJobView("grid")} className={`grid h-9 w-9 place-items-center rounded-xl border-0 transition ${jobViewMode === "grid" ? "bg-slate-100 text-slate-900" : "bg-white text-slate-500 hover:bg-slate-50"}`}><Grid2X2 size={18} /></button>
                <button type="button" aria-label="Jobs and description split view" title="Jobs and description split view" aria-pressed={jobViewMode === "split"} onClick={() => changeJobView("split")} className={`grid h-9 w-9 place-items-center rounded-xl border-0 transition ${jobViewMode === "split" ? "bg-slate-100 text-slate-900" : "bg-white text-slate-500 hover:bg-slate-50"}`}><PanelLeft size={19} strokeWidth={1.8} /></button>
              </div>
            </div>
            {/* SEGMENTED CONTROL ROW */}
            <div className="mb-4" data-tour="recommended-toggle">
              <div className="candidate-job-tabs relative grid grid-cols-3 p-1 bg-slate-100 rounded-full border border-slate-200 select-none">
                {/* Sliding Active Pill Indicator */}
                <div
                  className="absolute top-1 bottom-1 left-1 w-[calc((100%-8px)/3)] bg-brand-600 rounded-full shadow-xs transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
                  style={{
                    transform: `translateX(${
                      activeTab === "Recommended" ? "100%" : activeTab === "Saved" ? "200%" : "0%"
                    })`,
                  }}
                />

                {[
                  { id: "All Jobs", label: "All Jobs" },
                  { id: "Recommended", label: "Recommended" },
                  { id: "Saved", label: "Saved" },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      className={`relative z-10 py-2 px-1 text-xs font-bold rounded-full transition-colors duration-200 cursor-pointer flex items-center justify-center gap-1 border-0 bg-transparent outline-none focus:outline-none ${
                        isActive
                          ? "text-white"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsMobileDetailView(false);
                      }}
                    >
                      <span className="truncate">{tab.label}</span>
                      {tab.badge > 0 && (
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold transition-colors duration-200 ${
                            isActive ? "bg-white text-brand-600" : "bg-rose-500 text-white"
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {loading ? (
              <div className="w-full space-y-3 py-2">
                <JobCardSkeleton />
                <JobCardSkeleton />
                <JobCardSkeleton />
                <JobCardSkeleton />
              </div>
            ) : displayedJobs.length === 0 ? (
              <EmptyState
                illustration={workChatSvg}
                title={
                  activeTab === "Saved"
                    ? "No saved jobs yet"
                    : activeTab === "Recommended"
                    ? "No recommended jobs found"
                    : "No matching jobs found"
                }
                description={
                  activeTab === "Saved"
                    ? "Bookmark jobs while browsing to review and apply to them later."
                    : activeTab === "Recommended"
                    ? "We couldn't find any recommendations matching your current criteria or skills. Try browsing all jobs."
                    : "We couldn't find any opportunities matching your criteria. Try loosening search terms or clearing filters."
                }
                actionText={activeTab === "Saved" || activeTab === "Recommended" ? "Browse All Jobs" : "Clear Filters"}
                onAction={
                  activeTab === "Saved" || activeTab === "Recommended"
                    ? () => setActiveTab("All Jobs")
                    : () => {
                        setSearch("");
                        setSubmittedSearch("");
                        setLocationFilter("");
                        setExperienceFilter("");
                        setSalaryFilter("");
                        setCompanyFilter("");
                        setSourceFilter("");
                        setEmploymentTypeFilter("All");
                        setIsRemoteFilter("All");
                      }
                }
              />
            ) : (
              <>
                <div className={`candidate-job-results-grid grid grid-cols-1 ${jobViewMode === "grid" ? "lg:grid-cols-2" : ""} gap-4`}>
                  {visibleJobs.map((job) => {
                    const isSelected = selectedJob?._id === job._id;
                    const hasApplied = appliedJobs.includes(job._id);
                    const companyLogo = getCompanyLogo(job.company, job.companyLogo);
                    const logoDomain = deriveCompanyDomain(job.company);
                    const matchInfo = calculateJobMatchScore(job, user);
                    const experienceLabel =
                      job.experienceRequired === "Fresher"
                        ? "Entry Level"
                        : job.experienceRequired && job.experienceRequired !== "Not Specified"
                          ? job.experienceRequired
                          : inferExperienceFromDescription(job.description);

                    return (
                      <div
                        key={job._id}
                        className={`candidate-job-card bg-white border rounded-2xl p-4 sm:p-5 cursor-pointer transition-all ${
                          isSelected
                            ? "is-selected border-brand-600 ring-2 ring-brand-500/20 bg-blue-50/20 shadow-md"
                            : "border-slate-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
                        }`}
                        onClick={() => handleJobSelect(job)}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-base font-extrabold text-slate-900 leading-snug tracking-tight mb-1 truncate group-hover:text-brand-600">
                              {job.title}
                            </h4>
                            <div className="flex min-w-0 items-center gap-2 text-xs font-medium text-slate-600 sm:text-sm">
                              {companyLogo ? <img src={companyLogo} alt="" className="h-7 w-7 shrink-0 rounded-lg border border-slate-100 bg-white object-contain p-1" onError={(event) => {
                                if (!event.currentTarget.dataset.fallback && logoDomain) {
                                  event.currentTarget.dataset.fallback = "true";
                                  event.currentTarget.src = `https://www.google.com/s2/favicons?domain=${logoDomain}&sz=128`;
                                  return;
                                }
                                event.currentTarget.style.display = "none";
                                if (event.currentTarget.nextElementSibling) event.currentTarget.nextElementSibling.style.display = "grid";
                              }} /> : null}
                              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-blue-50 text-xs font-bold text-brand-700 ${companyLogo ? "hidden" : ""}`}>{(job.company || "S").slice(0, 1).toUpperCase()}</span>
                              <p className="truncate m-0">
                                {job.company} &bull; {job.location}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 shrink-0 -mr-1 -mt-1">
                            <button
                              type="button"
                              className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors border-0 bg-transparent cursor-pointer rounded-lg hover:bg-slate-50"
                              aria-label="Hide job"
                              title="Not interested"
                              onClick={(e) => {
                                e.stopPropagation();
                                openHideJobFeedback(job);
                              }}
                            >
                              <FiThumbsDown size={15} />
                            </button>
                            <button
                              type="button"
                              className="p-1.5 text-slate-400 hover:text-brand-600 transition-colors border-0 bg-transparent cursor-pointer rounded-lg hover:bg-slate-50"
                              aria-label="Save job"
                              title="Save job"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleSave(job._id);
                              }}
                            >
                              {user?.savedJobs?.some((savedJobId) => savedJobId?.toString() === job?._id) ? (
                                <FaBookmark size={15} className="text-brand-600" />
                              ) : (
                                <FiBookmark size={15} />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Salary Highlight Pill (Indeed Style) */}
                        {job.salary || job.salaryMin ? (
                          <div className="mb-2.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                              <span className="text-emerald-600 font-black" aria-hidden="true">✓</span>
                              <span>{formatSalary(job.salary, job.salaryMin, job.salaryMax, job.salaryCurrency, job.showSalaryRange !== false)}</span>
                            </span>
                          </div>
                        ) : null}
                        
                        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                          <StatusBadge
                            type="match"
                            score={matchInfo.score}
                            skillsCount={job.skills?.length || (Array.isArray(job.skillsRequired) ? job.skillsRequired.length : (job.skillsRequired ? 1 : 0))}
                          />

                          {job.skills && job.skills.length > 0 ? (
                            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                              {job.skills[0]}
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                              {job.isExternal ? "External" : "Internal"}
                            </span>
                          )}

                          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-sky-50 text-sky-700 border border-sky-200">
                            {experienceLabel && experienceLabel !== "Not Specified"
                              ? experienceLabel
                              : "Experience not specified"}
                          </span>
                          
                          {hasApplied && <StatusBadge status="applied" size="sm" />}
                        </div>
                        
                        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-500">{getRelativeTime(job.createdAt)}</span>
                            {job.applicationDeadline && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                new Date(job.applicationDeadline) < new Date()
                                  ? "bg-rose-50 text-rose-600 border border-rose-200"
                                  : "bg-amber-50 text-amber-800 border border-amber-200"
                              }`}>
                                {new Date(job.applicationDeadline) < new Date()
                                  ? "Closed"
                                  : (() => {
                                      const d = Math.ceil((new Date(job.applicationDeadline) - new Date()) / (1000 * 60 * 60 * 24));
                                      return d <= 1 ? "Closes today" : `${d}d left`;
                                    })()
                                }
                              </span>
                            )}
                          </div>
                          <button type="button" onClick={(event) => { event.stopPropagation(); handleJobSelect(job); }} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">View</button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="candidate-pagination-bar flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs mt-4">
                  <button
                    className="candidate-pagination-button px-4 py-2 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-brand-600 disabled:active:scale-100 cursor-pointer shadow-xs border-0"
                    disabled={currentPage <= 1}
                    onClick={() => {
                      const nextPage = Math.max(1, currentPage - 1);
                      setCurrentPage(nextPage);
                      fetchJobs({
                        searchTerm: submittedSearch,
                        locationTerm: locationFilter,
                        experienceTerm: experienceFilter,
                        salaryTerm: salaryFilter,
                        companyTerm: companyFilter,
                        page: nextPage,
                      });
                    }}
                  >
                    &larr; Previous
                  </button>
                  <span className="candidate-pagination-current text-xs sm:text-sm font-semibold text-slate-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    className="candidate-pagination-button px-4 py-2 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-brand-600 disabled:active:scale-100 cursor-pointer shadow-xs border-0"
                    disabled={currentPage >= totalPages}
                    onClick={() => {
                      const nextPage = Math.min(totalPages, currentPage + 1);
                      setCurrentPage(nextPage);
                      fetchJobs({
                        searchTerm: submittedSearch,
                        locationTerm: locationFilter,
                        salaryTerm: salaryFilter,
                        companyTerm: companyFilter,
                        page: nextPage,
                      });
                    }}
                  >
                    Next &rarr;
                  </button>
                </div>
              </>
            )}
          </div>

          {/* RIGHT COLUMN: DETAIL WORKSPACE */}
          {isGridJobModalOpen && jobViewMode === "grid" && selectedJob && (
            <button type="button" aria-label="Close job details" onClick={() => setIsGridJobModalOpen(false)} className="fixed inset-0 z-[120] cursor-default border-0 bg-slate-950/35 p-0 backdrop-blur-sm" />
          )}
          <div data-tour="job-details" className={`${jobViewMode === "grid" && isGridJobModalOpen && selectedJob ? "candidate-job-detail job-details-modal fixed left-1/2 top-[54%] z-[130] flex h-[84vh] w-[min(92vw,980px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl" : jobViewMode === "split" && selectedJob ? `candidate-job-detail custom-scrollbar ${isMobileDetailView ? "fixed inset-0 z-[100] h-full bg-white p-4 overflow-y-auto" : "hidden"} lg:block lg:sticky lg:top-[76px] lg:z-auto lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm lg:h-[calc(100vh-88px)] overflow-y-auto flex flex-col` : "hidden"}`}>
            {selectedJob ? (
              <div className={`flex flex-col ${jobViewMode === "grid" && isGridJobModalOpen ? "min-h-0 flex-1 custom-scrollbar overflow-y-auto" : "min-h-full"}`}>
                {/* Header section */}
                <div className="candidate-job-detail-header p-6 border-b border-slate-200 bg-white shrink-0 shadow-2xs z-10">
                  {(isGridJobModalOpen || isMobileDetailView) && <button aria-label={isGridJobModalOpen ? "Close job details" : "Back to jobs"} className={`${isGridJobModalOpen ? "text-2xl leading-none" : "text-sm"} text-brand-600 font-bold mb-3 bg-transparent border-0 cursor-pointer p-0 self-start`} onClick={() => { setIsGridJobModalOpen(false); setIsMobileDetailView(false); }}>{isGridJobModalOpen ? <>&times;</> : "← Back to Jobs"}</button>}
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mb-1">
                    {selectedJob.title}
                  </h3>
                  <div className="flex items-center gap-2 mb-1">
                    {getCompanyLogo(selectedJob.company, selectedJob.companyLogo) && (
                      <img 
                        src={getCompanyLogo(selectedJob.company, selectedJob.companyLogo)}
                        alt={selectedJob.company} 
                        className="w-[31px] h-[31px] object-contain rounded"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <p className="text-sm font-semibold text-slate-700 m-0">{selectedJob.company}</p>
                  </div>
                  <p className="text-xs text-slate-500 mb-1">{selectedJob.location}</p>
                  <p className="text-base font-bold text-slate-900 mb-3">
                    {formatSalary(selectedJob.salary, selectedJob.salaryMin, selectedJob.salaryMax, selectedJob.salaryCurrency, selectedJob.showSalaryRange !== false)}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {(() => {
                      const matchInfo = calculateJobMatchScore(selectedJob, user);
                      return (
                        <>
                          <StatusBadge
                            type="match"
                            score={matchInfo.score}
                            skillsCount={selectedJob.skills?.length || (Array.isArray(selectedJob.skillsRequired) ? selectedJob.skillsRequired.length : (selectedJob.skillsRequired ? 1 : 0))}
                            size="md"
                          />
                          {matchInfo.matchedSkills.length > 0 && (
                            <div className="w-full flex flex-wrap items-center gap-1.5 mt-1">
                              <span className="text-xs font-bold text-slate-600">Matched Skills:</span>
                              {matchInfo.matchedSkills.map((sk) => (
                                <span key={sk} className="px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-brand-700 border border-blue-200">
                                  <Check size={12} aria-hidden="true" /> {sk}
                                </span>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      <BriefcaseBusiness size={13} aria-hidden="true" /> <span>{selectedJob.employmentType || selectedJob.role || "Full-time"}</span>
                    </span>
                    {selectedJob.isExternal && (
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                        External
                      </span>
                    )}
                    {[
                      selectedJob.educationRequired,
                      selectedJob.experienceRequired,
                    ].some((value) => value && value.toLowerCase() !== "not specified") && (
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                        Qualifications: {[
                          selectedJob.educationRequired,
                          selectedJob.experienceRequired,
                        ].filter((value) => value && value.toLowerCase() !== "not specified").join(" • ")}
                      </span>
                    )}

                    <span className="text-xs text-slate-400 ml-auto">
                      {getRelativeTime(selectedJob.createdAt)}
                    </span>
                  </div>

                  {/* Application Deadline Alert */}
                  {selectedJob.applicationDeadline && (
                    <div className={`text-xs font-semibold px-3 py-2 rounded-xl mb-3 flex items-center justify-between border ${
                      new Date(selectedJob.applicationDeadline) < new Date()
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-amber-50 text-amber-900 border-amber-200"
                    }`}>
                      <span className="flex items-center gap-1.5">
                        <span>{new Date(selectedJob.applicationDeadline) < new Date() ? "⚠️" : "⏳"}</span>
                        <span>{new Date(selectedJob.applicationDeadline) < new Date() ? "Application deadline has passed" : "Application deadline:"}</span>
                        <strong>{new Date(selectedJob.applicationDeadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong>
                      </span>
                      {new Date(selectedJob.applicationDeadline) > new Date() && (
                        <span className="text-amber-800 font-bold">
                          {(() => {
                            const days = Math.ceil((new Date(selectedJob.applicationDeadline) - new Date()) / (1000 * 60 * 60 * 24));
                            return days <= 1 ? "Closes today" : `${days} days left`;
                          })()}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="pt-2">
                    {(selectedJob.expiresAt && new Date(selectedJob.expiresAt) < new Date()) || (selectedJob.applicationDeadline && new Date(selectedJob.applicationDeadline) < new Date()) ? (
                      <button className="px-6 py-2.5 rounded-xl font-bold text-sm bg-rose-100 text-rose-800 border border-rose-200 cursor-not-allowed" disabled>
                        Applications Closed
                      </button>
                    ) : appliedJobs?.includes(selectedJob._id) ? (
                      <button className="px-6 py-2.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed" disabled>
                        Applied Already
                      </button>
                    ) : resumeChoiceMode ? (
                      <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl w-full">
                        <p className="text-sm font-bold text-slate-800 mb-3">
                          Use your saved resume for this application?
                        </p>
                        <div className="flex flex-wrap gap-2.5">
                          <button
                            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-xs rounded-xl cursor-pointer transition-all disabled:opacity-50 border-0"
                            onClick={handleUseSavedResume}
                            disabled={fetchingSavedResume}
                          >
                            {fetchingSavedResume ? "Loading..." : "Yes, use saved resume"}
                          </button>
                          <button
                            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-all disabled:opacity-50"
                            onClick={handleUseDifferentResume}
                            disabled={fetchingSavedResume}
                          >
                            No, upload different
                          </button>
                        </div>
                      </div>
                    ) : showApplyPanel ? (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-3 bg-slate-50 border-2 border-dashed border-brand-500 rounded-2xl w-full">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => setResumeFile(e.target.files[0])}
                          className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 flex-1"
                        />
                        <div className="flex items-center gap-2">
                          <button 
                            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-xs rounded-xl cursor-pointer transition-all disabled:opacity-50 border-0" 
                            onClick={() => submitApplication()}
                            disabled={applying}
                          >
                            {applying ? "Sending..." : "Submit Application"}
                          </button>
                          <button 
                            className="p-2 text-slate-400 hover:text-rose-600 bg-transparent border-0 cursor-pointer font-bold"
                            onClick={resetApplyState}
                          >
                            âœ•
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-extrabold text-sm rounded-xl cursor-pointer transition-all shadow-sm border-0 inline-flex items-center gap-2"
                          onClick={handleApplyNowClick}
                        >
                          <span>Apply Now</span>
                          {selectedJob.isExternal && <FiExternalLink size={15} />}
                        </button>

                        {/* Save Button */}
                        <button
                          type="button"
                          className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                            user?.savedJobs?.some(
                              (savedJobId) => savedJobId?.toString() === selectedJob?._id
                            )
                              ? "bg-brand-50 border-brand-200 text-brand-600"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                          }`}
                          onClick={() => handleToggleSave(selectedJob._id)}
                          title={
                            user?.savedJobs?.some(
                              (savedJobId) => savedJobId?.toString() === selectedJob?._id
                            )
                              ? "Saved"
                              : "Save job"
                          }
                        >
                          {user?.savedJobs?.some(
                            (savedJobId) => savedJobId?.toString() === selectedJob?._id
                          ) ? (
                            <FaBookmark size={16} className="text-brand-600" />
                          ) : (
                            <FiBookmark size={17} />
                          )}
                        </button>

                        {/* Dislike / Hide Button */}
                        <button
                          type="button"
                          className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
                          onClick={() => openHideJobFeedback(selectedJob)}
                          title="Not interested / Hide job"
                        >
                          <FiThumbsDown size={17} />
                        </button>

                        {/* Share Button */}
                        <button
                          type="button"
                          className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
                          onClick={() => handleShareJob(selectedJob)}
                          title="Share job"
                        >
                          <FiShare2 size={17} />
                        </button>
                        <button
                          type="button"
                          className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
                          onClick={() => setIsConcernModalOpen(true)}
                          title="Raise concern"
                          aria-label="Raise concern"
                        >
                          <Flag size={17} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Scroll body */}
                <div className="candidate-job-description-area p-6 space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-slate-900 m-0">{selectedJob.descriptionSourceUrl ? "Employer Listing Details" : "Job Description"}</h4>
                      {englishDescription?.jobId !== selectedJob._id && !isDescriptionInEnglish(selectedJob.description) && (
                        <button
                          type="button"
                          disabled={isTranslatingDescription}
                          aria-busy={isTranslatingDescription}
                          className="inline-flex items-center rounded-md border-0 bg-[#2563eb] px-2 py-0.5 text-[11px] font-bold text-white shadow-sm transition-colors hover:bg-[#1d4ed8] disabled:cursor-wait disabled:opacity-70 cursor-pointer"
                          onClick={handleTranslateJobDescription}
                        >
                          {isTranslatingDescription ? "Translating..." : "Translate to English"}
                        </button>
                      )}
                      {(!selectedJob.descriptionUnavailable && (!isReferralAlertDescription(selectedJob.description) || selectedJob.descriptionSourceVerified) && !isDescriptionSnippet(selectedJob.description) && !isMisstructuredDescription(selectedJob.description)) && (
                        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                          <Check size={13} aria-hidden="true" /> Complete Requisition
                        </span>
                      )}
                    </div>

                    {selectedJob.descriptionSourceUrl && (
                      <p className="mb-3 text-xs text-slate-500">
                        The employer’s source page provides these listing details but does not publish a longer job description.{" "}
                        <a href={selectedJob.descriptionSourceUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 hover:underline">View employer listing</a>
                      </p>
                    )}

                    {translationError && !isDescriptionInEnglish(selectedJob.description) && <p className="mb-3 text-xs text-rose-600" role="status">{translationError}</p>}
                    {englishDescription?.jobId === selectedJob._id && englishDescription.source === selectedJob.description && englishDescription.text !== selectedJob.description && (
                      <button
                        type="button"
                        className="mb-3 border-0 bg-transparent p-0 text-xs font-semibold text-blue-700 hover:text-blue-900 cursor-pointer"
                        onClick={() => setShowOriginalDescription((visible) => !visible)}
                      >
                        {showOriginalDescription ? "Show English translation" : "View original description"}
                      </button>
                    )}

                    {isExpandingDescription && (
                      <div className="mb-3.5 p-3 bg-blue-50/80 border border-blue-200/90 rounded-xl text-blue-700 text-xs font-semibold flex items-center gap-2.5 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping shrink-0" />
                        <span>{selectedJob.descriptionSourceUrl ? "Loading details from the employer listing..." : `Loading the full job description for ${selectedJob.company}...`}</span>
                      </div>
                    )}
                    
                    {(() => {
                      const descText = selectedJob.description || "";
                      const hasEnglishTranslation = englishDescription?.jobId === selectedJob._id && englishDescription.source === descText;
                      const descriptionToDisplay = hasEnglishTranslation && !showOriginalDescription
                        ? englishDescription.text
                        : descText;
                      const sourceDescriptionUnavailable = selectedJob.descriptionUnavailable ||
                        (selectedJob.isExternal && isReferralAlertDescription(descText) && !selectedJob.descriptionSourceVerified);
                      const canExpandDescription =
                        selectedJob.isExternal &&
                        !selectedJob.descriptionSourceUrl &&
                        (isMisstructuredDescription(descText) || isDescriptionSnippet(descText));

                      return (
                        <>
                          <div className={`relative overflow-hidden transition-all duration-300 ${
                            !canExpandDescription || isDescriptionExpanded ? "max-h-none" : "max-h-96"
                          }`}>
                    <div className="job-description-content text-slate-700 space-y-4">
                              {sourceDescriptionUnavailable ? (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-slate-700">
                                  <p className="m-0">We couldn’t retrieve a matching description from the job source, so this unverified referral text is hidden.</p>
                                  {selectedJob.applyUrl && (
                                    <a href={selectedJob.applyUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex font-semibold text-brand-700 hover:underline">
                                      Open the original job source
                                    </a>
                                  )}
                                </div>
                              ) : descriptionToDisplay
                                ? renderExternalDescription(descriptionToDisplay, selectedJob)
                                : <p className="text-slate-400 italic">No description available.</p>
                              }
                            </div>
                            {canExpandDescription && !isDescriptionExpanded && (
                              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                            )}
                          </div>

                          {canExpandDescription && (
                            <button 
                              className="mt-3 text-brand-600 hover:text-brand-700 font-bold text-xs flex items-center gap-1 bg-transparent border-0 cursor-pointer disabled:opacity-60 disabled:cursor-wait p-0"
                              disabled={isExpandingDescription}
                              onClick={async () => {
                                if (
                                  !isDescriptionExpanded &&
                                  selectedJob.isExternal &&
                                  (isMisstructuredDescription(selectedJob.description) || isDescriptionSnippet(selectedJob.description))
                                ) {
                                  setIsExpandingDescription(true);
                                  try {
                                    const res = await getFullJobDescriptionAPI(selectedJob._id);
                                    if (res?.description) {
                                      const isFullDescription = res.isFullDescription === true;
                                      setSelectedJob((prev) =>
                                        prev?._id === res.jobId
                                          ? { ...prev, description: res.description, isFullDescription }
                                          : prev
                                      );
                                      setJobs((prevJobs) =>
                                        prevJobs.map((job) =>
                                          job._id === res.jobId
                                            ? { ...job, description: res.description, isFullDescription }
                                            : job
                                        )
                                      );
                                      setRecommendedJobsList((prevJobs) =>
                                        prevJobs.map((job) =>
                                          job._id === res.jobId
                                            ? { ...job, description: res.description, isFullDescription }
                                            : job
                                        )
                                      );
                                      setIsDescriptionExpanded(true);
                                    } else {
                                      setIsDescriptionExpanded(true);
                                      toast.error("Could not load the full job description.");
                                    }
                                  } catch {
                                    setIsDescriptionExpanded(true);
                                    toast.error("Could not retrieve the full job details. Please try again later.");
                                  } finally {
                                    setIsExpandingDescription(false);
                                  }
                                  return;
                                }
                                setIsDescriptionExpanded(!isDescriptionExpanded);
                              }}
                            >
                              {isExpandingDescription ? "Loading full description..." : isDescriptionExpanded ? "Show less ▲" : "Show more ▼"}
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 p-8 text-center text-sm">
                <p>Select a job listing entry to view comprehensive insights here.</p>
              </div>
            )}
          </div>
        </div>
        </>
        )}
      </div>

      {/* ONE-TIME PROFILE COMPLETION NUDGE MODAL */}
      {showProfileNudge && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[1000] flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowProfileNudge(false)}>
          <div className="w-full max-w-md bg-white rounded-3xl p-7 text-center relative shadow-2xl border border-slate-100 animate-slide-in-right" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-400 flex items-center justify-center border-0 cursor-pointer transition-colors"
              onClick={() => setShowProfileNudge(false)}
              aria-label="Close"
            >
              âœ•
            </button>

            <span className="text-4xl mb-3 block">ðŸ“‹</span>
            <h3 className="text-xl font-black text-slate-900 mb-2">Complete your profile to get matched</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
              Your profile is only <strong className="text-slate-900">{profileCompletion}% complete</strong>.
              Add a few more details &mdash; like your skills and resume &mdash; so we can
              recommend jobs that actually fit you.
            </p>

            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-brand-600 rounded-full transition-all duration-500"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-sm rounded-xl cursor-pointer transition-all shadow-sm border-0"
                onClick={() => navigate("/candidate-profile")}
              >
                Complete my profile
              </button>
              <button
                className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 bg-transparent border-0 cursor-pointer transition-colors"
                onClick={() => setShowProfileNudge(false)}
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      {externalApplyToConfirm && (
        <div
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          onClick={() => !isConfirmingExternalApplication && handleConfirmExternalApplication(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="external-apply-confirm-title"
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-[420px] rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl sm:p-9"
          >
            <button
              type="button"
              aria-label="Close"
              disabled={isConfirmingExternalApplication}
              onClick={() => handleConfirmExternalApplication(false)}
              className="absolute right-4 top-4 border-0 bg-transparent p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-50 cursor-pointer rounded-full hover:bg-slate-100 transition-colors"
            >
              <CloseIcon size={18} />
            </button>
            <div className="flex flex-col items-center text-center mb-6">
              <div className="mb-4 flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2.5 shadow-xs">
                {externalApplyToConfirm.companyLogo ? (
                  <img src={externalApplyToConfirm.companyLogo} alt="" className="h-full w-full object-contain" />
                ) : (
                  <BriefcaseBusiness size={26} className="text-blue-600" />
                )}
              </div>
              <h2 id="external-apply-confirm-title" className="mb-2.5 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                Have you applied?
              </h2>
              <p className="text-sm leading-relaxed text-slate-500">
                You opened the application page for <span className="font-semibold text-slate-800">{externalApplyToConfirm.title}</span> at <span className="font-semibold text-slate-800">{externalApplyToConfirm.company}</span>. Did you submit your application?
              </p>
            </div>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                disabled={isConfirmingExternalApplication}
                onClick={() => handleConfirmExternalApplication(true)}
                className="w-full rounded-xl border-0 bg-gradient-to-r from-blue-700 to-cyan-500 py-3.5 text-sm font-bold text-white shadow-md hover:brightness-105 disabled:cursor-wait disabled:opacity-60 cursor-pointer transition-all active:scale-[0.99]"
              >
                {isConfirmingExternalApplication ? "Updating..." : "Yes, I applied"}
              </button>
              <button
                type="button"
                disabled={isConfirmingExternalApplication}
                onClick={() => handleConfirmExternalApplication(false)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-100 disabled:opacity-50 cursor-pointer transition-all active:scale-[0.99]"
              >
                Not yet
              </button>
            </div>
          </div>
        </div>
      )}

      {isConcernModalOpen && selectedJob && (
        <div
          className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm sm:p-6"
          onClick={closeJobConcernModal}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="job-concern-title"
            onSubmit={handleSubmitJobConcern}
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-xl rounded-2xl border border-[#eadcc7] bg-[#faf7f1] p-5 shadow-2xl sm:p-7"
          >
            <button
              type="button"
              aria-label="Close"
              disabled={isSubmittingConcern}
              onClick={closeJobConcernModal}
              className="absolute right-4 top-4 border-0 bg-transparent p-1 text-slate-500 hover:text-slate-900 disabled:opacity-50 cursor-pointer"
            >
              <CloseIcon size={19} />
            </button>
            <h2 id="job-concern-title" className="mb-1 pr-8 text-xl font-semibold tracking-tight text-slate-900">
              Raise a concern
            </h2>
            <p className="mb-6 text-sm leading-6 text-slate-500">
              Report an issue with <span className="font-semibold text-slate-800">{selectedJob.title}</span> at <span className="font-semibold text-slate-800">{selectedJob.company}</span>. Our team will review it.
            </p>

            <label htmlFor="job-concern-reason" className="mb-2 block text-xs font-bold tracking-wider text-slate-500">
              REASON
            </label>
            <select
              id="job-concern-reason"
              required
              value={concernReason}
              onChange={(event) => setConcernReason(event.target.value)}
              disabled={isSubmittingConcern}
              className="mb-5 h-14 w-full rounded-xl border-2 border-[#2563eb] bg-white px-4 text-sm text-[#0d1117] outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="" disabled>Select a reason</option>
              {JOB_CONCERN_REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
            </select>

            <label htmlFor="job-concern-details" className="mb-2 block text-xs font-bold tracking-wider text-slate-500">
              DETAILS (OPTIONAL)
            </label>
            <textarea
              id="job-concern-details"
              rows={6}
              maxLength={1500}
              value={concernDetails}
              onChange={(event) => setConcernDetails(event.target.value)}
              disabled={isSubmittingConcern}
              placeholder="Share anything that helps us investigate..."
              className="mb-5 w-full resize-y rounded-xl border border-[#eadcc7] bg-white p-4 text-sm text-[#0d1117] shadow-sm outline-none placeholder:text-slate-400 focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
            />

            <button
              type="submit"
              disabled={!concernReason || isSubmittingConcern}
              className="w-full rounded-xl border-0 bg-gradient-to-r from-[#2563eb] to-[#06b6d4] py-3 text-sm font-bold text-white shadow-md transition-[filter,box-shadow] duration-200 hover:brightness-105 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-100 cursor-pointer"
            >
              {isSubmittingConcern ? "Submitting..." : "Submit concern"}
            </button>
            <button
              type="button"
              disabled={isSubmittingConcern}
              onClick={closeJobConcernModal}
              className="mt-3 w-full border-0 bg-transparent py-2 text-sm font-semibold text-slate-800 hover:text-blue-700 disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {pendingHideJob && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
          onClick={() => !isHidingJob && setPendingHideJob(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="hide-job-feedback-title"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="hide-job-feedback-title" className="m-0 text-lg font-bold text-slate-900">
              Why isnâ€™t this job a fit?
            </h3>
            <p className="mb-4 mt-1 text-sm text-slate-600">
              Your feedback helps us improve your job recommendations.
            </p>

            <div className="space-y-2">
              {HIDE_JOB_REASONS.map((reason) => (
                <label
                  key={reason.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                    hideJobReason === reason.value
                      ? "border-brand-500 bg-brand-50 text-slate-900"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="hide-job-reason"
                    value={reason.value}
                    checked={hideJobReason === reason.value}
                    onChange={() => setHideJobReason(reason.value)}
                    className="h-4 w-4 accent-brand-600"
                  />
                  {reason.label}
                </label>
              ))}
            </div>

            {hideJobReason === "other" && (
              <textarea
                value={hideJobDetails}
                onChange={(event) => setHideJobDetails(event.target.value)}
                placeholder="Tell us what didnâ€™t match (required)"
                aria-label="Describe why this job is not a fit"
                maxLength={500}
                rows={3}
                className="mt-3 w-full resize-y rounded-xl border border-slate-300 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingHideJob(null)}
                disabled={isHidingJob}
                className="rounded-xl border-0 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmHideJob}
                disabled={
                  isHidingJob ||
                  !hideJobReason ||
                  (hideJobReason === "other" && !hideJobDetails.trim())
                }
                className="rounded-xl border-0 bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isHidingJob ? "Saving..." : "Not interested"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POST-APPLY FEEDBACK MODAL */}
      {showFeedbackModal && pendingFeedbackJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[1000] flex items-center justify-center p-4 animate-fade-in" onClick={closeFeedbackModal}>
          <div className="w-full max-w-md bg-white rounded-3xl p-7 text-center relative shadow-2xl border border-slate-100 animate-slide-in-right" onClick={(e) => e.stopPropagation()}>
            <span className="text-4xl mb-3 block">ðŸ‘‹</span>
            <h3 className="text-xl font-black text-slate-900 mb-2">Welcome back!</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
              Did you apply for the <strong className="text-slate-900">{pendingFeedbackJob.title}</strong> role at {pendingFeedbackJob.company}?
            </p>

            <div className="flex flex-col gap-2.5">
              <button 
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-sm rounded-xl cursor-pointer transition-all shadow-sm border-0" 
                onClick={handleFeedbackYes}
              >
                Yes, I applied
              </button>
              <button 
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors border-0" 
                onClick={handleFeedbackNo}
              >
                No, I didn't apply
              </button>
              <button 
                className="w-full py-2 text-xs font-bold text-rose-600 hover:text-rose-700 bg-transparent hover:bg-rose-50 rounded-xl cursor-pointer transition-colors border-0"
                onClick={handleFeedbackHide}
              >
                Not a fit / Hide this job
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ONBOARDING WIZARD MODAL FOR NEW CANDIDATES */}
      {user && user.role === "candidate" && !user.hasCompletedOnboarding && (
        <OnboardingWizard
          user={user}
          onComplete={handleOnboardingComplete}
        />
      )}

    </div>
  );
}

export default CandidateDashboard;
