import { describe, expect, it } from "vitest";
import { formatSalary } from "./salary";

describe("formatSalary", () => {
  it("formats an internship range per month", () => {
    expect(
      formatSalary("25000 - 40000", 25000, 40000, "INR", true, "Internship"),
    ).toBe("\u20B925,000\u2013\u20B940,000/month");
  });

  it("formats a single stipend per month", () => {
    expect(formatSalary("25000", 25000, null, "INR", true, "Internship")).toBe(
      "\u20B925,000/month",
    );
  });

  it("uses the stated internship stipend instead of annual fields", () => {
    expect(
      formatSalary(
        "\u20B925,000 / month (\u20B945,000 / month PPO)",
        300000,
        540000,
        "INR",
        true,
        "Internship",
      ),
    ).toBe("\u20B925,000/month");
  });

  it("keeps full-time salaries annual", () => {
    expect(
      formatSalary("800000 - 1200000", 800000, 1200000, "INR", true, "Full-time"),
    ).toBe("\u20B98L\u2013\u20B912L");
  });
});
