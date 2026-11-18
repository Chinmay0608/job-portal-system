export function normalizeChatMarkdown(content) {
  if (!content) return "";

  return String(content)
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      return trimmed && !/^[:|\-\s]+$/.test(trimmed);
    })
    .map((line) => {
      const trimmed = line.trim();
      if (/^\|.*\|$/.test(trimmed) || /^\|?\s*[-]+\s*\|/.test(trimmed)) {
        const cells = trimmed
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((cell) => cell.trim())
          .filter(Boolean);
        if (cells.length > 1) return `- ${cells.join(" — ")}`;
        if (cells[0]) return `- ${cells[0]}`;
      }
      return line;
    })
    .join("\n");
}
