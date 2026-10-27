export const QUALIFICATION_OPTIONS = [
  { value: "", label: "Select Degree / Highest Qualification" },

  // Engineering, IT & Computer Applications
  { value: "B.Tech / B.E.", label: "B.Tech / B.E. (Bachelor of Technology / Engineering)" },
  { value: "M.Tech / M.E.", label: "M.Tech / M.E. (Master of Technology / Engineering)" },
  { value: "BCA", label: "BCA (Bachelor of Computer Applications)" },
  { value: "MCA", label: "MCA (Master of Computer Applications)" },
  { value: "B.Sc Computer Science / IT", label: "B.Sc Computer Science / IT" },
  { value: "M.Sc Computer Science / IT", label: "M.Sc Computer Science / IT" },

  // Basic Sciences & Mathematics
  { value: "B.Sc (General / Honors)", label: "B.Sc (Bachelor of Science)" },
  { value: "M.Sc (General / Honors)", label: "M.Sc (Master of Science)" },

  // Business, Commerce & Management
  { value: "BBA / BBM", label: "BBA / BBM (Bachelor of Business Administration)" },
  { value: "MBA / PGDM", label: "MBA / PGDM (Master of Business Administration)" },
  { value: "B.Com", label: "B.Com (Bachelor of Commerce)" },
  { value: "M.Com", label: "M.Com (Master of Commerce)" },

  // Medical, Healthcare & Nursing
  { value: "MBBS", label: "MBBS (Bachelor of Medicine & Surgery)" },
  { value: "MD / MS", label: "MD / MS (Doctor of Medicine / Master of Surgery)" },
  { value: "B.Pharm / M.Pharm", label: "B.Pharm / M.Pharm (Pharmacy)" },
  { value: "B.Sc Nursing / GNM", label: "B.Sc Nursing / GNM" },
  { value: "BDS / MDS", label: "BDS / MDS (Dental Surgery)" },
  { value: "BPT / MPT", label: "BPT / MPT (Physiotherapy)" },

  // Arts, Humanities, Social Sciences & Journalism
  { value: "BA (Bachelor of Arts)", label: "BA (Bachelor of Arts)" },
  { value: "MA (Master of Arts)", label: "MA (Master of Arts)" },
  { value: "BJMC / MJMC", label: "BJMC / MJMC (Journalism & Mass Communication)" },

  // Design, Architecture & Fine Arts
  { value: "B.Des / M.Des", label: "B.Des / M.Des (Graphic / UI/UX / Product Design)" },
  { value: "B.Arch / M.Arch", label: "B.Arch / M.Arch (Architecture)" },

  // Law & Legal Studies
  { value: "LLB / BA LLB", label: "LLB / BA LLB (Bachelor of Laws)" },
  { value: "LLM", label: "LLM (Master of Laws)" },

  // Doctorate, Accounting & Professional Certifications
  { value: "Ph.D. / Doctorate", label: "Ph.D. / Doctorate" },
  { value: "CA / CS / CMA", label: "CA / CS / CMA (Chartered Accountancy / Finance)" },

  // Polytechnic, Diplomas & School Education
  { value: "Polytechnic Diploma", label: "Polytechnic Diploma (Engineering / Technical)" },
  { value: "Diploma / Professional Certificate", label: "Diploma / Professional Certification" },
  { value: "High School (10th / 12th)", label: "High School (10th / 12th Pass)" },

  // Flexible / Other Categories
  { value: "Bachelor's Degree (Other)", label: "Other Bachelor's Degree" },
  { value: "Master's Degree (Other)", label: "Other Master's Degree" },
];

const QUALIFICATIONS_BY_FIELD = {
  healthcare: [
    "MBBS", "MD / MS", "B.Pharm / M.Pharm", "B.Sc Nursing / GNM",
    "BDS / MDS", "BPT / MPT", "B.Sc (General / Honors)",
    "M.Sc (General / Honors)", "Diploma / Professional Certificate",
    "High School (10th / 12th Pass)",
  ],
  software: [
    "B.Tech / B.E.", "M.Tech / M.E.", "BCA", "MCA",
    "B.Sc Computer Science / IT", "M.Sc Computer Science / IT",
    "Polytechnic Diploma", "Diploma / Professional Certificate",
    "High School (10th / 12th Pass)",
  ],
  data: [
    "B.Tech / B.E.", "M.Tech / M.E.", "BCA", "MCA",
    "B.Sc Computer Science / IT", "M.Sc Computer Science / IT",
    "B.Sc (General / Honors)", "M.Sc (General / Honors)",
    "High School (10th / 12th Pass)",
  ],
  business: ["BBA / BBM", "MBA / PGDM", "B.Com", "M.Com", "CA / CS / CMA", "High School (10th / 12th Pass)"],
  media: ["BJMC / MJMC", "BA (Bachelor of Arts)", "MA (Master of Arts)", "B.Des / M.Des", "High School (10th / 12th Pass)"],
  design: ["B.Des / M.Des", "B.Arch / M.Arch", "BA (Bachelor of Arts)", "MA (Master of Arts)", "High School (10th / 12th Pass)"],
  law: ["LLB / BA LLB", "LLM", "BA (Bachelor of Arts)", "MA (Master of Arts)", "High School (10th / 12th Pass)"],
  general: ["BBA / BBM", "MBA / PGDM", "B.Com", "M.Com", "BA (Bachelor of Arts)", "MA (Master of Arts)", "High School (10th / 12th Pass)"],
};

export const getQualificationsForField = (field = "") => {
  const normalized = field.toLowerCase();
  const group = normalized.includes("health") || normalized.includes("medical") || normalized.includes("nurs") || normalized.includes("pharm")
    ? "healthcare"
    : normalized.includes("software") || normalized.includes("engineering") || normalized.includes("devops") || normalized.includes("cloud") || normalized.includes("it")
      ? "software"
      : normalized.includes("data") || normalized.includes("analytics") || normalized.includes("science")
        ? "data"
        : normalized.includes("finance") || normalized.includes("account") || normalized.includes("management") || normalized.includes("operation") || normalized.includes("product") || normalized.includes("sales") || normalized.includes("marketing") || normalized.includes("support") || normalized.includes("hr")
          ? "business"
          : normalized.includes("media") || normalized.includes("video") || normalized.includes("journal") || normalized.includes("content")
            ? "media"
            : normalized.includes("design") || normalized.includes("creative") || normalized.includes("art")
              ? "design"
              : normalized.includes("law") || normalized.includes("legal")
                ? "law"
                : "general";
  const allowed = new Set(QUALIFICATIONS_BY_FIELD[group]);
  return QUALIFICATION_OPTIONS.filter((option) => !option.value || allowed.has(option.value));
};
