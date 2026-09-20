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
