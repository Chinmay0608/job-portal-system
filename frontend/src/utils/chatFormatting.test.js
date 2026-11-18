import { describe, expect, it } from "vitest";
import { normalizeChatMarkdown } from "./chatFormatting";

describe("normalizeChatMarkdown", () => {
  it("converts pipe-separated rows into readable bullets", () => {
    expect(
      normalizeChatMarkdown(
        "### Jobs\n| Job title | Location |\n| --- | --- |\n| Software Engineer | Bengaluru |",
      ),
    ).toBe(
      "### Jobs\n- Job title — Location\n- Software Engineer — Bengaluru",
    );
  });

  it("preserves normal headings and list items", () => {
    expect(normalizeChatMarkdown("### 1. Frontend\n- React")).toBe(
      "### 1. Frontend\n- React",
    );
  });
});
