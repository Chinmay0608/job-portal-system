require("dotenv").config({ path: "D:/Projects/MERN Project/job-portal/backend/.env" });
const mongoose = require("mongoose");
const Job = require("../models/job");

const KNOWN_ENTERPRISES = {
  "centraal bureau voor de statistiek": "cbs.nl",
  "cbs": "cbs.nl",
  "nasdaq": "nasdaq.com",
  "google": "google.com",
  "microsoft": "microsoft.com",
  "amazon": "amazon.com",
  "apple": "apple.com",
  "meta": "meta.com",
  "meta platforms": "meta.com",
  "facebook": "meta.com",
  "netflix": "netflix.com",
  "ibm": "ibm.com",
  "oracle": "oracle.com",
  "cisco": "cisco.com",
  "intel": "intel.com",
  "nvidia": "nvidia.com",
  "adobe": "adobe.com",
  "salesforce": "salesforce.com",
  "uber": "uber.com",
  "airbnb": "airbnb.com",
  "spotify": "spotify.com",
  "twitter": "x.com",
  "x": "x.com",
  "linkedin": "linkedin.com",
  "tata consultancy services": "tcs.com",
  "tcs": "tcs.com",
  "infosys": "infosys.com",
  "wipro": "wipro.com",
  "hcl technologies": "hcltech.com",
  "hcl": "hcltech.com",
  "tech mahindra": "techmahindra.com",
  "accenture": "accenture.com",
  "capgemini": "capgemini.com",
  "cognizant": "cognizant.com",
  "deloitte": "deloitte.com",
  "pwc": "pwc.com",
  "pricewaterhousecoopers": "pwc.com",
  "ey": "ey.com",
  "ernst & young": "ey.com",
  "kpmg": "kpmg.com",
  "jpmorgan chase": "jpmorganchase.com",
  "jpmorgan": "jpmorganchase.com",
  "jp morgan": "jpmorganchase.com",
  "goldman sachs": "goldmansachs.com",
  "morgan stanley": "morganstanley.com",
  "hsbc": "hsbc.com",
  "barclays": "barclays.com",
  "paypal": "paypal.com",
  "stripe": "stripe.com",
  "square": "squareup.com",
  "atlassian": "atlassian.com",
  "zoom": "zoom.us",
  "slack": "slack.com",
  "shopify": "shopify.com",
  "snowflake": "snowflake.com",
  "databricks": "databricks.com",
  "palantir": "palantir.com",
  "cloudflare": "cloudflare.com",
  "crowdstrike": "crowdstrike.com",
  "twilio": "twilio.com",
  "intuit": "intuit.com",
  "servicenow": "servicenow.com",
  "sap": "sap.com",
  "workday": "workday.com",
  "walmart": "walmart.com",
  "target": "target.com",
  "tesla": "tesla.com",
  "qualcomm": "qualcomm.com",
  "broadcom": "broadcom.com",
  "amd": "amd.com",
  "dell": "dell.com",
  "hp": "hp.com",
  "hewlett packard": "hp.com",
  "samsung": "samsung.com",
  "sony": "sony.com",
  "siemens": "siemens.com",
  "bosch": "bosch.com",
  "robert bosch": "bosch.com",
  "philips": "philips.com",
  "ge": "ge.com",
  "general electric": "ge.com",
  "ge healthcare": "ge.com",
  "nike": "nike.com",
  "adidas": "adidas.com",
  "booking.com": "booking.com",
  "expedia": "expedia.com",
  "trigent": "trigent.com",
  "trigent software": "trigent.com",
  "ericsson": "ericsson.com",
  "nokia": "nokia.com",
  "vmware": "vmware.com",
  "red hat": "redhat.com",
  "github": "github.com",
  "gitlab": "gitlab.com",
  "mongodb": "mongodb.com",
  "canonical": "canonical.com",
  "automattic": "automattic.com",
  "datadog": "datadog.com",
  "splunk": "splunk.com",
  "elastic": "elastic.co",
  "dynatrace": "dynatrace.com",
  "hashicorp": "hashicorp.com",
  "confluent": "confluent.io",
  "pagerduty": "pagerduty.com",
  "zendesk": "zendesk.com",
  "hubspot": "hubspot.com",
  "freshworks": "freshworks.com",
  "zoho": "zoho.com",
  "swiggy": "swiggy.com",
  "zomato": "zomato.com",
  "flipkart": "flipkart.com",
  "myntra": "myntra.com",
  "ola": "olacabs.com",
  "phonepe": "phonepe.com",
  "paytm": "paytm.com",
  "razorpay": "razorpay.com",
  "cred": "cred.club",
  "byju's": "byjus.com",
  "unacademy": "unacademy.com",
  "zepto": "zepto.com",
  "blinkit": "blinkit.com",
  "airtel": "airtel.in",
  "jio": "jio.com",
  "reliance": "ril.com",
  "tata motors": "tatamotors.com",
  "tata": "tata.com",
  "lars & toubro": "larsentoubro.com",
  "l&t": "larsentoubro.com",
  "ltimindtree": "ltimindtree.com",
  "mindtree": "ltimindtree.com",
  "mphasis": "mphasis.com",
  "birlasoft": "birlasoft.com",
  "zensar": "zensar.com",
  "cyient": "cyient.com",
  "persistent systems": "persistent.com",
  "kpit": "kpit.com",
  "coforge": "coforge.com",
  "hexaware": "hexaware.com",
  "ust": "ust.com",
  "ust global": "ust.com",
  "genpact": "genpact.com",
  "exl": "exlservice.com",
  "wipro enterprises": "wipro.com",
  "mu sigma": "mu-sigma.com",
  "fractal": "fractal.ai",
  "fractal analytics": "fractal.ai"
};

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    // 1. First, clean up any accidental 1-letter / 2-letter over-matches
    console.log("Cleaning up any previous inaccurate matches...");
    await Job.updateMany(
      { companyLogo: "https://unavatar.io/x.com", company: { $nin: ["X", "Twitter", "x", "Twitter Inc"] } },
      { $set: { companyLogo: "" } }
    );
    await Job.updateMany(
      { companyLogo: "https://unavatar.io/ge.com", company: { $nin: ["GE", "General Electric", "GE Healthcare"] } },
      { $set: { companyLogo: "" } }
    );
    await Job.updateMany(
      { companyLogo: "https://unavatar.io/meta.com", company: { $nin: ["Meta", "Facebook", "Meta Platforms"] } },
      { $set: { companyLogo: "" } }
    );

    // 2. Fetch the top 1000 companies by number of job postings
    console.log("Aggregating top employers across the database...");
    const topEmployers = await Job.aggregate([
      { $group: { _id: "$company", count: { $sum: 1 }, existingLogo: { $first: "$companyLogo" } } },
      { $sort: { count: -1 } },
      { $limit: 1000 }
    ]);

    console.log(`Analyzing top ${topEmployers.length} employers...`);

    let totalEnrichedJobs = 0;
    let totalEnrichedCompanies = 0;

    for (const emp of topEmployers) {
      const companyName = emp._id;
      if (!companyName || typeof companyName !== "string") continue;

      const trimmed = companyName.trim();
      const lower = trimmed.toLowerCase();

      // Cleaned canonical name
      const normalized = lower
        .replace(/\b(inc\.?|llc\.?|ltd\.?|limited|corp\.?|corporation|technologies|solutions|services|group|gmbh|pvt\.?|private)\b/gi, "")
        .replace(/[^\w\s]/g, " ")
        .trim()
        .replace(/\s+/g, " ");

      let domain = null;

      // 1. Direct dictionary match
      if (KNOWN_ENTERPRISES[lower]) {
        domain = KNOWN_ENTERPRISES[lower];
      } else if (KNOWN_ENTERPRISES[normalized]) {
        domain = KNOWN_ENTERPRISES[normalized];
      } else {
        // Check if any key in KNOWN_ENTERPRISES matches as a distinct word
        for (const [key, d] of Object.entries(KNOWN_ENTERPRISES)) {
          if (key.length <= 3) continue; // Skip short acronyms for fuzzy matching to avoid false positives
          const regex = new RegExp(`\\b${key}\\b`, "i");
          if (regex.test(lower) || regex.test(normalized)) {
            domain = d;
            break;
          }
        }
      }

      // If domain resolved
      if (domain) {
        const logoUrl = `https://unavatar.io/${domain}`;
        const res = await Job.updateMany(
          {
            company: companyName,
            $or: [
              { companyLogo: "" },
              { companyLogo: null },
              { companyLogo: { $exists: false } }
            ]
          },
          { $set: { companyLogo: logoUrl } }
        );

        if (res.modifiedCount > 0) {
          totalEnrichedCompanies++;
          totalEnrichedJobs += res.modifiedCount;
          console.log(`[+] Enriched: "${trimmed}" (${emp.count} jobs) -> ${logoUrl}`);
        }
      }
    }

    // 3. Specifically ensure Centraal Bureau voor de Statistiek (CBS) has cbs.nl
    const cbsRes = await Job.updateMany(
      { company: /centraal bureau voor de statistiek/i },
      { $set: { companyLogo: "https://unavatar.io/cbs.nl" } }
    );
    if (cbsRes.modifiedCount > 0) {
      console.log(`[+] Enriched CBS: ${cbsRes.modifiedCount} jobs -> https://unavatar.io/cbs.nl`);
      totalEnrichedJobs += cbsRes.modifiedCount;
    }

    console.log("\n================ RESULTS ================");
    console.log(`Total jobs enriched with verified logos: ${totalEnrichedJobs}`);
    console.log(`Total companies matched: ${totalEnrichedCompanies}`);
    console.log("=========================================\n");

    process.exit(0);
  } catch (err) {
    console.error("Enrichment failed:", err);
    process.exit(1);
  }
}

main();
