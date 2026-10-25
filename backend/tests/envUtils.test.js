const isLocalEnvironment = (overrideHostname) => {
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

describe("isLocalEnvironment Utility", () => {
  it("should return true for localhost", () => {
    expect(isLocalEnvironment("localhost")).toBe(true);
  });

  it("should return true for 127.0.0.1", () => {
    expect(isLocalEnvironment("127.0.0.1")).toBe(true);
  });

  it("should return true for IPv6 loopback ::1", () => {
    expect(isLocalEnvironment("::1")).toBe(true);
  });

  it("should return true for local domain extensions ending with .local", () => {
    expect(isLocalEnvironment("dev.local")).toBe(true);
    expect(isLocalEnvironment("my-laptop.local")).toBe(true);
  });

  it("should return false for production deployment domains", () => {
    expect(isLocalEnvironment("job-portal-system-alpha.vercel.app")).toBe(false);
    expect(isLocalEnvironment("skillbridge-backend-w05j.onrender.com")).toBe(false);
    expect(isLocalEnvironment("skillbridge.com")).toBe(false);
  });

  it("should return false for empty or undefined hostname", () => {
    expect(isLocalEnvironment("")).toBe(false);
  });
});

const isTraoEnabled = (overrideHostname, overrideEnv) => {
  const envFlag =
    overrideEnv !== undefined
      ? overrideEnv
      : typeof process !== "undefined" && process?.env
      ? process.env.VITE_TRAO_ENABLED
      : undefined;

  if (envFlag === "true") return true;
  if (envFlag === "false") return false;
  return isLocalEnvironment(overrideHostname);
};

describe("isTraoEnabled Utility", () => {
  it("should return true in local development when env flag is not set", () => {
    expect(isTraoEnabled("localhost", undefined)).toBe(true);
    expect(isTraoEnabled("127.0.0.1", undefined)).toBe(true);
    expect(isTraoEnabled("dev.local", undefined)).toBe(true);
  });

  it("should return false on production domains when env flag is not set", () => {
    expect(isTraoEnabled("job-portal-system-alpha.vercel.app", undefined)).toBe(false);
    expect(isTraoEnabled("skillbridge.com", undefined)).toBe(false);
  });

  it("should return true on production domains if VITE_TRAO_ENABLED is explicitly true", () => {
    expect(isTraoEnabled("job-portal-system-alpha.vercel.app", "true")).toBe(true);
  });

  it("should return false in local development if VITE_TRAO_ENABLED is explicitly false", () => {
    expect(isTraoEnabled("localhost", "false")).toBe(false);
  });
});
