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

/**
 * Utility to check if TRAO AI features should be enabled.
 * Hidden on production by default until integration is finalized.
 * In local development, enabled by default.
 * Can be explicitly overridden via VITE_TRAO_ENABLED ("true" | "false").
 *
 * @param {string} [overrideHostname] Optional hostname override for testing
 * @param {string} [overrideEnv] Optional environment flag override for testing
 * @returns {boolean} True if TRAO AI features are enabled
 */
export const isTraoEnabled = (overrideHostname, overrideEnv) => {
  const envFlag =
    overrideEnv !== undefined
      ? overrideEnv
      : typeof import.meta !== "undefined" && import.meta?.env
      ? import.meta.env.VITE_TRAO_ENABLED
      : typeof globalThis !== "undefined" && globalThis.process?.env
      ? globalThis.process.env.VITE_TRAO_ENABLED
      : undefined;

  if (envFlag === "true") return true;
  if (envFlag === "false") return false;
  return isLocalEnvironment(overrideHostname);
};
