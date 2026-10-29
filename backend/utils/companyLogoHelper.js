/**
 * Strict Verified Enterprise Logo Helper
 * Only returns official verified logos. Never guesses arbitrary domains.
 */

const VERIFIED_ENTERPRISE_MAP = {
  "google": "https://unavatar.io/google.com",
  "microsoft": "https://unavatar.io/microsoft.com",
  "microsoft corporation": "https://unavatar.io/microsoft.com",
  "amazon": "https://unavatar.io/amazon.com",
  "apple": "https://unavatar.io/apple.com",
  "meta": "https://unavatar.io/meta.com",
  "meta platforms": "https://unavatar.io/meta.com",
  "facebook": "https://unavatar.io/meta.com",
  "netflix": "https://unavatar.io/netflix.com",
  "spotify": "https://unavatar.io/spotify.com",
  "uber": "https://unavatar.io/uber.com",
  "airbnb": "https://unavatar.io/airbnb.com",
  "stripe": "https://unavatar.io/stripe.com",
  "databricks": "https://unavatar.io/databricks.com",
  "datadog": "https://unavatar.io/datadoghq.com",
  "tcs": "https://unavatar.io/tcs.com",
  "tata consultancy services": "https://unavatar.io/tcs.com",
  "infosys": "https://unavatar.io/infosys.com",
  "infosys limited": "https://unavatar.io/infosys.com",
  "infosys consulting": "https://unavatar.io/infosys.com",
  "wipro": "https://unavatar.io/wipro.com",
  "accenture": "https://unavatar.io/accenture.com",
  "cognizant": "https://unavatar.io/cognizant.com",
  "capgemini": "https://unavatar.io/capgemini.com",
  "capgemini engineering": "https://unavatar.io/capgemini.com",
  "deloitte": "https://unavatar.io/deloitte.com",
  "ibm": "https://unavatar.io/ibm.com",
  "cisco": "https://unavatar.io/cisco.com",
  "intel": "https://unavatar.io/intel.com",
  "nvidia": "https://unavatar.io/nvidia.com",
  "oracle": "https://unavatar.io/oracle.com",
  "salesforce": "https://unavatar.io/salesforce.com",
  "hcl": "https://unavatar.io/hcltech.com",
  "hcltech": "https://unavatar.io/hcltech.com",
  "hcl technologies": "https://unavatar.io/hcltech.com",
  "tech mahindra": "https://unavatar.io/techmahindra.com",
  "persistent systems": "https://unavatar.io/persistent.com",
  "barclays": "https://unavatar.io/barclays.com",
  "hsbc": "https://unavatar.io/hsbc.com",
  "jpmorgan": "https://unavatar.io/jpmorganchase.com",
  "jpmorgan chase": "https://unavatar.io/jpmorganchase.com",
  "jp morgan": "https://unavatar.io/jpmorganchase.com",
  "goldman sachs": "https://unavatar.io/goldmansachs.com",
  "morgan stanley": "https://unavatar.io/morganstanley.com",
  "kpmg": "https://unavatar.io/kpmg.com",
  "kpmg india": "https://unavatar.io/kpmg.com",
  "ey": "https://unavatar.io/ey.com",
  "ey (ernst & young)": "https://unavatar.io/ey.com",
  "ernst & young": "https://unavatar.io/ey.com",
  "pwc": "https://unavatar.io/pwc.com",
  "pricewaterhousecoopers": "https://unavatar.io/pwc.com",
  "swiggy": "https://unavatar.io/swiggy.com",
  "abb": "https://unavatar.io/abb.com",
  "abb india": "https://unavatar.io/abb.com",
  "abb group": "https://unavatar.io/abb.com",
  "kiwi": "https://unavatar.io/gokiwi.in",
  "ridecell": "https://unavatar.io/ridecell.com",
  "sculptsoft": "https://unavatar.io/sculptsoft.com",
  "credgenics": "https://unavatar.io/credgenics.com",
  "appbrew": "https://unavatar.io/appbrew.tech",
  "aiqon": "https://unavatar.io/aiqon.in",
  "tekworks": "https://unavatar.io/tekworks.in",
  "klimb": "https://unavatar.io/klimb.io",
  "flipkart": "https://unavatar.io/flipkart.com",
  "flipkart minutes": "https://unavatar.io/flipkart.com",
  "snowflake": "https://unavatar.io/snowflake.com",
  "acclime": "https://unavatar.io/acclime.com",
  "acclime india": "https://unavatar.io/acclime.com",
  "rentomojo": "https://unavatar.io/rentomojo.com",
  "codemonk": "https://unavatar.io/codemonk.io",
  "babaclick": "https://unavatar.io/babaclick.com",
  "vanco ai": "https://unavatar.io/vanco.ai",
  "vanco": "https://unavatar.io/vanco.ai",
  "innoventes": "https://unavatar.io/innoventestech.com",
  "innoventes technologies": "https://unavatar.io/innoventestech.com",
  "stitch": "https://unavatar.io/stitch.co",
  "stitch financial technologies": "https://unavatar.io/stitch.co",
  "blinkit": "https://unavatar.io/blinkit.com",
  "stan": "https://unavatar.io/getstan.app",
  "hevo data": "https://unavatar.io/hevodata.com",
  "hevo": "https://unavatar.io/hevodata.com",
  "larsen & toubro (l&t)": "https://unavatar.io/larsentoubro.com",
  "larsen & toubro": "https://unavatar.io/larsentoubro.com",
  "l&t": "https://unavatar.io/larsentoubro.com",
  "rupeek": "https://unavatar.io/rupeek.com",
  "stratzy ai": "https://unavatar.io/stratzy.in",
  "stratzy": "https://unavatar.io/stratzy.in",
  "videosdk": "https://unavatar.io/videosdk.live",
  "videosdk.live": "https://unavatar.io/videosdk.live",
  "bureau": "https://unavatar.io/bureau.id",
  "keploy": "https://unavatar.io/keploy.io",
  "nasdaq": "https://unavatar.io/nasdaq.com",
  "centraal bureau voor de statistiek": "https://unavatar.io/cbs.nl",
  "trigent": "https://unavatar.io/trigent.com",
  "trigent software": "https://unavatar.io/trigent.com",
  "trigent software private limited": "https://unavatar.io/trigent.com",
  "rotzinger": "https://unavatar.io/rotzingergroup.com",
  "rotzinger group": "https://unavatar.io/rotzingergroup.com",
  "swisspeak": "https://unavatar.io/swisspeak.com",
  "swisspeak partners": "https://unavatar.io/swisspeak.com",
  "swisspeak partners gmbh": "https://unavatar.io/swisspeak.com",
  "mistral.ai": "https://unavatar.io/mistral.ai",
  "canonical": "https://unavatar.io/canonical.com",
  "hp": "https://unavatar.io/hp.com",
  "exl": "https://unavatar.io/exlservice.com",
  "genpact": "https://unavatar.io/genpact.com",
  "zensar technologies": "https://unavatar.io/zensar.com",
  "ust": "https://unavatar.io/ust.com",
  "birlasoft": "https://unavatar.io/birlasoft.com",
  "coforge": "https://unavatar.io/coforge.com",
  "bosch group": "https://unavatar.io/bosch.com",
  "hexaware technologies": "https://unavatar.io/hexaware.com",
  "target": "https://unavatar.io/target.com",
  "unacademy": "https://unavatar.io/unacademy.com",
  "jio": "https://unavatar.io/jio.com",
  "paytm": "https://unavatar.io/paytm.com",
  "servicenow": "https://unavatar.io/servicenow.com",
  "airtel": "https://unavatar.io/airtel.in"
};

function resolveCompanyLogo(company, existingLogo) {
  if (existingLogo && typeof existingLogo === "string" && existingLogo.trim().length > 0 && !existingLogo.includes("ui-avatars.com")) {
    return existingLogo;
  }
  if (!company || typeof company !== "string") return "";
  const lower = company.trim().toLowerCase();
  
  // 1. Strict exact match against verified map
  if (VERIFIED_ENTERPRISE_MAP[lower]) {
    return VERIFIED_ENTERPRISE_MAP[lower];
  }

  // 2. If the company name literally contains a domain (e.g. Mistral.ai)
  if (lower.endsWith(".ai") || lower.endsWith(".io") || lower.endsWith(".com")) {
    return `https://unavatar.io/${lower}`;
  }

  // Never guess arbitrary domains
  return "";
}

module.exports = {
  VERIFIED_ENTERPRISE_MAP,
  resolveCompanyLogo,
};
