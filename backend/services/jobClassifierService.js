/**
 * jobClassifierService.js
 * Automatically classifies job postings into domain and seniority level categories
 * based on title, description, department, and experience strings.
 */

function classifyJob(job) {
  const title = (job?.title || "").toLowerCase();
  const desc = (job?.description || "").toLowerCase();
  const dept = (job?.department || "").toLowerCase();
  const text = `${title} ${dept} ${desc}`;

  // 1. DOMAIN CLASSIFICATION
  let domain = "Software Engineering"; // Default domain

  if (
    /\b(data\s+scientist|data\s+analyst|data\s+engineer|machine\s+learning|ml\s+engineer|ai\s+engineer|nlp|deep\s+learning|business\s+intelligence|power\s+bi|tableau)\b/.test(
      text
    )
  ) {
    domain = "Data & Analytics";
  } else if (
    /\b(doctor|physician|nurse|nursing|clinical|medical|pharmacist|pharmacy|healthcare|surgeon|radiologist|mbbs|medical\s+officer)\b/.test(
      text
    )
  ) {
    domain = "Healthcare & Medical";
  } else if (
    /\b(video\s+creator|video\s+editor|video\s+producer|content\s+creator|animator|motion\s+graphics?|videographer|cinematographer|youtube|film\s+editor)\b/.test(
      text
    )
  ) {
    domain = "Media & Video Creation";
  } else if (
    /\b(ui\/ux|user\s+experience|graphic\s+designer|product\s+designer|visual\s+designer|art\s+director|illustrator|figma)\b/.test(
      text
    )
  ) {
    domain = "Design & Creative";
  } else if (
    /\b(product\s+manager|program\s+manager|project\s+manager|operations\s+manager|general\s+manager|scrum\s+master|agile\s+coach)\b/.test(
      text
    )
  ) {
    domain = "Management & Operations";
  } else if (
    /\b(digital\s+marketing|seo|sem|growth\s+marketer|sales\s+executive|account\s+executive|business\s+development|bdr|sdr|content\s+marketing)\b/.test(
      text
    )
  ) {
    domain = "Marketing & Sales";
  } else if (
    /\b(accountant|finance|auditor|financial\s+analyst|taxation|payroll|treasury|chartered\s+accountant)\b/.test(
      text
    )
  ) {
    domain = "Finance & Accounting";
  } else if (
    /\b(customer\s+support|helpdesk|client\s+support|technical\s+support|call\s+center|customer\s+success)\b/.test(
      text
    )
  ) {
    domain = "Customer Support / Operations";
  } else if (
    /\b(software|sde|swe|developer|programmer|full\s*stack|backend|frontend|devops|sre|cloud|qa\s+engineer|sdet|code)\b/.test(
      text
    )
  ) {
    domain = "Software Engineering";
  }

  // 2. SENIORITY CLASSIFICATION
  let seniorityLevel = "Mid Level"; // Default mid level

  if (/\b(intern|internship|trainee|apprentice|co-op|residency|resident)\b/.test(text)) {
    seniorityLevel = "Intern";
  } else if (
    /\b(entry\s+level|junior|jr\b|sde[- ]?1|swe[- ]?1|associate|fresher|graduate\s+engineer|0-1\s+years?|0-2\s+years?)\b/.test(
      text
    )
  ) {
    seniorityLevel = "Entry Level";
  } else if (
    /\b(staff|principal|architect|distinguished|fellow)\b/.test(text)
  ) {
    seniorityLevel = "Staff / Principal";
  } else if (
    /\b(manager|head\s+of|director|vice\s+president|vp\b|chief|cmo|cto|cfo|ceo)\b/.test(
      text
    )
  ) {
    seniorityLevel = "Executive / Manager";
  } else if (
    /\b(senior|sr\b|lead|sde[- ]?3|swe[- ]?3|team\s+lead)\b/.test(text)
  ) {
    seniorityLevel = "Senior Level";
  }

  return { domain, seniorityLevel };
}

module.exports = {
  classifyJob,
};
