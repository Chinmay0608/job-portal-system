export const COUNTRY_OPTIONS = [
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "United Arab Emirates",
  "Singapore",
  "New Zealand",
  "Switzerland",
  "Japan",
  "China",
  "Brazil",
  "Mexico",
  "South Africa",
];

const currencyByCountry = {
  India: { code: "INR", symbol: "₹", thresholds: [300000, 600000, 1000000, 1800000, 2500000], labels: ["3 LPA+", "6 LPA+", "10 LPA+", "18 LPA+", "25 LPA+"] },
  "United States": { code: "USD", symbol: "$", thresholds: [40000, 75000, 120000, 200000, 300000] },
  "United Kingdom": { code: "GBP", symbol: "£", thresholds: [30000, 50000, 80000, 120000, 200000] },
  Canada: { code: "CAD", symbol: "CA$", thresholds: [40000, 75000, 120000, 200000, 300000] },
  Australia: { code: "AUD", symbol: "A$", thresholds: [40000, 75000, 120000, 200000, 300000] },
  Germany: { code: "EUR", symbol: "€", thresholds: [30000, 50000, 80000, 120000, 200000] },
  France: { code: "EUR", symbol: "€", thresholds: [30000, 50000, 80000, 120000, 200000] },
  "United Arab Emirates": { code: "AED", symbol: "د.إ", thresholds: [100000, 200000, 300000, 500000, 800000] },
  Singapore: { code: "SGD", symbol: "S$", thresholds: [40000, 75000, 120000, 200000, 300000] },
  "New Zealand": { code: "NZD", symbol: "NZ$", thresholds: [50000, 80000, 120000, 180000, 250000] },
  Switzerland: { code: "CHF", symbol: "CHF ", thresholds: [50000, 80000, 120000, 180000, 250000] },
  Japan: { code: "JPY", symbol: "¥", thresholds: [4000000, 6000000, 9000000, 15000000, 25000000] },
  China: { code: "CNY", symbol: "¥", thresholds: [100000, 200000, 300000, 500000, 800000] },
  Brazil: { code: "BRL", symbol: "R$", thresholds: [50000, 80000, 120000, 180000, 250000] },
  Mexico: { code: "MXN", symbol: "MX$", thresholds: [300000, 500000, 800000, 1200000, 2000000] },
  "South Africa": { code: "ZAR", symbol: "R", thresholds: [300000, 500000, 800000, 1200000, 2000000] },
};

export const getCountryCurrency = (country = "India") => currencyByCountry[country] || currencyByCountry.India;

export const getSalaryOptions = (country = "India") => {
  const currency = getCountryCurrency(country);
  const formatter = new Intl.NumberFormat(country === "India" ? "en-IN" : "en", {
    maximumFractionDigits: 0,
  });

  return [
    { value: "", label: `Any salary (${currency.symbol})` },
    ...currency.thresholds.map((amount, index) => ({
      value: `${currency.code}:${amount}`,
      label: currency.labels?.[index] || `${currency.symbol}${formatter.format(amount)}+`,
    })),
  ];
};
