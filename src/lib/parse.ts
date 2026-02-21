import { Window } from "happy-dom";

export interface ParseResult {
  document: Document;
  isFragment: boolean;
}

const FULL_DOC_PATTERN = /<!doctype\s+html|<html[\s>]/i;

let globalsInstalled = false;

/**
 * Install happy-dom's browser globals (HTMLElement, ShadowRoot, etc.)
 * so @accesslint/core's rules can use instanceof checks and getComputedStyle.
 * Only runs once.
 */
function installGlobals(window: InstanceType<typeof Window>): void {
  if (globalsInstalled) return;
  globalsInstalled = true;

  const win = window as unknown as Record<string, unknown>;
  for (const key of Object.getOwnPropertyNames(win)) {
    if (
      key[0] === key[0].toUpperCase() &&
      key !== "Infinity" &&
      key !== "NaN" &&
      typeof win[key] === "function" &&
      !(key in globalThis)
    ) {
      (globalThis as Record<string, unknown>)[key] = win[key];
    }
  }
  // getComputedStyle is lowercase and essential for color-contrast rules
  if (!("getComputedStyle" in globalThis)) {
    (globalThis as Record<string, unknown>)["getComputedStyle"] = (
      win["getComputedStyle"] as Function
    ).bind(window);
  }
}

/**
 * Parse an HTML string into a Document.
 * Detects fragments (no <html> or <!DOCTYPE>) and wraps them in a minimal
 * valid document shell so page-level rules don't fire false positives.
 */
export function parseHtml(html: string): ParseResult {
  const trimmed = html.trim();
  const isFragment = !FULL_DOC_PATTERN.test(trimmed);

  const fullHtml = isFragment
    ? `<!DOCTYPE html><html lang="en"><head><title>Audit</title></head><body>${trimmed}</body></html>`
    : trimmed;

  const window = new Window({ url: "https://audit.local/" });
  installGlobals(window);

  const doc = window.document;
  doc.write(fullHtml);

  return { document: doc as unknown as Document, isFragment };
}
