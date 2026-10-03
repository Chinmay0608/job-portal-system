const { classifyJob } = require("../services/jobClassifierService");

describe("jobClassifierService", () => {
  test("correctly classifies a Software Engineering Entry Level job", () => {
    const job = {
      title: "Junior Frontend Developer (SDE-1)",
      description: "We are hiring an entry level React developer.",
    };
    const result = classifyJob(job);
    expect(result.domain).toBe("Software Engineering");
    expect(result.seniorityLevel).toBe("Entry Level");
  });

  test("correctly classifies a Healthcare Specialist job", () => {
    const job = {
      title: "Resident Doctor - Clinical Operations",
      description: "Looking for an MBBS doctor for patient care.",
    };
    const result = classifyJob(job);
    expect(result.domain).toBe("Healthcare & Medical");
    expect(result.seniorityLevel).toBe("Intern");
  });

  test("correctly classifies a Senior Media Video Editor job", () => {
    const job = {
      title: "Senior Video Editor & Motion Graphics Producer",
      description: "Lead our YouTube content team using Premiere Pro & After Effects.",
    };
    const result = classifyJob(job);
    expect(result.domain).toBe("Media & Video Creation");
    expect(result.seniorityLevel).toBe("Senior Level");
  });

  test("correctly classifies a Staff Data Scientist job", () => {
    const job = {
      title: "Principal Data Scientist - AI / ML",
      description: "Drive large language model architectures and machine learning systems.",
    };
    const result = classifyJob(job);
    expect(result.domain).toBe("Data & Analytics");
    expect(result.seniorityLevel).toBe("Staff / Principal");
  });
});
