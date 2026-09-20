const csrfProtection = require("../middleware/csrfMiddleware");

describe("CSRF Protection Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: "GET",
      path: "/api/jobs",
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  it("should allow GET requests without CSRF checks", () => {
    req.method = "GET";
    csrfProtection(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  describe("Exempt Auth Routes", () => {
    const exemptEndpoints = [
      "/api/auth/login",
      "/api/auth/register",
      "/api/auth/logout",
      "/api/auth/google",
      "/api/auth/google/callback",
      "/api/auth/google-login",
      "/api/auth/refresh",
    ];

    exemptEndpoints.forEach((path) => {
      it(`should allow POST to exempt path ${path} without token/header`, () => {
        req.method = "POST";
        req.path = path;
        csrfProtection(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
      });
    });
  });

  describe("Protected State-Changing Operations (POST, PUT, PATCH, DELETE)", () => {
    const stateChangingMethods = ["POST", "PUT", "PATCH", "DELETE"];

    stateChangingMethods.forEach((method) => {
      it(`should reject ${method} to non-exempt path without Bearer or custom header`, () => {
        req.method = method;
        req.path = "/api/jobs";
        csrfProtection(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining("CSRF validation failed"),
          })
        );
        expect(next).not.toHaveBeenCalled();
      });

      it(`should allow ${method} when valid Bearer token is provided`, () => {
        req.method = method;
        req.path = "/api/jobs";
        req.headers.authorization = "Bearer mock_jwt_token";

        csrfProtection(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
      });

      it(`should allow ${method} when x-requested-with: XMLHttpRequest header is provided`, () => {
        req.method = method;
        req.path = "/api/applications";
        req.headers["x-requested-with"] = "XMLHttpRequest";

        csrfProtection(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
      });

      it(`should allow ${method} when x-csrf-token header is provided`, () => {
        req.method = method;
        req.path = "/api/users/profile";
        req.headers["x-csrf-token"] = "valid_csrf_token_string";

        csrfProtection(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
      });
    });
  });
});
