const USERNAME_REGEX = /^[a-z0-9_.-]{3,30}$/;

/**
 * Normalizes username:
 * - Trims whitespace
 * - Strips leading '@' if user entered it (e.g. "@johndoe" -> "johndoe")
 * - Converts to lowercase
 */
const normalizeUsername = (value) => {
  if (!value || typeof value !== "string") return "";
  let clean = value.trim().toLowerCase();
  if (clean.startsWith("@")) {
    clean = clean.slice(1).trim();
  }
  return clean;
};

/**
 * Validates whether a username meets formatting rules:
 * - 3 to 30 characters long
 * - Only lowercase alphanumeric characters, underscores (_), dots (.), and hyphens (-)
 * - No spaces, no '@' symbol
 */
const isValidUsername = (value) => {
  const clean = normalizeUsername(value);
  if (!clean || clean.length < 3 || clean.length > 30) return false;
  if (clean.includes("@") || clean.includes(" ")) return false;
  return USERNAME_REGEX.test(clean);
};

/**
 * Generates a clean, unique username from a base string (e.g. name or email).
 * Queries the UserModel to guarantee uniqueness.
 */
const generateUniqueUsername = async (base, UserModel) => {
  if (!UserModel) {
    UserModel = require("../models/user");
  }

  let clean = String(base || "")
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, "")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 22);

  if (clean.length < 3) {
    clean = "user";
  }

  let candidate = clean;
  let attempts = 0;

  while (await UserModel.findOne({ username: candidate })) {
    attempts++;
    const suffix = attempts === 1 ? Math.floor(100 + Math.random() * 900) : `${attempts}`;
    candidate = `${clean.slice(0, 24)}${suffix}`;
    if (attempts > 100) {
      candidate = `user_${Date.now().toString(36)}`;
      break;
    }
  }

  return candidate;
};

module.exports = {
  USERNAME_REGEX,
  normalizeUsername,
  isValidUsername,
  generateUniqueUsername,
};
