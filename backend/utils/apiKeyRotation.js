const cursors = new Map();
const cooldowns = new Map();

function getKeys(provider) {
  const prefix = `${provider}_API_KEY`;
  return Object.keys(process.env)
    .filter((name) => new RegExp(`^${prefix}_?\\d*$`, "i").test(name) && process.env[name]?.trim())
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((name) => ({ name, value: process.env[name].trim() }));
}

function retryDelay(error) {
  const status = error?.status || error?.statusCode || error?.response?.status;
  if (status === 401 || status === 403) return 5 * 60_000;
  const retryAfter = error?.response?.headers?.["retry-after"];
  if (retryAfter && Number.isFinite(Number(retryAfter))) return Number(retryAfter) * 1000;
  if (retryAfter) {
    const dateDelay = Date.parse(retryAfter) - Date.now();
    if (dateDelay > 0) return dateDelay;
  }
  return 60_000;
}

function isKeyError(error) {
  const status = error?.status || error?.statusCode || error?.response?.status;
  const message = `${error?.message || ""} ${error?.response?.data?.error?.message || ""}`;
  return [401, 403, 429].includes(status) || /resource_exhausted|quota|rate.?limit|invalid api key|unauthorized/i.test(message);
}

async function withApiKey(provider, request) {
  const keys = getKeys(provider);
  if (!keys.length) throw new Error(`No ${provider}_API_KEY configured`);

  const cursor = cursors.get(provider) || 0;
  const ordered = keys.map((_, index) => keys[(cursor + index) % keys.length]);
  let lastError;

  for (const key of ordered) {
    const cooldownKey = `${provider}:${key.name}`;
    if ((cooldowns.get(cooldownKey) || 0) > Date.now()) continue;
    cursors.set(provider, (keys.indexOf(key) + 1) % keys.length);
    try {
      const result = await request(key.value);
      cooldowns.delete(cooldownKey);
      return result;
    } catch (error) {
      lastError = error;
      if (!isKeyError(error)) throw error;
      cooldowns.set(cooldownKey, Date.now() + retryDelay(error));
      console.warn(`[API keys] ${provider} key ${key.name} cooling down after provider rejection.`);
    }
  }

  throw lastError || new Error(`All ${provider} API keys are cooling down`);
}

module.exports = { withApiKey, hasApiKey: (provider) => getKeys(provider).length > 0 };
