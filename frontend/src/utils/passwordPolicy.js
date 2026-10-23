export const PASSWORD_POLICY_MESSAGE = "Use at least 8 characters, with uppercase and lowercase letters, a number, and 1–3 special characters. Spaces aren't allowed.";

export const getPasswordRequirements = (password) => {
  const specialCount = (password.match(/[^A-Za-z0-9]/g) || []).length;
  return [
    { label: "8+ characters", met: password.length >= 8 },
    { label: "Uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Lowercase letter", met: /[a-z]/.test(password) },
    { label: "Number", met: /\d/.test(password) },
    { label: "1–3 special characters", met: specialCount >= 1 && specialCount <= 3 },
    { label: "No spaces", met: !/\s/.test(password) },
  ];
};

export const isStrongPassword = (password) =>
  getPasswordRequirements(password).every((requirement) => requirement.met);
