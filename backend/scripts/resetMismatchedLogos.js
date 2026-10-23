require("dotenv").config({ path: "D:/Projects/MERN Project/job-portal/backend/.env" });
const mongoose = require("mongoose");
const Job = require("../models/job");

// Explicit, strictly verified whitelist of companies and their official domains
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
  "airtel": "https://unavatar.io/airtel.in",
};

async function cleanAndReset() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB Atlas.");

    // Find all jobs that have a companyLogo
    const cursor = Job.find({ companyLogo: { $nin: ["", null] } }).cursor();
    let resetCount = 0;
    let retainedCount = 0;

    for await (const job of cursor) {
      const compLower = (job.company || "").trim().toLowerCase();
      
      // 1. If company is in the verified whitelist
      if (VERIFIED_ENTERPRISE_MAP[compLower]) {
        const expectedLogo = VERIFIED_ENTERPRISE_MAP[compLower];
        if (job.companyLogo !== expectedLogo) {
          job.companyLogo = expectedLogo;
          await job.save();
        }
        retainedCount++;
        continue;
      }

      // 2. If the company name itself literally is a domain name (e.g. Mistral.ai, Booking.com)
      if (compLower.endsWith(".ai") || compLower.endsWith(".io") || compLower.endsWith(".com")) {
        const expected = `https://unavatar.io/${compLower}`;
        if (job.companyLogo !== expected) {
          job.companyLogo = expected;
          await job.save();
        }
        retainedCount++;
        continue;
      }

      // 3. Otherwise, if it was guessed using unavatar.io, RESET IT to empty string!
      if (job.companyLogo.startsWith("https://unavatar.io/")) {
        job.companyLogo = "";
        await job.save();
        resetCount++;
      } else {
        retainedCount++;
      }
    }

    console.log(`\n=== CLEANUP FINISHED ===`);
    console.log(`Reset ${resetCount} unverified / guessed logos.`);
    console.log(`Retained ${retainedCount} verified official company logos.`);
    process.exit(0);
  } catch (err) {
    console.error("Cleanup error:", err);
    process.exit(1);
  }
}

cleanAndReset();
