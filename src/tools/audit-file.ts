import { z } from "zod";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { audit } from "../lib/state.js";
import { formatViolations } from "../lib/format.js";

export const auditFileSchema = {
  path: z
    .string()
    .describe("Path to HTML file (absolute, or relative to cwd)"),
  component_mode: z
    .boolean()
    .optional()
    .describe("Suppress page-level rules"),
  name: z
    .string()
    .optional()
    .describe('Store result for later diffing (e.g. "before")'),
};

export function registerAuditFile(server: McpServer): void {
  server.tool(
    "audit_file",
    "Read an HTML file from disk and audit it for accessibility violations.",
    auditFileSchema,
    async ({ path, component_mode, name }) => {
      const resolved = resolve(path);
      let html: string;
      try {
        html = await readFile(resolved, "utf-8");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown error reading file";
        return {
          content: [{ type: "text", text: `Error reading file: ${message}` }],
          isError: true,
        };
      }

      const result = audit(html, { componentMode: component_mode, name });
      return {
        content: [{ type: "text", text: formatViolations(result.violations) }],
      };
    }
  );
}
