const config = require("../../config/jobAggregation");
const AdzunaProvider = require("./adzuna.service");

// The Provider Registry
// Adding a new provider only requires importing it here and instantiating it with its config.
const registry = [];

if (config.providers.adzuna.enabled) {
  registry.push(new AdzunaProvider(config.providers.adzuna));
}

// Example future providers:
// if (config.providers.greenhouse.enabled) {
//   registry.push(new GreenhouseProvider(config.providers.greenhouse));
// }

module.exports = registry;
