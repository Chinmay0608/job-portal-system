/**
 * Enterprise Company Logo Helper & Auto-Resolution Engine
 * Resolves verified enterprise logos with multi-tiered resolution:
 * 1. Verified official map
 * 2. Embedded domain extraction
 * 3. Normalized corporate suffix stripping
 * 4. Fuzzy word matching against verified enterprises
 * 5. Automatic brand domain derivation via unavatar.io
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
  "firstsource": "https://unavatar.io/firstsource.com",
  "firstsource solutions": "https://unavatar.io/firstsource.com",
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
  "cbs": "https://unavatar.io/cbs.nl",
  "trigent": "https://unavatar.io/trigent.com",
  "trigent software": "https://unavatar.io/trigent.com",
  "trigent software private limited": "https://unavatar.io/trigent.com",
  "rotzinger": "https://unavatar.io/rotzingergroup.com",
  "rotzinger group": "https://unavatar.io/rotzingergroup.com",
  "swisspeak": "https://unavatar.io/swisspeak.com",
  "swisspeak partners": "https://unavatar.io/swisspeak.com",
  "swisspeak partners gmbh": "https://unavatar.io/swisspeak.com",
  "mistral.ai": "https://unavatar.io/mistral.ai",
  "mistral": "https://unavatar.io/mistral.ai",
  "canonical": "https://unavatar.io/canonical.com",
  "hp": "https://unavatar.io/hp.com",
  "exl": "https://unavatar.io/exlservice.com",
  "genpact": "https://unavatar.io/genpact.com",
  "zensar technologies": "https://unavatar.io/zensar.com",
  "ust": "https://unavatar.io/ust.com",
  "birlasoft": "https://unavatar.io/birlasoft.com",
  "coforge": "https://unavatar.io/coforge.com",
  "bosch group": "https://unavatar.io/bosch.com",
  "bosch": "https://unavatar.io/bosch.com",
  "hexaware technologies": "https://unavatar.io/hexaware.com",
  "hexaware": "https://unavatar.io/hexaware.com",
  "target": "https://unavatar.io/target.com",
  "unacademy": "https://unavatar.io/unacademy.com",
  "jio": "https://unavatar.io/jio.com",
  "paytm": "https://unavatar.io/paytm.com",
  "servicenow": "https://unavatar.io/servicenow.com",
  "airtel": "https://unavatar.io/airtel.in",
  "yellow.ai": "https://unavatar.io/yellow.ai",
  "yellow ai": "https://unavatar.io/yellow.ai",
  "inito": "https://unavatar.io/inito.com",
  "gocomet": "https://unavatar.io/gocomet.com",
  "snapdeal": "https://unavatar.io/snapdeal.com",
  "nxtpe": "https://unavatar.io/nxtpe.com",
  "hackerrank": "https://unavatar.io/hackerrank.com",
  "hook": "https://unavatar.io/hookmusic.com",
  "hook music": "https://unavatar.io/hookmusic.com",
  "aftershoot": "https://unavatar.io/aftershoot.com",
  "nudge": "https://unavatar.io/nudgenow.com",
  "provana": "https://unavatar.io/provana.com",
  "vaidam": "https://unavatar.io/vaidam.com",
  "vaidam health": "https://unavatar.io/vaidam.com",
  "the economic times": "https://unavatar.io/economictimes.indiatimes.com",
  "economic times": "https://unavatar.io/economictimes.indiatimes.com",
  "simviz labs": "https://unavatar.io/simvizlabs.com",
  "simviz": "https://unavatar.io/simvizlabs.com",
  "rinnovar": "https://unavatar.io/rinnovar.com",
  "tndrr": "https://unavatar.io/tndrr.in",
  "green portfolio": "https://unavatar.io/greenportfolio.co",
  "voyado": "https://unavatar.io/voyado.com",
  "algouniversity": "https://unavatar.io/github/algouniversity",
  "smallest.ai": "https://unavatar.io/smallest.ai",
  "es magico": "https://unavatar.io/esmagico.com",
  "krystelis": "https://unavatar.io/krystelis.com",
  "krystelis ltd": "https://unavatar.io/krystelis.com",
  "scaler": "https://unavatar.io/scaler.com",
  "scaler academy": "https://unavatar.io/scaler.com",
  "magic": "https://unavatar.io/magicedtech.com",
  "magic edtech": "https://unavatar.io/magicedtech.com",
  "bodhan ai": "https://unavatar.io/bodhan.ai",
  "bodhan.ai": "https://unavatar.io/bodhan.ai",
  "plutas.ai": "https://unavatar.io/plutas.ai",
  "plutas ai": "https://unavatar.io/plutas.ai",
  "aye finance": "https://unavatar.io/ayefin.com",
  "aye": "https://unavatar.io/ayefin.com",
  "pluang": "https://unavatar.io/pluang.com",
  "kelp": "https://unavatar.io/kelp.app",
  "kotak": "https://unavatar.io/kotak.com",
  "kotak mahindra": "https://unavatar.io/kotak.com",
  "kotak mahindra bank": "https://unavatar.io/kotak.com",
  "cox & kings": "https://unavatar.io/coxandkings.com",
  "cox and kings": "https://unavatar.io/coxandkings.com",
  "kailasa capital": "https://unavatar.io/kailasacapital.in",
  "kailasa capital advisors": "https://unavatar.io/kailasacapital.in",
  "ethereal exploration guild": "https://unavatar.io/etherealx.space",
  "ethereal exploration guild private limited": "https://unavatar.io/etherealx.space",
  "etherealx": "https://unavatar.io/etherealx.space",
  "revrag ai": "https://unavatar.io/revrag.ai",
  "revrag.ai": "https://unavatar.io/revrag.ai",
  "revrag": "https://unavatar.io/revrag.ai",
  "magdox": "https://unavatar.io/magdox.io",
  "ipnia": "https://unavatar.io/ipnia.com",
  "vahan": "https://unavatar.io/vahan.co",
  "vahan.ai": "https://unavatar.io/vahan.ai",
  "noise": "https://unavatar.io/gonoise.com",
  "gonoise": "https://unavatar.io/gonoise.com",

  // Top Tech & European Enterprises
  "finom": "https://unavatar.io/finom.co",
  "finom payments": "https://unavatar.io/finom.co",
  "mendix": "https://unavatar.io/mendix.com",
  "mendix technology": "https://unavatar.io/mendix.com",
  "coda": "https://unavatar.io/coda.io",
  "coda.io": "https://unavatar.io/coda.io",
  "codat": "https://unavatar.io/codat.io",
  "openai": "https://unavatar.io/openai.com",
  "figma": "https://unavatar.io/figma.com",
  "kyndryl": "https://unavatar.io/kyndryl.com",
  "standard chartered": "https://unavatar.io/sc.com",
  "standard chartered bank": "https://unavatar.io/sc.com",
  "samsara": "https://unavatar.io/samsara.com",
  "deutsche bank": "https://unavatar.io/db.com",
  "palantir": "https://unavatar.io/palantir.com",
  "palantir technologies": "https://unavatar.io/palantir.com",
  "brex": "https://unavatar.io/brex.com",
  "celonis": "https://unavatar.io/celonis.com",
  "reddit": "https://unavatar.io/reddit.com",
  "gitlab": "https://unavatar.io/gitlab.com",
  "scale ai": "https://unavatar.io/scale.com",
  "affirm": "https://unavatar.io/affirm.com",
  "coinbase": "https://unavatar.io/coinbase.com",
  "pinterest": "https://unavatar.io/pinterest.com",
  "twilio": "https://unavatar.io/twilio.com",
  "ramp": "https://unavatar.io/ramp.com",
  "notion": "https://unavatar.io/notion.so",
  "deliveroo": "https://unavatar.io/deliveroo.com",
  "robinhood": "https://unavatar.io/robinhood.com",
  "asana": "https://unavatar.io/asana.com",
  "perplexity": "https://unavatar.io/perplexity.ai",
  "perplexity ai": "https://unavatar.io/perplexity.ai",
  "instacart": "https://unavatar.io/instacart.com",
  "livspace": "https://unavatar.io/livspace.com",
  "vercel": "https://unavatar.io/vercel.com",
  "synthesia": "https://unavatar.io/synthesia.io",
  "enpal": "https://unavatar.io/enpal.de",
  "carta": "https://unavatar.io/carta.com",
  "chime": "https://unavatar.io/chime.com",
  "invesco": "https://unavatar.io/invesco.com",
  "hellofresh": "https://unavatar.io/hellofresh.com",
  "elevenlabs": "https://unavatar.io/elevenlabs.io",
  "pfizer": "https://unavatar.io/pfizer.com",
  "morningstar": "https://unavatar.io/morningstar.com",
  "doctolib": "https://unavatar.io/doctolib.com",
  "airwallex": "https://unavatar.io/airwallex.com",
  "ebay": "https://unavatar.io/ebay.com",
  "qonto": "https://unavatar.io/qonto.com",
  "nebius": "https://unavatar.io/nebius.com",
  "h&m": "https://unavatar.io/hm.com",
  "lendable": "https://unavatar.io/lendable.com",
  "thermo fisher": "https://unavatar.io/thermofisher.com",
  "thermo fisher scientific": "https://unavatar.io/thermofisher.com",
  "reckitt": "https://unavatar.io/reckitt.com",
  "gusto": "https://unavatar.io/gusto.com",
  "bank of america": "https://unavatar.io/bankofamerica.com",
  "jabil": "https://unavatar.io/jabil.com",
  "warner bros": "https://unavatar.io/wbd.com",
  "warner bros. discovery": "https://unavatar.io/wbd.com",
  "bjak": "https://unavatar.io/bjak.com",
  "moody's": "https://unavatar.io/moodys.com",
  "elsevier": "https://unavatar.io/elsevier.com",
  "novartis": "https://unavatar.io/novartis.com",
  "danaher": "https://unavatar.io/danaher.com",
  "teampicnic": "https://unavatar.io/picnic.app",
  "picnic": "https://unavatar.io/picnic.app",
  "pennylane": "https://unavatar.io/pennylane.com",
  "cornerstone ondemand": "https://unavatar.io/cornerstoneondemand.com",
  "eclerx": "https://unavatar.io/eclerx.com",
  "the exploration company": "https://unavatar.io/exploration.space",
  "arup": "https://unavatar.io/arup.com",
  "weekday ai": "https://unavatar.io/weekday.works",
  "te connectivity": "https://unavatar.io/te.com",
  "capco": "https://unavatar.io/capco.com",
  "taxtalente": "https://unavatar.io/taxtalente.de",
  "graphcore": "https://unavatar.io/graphcore.ai",
};

/**
 * Resolves a reliable logo image URL for any employer or company name.
 * Never leaves a company without an official brand logo or icon.
 */
