const PASSWORD_POLICY_MESSAGE = "Password must be at least 8 characters and include uppercase and lowercase letters, a number, and 1–3 special characters (no spaces).";

const isStrongPassword = (password) => {
  if (typeof password !== "string" || password.length < 8 || /\s/.test(password)) return false;
  const specialCount = (password.match(/[^A-Za-z0-9]/g) || []).length;
  return /[A-Z]/.test(password)
    && /[a-z]/.test(password)
    && /\d/.test(password)
    && specialCount >= 1
    && specialCount <= 3;
};

module.exports = { PASSWORD_POLICY_MESSAGE, isStrongPassword };
