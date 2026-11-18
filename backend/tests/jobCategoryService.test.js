const {
  isTitleAllowedForCategory,
} = require("../services/jobCategoryService");

describe("jobCategoryService", () => {
  test("accepts a real customer support role", () => {
    expect(
      isTitleAllowedForCategory(
        "customer_service",
        "Customer Support Executive",
      ),
    ).toBe(true);
  });

  test("rejects unrelated technology roles from customer support", () => {
    expect(
      isTitleAllowedForCategory(
        "customer_service",
        "Solutions Architect - Customer Systems",
      ),
    ).toBe(false);
  });

  test("accepts real hospitality roles and rejects marketing roles", () => {
    expect(
      isTitleAllowedForCategory("hospitality", "Executive Chef"),
    ).toBe(true);
    expect(
      isTitleAllowedForCategory("hospitality", "Marketing Intern"),
    ).toBe(false);
  });

  test("accepts store roles but rejects financial sales roles", () => {
    expect(
      isTitleAllowedForCategory("retail_sales", "Assistant Store Manager"),
    ).toBe(true);
    expect(
      isTitleAllowedForCategory(
        "retail_sales",
        "Financial Data Sales Associate",
      ),
    ).toBe(false);
  });

  test("accepts education roles but rejects clinical training roles", () => {
    expect(
      isTitleAllowedForCategory("education", "English Language Instructor"),
    ).toBe(true);
    expect(
      isTitleAllowedForCategory(
        "education",
        "Tutor - Operation Theatre Technician",
      ),
    ).toBe(false);
  });

  test("accepts transportation operators but rejects logistics architects", () => {
    expect(
      isTitleAllowedForCategory("transportation", "Forklift Operator"),
    ).toBe(true);
    expect(
      isTitleAllowedForCategory(
        "transportation",
        "SAP S/4HANA Solution Architect - Logistics",
      ),
    ).toBe(false);
  });
});
