import type { AuditResult, ConfigureOptions } from "@accesslint/core";
import { configureRules, clearAllCaches, runAudit } from "@accesslint/core";
import { parseHtml } from "./parse.js";

const MAX_STORED_AUDITS = 10;
const storedAudits = new Map<string, AuditResult>();

export function configure(options: ConfigureOptions): void {
  configureRules(options);
}

export function audit(
  html: string,
  options?: { componentMode?: boolean; name?: string }
): AuditResult {
  const { document, isFragment } = parseHtml(html);

  // Auto-enable componentMode for fragments unless explicitly overridden
  const componentMode = options?.componentMode ?? isFragment;
  configureRules({ componentMode });

  clearAllCaches();
  const result = runAudit(document);

  if (options?.name) {
    storeAudit(options.name, result);
  }

  return result;
}

export function storeAudit(name: string, result: AuditResult): void {
  // Evict oldest entry if at capacity
  if (storedAudits.size >= MAX_STORED_AUDITS && !storedAudits.has(name)) {
    const oldest = storedAudits.keys().next().value;
    if (oldest !== undefined) {
      storedAudits.delete(oldest);
    }
  }
  storedAudits.set(name, result);
}

export function getStoredAudit(name: string): AuditResult | undefined {
  return storedAudits.get(name);
}

export function clearStoredAudits(): void {
  storedAudits.clear();
}
