require("dotenv").config();

module.exports = {
  isAggregationEnabled: process.env.ENABLE_JOB_AGGREGATION === "true",
  useNewSyncEngine: process.env.USE_NEW_SYNC_ENGINE === "true",
  syncInterval: process.env.JOB_SYNC_INTERVAL || "0 */6 * * *", // Default: Every 6 hours
  providers: {
    adzuna: {
      enabled: process.env.ENABLE_ADZUNA === "true",
      appId: process.env.ADZUNA_APP_ID || "",
      apiKey: process.env.ADZUNA_API_KEY || "",
      baseUrl: "https://api.adzuna.com/v1/api/jobs",
    },
    greenhouse: {
      enabled: process.env.ENABLE_GREENHOUSE === "true",
    },
    lever: {
      enabled: process.env.ENABLE_LEVER === "true",
    },
  },
};
