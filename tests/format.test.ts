import { describe, it, expect } from "vitest";
import { formatViolations, formatDiff, formatRuleTable } from "../src/lib/format.js";
import type { Violation, DiffResult, Rule } from "@accesslint/core";

function makeViolation(overrides: Partial<Violation> = {}): Violation {
  return {
    ruleId: "text-alternatives/img-alt",
    selector: "img",
    html: '<img src="photo.jpg">',
    impact: "critical",
    message: "Image element missing alt attribute.",
    ...overrides,
  };
}

describe("formatViolations", () => {
  it("returns clean message for no violations", () => {
    expect(formatViolations([])).toBe("No accessibility violations found.");
  });

  it("formats a single violation", () => {
    const output = formatViolations([makeViolation()]);
    expect(output).toContain("Found 1 accessibility violation:");
    expect(output).toContain("[CRITICAL] text-alternatives/img-alt");
    expect(output).toContain("Image element missing alt attribute.");
    expect(output).toContain("Element: img");
    expect(output).toContain('HTML: <img src="photo.jpg">');
  });

  it("sorts violations by impact severity", () => {
    const violations = [
      makeViolation({ impact: "minor", ruleId: "minor-rule" }),
      makeViolation({ impact: "critical", ruleId: "critical-rule" }),
      makeViolation({ impact: "moderate", ruleId: "moderate-rule" }),
    ];
    const output = formatViolations(violations);
    const criticalIdx = output.indexOf("critical-rule");
    const moderateIdx = output.indexOf("moderate-rule");
    const minorIdx = output.indexOf("minor-rule");
    expect(criticalIdx).toBeLessThan(moderateIdx);
    expect(moderateIdx).toBeLessThan(minorIdx);
  });

  it("includes fix suggestion when present", () => {
    const v = makeViolation({
      fix: { type: "add-attribute", attribute: "alt", value: "" },
    });
    const output = formatViolations([v]);
    expect(output).toContain('Fix: add-attribute alt=""');
  });

  it("truncates at 50 violations", () => {
    const violations = Array.from({ length: 60 }, (_, i) =>
      makeViolation({ selector: `img:nth-child(${i})` })
    );
    const output = formatViolations(violations);
    expect(output).toContain("Showing 50 of 60 violations");
  });
});

describe("formatDiff", () => {
  it("formats a diff with fixed, new, and remaining", () => {
    const diff: DiffResult = {
      fixed: [makeViolation({ ruleId: "fixed-rule" })],
      added: [makeViolation({ ruleId: "new-rule" })],
      unchanged: [makeViolation({ ruleId: "remaining-rule" })],
    };
    const output = formatDiff(diff);
    expect(output).toContain("1 fixed, 1 new, 1 remaining");
    expect(output).toContain("FIXED:");
    expect(output).toContain("fixed-rule");
    expect(output).toContain("NEW:");
    expect(output).toContain("new-rule");
    expect(output).toContain("REMAINING:");
    expect(output).toContain("remaining-rule");
  });

  it("omits empty sections", () => {
    const diff: DiffResult = {
      fixed: [makeViolation()],
      added: [],
      unchanged: [],
    };
    const output = formatDiff(diff);
    expect(output).toContain("FIXED:");
    expect(output).not.toContain("NEW:");
    expect(output).not.toContain("REMAINING:");
  });
});

describe("formatRuleTable", () => {
  it("returns message for no matching rules", () => {
    expect(formatRuleTable([])).toBe("No rules match the specified filters.");
  });

  it("formats a rule table", () => {
    const rules = [
      {
        id: "text-alternatives/img-alt",
        description: "Images must have alt text",
        level: "A",
        fixability: "contextual",
      },
    ] as Rule[];
    const output = formatRuleTable(rules);
    expect(output).toContain("1 rule:");
    expect(output).toContain("text-alternatives/img-alt");
    expect(output).toContain("contextual");
  });
});
