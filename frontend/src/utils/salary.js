export const formatSalary = (
  salaryText,
  min,
  max,
  currency,
  showRange = true,
  employmentType = "",
) => {
  const currencySymbol =
    currency === "INR" || currency === "\u20B9"
      ? "\u20B9"
      : currency === "EUR"
        ? "\u20AC"
        : currency === "GBP"
          ? "\u00A3"
          : "$";
  const isInternship = String(employmentType).toLowerCase().includes("intern");

  if (!showRange) {
    return typeof salaryText === "string" &&
      isNaN(Number(salaryText)) &&
      salaryText !== "Competitive"
      ? salaryText
      : "Competitive";
  }

  if (isInternship && typeof salaryText === "string") {
    const trimmed = salaryText.trim();
    if (trimmed && trimmed !== "Competitive") {
      const monthlyMatch = trimmed.match(
        /(?:₹|[$€£])?\s*\d[\d,.]*(?:\s*\/\s*(?:month|mo)|\s+per\s+month)/i,
      );
      if (monthlyMatch) {
        const monthlyAmount = monthlyMatch[0]
          .replace(/\s+per\s+month/i, "/month")
          .replace(/\s*\/\s*(?:month|mo)/i, "/month");
        return monthlyAmount.replace(
          /^(?![₹$€£])/,
          currency === "INR" ? "\u20B9" : currencySymbol,
        );
      }

      if (/\/(?:month|mo)/i.test(trimmed)) return trimmed;
    }
  }

  if (min && max) {
    if (isInternship) {
      const locale = currency === "INR" ? "en-IN" : "en-US";
      const formatExact = (num) =>
        `${currencySymbol}${Number(num).toLocaleString(locale)}`;
      const range =
        Number(min) === Number(max)
          ? formatExact(min)
          : `${formatExact(min)}\u2013${formatExact(max)}`;
      return `${range}/month`;
    }

    const formatShorthand = (num) => {
      if (num >= 100000)
        return `${currencySymbol}${Number((num / 100000).toFixed(1))}L`;
      if (num >= 1000)
        return `${currencySymbol}${Number((num / 1000).toFixed(1))}k`;
      return `${currencySymbol}${num}`;
    };
    return Number(min) === Number(max)
      ? formatShorthand(min)
      : `${formatShorthand(min)}\u2013${formatShorthand(max)}`;
  }

  if (isInternship && typeof salaryText === "string") {
    const trimmed = salaryText.trim();
    if (/\/(?:month|mo)/i.test(trimmed)) return trimmed;
    if (trimmed && trimmed !== "Competitive" && isNaN(Number(trimmed))) {
      return /stipend/i.test(trimmed) ? trimmed : `${trimmed}/month`;
    }
  }

  if (isInternship && salaryText && Number(salaryText) !== 0) {
    const locale = currency === "INR" ? "en-IN" : "en-US";
    return `${currencySymbol}${Number(salaryText).toLocaleString(locale)}/month`;
  }

  if (typeof salaryText === "string" && isNaN(Number(salaryText)))
    return salaryText;
  if (!salaryText || Number(salaryText) === 0) return "Competitive";
  return `${currencySymbol}${Number(salaryText).toLocaleString(
    currency === "INR" ? "en-IN" : "en-US",
  )} a year`;
};
