/**
 * Universal Company Domain & Logo Resolver
 */

const KNOWN_COMPANY_DOMAINS = {
  "trigent software private limited": "trigent.com",
  "trigent software": "trigent.com",
  "trigent": "trigent.com",
  "rotzinger group": "rotzingergroup.com",
  "rotzinger": "rotzingergroup.com",
  "swisspeak partners gmbh": "swisspeak.com",
  "swisspeak partners": "swisspeak.com",
  "swisspeak": "swisspeak.com",
  "mistral.ai": "mistral.ai",
  "mistral": "mistral.ai",
  "centraal bureau voor de statistiek": "cbs.nl",
  "cbs": "cbs.nl",
  "nasdaq": "nasdaq.com",
  "bureau": "bureau.id",
  "swiggy": "swiggy.com",
  "keploy": "keploy.io",
  "google": "google.com",
  "microsoft": "microsoft.com",
  "amazon": "amazon.com",
  "apple": "apple.com",
  "meta": "meta.com",
  "netflix": "netflix.com",
  "spotify": "spotify.com",
  "uber": "uber.com",
  "airbnb": "airbnb.com",
  "stripe": "stripe.com",
  "databricks": "databricks.com",
  "datadog": "datadoghq.com",
  "tcs": "tcs.com",
  "tata consultancy services": "tcs.com",
  "infosys": "infosys.com",
  "wipro": "wipro.com",
  "accenture": "accenture.com",
  "cognizant": "cognizant.com",
  "capgemini": "capgemini.com",
  "deloitte": "deloitte.com",
  "ibm": "ibm.com",
  "cisco": "cisco.com",
  "intel": "intel.com",
  "nvidia": "nvidia.com",
  "oracle": "oracle.com",
  "salesforce": "salesforce.com",
  "hcl": "hcltech.com",
  "hcl technologies": "hcltech.com",
  "tech mahindra": "techmahindra.com",
  "persistent systems": "persistent.com",
  "barclays": "barclays.com",
  "hsbc": "hsbc.com",
  "jpmorgan": "jpmorganchase.com",
  "goldman sachs": "goldmansachs.com",
  "morgan stanley": "morganstanley.com",
  "kpmg": "kpmg.com",
  "ey": "ey.com",
  "pwc": "pwc.com",
};

function deriveCompanyDomain(company) {
  if (!company || typeof company !== "string") return null;
  const raw = company.trim();
  const lower = raw.toLowerCase();

  if (KNOWN_COMPANY_DOMAINS[lower]) {
    return KNOWN_COMPANY_DOMAINS[lower];
  }

  // 1. Direct domain in company name (e.g. Mistral.ai, Booking.com, Amazon.com)
  const domainMatch = raw.match(/\b([a-zA-Z0-9-]+\.(?:ai|io|com|co|org|net|de|ch|nl|in|uk|app|tech|dev))\b/i);
  if (domainMatch) return domainMatch[1].toLowerCase();

  // 2. Clean out enterprise legal / corporate entity suffixes
  const clean = raw
    .replace(/\b(private\s+limited|pvt\.?\s*ltd\.?|ltd\.?|limited|inc\.?|llc\.?|corp\.?|corporation|gmbh|ag|sa|bv|sarl|group|partners|technologies|technology|tech|solutions|services|consulting|consultancy|software|international|holdings)\b/gi, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase();

  const slug = clean.replace(/\s+/g, "");
  if (!slug || slug.length < 2) return null;
  return `${slug}.com`;
}

function resolveCompanyLogo(company, existingLogo) {
  if (existingLogo && typeof existingLogo === "string" && existingLogo.trim().length > 0 && !existingLogo.includes("ui-avatars.com")) {
    return existingLogo;
  }
  const domain = deriveCompanyDomain(company);
  if (domain) {
    return `https://unavatar.io/${domain}`;
  }
  return "";
}

module.exports = {
  KNOWN_COMPANY_DOMAINS,
  deriveCompanyDomain,
  resolveCompanyLogo,
};
