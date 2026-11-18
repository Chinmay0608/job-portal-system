const {
  isValidUsername,
  normalizeUsername,
  generateUniqueUsername,
} = require("../utils/usernameUtils");

describe("Username Utilities", () => {
  describe("normalizeUsername", () => {
    it("lowercases and trims username", () => {
      expect(normalizeUsername("  JohnDoe  ")).toBe("johndoe");
    });

    it("strips leading @ symbol", () => {
      expect(normalizeUsername("@alice_99")).toBe("alice_99");
    });

    it("returns empty string for non-string or falsy input", () => {
      expect(normalizeUsername(null)).toBe("");
      expect(normalizeUsername(undefined)).toBe("");
      expect(normalizeUsername("")).toBe("");
    });
  });

  describe("isValidUsername", () => {
    it("accepts valid alphanumeric usernames with underscores, dots, hyphens", () => {
      expect(isValidUsername("john_doe")).toBe(true);
      expect(isValidUsername("alice.smith")).toBe(true);
      expect(isValidUsername("dev-lead-01")).toBe(true);
      expect(isValidUsername("abc")).toBe(true);
    });

    it("rejects usernames that are too short or too long", () => {
      expect(isValidUsername("ab")).toBe(false);
      expect(isValidUsername("a".repeat(31))).toBe(false);
    });

    it("rejects usernames containing spaces, @, or special symbols", () => {
      expect(isValidUsername("john doe")).toBe(false);
      expect(isValidUsername("john@doe.com")).toBe(false);
      expect(isValidUsername("alice$mith")).toBe(false);
      expect(isValidUsername("user!name")).toBe(false);
    });
  });

  describe("generateUniqueUsername", () => {
    it("generates a clean username from an email address", async () => {
      const mockUserModel = {
        findOne: jest.fn().mockResolvedValue(null),
      };

      const result = await generateUniqueUsername("john.doe@gmail.com", mockUserModel);
      expect(result).toBe("john.doe");
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ username: "john.doe" });
    });

    it("resolves collision by appending a suffix", async () => {
      const mockFindOne = jest
        .fn()
        .mockResolvedValueOnce({ username: "johndoe" })
        .mockResolvedValueOnce(null);
      const mockUserModel = {
        findOne: mockFindOne,
      };

      const result = await generateUniqueUsername("John Doe", mockUserModel);
      expect(result).toMatch(/^johndoe\d+$/);
      expect(mockUserModel.findOne).toHaveBeenCalledTimes(2);
    });

    it("handles short or empty base values safely", async () => {
      const mockUserModel = {
        findOne: jest.fn().mockResolvedValue(null),
      };

      const result = await generateUniqueUsername("", mockUserModel);
      expect(result).toBe("user");
      expect(result.length).toBeGreaterThanOrEqual(3);
    });
  });
});
