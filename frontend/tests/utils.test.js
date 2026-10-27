import { describe, expect, it } from "vitest";
import { getPasswordRequirements, isStrongPassword } from "../src/utils/passwordPolicy.js";
import { getQualificationsForField } from "../src/utils/qualificationOptions.js";

describe("frontend utilities", () => {
  it("password policy accepts valid passwords and rejects missing or excess requirements", () => {
    expect(isStrongPassword("SkillBridge1!")).toBe(true);
    expect(isStrongPassword("short1!")).toBe(false);
    expect(isStrongPassword("SkillBridge!")).toBe(false);
    expect(isStrongPassword("SkillBridge1234!!!!")).toBe(false);
    expect(isStrongPassword("Skill Bridge1!")).toBe(false);
    expect(getPasswordRequirements("SkillBridge1!").every(({ met }) => met)).toBe(true);
  });

  it("qualification options match the selected field and retain the placeholder", () => {
    const software = getQualificationsForField("Software Engineering").map(({ value }) => value);
    const healthcare = getQualificationsForField("Healthcare").map(({ value }) => value);

    expect(software[0]).toBe("");
    expect(software).toContain("B.Tech / B.E.");
    expect(software).not.toContain("MBBS");
    expect(healthcare).toContain("MBBS");
    expect(healthcare).not.toContain("BCA");
  });
});
