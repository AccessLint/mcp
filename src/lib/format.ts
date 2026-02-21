import type { Violation, FixSuggestion, Rule, DiffResult } from "@accesslint/core";
import { getRuleById } from "@accesslint/core";

const MAX_VIOLATIONS = 50;

export const IMPACT_ORDER: Record<string, number> = {
  critical: 0,
  serious: 1,
  moderate: 2,
  minor: 3,
};

export type Impact = "critical" | "serious" | "moderate" | "minor";

export interface FormatOptions {
  minImpact?: Impact;
}

export function filterByImpact<T extends { impact: string }>(
  items: T[],
  minImpact: Impact
): T[] {
  const threshold = IMPACT_ORDER[minImpact];
  return items.filter((item) => (IMPACT_ORDER[item.impact] ?? 4) <= threshold);
}

interface EnrichedViolation {
  ruleId: string;
  selector: string;
  html: string;
  impact: string;
  message: string;
  context?: string;
  fix?: FixSuggestion;
  fixability?: string;
  browserHint?: string;
  guidance?: string;
}

function enrichViolation(v: Violation): EnrichedViolation {
  const rule = getRuleById(v.ruleId);
  return {
    ruleId: v.ruleId,
    selector: v.selector,
    html: v.html,
    impact: v.impact,
    message: v.message,
    context: v.context,
    fix: v.fix,
    fixability: rule?.fixability,
    browserHint: (rule as Record<string, unknown>)?.browserHint as string | undefined,
    guidance: rule?.guidance,
  };
}

function formatFixSuggestion(fix: FixSuggestion): string {
  switch (fix.type) {
    case "add-attribute":
      return `add-attribute ${fix.attribute}="${fix.value}"`;
    case "set-attribute":
      return `set-attribute ${fix.attribute}="${fix.value}"`;
    case "remove-attribute":
      return `remove-attribute ${fix.attribute}`;
    case "add-element":
      return `add-element <${fix.tag}>${fix.textContent ? ` with text "${fix.textContent}"` : ""} inside ${fix.parent}`;
    case "remove-element":
      return "remove-element";
    case "add-text-content":
      return `add-text-content${fix.text ? ` "${fix.text}"` : ""}`;
    case "suggest":
      return `suggest — ${fix.suggestion}`;
    default:
      return `fix — ${(fix as { type: string }).type}`;
  }
}

function formatViolation(v: EnrichedViolation, index: number): string {
  const lines: string[] = [];
  lines.push(`${index}. [${v.impact.toUpperCase()}] ${v.ruleId}`);
  lines.push(`   ${v.message}`);
  lines.push(`   Element: ${v.selector}`);
  lines.push(`   HTML: ${v.html}`);

  if (v.fix) {
    lines.push(`   Fix: ${formatFixSuggestion(v.fix)}`);
  }
  if (v.fixability) {
    lines.push(`   Fixability: ${v.fixability}`);
  }
  if (v.browserHint) {
    lines.push(`   Browser hint: ${v.browserHint}`);
  }
  if (v.context) {
    lines.push(`   Context: ${v.context}`);
  }
  if (v.guidance) {
    lines.push(`   Guidance: ${v.guidance}`);
  }

  return lines.join("\n");
}

export function formatViolations(violations: Violation[], options?: FormatOptions): string {
  if (violations.length === 0) {
    return "No accessibility violations found.";
  }

  const totalCount = violations.length;
  const filtered = options?.minImpact
    ? filterByImpact(violations, options.minImpact)
    : violations;

  if (filtered.length === 0) {
    return `No accessibility violations at ${options!.minImpact} or above (${totalCount} total at lower severity).`;
  }

  const enriched = filtered.map(enrichViolation);
  enriched.sort(
    (a, b) => (IMPACT_ORDER[a.impact] ?? 4) - (IMPACT_ORDER[b.impact] ?? 4)
  );

  const truncated = enriched.length > MAX_VIOLATIONS;
  const display = truncated ? enriched.slice(0, MAX_VIOLATIONS) : enriched;

  const blocks = display.map((v, i) => formatViolation(v, i + 1));
  const filterNote = options?.minImpact
    ? ` (filtered to ${options.minImpact} and above from ${totalCount} total)`
    : "";
  const header = `Found ${filtered.length} accessibility violation${filtered.length === 1 ? "" : "s"}${filterNote}:`;
  const result = [header, "", ...blocks].join("\n");

  if (truncated) {
    return result + `\n\n(Showing ${MAX_VIOLATIONS} of ${filtered.length} violations. Fix these first, then re-audit.)`;
  }
  return result;
}

export function formatDiff(diff: DiffResult, options?: FormatOptions): string {
  const lines: string[] = [];
  const fixed = options?.minImpact ? filterByImpact(diff.fixed, options.minImpact) : diff.fixed;
  const added = options?.minImpact ? filterByImpact(diff.added, options.minImpact) : diff.added;
  const unchanged = options?.minImpact ? filterByImpact(diff.unchanged, options.minImpact) : diff.unchanged;

  lines.push(
    `Summary: ${fixed.length} fixed, ${added.length} new, ${unchanged.length} remaining`
  );

  if (fixed.length > 0) {
    lines.push("");
    lines.push("FIXED:");
    for (const v of fixed) {
      lines.push(`  - [${v.impact.toUpperCase()}] ${v.ruleId} at ${v.selector}`);
    }
  }

  if (added.length > 0) {
    lines.push("");
    lines.push("NEW:");
    for (const v of added) {
      const enriched = enrichViolation(v);
      lines.push(`  - [${v.impact.toUpperCase()}] ${v.ruleId} at ${v.selector}`);
      lines.push(`    ${v.message}`);
      if (enriched.fix) {
        lines.push(`    Fix: ${formatFixSuggestion(enriched.fix)}`);
      }
      if (enriched.browserHint) {
        lines.push(`    Browser hint: ${enriched.browserHint}`);
      }
    }
  }

  if (unchanged.length > 0) {
    lines.push("");
    lines.push("REMAINING:");
    for (const v of unchanged) {
      lines.push(`  - [${v.impact.toUpperCase()}] ${v.ruleId} at ${v.selector}`);
    }
  }

  return lines.join("\n");
}

export function formatRuleTable(
  rules: Rule[]
): string {
  if (rules.length === 0) {
    return "No rules match the specified filters.";
  }

  const header = `${rules.length} rule${rules.length === 1 ? "" : "s"}:\n`;
  const rows = rules.map(
    (r) =>
      `  ${r.id}  |  ${r.description}  |  ${r.level}  |  ${r.fixability ?? "—"}`
  );

  return header + "  ID  |  Description  |  Level  |  Fixability\n" + "  ---|---|---|---\n" + rows.join("\n");
}
