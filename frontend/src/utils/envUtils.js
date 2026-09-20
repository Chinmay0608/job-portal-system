/**
 * Utility to check if current execution environment is local development
 * @param {string} [overrideHostname] Optional hostname override for testing
 * @returns {boolean} True if localhost or local domain
 */
export const isLocalEnvironment = (overrideHostname) => {
  const hostname =
    overrideHostname !== undefined
      ? overrideHostname
      : typeof window !== "undefined"
      ? window.location.hostname
      : "";

  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".local")
  );
};