function resolveCompanyLogo(company, existingLogo) {
  // If an existing logo URL is provided and valid, return it
  if (
    existingLogo &&
    typeof existingLogo === "string" &&
    existingLogo.trim().length > 0 &&
    !existingLogo.includes("ui-avatars.com")
  ) {
    return existingLogo.trim();
  }

  if (!company || typeof company !== "string") return "";
  const raw = company.trim();
  const lower = raw.toLowerCase();

  // 1. Exact match in verified enterprise map
  if (VERIFIED_ENTERPRISE_MAP[lower]) {
    return VERIFIED_ENTERPRISE_MAP[lower];
  }

  // 2. Embedded domain detection (e.g. "Mistral.ai", "Coda.io", "Booking.com", "Taxtalente.de")
  const domainMatch = raw.match(/\b([a-zA-Z0-9-]+\.(?:ai|io|com|co|org|net|de|nl|in|tech|app|space|so|works))\b/i);
  if (domainMatch) {
    return `https://unavatar.io/${domainMatch[1].toLowerCase()}`;
  }

  // 3. Normalized dictionary lookup (strip corporate entity legal suffixes)
  const normalized = lower
    .replace(/\b(inc\.?|llc\.?|ltd\.?|limited|corp\.?|corporation|technologies|solutions|services|group|gmbh|pvt\.?|private|co\.?|company|holdings|enterprises)\b/gi, "")
    .replace(/[^\w\s]/g, " ")
    .trim()
    .replace(/\s+/g, " ");

  if (normalized && VERIFIED_ENTERPRISE_MAP[normalized]) {
    return VERIFIED_ENTERPRISE_MAP[normalized];
  }

  // 4. Fuzzy word match against known verified enterprise keys (min length 4)
  for (const [key, verifiedUrl] of Object.entries(VERIFIED_ENTERPRISE_MAP)) {
    if (key.length >= 4) {
      const regex = new RegExp(`\\b${key}\\b`, "i");
      if (regex.test(lower) || (normalized && regex.test(normalized))) {
        return verifiedUrl;
      }
    }
  }

  // 5. Intelligent Automated Brand Slug Derivation:
  // For any other company in the world, derive clean brand domain on unavatar.io
  const cleanSlug = (normalized || lower).replace(/[^a-z0-9]/g, "");
  if (cleanSlug.length >= 2) {
    return `https://unavatar.io/${cleanSlug}.com`;
  }

  return "";
}

module.exports = {
  VERIFIED_ENTERPRISE_MAP,
  resolveCompanyLogo,
};
