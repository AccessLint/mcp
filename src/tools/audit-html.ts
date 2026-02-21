import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { audit } from "../lib/state.js";
import { formatViolations } from "../lib/format.js";

export const auditHtmlSchema = {
  html: z.string().describe("HTML to audit for accessibility violations"),
  component_mode: z
    .boolean()
    .optional()
    .describe(
      "Suppress page-level rules (auto-detected when HTML lacks <html> tag)"
    ),
  name: z
    .string()
    .optional()
    .describe('Store result for later diffing (e.g. "before")'),
};

export function registerAuditHtml(server: McpServer): void {
  server.tool(
    "audit_html",
    "Audit an HTML string for accessibility violations. Auto-detects fragments vs full documents.",
    auditHtmlSchema,
    async ({ html, component_mode, name }) => {
      const result = audit(html, { componentMode: component_mode, name });
      return {
        content: [{ type: "text", text: formatViolations(result.violations) }],
      };
    }
  );
}
