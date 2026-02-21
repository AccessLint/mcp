import { z } from "zod";
import { diffAudit } from "@accesslint/core";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { audit, getStoredAudit } from "../lib/state.js";
import { formatDiff } from "../lib/format.js";

export const diffHtmlSchema = {
  html: z.string().describe("Updated HTML to audit and compare"),
  before: z
    .string()
    .describe("Name of a previously stored audit to compare against"),
  component_mode: z
    .boolean()
    .optional()
    .describe("Suppress page-level rules"),
};

export function registerDiffHtml(server: McpServer): void {
  server.tool(
    "diff_html",
    "Audit new HTML and diff against a previously named audit. Use after audit_html with a name to verify fixes.",
    diffHtmlSchema,
    async ({ html, before, component_mode }) => {
      const beforeResult = getStoredAudit(before);
      if (!beforeResult) {
        return {
          content: [
            {
              type: "text",
              text: `No stored audit named "${before}". Run audit_html with name="${before}" first.`,
            },
          ],
          isError: true,
        };
      }

      const afterResult = audit(html, { componentMode: component_mode });
      const diff = diffAudit(beforeResult, afterResult);
      return {
        content: [{ type: "text", text: formatDiff(diff) }],
      };
    }
  );
}
